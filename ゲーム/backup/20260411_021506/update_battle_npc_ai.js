function updateBattleNpcAI(npc, nowMs = performance.now()) {
  if (!npc || npc.kind === "item") return;
  if (npc.stageIndex !== ARENA_STAGE_INDEX) return;
  if (getCharacterState(npc) === "spectator") return;

  if (!npc.battleAi) {
    npc.battleAi = {
      mode: "search",
      targetId: null,
      thinkAt: 0,
      strafeDir: Math.random() < 0.5 ? -1 : 1,
      comboPressureUntil: 0,
      lastActionAt: 0,
      lastModeChangeAt: 0,
      recoverThrownKnifeId: null
    };
  }

  const ai = npc.battleAi;
  updateComboState(npc, nowMs);

  if (npc.combat && npc.combat.type) return;
  if ((npc.hitstopFrames || 0) > 0) return;
  if (nowMs < ai.thinkAt) return;
  if (nowMs - (ai.lastActionAt || 0) < 140) return; // 行動直後の最低待機

  const chars = getCharactersInStage(npc.stageIndex).filter(
    (c) => c && c.id !== npc.id && getCharacterState(c) !== "spectator"
  );
  if (!chars.length) return;

  let target = getEntityById(ai.targetId);
  if (!target || target.stageIndex !== npc.stageIndex || getCharacterState(target) === "spectator") {
    let best = null;
    let bestDist = Infinity;
    for (const c of chars) {
      const d = Math.abs(c.x - npc.x);
      if (d < bestDist) {
        best = c;
        bestDist = d;
      }
    }
    target = best;
    ai.targetId = target ? target.id : null;
  }
  if (!target) return;

  const dx = target.x - npc.x;
  const absDx = Math.abs(dx);
  const facingDir = dx >= 0 ? 1 : -1;
  npc.facing = facingDir;

  const w = Math.max(1, npc.w || CHAR_BASE_H * 0.65);
  const closeRange = w * 1.15;
  const midRange = w * 2.4;
  const farRange = w * 4.2;
  const lowHp = (npc.hp || HP_MAX) <= 90;
  const dangerHp = (npc.hp || HP_MAX) <= HP_DANGER_THRESHOLD;
  const hasKnife = !!getHeldKnifeItem(npc);
  const heldKnifeName = getHeldKnifeName(npc);
  const targetCombat = target.combat && target.combat.type ? target.combat.type : "";
  const targetAttacking = !!targetCombat;
  const comboActive =
    (npc.comboCount || 0) >= 2 &&
    nowMs - (npc.comboLastHitAt || 0) <= COMBO_RESET_MS;

  const bucket = bucketOf(npc.stageIndex);
  const items = (bucket?.items || []).filter(Boolean);

  let nearestKnife = null;
  let nearestKnifeDist = Infinity;
  let nearestFood = null;
  let nearestFoodDist = Infinity;
  let thrownKnife = null;
  let thrownKnifeDist = Infinity;

  for (const item of items) {
    if (item.carriedById || item.eatingById) continue;
    const d = Math.abs(item.x - npc.x);

    if (isKnifeName(item.name) && d < nearestKnifeDist) {
      nearestKnife = item;
      nearestKnifeDist = d;
    }
    if (FOOD_ITEM_NAMES.has(item.name) && d < nearestFoodDist) {
      nearestFood = item;
      nearestFoodDist = d;
    }

    if (
      isKnifeName(item.name) &&
      !hasKnife &&
      d < thrownKnifeDist
    ) {
      thrownKnife = item;
      thrownKnifeDist = d;
    }
  }

  function setNextThink(isCombatReaction = false) {
    if (isCombatReaction) {
      ai.thinkAt = nowMs + 120 + Math.random() * 60; // 120〜180ms
    } else {
      ai.thinkAt = nowMs + 260 + Math.random() * 120; // 260〜380ms
    }
  }

  function moveToward(x, speedMul = 1) {
    const dir = x >= npc.x ? 1 : -1;
    npc.facing = dir;
    npc.vx = clamp(
      (npc.vx || 0) + dir * 26 * speedMul,
      -190 * getMotionSpeedMultiplier(npc),
      190 * getMotionSpeedMultiplier(npc)
    );
  }

  function softenVelocity() {
    npc.vx *= 0.72;
  }

  function canAct(key) {
    if (!npc.actionCooldownUntil) return true;
    return nowMs >= (npc.actionCooldownUntil[key] || 0);
  }

  function act(action, inputDir = "forward") {
    handleAction(action, "auto", npc, inputDir);
    ai.lastActionAt = nowMs;
  }

  function pickWeighted(options) {
    const valid = options.filter((o) => o.weight > 0);
    if (!valid.length) return null;
    const total = valid.reduce((s, o) => s + o.weight, 0);
    let roll = Math.random() * total;
    for (const o of valid) {
      roll -= o.weight;
      if (roll <= 0) return o;
    }
    return valid[valid.length - 1];
  }

  function tryPickupNearby(item) {
    if (!item) return false;
    if (
      Math.abs(item.x - npc.x) <= w * 0.95 &&
      Math.abs(item.y - npc.y) <= npc.h * 0.9 &&
      canAct("pickup")
    ) {
      act("pickup", "forward");
      return true;
    }
    return false;
  }

  // 投擲後のナイフ回収を最優先
  if (!hasKnife && thrownKnife) {
    ai.mode = "recoverKnife";
    if (tryPickupNearby(thrownKnife)) {
      setNextThink(false);
      return;
    }
    moveToward(thrownKnife.x, 1.15);
    if (thrownKnifeDist > midRange && canAct("roll") && Math.random() < 0.18) {
      act("roll", thrownKnife.x >= npc.x ? "forward" : "backward");
      setNextThink(false);
      return;
    }
    setNextThink(false);
    return;
  }

  // 武器なしならナイフ最優先
  if (!hasKnife && nearestKnife) {
    ai.mode = "arm";
    if (tryPickupNearby(nearestKnife)) {
      setNextThink(false);
      return;
    }
    moveToward(nearestKnife.x, 1.05);
    if (nearestKnifeDist > closeRange && canAct("roll") && Math.random() < 0.16) {
      act("roll", nearestKnife.x >= npc.x ? "forward" : "backward");
      setNextThink(false);
      return;
    }
    setNextThink(false);
    return;
  }

  // 低体力なら回復も強め
  if (lowHp && nearestFood && nearestFoodDist <= farRange * 0.75) {
    ai.mode = "recover";
    if (tryPickupNearby(nearestFood)) {
      setNextThink(false);
      return;
    }
    moveToward(nearestFood.x, dangerHp ? 1.15 : 1.0);
    if (dangerHp && canAct("roll") && Math.random() < 0.20) {
      act("roll", nearestFood.x >= npc.x ? "forward" : "backward");
      setNextThink(false);
      return;
    }
    setNextThink(false);
    return;
  }

  // 相手攻撃中は短い思考間隔で反応
  if (targetAttacking && absDx <= midRange) {
    // 降下斬りにジャストガードを積極的に狙う
    if (targetCombat === "dropSlash" && hasKnife && canAct("roll")) {
      ai.mode = "defend";
      act("roll", "backward"); // 次の前はねるで justGuard を誘発
      setNextThink(true);
      return;
    }

    // ジャストガードには居合斬りを狙う
    if (targetCombat === "justGuard" && hasKnife && canAct("roll")) {
      ai.mode = "punish";
      act("roll", "forward"); // 次の前はねるで iaiSlash
      setNextThink(true);
      return;
    }

    // 居合斬りには降下斬りを狙う
    if (targetCombat === "iaiSlash" && hasKnife && canAct("bounce")) {
      ai.mode = "airCounter";
      act("bounce", "forward"); // 次の前転で dropSlash
      setNextThink(true);
      return;
    }

    if (canAct("roll") && Math.random() < 0.22) {
      ai.mode = "evade";
      act("roll", "backward");
      setNextThink(true);
      return;
    }
  }

  // コンボ中は攻め継続
  if (comboActive && absDx <= midRange) {
    ai.mode = "pressure";
    if (absDx <= closeRange && canAct("bounce")) {
      act("bounce", "forward");
      setNextThink(true);
      return;
    }
    if (absDx <= midRange && canAct("roll")) {
      act("roll", "forward");
      setNextThink(true);
      return;
    }
  }

  // 遠距離
  if (absDx >= farRange) {
    ai.mode = "approach";

    // pickupがクールダウン中でも bounce / roll が使えるなら並行して攻める
    if (hasKnife && heldKnifeName === "コトのナイフ" && canAct("pickup") && Math.random() < 0.14) {
      act("pickup", "forward");
      setNextThink(false);
      return;
    }

    moveToward(target.x, heldKnifeName === "サテラのナイフ" ? 1.15 : 1.0);

    if (hasKnife && canAct("roll") && Math.random() < 0.16) {
      act("roll", "forward");
      setNextThink(false);
      return;
    }

    if (hasKnife && canAct("bounce") && Math.random() < 0.10) {
      act("bounce", "forward");
      setNextThink(false);
      return;
    }

    setNextThink(false);
    return;
  }

  // 中距離: コマンド攻撃をかなり積極的に
  if (absDx > closeRange) {
    ai.mode = "footsies";

    const option = pickWeighted([
      { type: "approach", weight: 24 },
      { type: "rollForward", weight: canAct("roll") ? 16 : 0 },
      { type: "iaiPrep", weight: hasKnife && canAct("roll") ? (heldKnifeName === "アヤのナイフ" ? 26 : 18) : 0 },
      { type: "dropPrep", weight: hasKnife && canAct("bounce") ? (heldKnifeName === "狐色のナイフ" ? 24 : 16) : 0 },
      { type: "throw", weight: hasKnife && canAct("pickup") ? (heldKnifeName === "コトのナイフ" ? 16 : 8) : 0 },
      { type: "retreat", weight: canAct("roll") ? (dangerHp ? 18 : 8) : 0 },
      { type: "wait", weight: 18 } // wait増量
    ]);

    if (option?.type === "approach") {
      moveToward(target.x, 1.0);
      setNextThink(false);
      return;
    }
    if (option?.type === "rollForward") {
      act("roll", "forward");
      setNextThink(false);
      return;
    }
    if (option?.type === "iaiPrep") {
      act("roll", "forward");
      setNextThink(false);
      return;
    }
    if (option?.type === "dropPrep") {
      act("bounce", "forward");
      setNextThink(false);
      return;
    }
    if (option?.type === "throw") {
      act("pickup", "forward");
      setNextThink(false);
      return;
    }
    if (option?.type === "retreat") {
      act("roll", "backward");
      setNextThink(false);
      return;
    }

    softenVelocity();
    setNextThink(false);
    return;
  }

  // 近距離
  ai.mode = "close";
  const option = pickWeighted([
    { type: "normal", weight: canAct("bounce") ? 34 : 0 },
    { type: "backRoll", weight: canAct("roll") ? (dangerHp ? 24 : 14) : 0 },
    { type: "iai", weight: hasKnife && canAct("roll") ? (heldKnifeName === "アヤのナイフ" ? 22 : 14) : 0 },
    { type: "guard", weight: hasKnife && canAct("roll") ? (heldKnifeName === "漆黒のナイフ" ? 22 : 14) : 0 },
    { type: "throw", weight: hasKnife && canAct("pickup") ? (heldKnifeName === "コトのナイフ" ? 8 : 3) : 0 },
    { type: "wait", weight: 20 } // wait増量
  ]);

  if (option?.type === "normal") {
    act("bounce", "forward");
    setNextThink(false);
    return;
  }
  if (option?.type === "backRoll") {
    act("roll", "backward");
    setNextThink(false);
    return;
  }
  if (option?.type === "iai") {
    act("roll", "forward");
    setNextThink(false);
    return;
  }
  if (option?.type === "guard") {
    act("roll", "backward");
    setNextThink(false);
    return;
  }
  if (option?.type === "throw") {
    act("pickup", "forward");
    setNextThink(false);
    return;
  }

  softenVelocity();
  setNextThink(false);
}