// =====================================================
// 必殺技システム追加
// RePuniS.js 用
// =====================================================

// -----------------------------
// 1) 定数追加
// 既存の定数群の近くに追加
// -----------------------------
const SPECIAL_HOLD_MS = 3000;
const SPECIAL_INPUT_LOCK_MS = 220;
const SPECIAL_INVUL_TYPES = new Set([
  "berserkSecret",
  "voidSecret",
  "balanceSecret",
  "witchSecret",
  "divaSecret",
  "yandereSecret"
]);

const SPECIAL_DEF = {
  "アカウ": { type: "berserkSecret", effect: "effect1" },
  "ファタ": { type: "berserkSecret", effect: "effect1" },

  "タネイ": { type: "voidSecret", effect: "effect2" },

  "ミナツ": { type: "balanceSecret", effect: "effect3" },

  "サテラ": { type: "witchSecret", effect: "effect4" },

  "ジョーチョ": { type: "divaSecret", effect: "effect5" },

  "コト": { type: "yandereSecret", effect: "effect6" }
};

// -----------------------------
// 2) state 拡張
// 既存 state の combat に追加
// -----------------------------
/*
combat: {
  effects: [],
  slashFxImg: null,
  explosionFxImg: null,

  specialFxImgs: {},
  specialTextFx: []
},
*/
// -----------------------------
// 3) エンティティ初期値拡張
// createEntity() の return object に追加
// -----------------------------
/*
specialCharge: {
  active: false,
  startedAt: 0,
  ready: false,
  buttonAction: ""
},
specialMove: null,
damageCutUntil: 0,
*/
// -----------------------------
// 4) loadSpeechAssets() の末尾あたりに追加
// 画像は ./image/エフェクト1.png ... を想定
// -----------------------------
{
  const specialFxNames = [
    ["effect1", `${ASSET_BASE}/エフェクト1.png`],
    ["effect2", `${ASSET_BASE}/エフェクト2.png`],
    ["effect3", `${ASSET_BASE}/エフェクト3.png`],
    ["effect4", `${ASSET_BASE}/エフェクト4.png`],
    ["effect5", `${ASSET_BASE}/エフェクト5.png`],
    ["effect6", `${ASSET_BASE}/エフェクト6.png`]
  ];

  state.combat.specialFxImgs = {};
  for (const [key, path] of specialFxNames) {
    try {
      state.combat.specialFxImgs[key] = await loadImage(path);
    } catch (_e) {
      state.combat.specialFxImgs[key] = null;
    }
  }
}
// -----------------------------
// 5) 補助関数追加
// ユーティリティ群の近くへ
// -----------------------------
function hasSpecialMoveForActor(actor) {
  return !!(actor && SPECIAL_DEF[actor.name]);
}

function isSpecialActive(actor) {
  return !!(actor && actor.specialMove && actor.specialMove.active);
}

function getSpecialSpec(actor) {
  return actor ? (SPECIAL_DEF[actor.name] || null) : null;
}

function getNearestEnemyInRange(actor, range = Infinity) {
  if (!actor) return null;
  let best = null;
  let bestD = Infinity;
  const chars = getCharactersInStage(actor.stageIndex);
  for (const target of chars) {
    if (!target || target.id === actor.id) continue;
    if (getCharacterState(target) === "spectator") continue;
    const dx = target.x - actor.x;
    const dy = (target.y - actor.y);
    const d = Math.hypot(dx, dy);
    if (d < bestD && d <= range) {
      best = target;
      bestD = d;
    }
  }
  return best;
}

function spawnSpecialText(stageIndex, x, y, text, color = "#fff", life = 40, scale = 1) {
  state.combat.specialTextFx.push({
    stageIndex,
    x,
    y,
    text,
    color,
    life,
    maxLife: life,
    scale
  });
}

function spawnSpecialEffect(kind, stageIndex, x, y, dir = 1, scale = 1, tint = null, life = 24) {
  state.combat.effects.push({
    kind,
    stageIndex,
    x,
    y,
    dir,
    scale,
    tint,
    frame: 0,
    life
  });
}

function startSpecialCharge(actor, action, nowMs) {
  if (!actor || actor.kind === "item") return false;
  if (!hasSpecialMoveForActor(actor)) return false;
  if (getCharacterState(actor) === "spectator") return false;
  if (actor.combat && actor.combat.type) return false;
  if (isSpecialActive(actor)) return false;
  if (!actor.specialCharge) {
    actor.specialCharge = { active: false, startedAt: 0, ready: false, buttonAction: "" };
  }
  actor.specialCharge.active = true;
  actor.specialCharge.startedAt = nowMs;
  actor.specialCharge.ready = false;
  actor.specialCharge.buttonAction = action;
  return true;
}

function cancelSpecialCharge(actor) {
  if (!actor || !actor.specialCharge) return;
  actor.specialCharge.active = false;
  actor.specialCharge.ready = false;
  actor.specialCharge.buttonAction = "";
}

function updateSpecialCharge(actor, nowMs) {
  if (!actor || !actor.specialCharge || !actor.specialCharge.active) return;
  const elapsed = nowMs - actor.specialCharge.startedAt;
  if (elapsed >= SPECIAL_HOLD_MS && !actor.specialCharge.ready) {
    actor.specialCharge.ready = true;
    spawnSpecialText(actor.stageIndex, actor.x, actor.y - actor.h * 1.15, "秘技解放", "#ffd54a", 42, 1.15);
  }
}

function triggerSpecialMove(actor, nowMs) {
  if (!actor || !actor.specialCharge || !actor.specialCharge.ready) return false;
  const spec = getSpecialSpec(actor);
  if (!spec) return false;

  actor.specialMove = {
    active: true,
    type: spec.type,
    effectKey: spec.effect,
    startedAt: nowMs,
    frame: 0,
    hitIds: new Set(),
    marks: [],
    pulsesDone: 0,
    nextPulseAt: 0,
    nextStrikeAt: 0,
    counterWindowOpen: false,
    counterTriggered: false,
    pendingCounterVictimId: null,
    finishAt: 0,
    autoPhase: 0
  };

  actor.hitstopFrames = 0;
  actor.roll.active = false;
  actor.combat.type = null;
  actor.vx = 0;
  actor.vy = 0;
  actor.damageCutUntil = nowMs + 10000;

  // 演出
  if (spec.type === "berserkSecret") {
    actor.specialMove.finishAt = nowMs + 1800;
    actor.specialMove.nextStrikeAt = nowMs + 160;
    spawnSpecialText(actor.stageIndex, actor.x, actor.y - actor.h * 1.2, "狂暴の秘技", "#ff5a36", 52, 1.25);
  } else if (spec.type === "voidSecret") {
    actor.specialMove.finishAt = nowMs + 3000;
    actor.specialMove.counterWindowOpen = true;
    spawnSpecialText(actor.stageIndex, actor.x, actor.y - actor.h * 1.2, "無心の秘技", "#55a7ff", 54, 1.25);
  } else if (spec.type === "balanceSecret") {
    actor.specialMove.finishAt = nowMs + 1900;
    actor.specialMove.nextPulseAt = nowMs + 220;
    spawnSpecialText(actor.stageIndex, actor.x, actor.y - actor.h * 1.2, "中庸の秘技", "#3ab7ff", 54, 1.25);
  } else if (spec.type === "witchSecret") {
    actor.specialMove.finishAt = nowMs + 2200;
    actor.specialMove.nextStrikeAt = nowMs + 120;
    spawnSpecialText(actor.stageIndex, actor.x, actor.y - actor.h * 1.2, "魔女の秘技", "#ffd54a", 54, 1.25);
  } else if (spec.type === "divaSecret") {
    actor.specialMove.finishAt = nowMs + 2200;
    actor.specialMove.nextPulseAt = nowMs + 150;
    spawnSpecialText(actor.stageIndex, actor.x, actor.y - actor.h * 1.2, "歌姫の秘技", "#9cd7ff", 54, 1.25);
  } else if (spec.type === "yandereSecret") {
    actor.specialMove.finishAt = nowMs + 3400;
    actor.specialMove.counterWindowOpen = true;
    spawnSpecialText(actor.stageIndex, actor.x, actor.y - actor.h * 1.2, "病嬌の秘技", "#73b6ff", 54, 1.25);
  }

  cancelSpecialCharge(actor);
  return true;
}

function finishSpecialMove(actor) {
  if (!actor || !actor.specialMove) return;
  actor.specialMove.active = false;
  actor.specialMove = null;
  actor.damageCutUntil = 0;
}

function applyDirectSpecialDamage(attacker, target, damage, dir, hitstop = 8, knockback = "medium", allowCritical = false) {
  return applyHitToTarget(attacker, target, {
    damage,
    hitstop,
    knockback,
    allowCritical
  }, dir);
}

function performAreaSpecialHit(attacker, cx, cy, rx, ry, damage, opts = {}) {
  const chars = getCharactersInStage(attacker.stageIndex);
  for (const target of chars) {
    if (!target || target.id === attacker.id) continue;
    if (getCharacterState(target) === "spectator") continue;
    const dx = target.x - cx;
    const dy = (target.y - target.h * 0.5) - cy;
    const nx = dx / Math.max(1, rx);
    const ny = dy / Math.max(1, ry);
    if ((nx * nx + ny * ny) > 1) continue;
    if (opts.hitIds && opts.hitIds.has(target.id)) continue;
    const dir = dx >= 0 ? 1 : -1;
    const ok = applyDirectSpecialDamage(attacker, target, damage, dir, opts.hitstop || 8, opts.knockback || "medium", false);
    if (ok && opts.hitIds) opts.hitIds.add(target.id);
  }
}
// -----------------------------
// 6) 無敵判定拡張
// 既存 isActorInvulnerable() を置換
// -----------------------------
function isActorInvulnerable(actor) {
  if (!actor || actor.kind === "item") return false;

  if (isSpecialActive(actor) && SPECIAL_INVUL_TYPES.has(actor.specialMove.type)) {
    return true;
  }

  if (!actor.combat || !actor.combat.type) return false;
  const frame = getCombatFrame(actor);
  if (actor.combat.type === "rollForward") {
    return frame >= COMBAT_DEF.rollForward.evadeStart && frame <= COMBAT_DEF.rollForward.evadeEnd;
  }
  if (actor.combat.type === "rollBackward") {
    return frame >= COMBAT_DEF.rollBackward.evadeStart && frame <= COMBAT_DEF.rollBackward.evadeEnd;
  }
  return false;
}
// -----------------------------
// 7) カウンター秘技用に applyHitToTarget を拡張
// 既存 applyHitToTarget() の先頭付近へ追加
// -----------------------------
/*
  // 必殺カウンター待機中
  if (target && isSpecialActive(target)) {
    const sm = target.specialMove;
    if ((sm.type === "voidSecret" || sm.type === "yandereSecret") && sm.counterWindowOpen && !sm.counterTriggered) {
      sm.counterTriggered = true;
      sm.pendingCounterVictimId = attacker ? attacker.id : null;
      target.hitstopFrames = Math.max(Number.isFinite(target.hitstopFrames) ? target.hitstopFrames : 0, 10);
      if (attacker) {
        attacker.hitstopFrames = Math.max(Number.isFinite(attacker.hitstopFrames) ? attacker.hitstopFrames : 0, 10);
      }
      return false;
    }
  }
*/
// -----------------------------
// 8) 長押し入力追加
// 既存イベント登録の近くへ追加
// document.addEventListener("click", onActionButtonClick);
// の後に入れてください
// -----------------------------
const holdState = {
  pointerId: null,
  actorId: null,
  action: "",
  startedAt: 0,
  consumed: false
};

function onActionButtonPointerDown(e) {
  const btn = e.target.closest(".action-trigger");
  if (!btn) return;
  if (btn.dataset.action !== "bounce") return;

  const actor = getControlledActor();
  if (!actor || !hasSpecialMoveForActor(actor)) return;

  holdState.pointerId = e.pointerId ?? "mouse";
  holdState.actorId = actor.id;
  holdState.action = "bounce";
  holdState.startedAt = performance.now();
  holdState.consumed = false;

  startSpecialCharge(actor, "bounce", holdState.startedAt);
}

function onActionButtonPointerUp(e) {
  const btn = e.target.closest(".action-trigger");
  if (!btn) return;
  if (btn.dataset.action !== "bounce") return;

  const actor = getControlledActor();
  if (!actor || actor.id !== holdState.actorId) return;

  const nowMs = performance.now();
  if (actor.specialCharge?.active && actor.specialCharge.ready && !holdState.consumed) {
    holdState.consumed = true;
    triggerSpecialMove(actor, nowMs);
    return;
  }

  cancelSpecialCharge(actor);
}

function onActionButtonPointerCancel() {
  const actor = getControlledActor();
  if (actor) cancelSpecialCharge(actor);
  holdState.pointerId = null;
  holdState.actorId = null;
  holdState.action = "";
  holdState.consumed = false;
}
// -----------------------------
// 9) onActionButtonClick() を置換
// 長押し成功後は通常の はねる を出さない
// -----------------------------
function onActionButtonClick(e) {
  const btn = e.target.closest(".action-trigger");
  if (!btn) return;
  const action = btn.dataset.action;
  if (!action) return;

  const actor = getControlledActor();

  if (
    action === "bounce" &&
    actor &&
    hasSpecialMoveForActor(actor) &&
    actor.specialCharge &&
    actor.specialCharge.ready
  ) {
    return; // pointerup 側で必殺に変換済み
  }

  let directionMode = "forward";
  if (actor) {
    const rect = btn.getBoundingClientRect();
    const localX = e.clientX - rect.left;
    const clickDir = localX >= rect.width * 0.5 ? 1 : -1;
    const facingDir = actor.facing >= 0 ? 1 : -1;
    directionMode = clickDir === facingDir ? "forward" : "backward";
  }

  handleAction(action, "user", null, directionMode);
}
// -----------------------------
// 10) イベント登録追加
// init() の末尾側イベント登録の近くへ追加
// -----------------------------
document.addEventListener("pointerdown", onActionButtonPointerDown);
document.addEventListener("pointerup", onActionButtonPointerUp);
document.addEventListener("pointercancel", onActionButtonPointerCancel);
// -----------------------------
// 11) 必殺更新
// 新規追加
// -----------------------------
function updateSpecialMoves(nowMs, dt) {
  const chars = getAllEntities().filter((ent) => ent && ent.kind !== "item");
  for (const actor of chars) {
    updateSpecialCharge(actor, nowMs);

    if (!isSpecialActive(actor)) continue;
    const sm = actor.specialMove;
    sm.frame += dt * COMBAT_FRAME_RATE;

    // 共通の赤/青/黄の暴れ演出
    if ((Math.floor(sm.frame) % 4) === 0) {
      let tint = null;
      if (sm.type === "berserkSecret") tint = "#ff4949";
      else if (sm.type === "voidSecret") tint = "#3e90ff";
      else if (sm.type === "balanceSecret") tint = "#45cf66";
      else if (sm.type === "witchSecret") tint = "#ffd54a";
      else if (sm.type === "divaSecret") tint = "#9cd7ff";
      else if (sm.type === "yandereSecret") tint = "#73b6ff";

      spawnSpecialEffect(
        "special",
        actor.stageIndex,
        actor.x + (Math.random() - 0.5) * actor.w * 1.4,
        actor.y - actor.h * (0.3 + Math.random() * 0.9),
        actor.facing || 1,
        0.65 + Math.random() * 0.5,
        tint,
        12
      );
    }

    // 狂暴の秘技: 近くの敵へ自動追撃×3
    if (sm.type === "berserkSecret") {
      if (nowMs >= sm.nextStrikeAt && sm.autoPhase < 3) {
        const target = getNearestEnemyInRange(actor, actor.w * 8);
        if (target) {
          const dx = target.x - actor.x;
          const dir = dx >= 0 ? 1 : -1;
          actor.facing = dir;
          actor.x = clamp(target.x - dir * actor.w * 0.85, stageOf(actor.stageIndex).x + actor.w * 0.5, stageOf(actor.stageIndex).x + stageOf(actor.stageIndex).width - actor.w * 0.5);
          actor.y = Math.min(actor.y, target.y);
          spawnSpecialEffect("special", actor.stageIndex, actor.x, actor.y - actor.h * 0.55, dir, 1.5, "#ff4930", 18);
          spawnExplosionEffect(actor.stageIndex, target.x, target.y, 0.8);
          applyDirectSpecialDamage(actor, target, 34, dir, 10, "medium", false);
        }
        sm.autoPhase += 1;
        sm.nextStrikeAt = nowMs + 240;
      }
      if (nowMs >= sm.finishAt) finishSpecialMove(actor);
      continue;
    }

    // 魔女の秘技: 追撃×5、威力低め
    if (sm.type === "witchSecret") {
      if (nowMs >= sm.nextStrikeAt && sm.autoPhase < 5) {
        const target = getNearestEnemyInRange(actor, actor.w * 9);
        if (target) {
          const dx = target.x - actor.x;
          const dir = dx >= 0 ? 1 : -1;
          actor.facing = dir;
          actor.x = clamp(target.x - dir * actor.w * 0.8, stageOf(actor.stageIndex).x + actor.w * 0.5, stageOf(actor.stageIndex).x + stageOf(actor.stageIndex).width - actor.w * 0.5);
          spawnSpecialEffect("special", actor.stageIndex, actor.x, actor.y - actor.h * 0.52, dir, 1.3, "#ffd54a", 16);
          applyDirectSpecialDamage(actor, target, 22, dir, 8, "small", false);
        }
        sm.autoPhase += 1;
        sm.nextStrikeAt = nowMs + 150;
      }
      if (nowMs >= sm.finishAt) finishSpecialMove(actor);
      continue;
    }

    // 無心の秘技: 超長待機カウンター、高威力、高範囲
    if (sm.type === "voidSecret") {
      actor.vx = 0;
      actor.vy = 0;
      if (!sm.counterTriggered) {
        spawnSpecialEffect("special", actor.stageIndex, actor.x, actor.y - actor.h * 0.6, actor.facing || 1, 1.0, "#3e90ff", 10);
      }
      if (sm.counterTriggered && !sm.resolved) {
        sm.resolved = true;
        const victim = getEntityById(sm.pendingCounterVictimId);
        const cx = actor.x + (actor.facing || 1) * actor.w * 0.8;
        const cy = actor.y - actor.h * 0.55;
        spawnSpecialEffect("special", actor.stageIndex, cx, cy, actor.facing || 1, 2.0, "#55a7ff", 30);
        if (victim) {
          performAreaSpecialHit(actor, cx, cy, actor.w * 3.0, actor.h * 2.2, 72, { hitstop: 14, knockback: "medium", hitIds: new Set() });
        } else {
          performAreaSpecialHit(actor, cx, cy, actor.w * 3.0, actor.h * 2.2, 72, { hitstop: 14, knockback: "medium", hitIds: new Set() });
        }
        sm.finishAt = nowMs + 420;
      }
      if (nowMs >= sm.finishAt) finishSpecialMove(actor);
      continue;
    }

    // 病嬌の秘技: 動けるカウンター、威力低め、ハート表示
    if (sm.type === "yandereSecret") {
      spawnSpecialEffect("special", actor.stageIndex, actor.x, actor.y - actor.h * 0.85, actor.facing || 1, 0.9, "#73b6ff", 10);
      if (sm.counterTriggered && !sm.resolved) {
        sm.resolved = true;
        const cx = actor.x + (actor.facing || 1) * actor.w * 0.7;
        const cy = actor.y - actor.h * 0.52;
        spawnSpecialEffect("special", actor.stageIndex, cx, cy, actor.facing || 1, 1.65, "#73b6ff", 28);
        performAreaSpecialHit(actor, cx, cy, actor.w * 2.5, actor.h * 1.9, 48, { hitstop: 11, knockback: "medium", hitIds: new Set() });
        sm.finishAt = nowMs + 380;
      }
      if (nowMs >= sm.finishAt) finishSpecialMove(actor);
      continue;
    }

    // 中庸の秘技: 多段・超高範囲の世界断ち
    if (sm.type === "balanceSecret") {
      actor.vx = 0;
      actor.vy = 0;
      if (nowMs >= sm.nextPulseAt && sm.pulsesDone < 6) {
        sm.pulsesDone += 1;
        sm.nextPulseAt = nowMs + 180;
        sm.hitIds = new Set();

        const lineX = actor.x + (actor.facing || 1) * actor.w * (0.4 + sm.pulsesDone * 0.18);
        spawnSpecialEffect("special", actor.stageIndex, lineX, actor.y - actor.h * 0.58, actor.facing || 1, 2.15, "#45cf66", 22);
        performAreaSpecialHit(actor, lineX, actor.y - actor.h * 0.55, actor.w * 3.8, actor.h * 2.4, 18, {
          hitstop: 8,
          knockback: "small",
          hitIds: sm.hitIds
        });
      }
      if (nowMs >= sm.finishAt) {
        // 締めの大斬撃
        performAreaSpecialHit(actor, actor.x + (actor.facing || 1) * actor.w * 1.0, actor.y - actor.h * 0.55, actor.w * 4.6, actor.h * 2.8, 42, {
          hitstop: 12,
          knockback: "medium",
          hitIds: new Set()
        });
        finishSpecialMove(actor);
      }
      continue;
    }

    // 歌姫の秘技: 同心円エコー7波
    if (sm.type === "divaSecret") {
      actor.vx = 0;
      actor.vy = 0;
      if (nowMs >= sm.nextPulseAt && sm.pulsesDone < 7) {
        sm.pulsesDone += 1;
        sm.nextPulseAt = nowMs + 170;
        const r = actor.w * (0.8 + sm.pulsesDone * 0.55);
        spawnSpecialEffect("echo", actor.stageIndex, actor.x, actor.y - actor.h * 0.52, 1, r / Math.max(1, actor.w), "#9cd7ff", 22);
        performAreaSpecialHit(actor, actor.x, actor.y - actor.h * 0.52, r, actor.h * (0.7 + sm.pulsesDone * 0.12), 20, {
          hitstop: 7,
          knockback: "small",
          hitIds: new Set()
        });
      }
      if (nowMs >= sm.finishAt) finishSpecialMove(actor);
      continue;
    }
  }
}
// -----------------------------
// 12) drawCombatEffects() を拡張
// 既存 drawCombatEffects() の forEach 内に追加
// -----------------------------
/*
      if (fx.kind === "special") {
        const viewScale = 0.95;
        const effectKey = (() => {
          if (fx.tint === "#ff4930") return "effect1";
          if (fx.tint === "#3e90ff") return "effect2";
          if (fx.tint === "#45cf66") return "effect3";
          if (fx.tint === "#ffd54a") return "effect4";
          if (fx.tint === "#9cd7ff") return "effect5";
          if (fx.tint === "#73b6ff") return "effect6";
          return null;
        })();
        const img = effectKey ? state.combat.specialFxImgs[effectKey] : null;
        if (img) {
          const alpha = clamp(fx.life / 24, 0, 1);
          const baseW = 56 * view.zoom * (fx.scale || 1) * viewScale;
          const baseH = baseW * (img.naturalHeight / Math.max(1, img.naturalWidth));
          ctx.save();
          ctx.globalCompositeOperation = "source-over";
          ctx.globalAlpha = 0.92 * alpha;
          ctx.translate(x, y);
          if ((fx.dir || 1) < 0) ctx.scale(-1, 1);
          ctx.drawImage(img, -baseW * 0.5, -baseH * 0.5, baseW, baseH);
          ctx.restore();
        }
        return;
      }

      if (fx.kind === "echo") {
        const alpha = clamp(fx.life / 22, 0, 1);
        const radius = 32 * view.zoom * (fx.scale || 1);
        ctx.save();
        ctx.globalAlpha = 0.85 * alpha;
        ctx.strokeStyle = fx.tint || "#9cd7ff";
        ctx.lineWidth = Math.max(2, 5 * alpha);
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x, y, radius * 0.72, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        const noteImg = state.combat.specialFxImgs.effect5;
        if (noteImg) {
          const noteW = 24 * view.zoom;
          const noteH = noteW * (noteImg.naturalHeight / Math.max(1, noteImg.naturalWidth));
          for (let i = 0; i < 3; i += 1) {
            const a = (Math.PI * 2 * i) / 3 + fx.frame * 0.06;
            const nx = x + Math.cos(a) * radius;
            const ny = y + Math.sin(a) * radius * 0.7;
            ctx.save();
            ctx.globalAlpha = 0.78 * alpha;
            ctx.drawImage(noteImg, nx - noteW * 0.5, ny - noteH * 0.5, noteW, noteH);
            ctx.restore();
          }
        }
        return;
      }
*/
// -----------------------------
// 13) テキストFX描画追加
// 新規追加
// -----------------------------
function drawSpecialTexts() {
  const view = getViewTransform();
  for (let i = state.combat.specialTextFx.length - 1; i >= 0; i -= 1) {
    const fx = state.combat.specialTextFx[i];
    if (fx.stageIndex !== state.currentStageIndex) continue;
    const alpha = clamp(fx.life / fx.maxLife, 0, 1);
    const x = (fx.x - state.camera.x) * view.zoom + view.offsetX;
    const y = (fx.y - state.camera.y) * view.zoom + view.offsetY;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `bold ${Math.round(24 * (fx.scale || 1))}px "Segoe UI", sans-serif`;
    ctx.lineWidth = 6;
    ctx.strokeStyle = "rgba(0,0,0,0.55)";
    ctx.strokeText(fx.text, x, y);
    ctx.fillStyle = fx.color || "#fff";
    ctx.fillText(fx.text, x, y);
    ctx.restore();

    fx.life -= 1;
    fx.y -= 0.7;
    if (fx.life <= 0) {
      state.combat.specialTextFx.splice(i, 1);
    }
  }
}
// -----------------------------
// 14) tick() に追加
// updateCombatEffects(dt) の後あたり
// -----------------------------
/*
updateSpecialMoves(now, dt);
*/
// -----------------------------
// 15) draw 側に追加
// drawCombatEffects() の後あたり
// -----------------------------
/*
drawSpecialTexts();
*/
// -----------------------------
// 16) プレイヤー以外の通常操作を止めたいなら
// handleAction() 冒頭付近に追加
// 必殺中は通常操作を受け付けない
// 病嬌の秘技だけは動けるので除外
// -----------------------------
/*
if (actor && isSpecialActive(actor) && actor.specialMove.type !== "yandereSecret") return;
*/
// -----------------------------
// 17) 必殺中のチャージ表示を軽く出したい場合
// updateActionCooldownUi(nowMs) の末尾あたりに追加
// -----------------------------
/*
if (actor && actor.specialCharge && actor.specialCharge.active) {
  const remain = Math.max(0, SPECIAL_HOLD_MS - (nowMs - actor.specialCharge.startedAt));
  if (remain > 0) {
    hud.style.display = "block";
    hud.textContent = `秘技チャージ ${(remain / 1000).toFixed(1)}s`;
  } else {
    hud.style.display = "block";
    hud.textContent = "秘技解放！ はねるを離して発動";
  }
}
*/