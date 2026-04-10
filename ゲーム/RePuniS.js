
(() => {
  "use strict";

  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const hud = document.getElementById("hud");
  const sidebar = document.getElementById("sidebar");
  const entityPanel = document.getElementById("entityPanel");
  const navLeft = document.getElementById("navLeft");
  const navRight = document.getElementById("navRight");
  const gameWrap = document.getElementById("gameWrap");
  const entityList = document.getElementById("entityList");
  const entityCountTitle = document.getElementById("entityCountTitle");
  const stageSelector = document.getElementById("stageSelector");
  const speechLogDesktop = document.getElementById("speechLogDesktop");
  const speechLogMobile = document.getElementById("speechLogMobile");
  const toggleLeftSidebar = document.getElementById("toggleLeftSidebar");
  const toggleRightSidebar = document.getElementById("toggleRightSidebar");
  const startScreen = document.getElementById("startScreen");
  const modePlayBtn = document.getElementById("modePlayBtn");
  const modeStadiumBtn = document.getElementById("modeStadiumBtn");
  const stadiumSetup = document.getElementById("stadiumSetup");
  const selfCharSelect = document.getElementById("selfCharSelect");
  const enemyCharSelect = document.getElementById("enemyCharSelect");
  const stadiumKnifeSelect = document.getElementById("stadiumKnifeSelect");
  const stadiumKnife2Select = document.getElementById("stadiumKnife2Select");
  const selfCharPreview = document.getElementById("selfCharPreview");
  const enemyCharPreview = document.getElementById("enemyCharPreview");
  const startGameBtn = document.getElementById("startGameBtn");
  const combatHelpBtn = document.getElementById("combatHelpBtn");
  const combatHelpBox = document.getElementById("combatHelpBox");
  const combatHelpClose = document.getElementById("combatHelpClose");

  const ASSET_BASE = "./image";
  const PUNI_BASE = `${ASSET_BASE}/puni`;
  const ITEM_BASE = `${ASSET_BASE}/item`;

  const FAR_BG_FILES = ["朝.jpg", "昼.jpg", "夕方.jpg", "夜.jpg"];
  const DAY_CYCLE_MS = 15 * 60 * 1000;
  const DAY_FADE_MS = 1800;

  const SPEECH_JSON_CANDIDATES = ["./RePuniS.json"];
  const AUTO_SPEECH_INTERVAL_MS = 30 * 1000;
  const AUTO_SPEECH_CHANCE = 1 / 5;
  const SPEECH_BUBBLE_MS = 3200;
  const CONTACT_SPEECH_INTERVAL_MS = 30 * 1000;
  const CONTACT_CHAT_CHANCE = 1 / 3;
  const CONTACT_DIALOGUE_CHANCE = 1 / 2;
  const CONTACT_PAIR_COOLDOWN_MS = 15 * 60 * 1000;
  const DIALOGUE_LINE_INTERVAL_MS = 900;
  const AUTO_BEHAVIOR_INTERVAL_MS = 30 * 1000;
  const AUTO_PERCEPTION_RANGE = 520;
  const AUTO_IMPROVE_EPS = 6;
  const AUTO_ROLL_NO_IMPROVE_LIMIT = 2;
  const ITEM_DESPAWN_IDLE_MS = 2 * 60 * 1000;
  const ITEM_SWEEP_INTERVAL_MS = 1000;

  const EAT_EFFECT_MS = 2200;
  const COMBAT_FRAME_RATE = 60;
  const COMMAND_BUFFER_FRAMES = 12;
  const FOOD_ITEM_NAMES = new Set(["チャハン", "サシィク", "タピオカ"]);
  const COMBAT_DEF = {
    normal: {
      total: 17,
      activeStart: 5,
      activeEnd: 7,
      damage: 14,
      hitstop: 4,
      knockback: "small",
      hitbox: { x1: 0.28, x2: 1.02, y1: -0.82, y2: -0.22 }
    },
    rollForward: {
      total: 24,
      evadeStart: 5,
      evadeEnd: 8,
      activeStart: 9,
      activeEnd: 12,
      damage: 18,
      hitstop: 5,
      knockback: "medium",
      hitbox: { x1: 0.18, x2: 1.18, y1: -0.52, y2: -0.06 }
    },
    rollBackward: {
      total: 20,
      evadeStart: 4,
      evadeEnd: 9,
      moveStart: 4,
      moveEnd: 12
    },
    throwKnife: {
      total: 20,
      closeHitFrame: 7,
      launchFrame: 8,
      damage: 16,
      hitstop: 4,
      knockback: "medium",
      closeHitbox: { x1: 0.18, x2: 0.70, y1: -0.72, y2: -0.18 },
      projectile: { w: 0.55, h: 0.22, duration: 50, speed: 580 }
    },
    dropSlash: {
      total: 29,
      diveStart: 8,
      activeStart: 11,
      activeEnd: 15,
      landHitStart: 16,
      landHitEnd: 17,
      damage: 24,
      landDamage: 6,
      hitstop: 6,
      knockback: "medium",
      hitbox: { x1: 0.08, x2: 0.92, y1: -1.02, y2: 0.02 },
      landHitbox: { x1: 0.00, x2: 1.05, y1: -0.20, y2: 0.06 },
      startVy: -120,
      diveVy: 560,
      forwardVx: 110
    },
    justGuard: {
      totalSuccess: 18,
      totalFail: 20,
      guardStart: 4,
      guardEnd: 7,
      counterStart: 9,
      counterEnd: 11,
      damage: 12,
      critDamage: 16,
      hitstop: 5,
      knockback: "medium",
      guardHitbox: { x1: -0.18, x2: 0.82, y1: -1.00, y2: -0.10 },
      counterHitbox: { x1: 0.20, x2: 0.98, y1: -0.74, y2: -0.18 },
      counterCritHitbox: { x1: 0.42, x2: 0.76, y1: -0.58, y2: -0.24 }
    },
    iaiSlash: {
      total: 26,
      pauseStart: 5,
      pauseEnd: 9,
      activeStart: 10,
      activeEnd: 11,
      fxFrame: 12,
      damage: 30,
      critDamage: 38,
      counterDamage: 44,
      hitstop: 8,
      knockback: "medium",
      hitbox: { x1: 0.34, x2: 1.75, y1: -0.74, y2: -0.20 },
      critHitbox: { x1: 0.72, x2: 1.34, y1: -0.58, y2: -0.24 },
      dashVx: 240
    }
  };

  const CHAR_BASE_H = 69;
  const ITEM_BASE_H = Math.round(CHAR_BASE_H * 0.75);
  const NPC_LIMIT = 2;
  const ITEM_LIMIT = 2;
  const KNIFE_REFERENCE_NAME = "ガナリのナイフ";

  const PHYS = {
    gravity: 230,
    drag: 0.995,
    bounce: 0.35,
    maxFall: 1200
  };

  const EDGE_ICON_MARGIN = 70;

  const ACTION_COOLDOWN_MS = 3000;
  const HP_MAX = 300;
  const HP_DANGER_THRESHOLD = 50;
  const EAT_HEAL_AMOUNT = 125;
  const CRIT_BASE_CHANCE = 0.08;
  const CRIT_COMBO_BONUS = 0.035;
  const CRIT_MAX_CHANCE = 0.42;
  const CRIT_DAMAGE_MULT = 1.3;
  const COMBO_RESET_MS = 3200;
  const COMBO_DISPLAY_MS = 1600;

  const STAGES = [
    { bg: "アーケイ.png", mask: "判定1.png" },
    { bg: "イラー.png", mask: "判定2.png" },
    { bg: "シュメケルペ.png", mask: "判定3.png" },
    { bg: "ヘリエン.png", mask: "判定3.png" },
    { bg: "スタジアム.png", mask: "判定4.png" }
  ];

  const STAGE_SELECT_NAMES = ["アーケイ", "イラー", "シュメケルペ", "ヘリエン", "アリーナ"];
  const ARENA_STAGE_INDEX = 4;

  const CHARACTER_GROUPS = [
    { title: "タネイ政権", names: ["アカウ", "カレイ", "タネイ", "モノ"] },
    { title: "西アルトス研究会", names: ["アリー", "レト", "ファタ", "ミナツ", "クラ", "ハル"] },
    { title: "サウソス", names: ["サテラ", "シユウ", "シナン", "モン"] },
    { title: "VUISAL", names: ["チエル", "メウ", "ニプロ", "ロイド", "レイマー", "ヴィオン"] },
    { title: "ZC", names: ["チサ", "ジョーチョ"] },
    { title: "五天", names: ["アルカ", "キルロード", "キュビ", "コト", "アーシャ"] }
  ];

  const CHARACTER_FILES = new Map([
    ["アカウ", "アカウ.png"], ["カレイ", "カレイ.png"], ["タネイ", "タネイ.png"], ["モノ", "モノ.png"],
    ["アリー", "アリー.png"], ["レト", "レト.png"], ["ファタ", "ファタ.png"], ["ミナツ", "ミナツ.png"], ["クラ", "クラ.png"], ["ハル", "ハル.png"],
    ["サテラ", "サテラ.png"], ["シユウ", "シユウ.png"], ["シナン", "シナン.png"], ["モン", "モン.png"],
    ["チエル", "チエル.png"], ["メウ", "メウ.png"], ["ニプロ", "ニプロ.png"], ["ロイド", "ロイド.png"], ["レイマー", "レイマー.png"], ["ヴィオン", "ヴィオン.png"],
    ["チサ", "チサ.png"], ["ジョーチョ", "ジョーチョ.png"],
    ["アルカ", "アルカ.png"], ["キルロード", "キルロード.png"], ["キュビ", "キュビ.png"], ["コト", "コト.png"], ["アーシャ", "アーシャ.png"]
  ]);

  const ITEM_FILES = new Map([
    ["狐色のナイフ", "狐色のナイフ.png"], ["漆黒のナイフ", "漆黒のナイフ.PNG"], ["真紅のナイフ", "真紅のナイフ.png"], ["純白のナイフ", "純白のナイフ.png"],
    ["アヤのナイフ", "アヤのナイフ.png"], ["コトのナイフ", "コトのナイフ.PNG"], ["サテラのナイフ", "サテラのナイフ.PNG"], ["ガナリのナイフ", "ガナリのナイフ.png"],
    ["チャハン", "チャハン.png"], ["サシィク", "サシィク.png"], ["タピオカ", "タピオカ.png"], ["ギター", "ギター.png"], ["ぬいぐるみ", "ぬいぐるみ.png"]
  ]);

  const state = {
    ready: false,
    scale: 1,
    stages: [],
    stageBuckets: [],
    worldWidth: 0,
    worldHeight: 720,
    camera: { x: 0, y: 0 },
    currentStageIndex: 0,
    lastTime: performance.now(),
    selectedCharacter: "アカウ",
    selectedItem: "狐色のナイフ",
    farBg: {
      images: [],
      currentIndex: 0,
      nextIndex: 1,
      isFading: false,
      fadeProgress: 0,
      lastSwitchAt: performance.now()
    },
    player: null,
    drag: {
      active: false,
      pointerId: null,
      entityId: null,
      grabOffsetX: 0,
      grabOffsetY: 0,
      prevClientX: 0,
      prevClientY: 0,
      downX: 0,
      downY: 0,
      bestX: 0,
      bestY: 0,
      hasBest: false,
      faceOnly: false,
      groundOnly: false
    },
    speech: {
      dailyByCharacter: new Map(),
      chatByCharacter: new Map(),
      dialoguesByPair: new Map(),
      metaByCharacter: new Map(),
      pairCooldownByEntity: new Map(),
      nextAt: performance.now() + AUTO_SPEECH_INTERVAL_MS,
      nextContactAt: performance.now() + CONTACT_SPEECH_INTERVAL_MS,
      bubbleUntil: 0,
      bubbleEntityId: null,
      leftBubbleImg: null,
      rightBubbleImg: null,
      eatFxImg: null,
      dialogueQueue: [],
      dialogueNextAt: 0
    },
    ai: {
      nextAt: performance.now() + AUTO_BEHAVIOR_INTERVAL_MS,
      targetId: null,
      lastDistance: Number.POSITIVE_INFINITY,
      noImproveRolls: 0
    },
    itemLifecycle: {
      nextSweepAt: performance.now() + ITEM_SWEEP_INTERVAL_MS
    },
    combat: {
      effects: [],
      slashFxImg: null,
      explosionFxImg: null
    },
    ui: { panelDirty: true, panelStage: -1, speechLogs: [] },
    start: {
      mode: "play",
      selfChar: "アカウ",
      enemyChar: "カレイ",
      knife: "狐色のナイフ",
      knife2: "漆黒のナイフ",
      started: false
    },
    loopStarted: false};

  const imageCache = new Map();
  const boundsCache = new Map();
  let nextEntityId = 1;
  let knifeReferenceDiag = null;

  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
  function stageOf(index) { return state.stages[index]; }
  function bucketOf(stageIndex) { return state.stageBuckets[stageIndex]; }
  function getCharacterState(ent) {
    if (!ent || ent.kind === "item") return "normal";
    const hp = Number.isFinite(ent.hp) ? ent.hp : HP_MAX;
    if (hp <= 0) return "spectator";
    if (hp <= HP_DANGER_THRESHOLD) return "danger";
    return "normal";
  }
  function setCharacterHp(ent, nextHp) {
    if (!ent || ent.kind === "item") return;
    const maxHp = Number.isFinite(ent.maxHp) ? ent.maxHp : HP_MAX;
    ent.maxHp = maxHp;
    ent.hp = clamp(Number.isFinite(nextHp) ? nextHp : maxHp, 0, maxHp);
    if (ent.hp <= 0) {
      if (ent.carryingItemId) detachCarriedItem(ent, true);
      if (ent.combat) ent.combat.type = null;
      ent.vx = 0;
      ent.vy = 0;
    }
    state.ui.panelDirty = true;
  }
  function healCharacter(ent, amount) {
    if (!ent || ent.kind === "item") return;
    const heal = Number.isFinite(amount) ? amount : 0;
    setCharacterHp(ent, (Number.isFinite(ent.hp) ? ent.hp : HP_MAX) + heal);
  }
  function getHpRatio(ent) {
    if (!ent || ent.kind === "item") return 1;
    const maxHp = Math.max(1, Number.isFinite(ent.maxHp) ? ent.maxHp : HP_MAX);
    const hp = Number.isFinite(ent.hp) ? ent.hp : maxHp;
    return clamp(hp / maxHp, 0, 1);
  }

  function isKnifeName(name) {
    return typeof name === "string" && name.includes("ナイフ");
  }

  function getHeldKnifeItem(actor) {
    const item = getCarriedItem(actor);
    if (!item) return null;
    return isKnifeName(item.name) ? item : null;
  }

  function getHeldKnifeName(actor, fallbackSpec = null) {
    if (fallbackSpec && typeof fallbackSpec.knifeName === "string" && fallbackSpec.knifeName) return fallbackSpec.knifeName;
    const held = getHeldKnifeItem(actor);
    return held ? held.name : "";
  }

  function getMotionSpeedMultiplier(actor) {
    const knifeName = getHeldKnifeName(actor);
    return knifeName === "サテラのナイフ" ? 1.2 : 1;
  }

  function getKnifeDamageMultiplier(actor, actionType, knifeName = "") {
    let mul = 1;
    const hp = Number.isFinite(actor && actor.hp) ? actor.hp : HP_MAX;
    const maxHp = Number.isFinite(actor && actor.maxHp) ? actor.maxHp : HP_MAX;

    if (knifeName === "真紅のナイフ" && hp <= 50) mul *= 1.5;
    if (knifeName === "純白のナイフ" && hp >= maxHp) mul *= 1.1;
    if (knifeName === "狐色のナイフ" && actionType === "dropSlash") mul *= 1.3;
    if (knifeName === "漆黒のナイフ" && actionType === "justGuard") mul *= 1.3;
    if (knifeName === "アヤのナイフ" && actionType === "iaiSlash") mul *= 1.3;
    if (knifeName === "コトのナイフ" && actionType === "throwKnife") mul *= 1.3;

    return mul;
  }

  function getCriticalChance(actor, nowMs) {
    if (!actor) return CRIT_BASE_CHANCE;
    const last = Number.isFinite(actor.comboLastHitAt) ? actor.comboLastHitAt : 0;
    const activeCombo = (nowMs - last <= COMBO_RESET_MS) ? Math.max(0, Number.isFinite(actor.comboCount) ? actor.comboCount : 0) : 0;
    return clamp(CRIT_BASE_CHANCE + activeCombo * CRIT_COMBO_BONUS, CRIT_BASE_CHANCE, CRIT_MAX_CHANCE);
  }

  function registerComboHit(attacker, nowMs, isCritical) {
    if (!attacker || attacker.kind === "item") return;
    const last = Number.isFinite(attacker.comboLastHitAt) ? attacker.comboLastHitAt : 0;
    if (nowMs - last <= COMBO_RESET_MS) {
      attacker.comboCount = (Number.isFinite(attacker.comboCount) ? attacker.comboCount : 0) + 1;
    } else {
      attacker.comboCount = 1;
    }
    attacker.comboLastHitAt = nowMs;
    attacker.comboDisplayUntil = nowMs + COMBO_DISPLAY_MS;
    if (isCritical) attacker.comboCritUntil = nowMs + 900;
  }

  function updateComboState(ent, nowMs) {
    if (!ent || ent.kind === "item") return;
    if (!Number.isFinite(ent.comboCount)) ent.comboCount = 0;
    if (!Number.isFinite(ent.comboLastHitAt)) ent.comboLastHitAt = 0;
    if (ent.comboCount > 0 && nowMs - ent.comboLastHitAt > COMBO_RESET_MS) {
      ent.comboCount = 0;
    }
  }

  function getCombatFrame(actor) {
    if (!actor || !actor.combat || !actor.combat.type) return 0;
    return Math.floor(actor.combat.frame) + 1;
  }

  function rememberCombatInput(actor, inputName, dir, nowMs) {
    if (!actor) return;
    if (!actor.commandBuffer) actor.commandBuffer = [];
    actor.commandBuffer.push({ input: inputName, dir, at: nowMs });
    if (actor.commandBuffer.length > 6) {
      actor.commandBuffer.splice(0, actor.commandBuffer.length - 6);
    }
  }

  function cleanupCombatInputBuffer(actor, nowMs) {
    if (!actor || !actor.commandBuffer) return;
    const keepMs = (1000 / COMBAT_FRAME_RATE) * COMMAND_BUFFER_FRAMES;
    actor.commandBuffer = actor.commandBuffer.filter((x) => nowMs - x.at <= keepMs);
  }

  function getRecentCombatInput(actor, indexFromLast = 0) {
    if (!actor || !actor.commandBuffer || !actor.commandBuffer.length) return null;
    const idx = actor.commandBuffer.length - 1 - indexFromLast;
    return idx >= 0 ? actor.commandBuffer[idx] : null;
  }

  function tryBeginCommandCombat(actor, action, motionDir, nowMs) {
    if (!actor || !getHeldKnifeItem(actor)) return false;
    cleanupCombatInputBuffer(actor, nowMs);

    const facingDir = actor.facing >= 0 ? 1 : -1;
    const bounceCd = actor.actionCooldownUntil ? (actor.actionCooldownUntil.bounce || 0) : 0;
    const rollCd = actor.actionCooldownUntil ? (actor.actionCooldownUntil.roll || 0) : 0;

    if (
      action === "roll" &&
      motionDir === facingDir &&
      !actor.grounded &&
      nowMs < bounceCd
    ) {
      return beginCombatAction(actor, "dropSlash", facingDir);
    }

    if (
      action === "bounce" &&
      motionDir === facingDir &&
      nowMs < rollCd
    ) {
      const prev = getRecentCombatInput(actor, 0);
      const rollDir = Number.isFinite(actor.lastRollDir)
        ? actor.lastRollDir
        : (prev && prev.input === "roll" ? prev.dir : 0);
      if (rollDir === -facingDir) return beginCombatAction(actor, "justGuard", facingDir);
      if (rollDir === facingDir) return beginCombatAction(actor, "iaiSlash", facingDir);
    }

    return false;
  }
  function isActorInvulnerable(actor) {
    if (!actor || actor.kind === "item" || !actor.combat || !actor.combat.type) return false;
    const frame = getCombatFrame(actor);
    if (actor.combat.type === "rollForward") {
      return frame >= COMBAT_DEF.rollForward.evadeStart && frame <= COMBAT_DEF.rollForward.evadeEnd;
    }
    if (actor.combat.type === "rollBackward") {
      return frame >= COMBAT_DEF.rollBackward.evadeStart && frame <= COMBAT_DEF.rollBackward.evadeEnd;
    }
    return false;
  }

  function getEntityBodyRect(ent) {
    const hw = getCollisionHalfWidth(ent);
    const h = getCollisionHeight(ent);
    return { left: ent.x - hw, right: ent.x + hw, top: ent.y - h, bottom: ent.y };
  }

  function rectOverlaps(a, b) {
    return a.left <= b.right && a.right >= b.left && a.top <= b.bottom && a.bottom >= b.top;
  }

  function getAttackRect(actor, hb, dir) {
    const xA = actor.x + actor.w * hb.x1 * dir;
    const xB = actor.x + actor.w * hb.x2 * dir;
    const left = Math.min(xA, xB);
    const right = Math.max(xA, xB);
    const top = actor.y + actor.h * hb.y1;
    const bottom = actor.y + actor.h * hb.y2;
    return { left, right, top: Math.min(top, bottom), bottom: Math.max(top, bottom) };
  }

  function spawnSlashEffect(stageIndex, x, y, dir = 1, scale = 1, tint = null) {
    state.combat.effects.push({
      kind: "slash",
      stageIndex,
      x,
      y,
      dir,
      scale,
      tint,
      frame: 0,
      life: 18
    });
  }

  function spawnExplosionEffect(stageIndex, x, y, scale = 1) {
    state.combat.effects.push({
      kind: "explosion",
      stageIndex,
      x,
      y,
      dir: 1,
      scale,
      frame: 0,
      life: 20
    });
  }
  function applyHitToTarget(attacker, target, spec, dir) {
    if (!target || target.kind === "item") return false;
    if (getCharacterState(target) === "spectator") return false;

    if (
      target.combat &&
      target.combat.type === "justGuard"
    ) {
      const frame = getCombatFrame(target);
      if (frame >= COMBAT_DEF.justGuard.guardStart && frame <= COMBAT_DEF.justGuard.guardEnd) {
        const guardRect = getAttackRect(target, COMBAT_DEF.justGuard.guardHitbox, target.combat.dir || target.facing || 1);
        const attackRect = spec._currentRect || null;
        const bodyRect = attackRect || getEntityBodyRect(attacker);
        if (rectOverlaps(guardRect, bodyRect)) {
          target.combat.flags.success = true;
          target.combat.flags.guardSuccessAt = frame;
          if (attacker) {
            attacker.hitstopFrames = Math.max(Number.isFinite(attacker.hitstopFrames) ? attacker.hitstopFrames : 0, 6);
          }
          target.hitstopFrames = Math.max(Number.isFinite(target.hitstopFrames) ? target.hitstopFrames : 0, 6);
          spawnSlashEffect(target.stageIndex, target.x + (target.combat.dir || 1) * target.w * 0.36, target.y - target.h * 0.52, target.combat.dir || 1, 0.82, "#55a7ff");
          return false;
        }
      }
    }

    if (isActorInvulnerable(target)) return false;

    const nowMs = performance.now();
    const actionType = (spec && typeof spec.attackType === "string" && spec.attackType)
      ? spec.attackType
      : (attacker && attacker.combat && attacker.combat.type ? attacker.combat.type : "normal");

    let damage = Number.isFinite(spec.damage) ? spec.damage : 0;
    if (Number.isFinite(spec.counterDamage) && target.combat && target.combat.type) {
      damage = spec.counterDamage;
    }

    const knifeName = getHeldKnifeName(attacker, spec);
    const knifeMul = getKnifeDamageMultiplier(attacker, actionType, knifeName);

    let crit = false;
    if (!spec || spec.allowCritical !== false) {
      const critChance = getCriticalChance(attacker, nowMs);
      crit = Math.random() < critChance;
    }
    let critMul = crit ? CRIT_DAMAGE_MULT : 1;
    if (crit && knifeName === "ガナリのナイフ") critMul *= 1.3;

    const finalDamage = Math.max(1, Math.round(damage * knifeMul * critMul));

    setCharacterHp(target, (Number.isFinite(target.hp) ? target.hp : HP_MAX) - finalDamage);

    const knock = spec.knockback === "medium"
      ? { vx: 150, vy: -58 }
      : { vx: 92, vy: -34 };

    target.vx += dir * knock.vx;
    target.vy = Math.min(target.vy, knock.vy);
    target.grounded = false;
    target.hitstopFrames = Math.max(Number.isFinite(target.hitstopFrames) ? target.hitstopFrames : 0, spec.hitstop || 0);

    if (attacker) {
      attacker.hitstopFrames = Math.max(Number.isFinite(attacker.hitstopFrames) ? attacker.hitstopFrames : 0, spec.hitstop || 0);
      registerComboHit(attacker, nowMs, crit);
    }

    return true;
  }
  function processAttackHitbox(actor, attackSpec, hitbox, dir) {
    const rect = getAttackRect(actor, hitbox, dir);
    attackSpec._currentRect = rect;

    let hitAny = false;
    const chars = getCharactersInStage(actor.stageIndex);
    chars.forEach((target) => {
      if (!target || target.id === actor.id) return;
      if (actor.combat.hitIds.has(target.id)) return;
      if (!rectOverlaps(rect, getEntityBodyRect(target))) return;
      const hit = applyHitToTarget(actor, target, attackSpec, dir);
      if (!hit) return;
      actor.combat.hitIds.add(target.id);
      hitAny = true;
    });

    if (hitAny) {
      spawnSlashEffect(actor.stageIndex, (rect.left + rect.right) * 0.5, (rect.top + rect.bottom) * 0.5, dir, 1);
    }

    delete attackSpec._currentRect;
  }
  function beginCombatAction(actor, type, dir) {
    if (!actor || actor.kind === "item") return false;
    if (!actor.combat) {
      actor.combat = { type: null, frame: 0, dir: 1, hitIds: new Set(), flags: {} };
    }
    if (actor.combat.type) return false;

    actor.combat.type = type;
    actor.combat.frame = 0;
    actor.combat.dir = dir >= 0 ? 1 : -1;
    actor.combat.hitIds = new Set();
    actor.combat.flags = {};
    actor.combat.flags.motionMul = getMotionSpeedMultiplier(actor);

    if (type === "normal") {
      const jumpHeight = actor.h * 1.95;
      const jumpV = Math.sqrt(2 * PHYS.gravity * jumpHeight);
      actor.vy = Math.min(actor.vy, -jumpV);
      actor.vx += actor.combat.dir * 68 * (actor.combat.flags.motionMul || 1);
      actor.vx = clamp(actor.vx, -240, 240);
      actor.grounded = false;
      actor.bounceForwardActive = true;
    } else if (type === "rollForward" || type === "rollBackward") {
      actor.roll.active = true;
      actor.roll.justFinished = false;
      actor.roll.t = 0;
      actor.roll.dur = (type === "rollForward" ? 0.62 : 0.54) / (actor.combat.flags.motionMul || 1);
      actor.roll.dir = actor.combat.dir;
      actor.roll.targetRot = actor.rot + actor.combat.dir * Math.PI * 8;
      actor.wrot = actor.combat.dir * 0.36 * (actor.combat.flags.motionMul || 1);
      actor.vx = 0;
      actor.vy = Math.min(actor.vy, -55);
      actor.grounded = false;
    } else if (type === "dropSlash") {
      actor.vx = actor.combat.dir * COMBAT_DEF.dropSlash.forwardVx * (actor.combat.flags.motionMul || 1);
      actor.vy = COMBAT_DEF.dropSlash.startVy;
      actor.grounded = false;
      actor.roll.active = false;
      actor.wrot = 0;
    } else if (type === "justGuard") {
      actor.vx = 0;
      actor.vy = 0;
      actor.roll.active = false;
      actor.wrot = 0;
    } else if (type === "iaiSlash") {
      actor.vx = 0;
      actor.vy = 0;
      actor.roll.active = false;
      actor.wrot = 0;
    }

    return true;
  }
  function updateCombatActionForActor(actor, dt) {
    if (!actor || actor.kind === "item" || !actor.combat || !actor.combat.type) return;
    if ((actor.hitstopFrames || 0) > 0) return;

    actor.combat.frame += dt * COMBAT_FRAME_RATE;
    const frame = getCombatFrame(actor);
    const type = actor.combat.type;
    const dir = actor.combat.dir || 1;
    const motionMul = Number.isFinite(actor.combat.flags && actor.combat.flags.motionMul) ? actor.combat.flags.motionMul : 1;

    if (type === "normal") {
      if (frame >= COMBAT_DEF.normal.activeStart && !actor.combat.flags.fxNormal) {
        spawnSlashEffect(actor.stageIndex, actor.x + dir * actor.w * 0.56, actor.y - actor.h * 0.48, dir, 1);
        actor.combat.flags.fxNormal = true;
      }
      if (frame >= COMBAT_DEF.normal.activeStart && frame <= COMBAT_DEF.normal.activeEnd) {
        processAttackHitbox(actor, COMBAT_DEF.normal, COMBAT_DEF.normal.hitbox, dir);
      }
      if (frame >= COMBAT_DEF.normal.total) {
        actor.combat.type = null;
      }
      return;
    }

    if (type === "rollForward") {
      if (frame >= COMBAT_DEF.rollForward.activeStart && !actor.combat.flags.fxRollF) {
        spawnSlashEffect(actor.stageIndex, actor.x + dir * actor.w * 0.62, actor.y - actor.h * 0.34, dir, 1.08);
        actor.combat.flags.fxRollF = true;
      }
      if (frame >= COMBAT_DEF.rollForward.evadeStart && frame <= COMBAT_DEF.rollForward.evadeEnd) {
        actor.vx = dir * 250 * motionMul;
      }
      if (frame >= COMBAT_DEF.rollForward.activeStart && frame <= COMBAT_DEF.rollForward.activeEnd) {
        processAttackHitbox(actor, COMBAT_DEF.rollForward, COMBAT_DEF.rollForward.hitbox, dir);
      }
      if (frame >= COMBAT_DEF.rollForward.total) {
        actor.combat.type = null;
      }
      return;
    }

    if (type === "rollBackward") {
      if (frame >= COMBAT_DEF.rollBackward.moveStart && frame <= COMBAT_DEF.rollBackward.moveEnd) {
        actor.vx = dir * 220 * motionMul;
      }
      if (frame >= COMBAT_DEF.rollBackward.total) {
        actor.combat.type = null;
      }
      return;
    }

    if (type === "throwKnife") {
      if (!actor.combat.flags.closeHitDone && frame >= COMBAT_DEF.throwKnife.closeHitFrame) {
        processAttackHitbox(actor, COMBAT_DEF.throwKnife, COMBAT_DEF.throwKnife.closeHitbox, dir);
        actor.combat.flags.closeHitDone = true;
      }
      if (!actor.combat.flags.launched && frame >= COMBAT_DEF.throwKnife.launchFrame) {
        const held = getHeldKnifeItem(actor);
        if (held) {
          detachCarriedItem(actor, true, dir);
          held.throwAttack = {
            ownerId: actor.id,
            framesLeft: COMBAT_DEF.throwKnife.projectile.duration,
            damage: COMBAT_DEF.throwKnife.damage,
            hitstop: COMBAT_DEF.throwKnife.hitstop,
            knockback: COMBAT_DEF.throwKnife.knockback,
            dir,
            boxW: actor.w * COMBAT_DEF.throwKnife.projectile.w,
            boxH: actor.h * COMBAT_DEF.throwKnife.projectile.h,
            hitIds: new Set(),
            attackType: "throwKnife",
            knifeName: held.name
          };
          held.vx = dir * COMBAT_DEF.throwKnife.projectile.speed;
          held.vy = -20;
          held.wrot += dir * 0.45;
          spawnSlashEffect(actor.stageIndex, actor.x + dir * actor.w * 0.42, actor.y - actor.h * 0.46, dir, 1.05);
        }
        actor.combat.flags.launched = true;
      }
      if (frame >= COMBAT_DEF.throwKnife.total) {
        actor.combat.type = null;
      }
      return;
    }

    if (type === "dropSlash") {
      if (frame < COMBAT_DEF.dropSlash.diveStart) {
        actor.vx = dir * (COMBAT_DEF.dropSlash.forwardVx * 0.55) * motionMul;
        actor.wrot = dir * -0.06;
      } else {
        actor.vx = dir * COMBAT_DEF.dropSlash.forwardVx * motionMul;
        actor.vy = Math.max(actor.vy, COMBAT_DEF.dropSlash.diveVy);
        actor.wrot = dir * 0.22;
      }

      if (frame === COMBAT_DEF.dropSlash.activeStart && !actor.combat.flags.fxDropStart) {
        spawnSlashEffect(actor.stageIndex, actor.x + dir * actor.w * 0.25, actor.y - actor.h * 0.72, dir, 1.1, "#ff4949");
        actor.combat.flags.fxDropStart = true;
      }

      if (frame >= COMBAT_DEF.dropSlash.activeStart && frame <= COMBAT_DEF.dropSlash.activeEnd) {
        processAttackHitbox(actor, COMBAT_DEF.dropSlash, COMBAT_DEF.dropSlash.hitbox, dir);
      }

      if (actor.grounded && !actor.combat.flags.landed) {
        actor.combat.flags.landed = true;
        actor.combat.flags.landFrame = frame;
        actor.vx *= 0.4;
        actor.vy = 0;
        spawnExplosionEffect(actor.stageIndex, actor.x + dir * actor.w * 0.18, actor.y, 0.9);
      }

      if (
        actor.combat.flags.landed &&
        frame >= COMBAT_DEF.dropSlash.landHitStart &&
        frame <= COMBAT_DEF.dropSlash.landHitEnd
      ) {
        processAttackHitbox(
          actor,
          {
            damage: COMBAT_DEF.dropSlash.landDamage,
            hitstop: COMBAT_DEF.dropSlash.hitstop,
            knockback: "small"
          },
          COMBAT_DEF.dropSlash.landHitbox,
          dir
        );
      }

      if (frame >= COMBAT_DEF.dropSlash.total) {
        actor.combat.type = null;
        actor.wrot *= 0.4;
      }
      return;
    }

    if (type === "justGuard") {
      actor.vx *= 0.8;
      actor.vy = Math.min(actor.vy, 0);
      actor.wrot = 0;

      const success = !!actor.combat.flags.success;

      if (success) {
        if (!actor.combat.flags.fxGuardSuccess) {
          spawnSlashEffect(actor.stageIndex, actor.x + dir * actor.w * 0.24, actor.y - actor.h * 0.50, dir, 0.75, "#3e90ff");
          actor.combat.flags.fxGuardSuccess = true;
        }

        if (frame >= COMBAT_DEF.justGuard.counterStart && frame <= COMBAT_DEF.justGuard.counterEnd) {
          processAttackHitbox(
            actor,
            {
              damage: COMBAT_DEF.justGuard.damage,
              hitstop: COMBAT_DEF.justGuard.hitstop,
              knockback: COMBAT_DEF.justGuard.knockback
            },
            COMBAT_DEF.justGuard.counterHitbox,
            dir
          );
          processAttackHitbox(
            actor,
            {
              damage: COMBAT_DEF.justGuard.critDamage,
              hitstop: COMBAT_DEF.justGuard.hitstop,
              knockback: COMBAT_DEF.justGuard.knockback
            },
            COMBAT_DEF.justGuard.counterCritHitbox,
            dir
          );
        }

        if (frame >= COMBAT_DEF.justGuard.totalSuccess) {
          actor.combat.type = null;
        }
      } else if (frame >= COMBAT_DEF.justGuard.totalFail) {
        actor.combat.type = null;
      }
      return;
    }

    if (type === "iaiSlash") {
      if (frame >= COMBAT_DEF.iaiSlash.pauseStart && frame <= COMBAT_DEF.iaiSlash.pauseEnd) {
        actor.vx = 0;
        actor.wrot = 0;
      }

      if (frame === COMBAT_DEF.iaiSlash.activeStart) {
        actor.vx = dir * COMBAT_DEF.iaiSlash.dashVx * motionMul;
      }

      if (frame >= COMBAT_DEF.iaiSlash.activeStart && frame <= COMBAT_DEF.iaiSlash.activeEnd) {
        processAttackHitbox(
          actor,
          {
            damage: COMBAT_DEF.iaiSlash.damage,
            counterDamage: COMBAT_DEF.iaiSlash.counterDamage,
            hitstop: COMBAT_DEF.iaiSlash.hitstop,
            knockback: COMBAT_DEF.iaiSlash.knockback
          },
          COMBAT_DEF.iaiSlash.hitbox,
          dir
        );
        processAttackHitbox(
          actor,
          {
            damage: COMBAT_DEF.iaiSlash.critDamage,
            counterDamage: COMBAT_DEF.iaiSlash.counterDamage,
            hitstop: COMBAT_DEF.iaiSlash.hitstop,
            knockback: COMBAT_DEF.iaiSlash.knockback
          },
          COMBAT_DEF.iaiSlash.critHitbox,
          dir
        );
      }

      if (frame === COMBAT_DEF.iaiSlash.fxFrame && !actor.combat.flags.fxIai) {
        spawnSlashEffect(actor.stageIndex, actor.x + dir * actor.w * 0.82, actor.y - actor.h * 0.42, dir, 1.25, "#45cf66");
        actor.combat.flags.fxIai = true;
      }

      if (frame >= COMBAT_DEF.iaiSlash.total) {
        actor.combat.type = null;
        actor.vx *= 0.5;
      }
      return;
    }
  }
  function updateThrownKnifeAttacks(dt) {
    for (const bucket of state.stageBuckets) {
      for (const item of bucket.items) {
        if (!item || !item.throwAttack) continue;
        const atk = item.throwAttack;
        atk.framesLeft -= dt * COMBAT_FRAME_RATE;
        if (atk.framesLeft <= 0) {
          item.throwAttack = null;
          continue;
        }

        const rect = {
          left: item.x - atk.boxW * 0.5,
          right: item.x + atk.boxW * 0.5,
          top: item.y - atk.boxH,
          bottom: item.y
        };

        const chars = getCharactersInStage(item.stageIndex);
        let hitAny = false;
        for (const target of chars) {
          if (!target || target.id === atk.ownerId) continue;
          if (atk.hitIds.has(target.id)) continue;
          if (!rectOverlaps(rect, getEntityBodyRect(target))) continue;

          const owner = getEntityById(atk.ownerId);
          const hit = applyHitToTarget(owner, target, atk, atk.dir || 1);
          if (!hit) continue;

          atk.hitIds.add(target.id);
          hitAny = true;
          break;
        }

        if (hitAny) {
          spawnSlashEffect(item.stageIndex, item.x, item.y - atk.boxH * 0.4, atk.dir || 1, 0.95);
          item.vx *= 0.35;
          item.vy = Math.min(item.vy, -25);
          item.throwAttack = null;
        }
      }
    }
  }

  function updateCombatEffects(dt) {
    const effects = state.combat.effects;
    for (let i = effects.length - 1; i >= 0; i -= 1) {
      const fx = effects[i];
      fx.frame += dt * COMBAT_FRAME_RATE;
      fx.life -= dt * COMBAT_FRAME_RATE;
      if (fx.life <= 0) effects.splice(i, 1);
    }
  }

  function drawCombatEffects() {
    const slashImg = state.combat.slashFxImg;
    const explosionImg = state.combat.explosionFxImg;
    const view = getViewTransform();

    state.combat.effects.forEach((fx) => {
      if (fx.stageIndex !== state.currentStageIndex) return;

      const x = (fx.x - state.camera.x) * view.zoom + view.offsetX;
      const y = (fx.y - state.camera.y) * view.zoom + view.offsetY;

      if (fx.kind === "explosion") {
        if (!explosionImg) return;
        const alpha = clamp(fx.life / 20, 0, 1);
        const baseW = 70 * view.zoom * (fx.scale || 1);
        const baseH = baseW * (explosionImg.naturalHeight / Math.max(1, explosionImg.naturalWidth));
        ctx.save();
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = 0.95 * alpha;
        ctx.drawImage(explosionImg, x - baseW * 0.5, y - baseH * 0.85, baseW, baseH);
        ctx.restore();
        return;
      }

      if (!slashImg) return;
      const alpha = clamp(fx.life / 18, 0, 1);
      const baseW = 70 * view.zoom * (fx.scale || 1);
      const baseH = baseW * (slashImg.naturalHeight / Math.max(1, slashImg.naturalWidth));

      let tintFilter = "none";
      if (fx.tint === "#ff4949") tintFilter = "sepia(1) saturate(7) hue-rotate(-35deg) brightness(1.12)";
      else if (fx.tint === "#3e90ff") tintFilter = "sepia(1) saturate(8) hue-rotate(165deg) brightness(1.1)";
      else if (fx.tint === "#45cf66") tintFilter = "sepia(1) saturate(8) hue-rotate(55deg) brightness(1.08)";

      ctx.save();
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 0.98 * alpha;
      ctx.translate(x, y);
      if ((fx.dir || 1) < 0) ctx.scale(-1, 1);
      ctx.filter = tintFilter;
      ctx.drawImage(slashImg, -baseW * 0.5, -baseH * 0.7, baseW, baseH);
      ctx.restore();
    });
  }
  function loadImage(path) {
    if (imageCache.has(path)) return imageCache.get(path);
    const p = new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`画像の読み込みに失敗: ${path}`));
      img.src = path;
    });
    imageCache.set(path, p);
    return p;
  }

  function createMaskData(image) {
    const off = document.createElement("canvas");
    off.width = image.naturalWidth;
    off.height = image.naturalHeight;
    let c = null;
    try {
      c = off.getContext("2d", { willReadFrequently: true });
    } catch (_e) {
      c = null;
    }
    if (!c) c = off.getContext("2d");
    if (!c) {
      const size = Math.max(1, off.width * off.height * 4);
      return { width: off.width, height: off.height, data: new Uint8ClampedArray(size) };
    }
    c.drawImage(image, 0, 0);
    return { width: off.width, height: off.height, data: c.getImageData(0, 0, off.width, off.height).data };
  }

  function getOpaqueBounds(image, alphaThreshold = 8) {
    const key = `${image.src}::${alphaThreshold}`;
    if (boundsCache.has(key)) return boundsCache.get(key);

    const off = document.createElement("canvas");
    off.width = image.naturalWidth;
    off.height = image.naturalHeight;
    let c = null;
    try {
      c = off.getContext("2d", { willReadFrequently: true });
    } catch (_e) {
      c = null;
    }
    if (!c) c = off.getContext("2d");
    if (!c) {
      const fallback = { sx: 0, sy: 0, sw: Math.max(1, off.width), sh: Math.max(1, off.height) };
      boundsCache.set(key, fallback);
      return fallback;
    }
    c.drawImage(image, 0, 0);
    const data = c.getImageData(0, 0, off.width, off.height).data;

    let minX = off.width;
    let minY = off.height;
    let maxX = -1;
    let maxY = -1;

    for (let y = 0; y < off.height; y += 1) {
      for (let x = 0; x < off.width; x += 1) {
        const a = data[(y * off.width + x) * 4 + 3];
        if (a >= alphaThreshold) {
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
        }
      }
    }

    const bounds = (maxX < minX || maxY < minY)
      ? { sx: 0, sy: 0, sw: off.width, sh: off.height }
      : { sx: minX, sy: minY, sw: maxX - minX + 1, sh: maxY - minY + 1 };

    boundsCache.set(key, bounds);
    return bounds;
  }

  function resizeCanvas() {
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    state.scale = dpr;
  }

  function worldFromOffset(offsetX, offsetY) {
    const view = getViewTransform();
    const sx = offsetX * state.scale;
    const sy = offsetY * state.scale;
    return {
      x: state.camera.x + (sx - view.offsetX) / view.zoom,
      y: state.camera.y + (sy - view.offsetY) / view.zoom
    };
  }

  function getStageIndexByX(x) {
    for (let i = 0; i < state.stages.length; i += 1) {
      const s = state.stages[i];
      if (x >= s.x && x < s.x + s.width) return i;
    }
    return state.stages.length - 1;
  }

  function getCurrentStage() {
    return stageOf(state.currentStageIndex);
  }

  function isMobilePortraitView() {
    return window.matchMedia("(max-width: 900px) and (orientation: portrait)").matches;
  }

  function isMobileLandscapeView() {
    return window.matchMedia("(max-width: 900px) and (orientation: landscape)").matches;
  }

  function getViewTransform() {
    const stage = getCurrentStage();
    if (!stage || !isMobileLandscapeView()) {
      return { zoom: 1, offsetX: 0, offsetY: 0 };
    }
    const zoom = canvas.height / Math.max(1, stage.height);
    const drawWidth = stage.width * zoom;
    const offsetX = (canvas.width - drawWidth) * 0.5;
    return { zoom, offsetX, offsetY: 0 };
  }

  function markItemUserTouched(item, nowMs = performance.now()) {
    if (!item || item.kind !== "item") return;
    item.lastUserTouchAt = nowMs;
  }

  function chooseRespawnItemName() {
    const roll = Math.floor(Math.random() * 6);
    if (roll === 0) return "チャハン";
    if (roll === 1) return "タピオカ";
    if (roll === 2) return "サシィク";
    if (roll === 3) return "ぬいぐるみ";
    if (roll === 4) return "ギター";
    const knives = Array.from(ITEM_FILES.keys()).filter((name) => String(name).includes("ナイフ"));
    if (!knives.length) return "狐色のナイフ";
    return knives[Math.floor(Math.random() * knives.length)];
  }

  function spawnRandomItemAroundViewportCenter(stageIndex) {
    const stage = stageOf(stageIndex);
    if (!stage) return;
    const spawnName = chooseRespawnItemName();
    const file = ITEM_FILES.get(spawnName);
    if (!file) return;

    createEntity("item", stageIndex, spawnName, file, ITEM_BASE, ITEM_BASE_H).then((item) => {
      const bucket = bucketOf(stageIndex);
      if (!bucket) return;
      const centerX = state.camera.x + canvas.width / Math.max(1, state.scale) * 0.5;
      const centerY = state.camera.y + canvas.height / Math.max(1, state.scale) * 0.5;
      const minX = stage.x + item.w * 0.5;
      const maxX = stage.x + stage.width - item.w * 0.5;
      const prefX = clamp(centerX, minX, maxX);
      const prefY = clamp(centerY, item.h + 2, stage.height - 2);
      const candidates = [[0,0],[40,0],[-40,0],[80,0],[-80,0],[0,-30],[0,30],[120,0],[-120,0],[160,-30],[-160,-30]];
      let placed = false;
      for (const [ox, oy] of candidates) {
        const tx = clamp(prefX + ox, minX, maxX);
        const ty = clamp(prefY + oy, item.h + 2, stage.height - 2);
        if (applyMoveCandidate(item, tx, ty, true) && !collidesForNormal(item, item.x, item.y)) {
          placed = true;
          break;
        }
      }
      if (!placed) placeEntitySafely(item, prefX);
      item.lastUserTouchAt = performance.now();
      bucket.items.push(item);
      state.ui.panelDirty = true;
    }).catch(() => {});
  }

  function updateIdleItemsLifecycle(nowMs) {
    if (!state.itemLifecycle) return;
    if (nowMs < state.itemLifecycle.nextSweepAt) return;
    state.itemLifecycle.nextSweepAt = nowMs + ITEM_SWEEP_INTERVAL_MS;
    const respawnStages = [];
    for (let stageIndex = 0; stageIndex < state.stageBuckets.length; stageIndex += 1) {
      const bucket = state.stageBuckets[stageIndex];
      if (!bucket || !bucket.items.length) continue;
      for (let i = bucket.items.length - 1; i >= 0; i -= 1) {
        const item = bucket.items[i];
        if (!item || item.carriedById || item.eatingById) continue;
        if (stageIndex === ARENA_STAGE_INDEX && isKnifeName(item.name)) continue;
        const lastTouched = Number.isFinite(item.lastUserTouchAt) ? item.lastUserTouchAt : item.born;
        if (nowMs - lastTouched < ITEM_DESPAWN_IDLE_MS) continue;
        bucket.items.splice(i, 1);
        if (state.player && state.player.carryingItemId === item.id) state.player.carryingItemId = null;
        respawnStages.push(stageIndex);
        state.ui.panelDirty = true;
      }
    }
    respawnStages.forEach((stageIndex) => spawnRandomItemAroundViewportCenter(stageIndex));
  }

  async function loadWorld() {
    let x = 0;
    const loaded = [];
    for (const st of STAGES) {
      const bg = await loadImage(`${ASSET_BASE}/${st.bg}`);
      const maskImg = await loadImage(`${ASSET_BASE}/${st.mask}`);
      const mask = createMaskData(maskImg);
      loaded.push({ bg, mask, x, y: 0, width: bg.naturalWidth, height: bg.naturalHeight });
      x += bg.naturalWidth;
    }

    state.stages = loaded;
    state.stageBuckets = loaded.map(() => ({ npcs: [], items: [] }));
    state.worldWidth = x;
    state.worldHeight = loaded.reduce((m, s) => Math.max(m, s.height, s.mask.height), 0);
  }

  async function loadFarBackgrounds() {
    state.farBg.images = await Promise.all(FAR_BG_FILES.map((f) => loadImage(`${ASSET_BASE}/${f}`)));
  }

  async function loadSpeechAssets() {
    state.speech.leftBubbleImg = await loadImage(`${ASSET_BASE}/左キャラ用吹き出し.png`);
    state.speech.rightBubbleImg = await loadImage(`${ASSET_BASE}/右キャラ用吹き出し.png`);

    try {
      state.speech.eatFxImg = await loadImage(`${ASSET_BASE}/食.GIF`);
    } catch (_e) {
      state.speech.eatFxImg = null;
    }

    {
      const slashCandidates = [
        `${ASSET_BASE}/斬撃.png`,
        `${ASSET_BASE}/斬撃.PNG`,
        `${ASSET_BASE}/斬撃.gif`,
        `${ASSET_BASE}/斬撃.GIF`,
        `${ASSET_BASE}/item/斬撃.png`,
        `${ASSET_BASE}/item/斬撃.PNG`,
        `${ASSET_BASE}/item/斬撃.gif`,
        `${ASSET_BASE}/item/斬撃.GIF`
      ];
      state.combat.slashFxImg = null;
      for (const p of slashCandidates) {
        try {
          state.combat.slashFxImg = await loadImage(p);
          break;
        } catch (_e) {
          // try next
        }
      }
    }

    {
      const explosionCandidates = [
        `${ASSET_BASE}/爆発.png`,
        `${ASSET_BASE}/爆発.PNG`,
        `${ASSET_BASE}/爆発.gif`,
        `${ASSET_BASE}/爆発.GIF`,
        `${ASSET_BASE}/item/爆発.png`,
        `${ASSET_BASE}/item/爆発.PNG`,
        `${ASSET_BASE}/item/爆発.gif`,
        `${ASSET_BASE}/item/爆発.GIF`
      ];
      state.combat.explosionFxImg = null;
      for (const p of explosionCandidates) {
        try {
          state.combat.explosionFxImg = await loadImage(p);
          break;
        } catch (_e) {
          // try next
        }
      }
    }
    let raw = null;
    for (const url of SPEECH_JSON_CANDIDATES) {
      try {
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) continue;
        raw = await res.json();
        if (Array.isArray(raw)) break;
      } catch (_e) {
        // next candidate
      }
    }

    if (!Array.isArray(raw)) {
      state.speech.dailyByCharacter = new Map();
      state.speech.chatByCharacter = new Map();
      state.speech.dialoguesByPair = new Map();
      state.speech.metaByCharacter = new Map();
      return;
    }

    const dailyMap = new Map();
    const chatMap = new Map();
    const dialogueMap = new Map();
    const metaMap = new Map();
    const pairKeyByNames = (a, b) => [a, b].sort().join("\u0001");

    raw.forEach((row) => {
      if (!row || typeof row !== "object") return;

      if (typeof row.character === "string") {
        metaMap.set(row.character, row);

        if (Array.isArray(row.daily) && row.daily.length) {
          const d = row.daily.filter((x) => typeof x === "string" && x.trim().length > 0).slice(0, 3);
          if (d.length) dailyMap.set(row.character, d);
        }
        if (typeof row.chat === "string" && row.chat.trim()) {
          chatMap.set(row.character, [row.chat.trim()]);
        }
      }

      if (Array.isArray(row.conversation_between) && row.conversation_between.length === 2 && Array.isArray(row.dialogue) && row.dialogue.length) {
        const n1 = row.conversation_between[0];
        const n2 = row.conversation_between[1];
        if (typeof n1 !== "string" || typeof n2 !== "string") return;

        const lines = row.dialogue
          .filter((d) => d && typeof d.message === "string" && d.message.trim().length > 0)
          .map((d) => ({
            speaker: (typeof d.speaker === "string" ? d.speaker : ""),
            message: d.message.trim()
          }));

        if (!lines.length) return;
        const pairKey = pairKeyByNames(n1, n2);
        const list = dialogueMap.get(pairKey) || [];
        list.push(lines);
        dialogueMap.set(pairKey, list);
      }
    });

    state.speech.dailyByCharacter = dailyMap;
    state.speech.chatByCharacter = chatMap;
    state.speech.dialoguesByPair = dialogueMap;
    state.speech.metaByCharacter = metaMap;
  }

  function setSpeechBubbleForEntity(entId, nowMs) {
    state.speech.bubbleEntityId = entId;
    state.speech.bubbleUntil = nowMs + SPEECH_BUBBLE_MS;
  }

  function getFoundSpeechLine(characterName, itemName) {
    const meta = state.speech.metaByCharacter.get(characterName);
    if (!meta || typeof meta !== "object") return null;

    const specificKey = (() => {
      if (itemName === "ぬいぐるみ") return "found_plushie";
      if (itemName === "ギター") return "found_guitar";
      if (itemName === "狐色のナイフ") return "found_fox_colored_knife";
      if (itemName === "真紅のナイフ") return "found_crimson_knife";
      if (itemName === "純白のナイフ") return "found_pure_white_knife";
      if (itemName === "アヤのナイフ") return "found_aya_knife";
      if (itemName === "コトのナイフ") return "found_kotos_knife";
      if (itemName === "サテラのナイフ") return "found_satellas_knife";
      return null;
    })();

    if (specificKey && typeof meta[specificKey] === "string" && meta[specificKey].trim()) {
      return meta[specificKey].trim();
    }

    if (String(itemName || "").includes("ナイフ") && typeof meta.found_knife === "string" && meta.found_knife.trim()) {
      return meta.found_knife.trim();
    }

    return null;
  }

  function getEatingSpeechLine(characterName) {
    const meta = state.speech.metaByCharacter.get(characterName);
    if (!meta || !Array.isArray(meta.eating) || !meta.eating.length) return null;
    const lines = meta.eating.filter((x) => typeof x === "string" && x.trim().length > 0);
    if (!lines.length) return null;
    return lines[Math.floor(Math.random() * lines.length)];
  }

  function startEating(actor, item, nowMs) {
    if (!actor || !item) return;

    actor.carryingItemId = null;
    actor.eatingItemId = item.id;
    actor.eatStartAt = nowMs;
    actor.eatUntil = nowMs + EAT_EFFECT_MS;

    item.carriedById = null;
    item.eatingById = actor.id;
    item.vx = 0;
    item.vy = 0;
  }

  function updateEating(nowMs) {
    const actors = getAllEntities().filter((ent) => ent && ent.kind !== "item");
    actors.forEach((actor) => {
      if (!actor.eatingItemId || nowMs < actor.eatUntil) return;

      const item = getEntityById(actor.eatingItemId);
      if (item && item.kind === "item") {
        const b = bucketOf(item.stageIndex);
        if (b) {
          const i = b.items.findIndex((x) => x.id === item.id);
          if (i >= 0) b.items.splice(i, 1);
        }
      }

      actor.eatingItemId = null;
      actor.eatStartAt = 0;
      actor.eatUntil = 0;
      healCharacter(actor, EAT_HEAL_AMOUNT);
      state.ui.panelDirty = true;

      const line = getEatingSpeechLine(actor.name);
      if (line) {
        pushSpeechLog(`${actor.name}: ${line}`);
        setSpeechBubbleForEntity(actor.id, nowMs);
      }
    });
  }

  function updateDialogueQueue(nowMs) {
    if (!Array.isArray(state.speech.dialogueQueue) || !state.speech.dialogueQueue.length) return;
    if (nowMs < state.speech.dialogueNextAt) return;

    const step = state.speech.dialogueQueue.shift();
    if (!step) return;
    pushSpeechLog(`${step.speakerName}: ${step.message}`);
    if (step.speakerEntId) setSpeechBubbleForEntity(step.speakerEntId, nowMs);
    state.speech.dialogueNextAt = nowMs + DIALOGUE_LINE_INTERVAL_MS;
  }

  function tryAutoSpeak(nowMs) {
    const actors = getAllEntities().filter((ent) => ent && ent.kind !== "item");
    actors.forEach((actor) => {
      if (!Number.isFinite(actor.nextSpeechAt)) actor.nextSpeechAt = nowMs + AUTO_SPEECH_INTERVAL_MS;
      if (nowMs < actor.nextSpeechAt) return;
      actor.nextSpeechAt = nowMs + AUTO_SPEECH_INTERVAL_MS;
      if (Math.random() >= AUTO_SPEECH_CHANCE) return;

      const lines = state.speech.dailyByCharacter.get(actor.name);
      if (!Array.isArray(lines) || !lines.length) return;
      const line = lines[Math.floor(Math.random() * lines.length)];
      pushSpeechLog(`${actor.name}: ${line}`);
      setSpeechBubbleForEntity(actor.id, nowMs);
    });
  }

  function tryContactConversation(nowMs) {
    if (Array.isArray(state.speech.dialogueQueue) && state.speech.dialogueQueue.length) return;
    if (nowMs < state.speech.nextContactAt) return;
    state.speech.nextContactAt = nowMs + CONTACT_SPEECH_INTERVAL_MS;

    const chars = getEntitiesInStage(state.currentStageIndex).filter((ent) => ent && ent.kind !== "item");
    if (chars.length < 2) return;

    const touchingPairs = [];
    for (let i = 0; i < chars.length; i += 1) {
      for (let j = i + 1; j < chars.length; j += 1) {
        const a = chars[i];
        const b = chars[j];
        if (!overlapsEntity(a, b, 4)) continue;

        const entityPairKey = a.id < b.id ? `${a.id}|${b.id}` : `${b.id}|${a.id}`;
        const coolUntil = state.speech.pairCooldownByEntity.get(entityPairKey) || 0;
        if (nowMs < coolUntil) continue;
        touchingPairs.push([a, b, entityPairKey]);
      }
    }

    if (!touchingPairs.length) return;

    const [a, b, entityPairKey] = touchingPairs[Math.floor(Math.random() * touchingPairs.length)];
    const namePairKey = [a.name, b.name].sort().join("\u0001");
    const specificList = state.speech.dialoguesByPair.get(namePairKey);

    if (Array.isArray(specificList) && specificList.length) {
      if (Math.random() >= CONTACT_DIALOGUE_CHANCE) return;
      let alt = 0;
      const specific = specificList[Math.floor(Math.random() * specificList.length)];
      state.speech.dialogueQueue = specific.map((line) => {
        const valid = (line.speaker === a.name || line.speaker === b.name);
        const speakerName = valid ? line.speaker : (alt++ % 2 === 0 ? a.name : b.name);
        const speakerEnt = speakerName === a.name ? a : b;
        return { speakerName, speakerEntId: speakerEnt.id, message: line.message };
      });
      state.speech.dialogueNextAt = nowMs;
      updateDialogueQueue(nowMs);
      state.speech.pairCooldownByEntity.set(entityPairKey, nowMs + CONTACT_PAIR_COOLDOWN_MS);
      return;
    }

    if (Math.random() >= CONTACT_CHAT_CHANCE) return;

    const candidates = [a, b].filter((ent) => {
      const lines = state.speech.chatByCharacter.get(ent.name);
      return Array.isArray(lines) && lines.length > 0;
    });
    if (!candidates.length) return;

    const speaker = candidates[Math.floor(Math.random() * candidates.length)];
    const lines = state.speech.chatByCharacter.get(speaker.name);
    const line = lines[Math.floor(Math.random() * lines.length)];

    pushSpeechLog(`${speaker.name}: ${line}`);
    setSpeechBubbleForEntity(speaker.id, nowMs);
    state.speech.pairCooldownByEntity.set(entityPairKey, nowMs + CONTACT_PAIR_COOLDOWN_MS);
  }

  function drawSpeechBubble(nowMs) {
    if (!state.speech.bubbleEntityId || nowMs > state.speech.bubbleUntil) return;
    const ent = getEntityById(state.speech.bubbleEntityId);
    if (!ent || ent.stageIndex !== state.currentStageIndex) return;
    const bubbleImg = ent.facing > 0 ? state.speech.rightBubbleImg : state.speech.leftBubbleImg;
    if (!bubbleImg) return;
    const view = getViewTransform();
    const ex = (ent.x - state.camera.x) * view.zoom + view.offsetX;
    const ey = (ent.y - state.camera.y) * view.zoom + view.offsetY;
    const bw = ent.w * 1.25 * view.zoom;
    const bh = bw * (bubbleImg.naturalHeight / Math.max(1, bubbleImg.naturalWidth));
    const bx = ent.facing > 0 ? (ex + ent.w * 0.12 * view.zoom) : (ex - ent.w * 0.12 * view.zoom - bw);
    const by = ey - ent.h * view.zoom - bh * 0.72;
    const remain = Math.max(0, state.speech.bubbleUntil - nowMs);
    const alpha = 0.72 + 0.28 * Math.min(1, remain / 500);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.drawImage(bubbleImg, bx, by, bw, bh);
    ctx.restore();
  }

  function maskTypeAt(worldX, worldY) {
    if (worldY < 0 || worldY >= state.worldHeight) return "empty";

    for (const s of state.stages) {
      if (worldX < s.x || worldX >= s.x + s.width) continue;
      if (worldY < s.y || worldY >= s.y + s.height) continue;

      const u = (worldX - s.x) / s.width;
      const v = (worldY - s.y) / s.height;
      const lx = clamp(Math.floor(u * s.mask.width), 0, s.mask.width - 1);
      const ly = clamp(Math.floor(v * s.mask.height), 0, s.mask.height - 1);

      const i = (ly * s.mask.width + lx) * 4;
      const r = s.mask.data[i];
      const g = s.mask.data[i + 1];
      const b = s.mask.data[i + 2];
      const a = s.mask.data[i + 3];
      if (a < 8) return "empty";

      const isGreen = g >= 70 && g - Math.max(r, b) >= 18;
      const isBlack = r <= 85 && g <= 85 && b <= 85;
      const isRed = r >= 115 && r - Math.max(g, b) >= 22;
      if (isGreen) return "green";
      if (isBlack || isRed) return "solid";
      return "empty";
    }

    return "empty";
  }

  function isBlocked(type, blockGreen) {
    if (type === "solid") return true;
    if (type === "green" && blockGreen) return true;
    return false;
  }

  function getCollisionHalfWidth(ent) {
    return ent.w * 0.5 * (Number.isFinite(ent.hitboxScaleX) ? ent.hitboxScaleX : 1);
  }

  function getCollisionHeight(ent) {
    return ent.h * (Number.isFinite(ent.hitboxScaleY) ? ent.hitboxScaleY : 1);
  }

  function collidesAt(ent, px, py, blockGreen) {
    const halfW = getCollisionHalfWidth(ent);
    const colH = getCollisionHeight(ent);
    const left = px - halfW;
    const right = px + halfW;
    const top = py - colH;
    const bottom = py - 1;

    for (let y = top; y <= bottom; y += 2) {
      for (let x = left; x <= right; x += 2) {
        if (isBlocked(maskTypeAt(x, y), blockGreen)) return true;
      }
    }
    return false;
  }

  const collidesForNormal = (ent, x, y) => collidesAt(ent, x, y, true);
  const collidesForDrag = (ent, x, y) => collidesAt(ent, x, y, false);

  function hasGroundSupportAt(ent, x, y) {
    const footY = y + 1;
    const halfW = getCollisionHalfWidth(ent);
    const samples = [x, x - halfW * 0.55, x + halfW * 0.55];
    for (const sx of samples) {
      const t = maskTypeAt(sx, footY);
      if (t === "solid" || t === "green") return true;
    }
    return false;
  }

  function applyMoveCandidate(ent, nx, ny, allowGreenPass) {
    const stage = stageOf(ent.stageIndex);
    const halfW = ent.w * 0.5;
    nx = clamp(nx, stage.x + halfW, stage.x + stage.width - halfW);
    ny = clamp(ny, ent.h, state.worldHeight + ent.h);

    const collides = allowGreenPass ? collidesForDrag : collidesForNormal;

    if (!collides(ent, nx, ny)) {
      ent.x = nx;
      ent.y = ny;
      return true;
    }
    if (!collides(ent, nx, ent.y)) {
      ent.x = nx;
      return true;
    }
    if (!collides(ent, ent.x, ny)) {
      ent.y = ny;
      return true;
    }
    return false;
  }

  function tryStepUpMove(ent, dx, maxStep = null) {
    if (!ent || ent.kind === "item") return false;
    const ox = ent.x;
    const oy = ent.y;
    const stepLimit = Number.isFinite(maxStep) ? maxStep : Math.max(22, Math.min(44, Math.round(ent.h * 0.58)));
    for (let up = 2; up <= stepLimit; up += 2) {
      const ny = oy - up;
      const nx = ox + dx;
      if (collidesForNormal(ent, ox, ny)) continue;
      if (collidesForNormal(ent, nx, ny)) continue;
      ent.x = nx;
      ent.y = ny;
      for (let fall = 0; fall < stepLimit + 8; fall += 1) {
        if (collidesForNormal(ent, ent.x, ent.y + 1)) break;
        ent.y += 1;
      }
      return true;
    }
    ent.x = ox;
    ent.y = oy;
    return false;
  }
  function snapDownToGround(ent, maxDrop = 80) {
    if (!ent || ent.kind === "item") return false;
    for (let i = 0; i < maxDrop; i += 1) {
      if (collidesForNormal(ent, ent.x, ent.y + 1)) return true;
      ent.y += 1;
      if (collidesForNormal(ent, ent.x, ent.y)) return false;
    }
    return hasGroundSupportAt(ent, ent.x, ent.y);
  }
  function settleToGround(ent) {
    ent.y = ent.h;
    ent.vx = 0;
    ent.vy = 0;
    for (let i = 0; i < 3000; i += 1) {
      if (!collidesForNormal(ent, ent.x, ent.y + 1)) ent.y += 1;
      else break;
    }
  }

  function placeEntitySafely(ent, preferredX) {
    const stage = stageOf(ent.stageIndex);
    const minX = stage.x + ent.w * 0.5;
    const maxX = stage.x + stage.width - ent.w * 0.5;
    const offsets = [0, -60, 60, -120, 120, -180, 180, -240, 240, -320, 320];

    for (const off of offsets) {
      ent.x = clamp(preferredX + off, minX, maxX);
      settleToGround(ent);
      if (!collidesForNormal(ent, ent.x, ent.y)) return true;
    }
    return false;
  }

  function getEntitiesInStage(stageIndex) {
    const bucket = bucketOf(stageIndex);
    const arr = [];
    if (bucket) {
      arr.push(...bucket.items);
      arr.push(...bucket.npcs);
    }
    if (state.player && state.player.stageIndex === stageIndex) arr.push(state.player);
    return arr;
  }

  function getAllEntities() {
    const all = [];
    if (state.player) all.push(state.player);
    for (const b of state.stageBuckets) {
      all.push(...b.npcs, ...b.items);
    }
    return all;
  }

  function getCharactersInStage(stageIndex) {
    return getEntitiesInStage(stageIndex).filter((ent) => ent && ent.kind !== "item");
  }
  function getControlledActor() {
    return state.player || null;
  }


  async function getKnifeReferenceDiag() {
    if (Number.isFinite(knifeReferenceDiag) && knifeReferenceDiag > 0) return knifeReferenceDiag;
    const refFile = ITEM_FILES.get(KNIFE_REFERENCE_NAME);
    if (!refFile) { knifeReferenceDiag = 0; return 0; }
    try {
      const img = await loadImage(`${ITEM_BASE}/${refFile}`);
      const bounds = getOpaqueBounds(img);
      knifeReferenceDiag = Math.hypot(Math.max(1, bounds.sw), Math.max(1, bounds.sh));
    } catch (_e) {
      knifeReferenceDiag = 0;
    }
    return knifeReferenceDiag;
  }

    function getEntityById(id) {
    if (state.player && state.player.id === id) return state.player;
    for (const bucket of state.stageBuckets) {
      for (const n of bucket.npcs) if (n.id === id) return n;
      for (const it of bucket.items) if (it.id === id) return it;
    }
    return null;
  }

  function overlapsEntity(a, b, pad = 0) {
    const ahw = getCollisionHalfWidth(a);
    const bhw = getCollisionHalfWidth(b);
    const ah = getCollisionHeight(a);
    const bh = getCollisionHeight(b);

    const al = a.x - ahw - pad;
    const ar = a.x + ahw + pad;
    const at = a.y - ah - pad;
    const ab = a.y + pad;

    const bl = b.x - bhw;
    const br = b.x + bhw;
    const bt = b.y - bh;
    const bb = b.y;

    return al <= br && ar >= bl && at <= bb && ab >= bt;
  }
  function distanceBetweenEntities(a, b) {
    const ax = a.x;
    const ay = a.y - a.h * 0.5;
    const bx = b.x;
    const by = b.y - b.h * 0.5;
    return Math.hypot(ax - bx, ay - by);
  }

  function findTouchingItemForPickup(actor) {
    if (!actor || actor.carryingItemId) return null;
    const bucket = bucketOf(actor.stageIndex);
    if (!bucket) return null;

    let best = null;
    let bestDist = Number.POSITIVE_INFINITY;
    for (const item of bucket.items) {
      if (!item || item.carriedById || item.eatingById) continue;
      if (!overlapsEntity(actor, item, 6)) continue;
      const d = distanceBetweenEntities(actor, item);
      if (d < bestDist) {
        bestDist = d;
        best = item;
      }
    }
    return best;
  }

  function findPreferredAutoTarget(actor) {
    if (!actor) return null;
    const entities = getEntitiesInStage(actor.stageIndex).filter((ent) =>
      ent && ent.id !== actor.id && !ent.eatingById
    );

    const chars = entities.filter((ent) => ent.kind !== "item");
    const items = entities.filter((ent) => ent.kind === "item" && !ent.carriedById);

    const pickNearest = (arr) => {
      let best = null;
      let bestDist = Number.POSITIVE_INFINITY;
      for (const ent of arr) {
        const d = distanceBetweenEntities(actor, ent);
        if (d < bestDist) {
          bestDist = d;
          best = ent;
        }
      }
      if (!best || bestDist > AUTO_PERCEPTION_RANGE) return null;
      return { target: best, distance: bestDist };
    };

    return pickNearest(chars) || pickNearest(items);
  }

  function runAutoBehaviorForActor(actor, nowMs) {
    if (!actor || actor.kind === "item") return;
    if (actor.stageIndex === ARENA_STAGE_INDEX) return;
    if (state.drag.active && state.drag.entityId === actor.id) return;
    if (actor.roll && actor.roll.active) return;
    if (actor.eatUntil && nowMs < actor.eatUntil) return;
    if (!actor.autoAi) {
      actor.autoAi = {
        nextAt: nowMs + AUTO_BEHAVIOR_INTERVAL_MS,
        targetId: null,
        lastDistance: Number.POSITIVE_INFINITY,
        noImproveRolls: 0
      };
    }
    const ai = actor.autoAi;
    if (nowMs < ai.nextAt) return;
    ai.nextAt = nowMs + AUTO_BEHAVIOR_INTERVAL_MS;

    const touchingItem = findTouchingItemForPickup(actor);
    if (touchingItem) {
      handleAction("pickup", "auto", actor);
      ai.targetId = null;
      ai.lastDistance = Number.POSITIVE_INFINITY;
      ai.noImproveRolls = 0;
      return;
    }

    if (actor.carryingItemId) {
      handleAction("pickup", "auto", actor);
      ai.targetId = null;
      ai.lastDistance = Number.POSITIVE_INFINITY;
      ai.noImproveRolls = 0;
      return;
    }

    const pref = findPreferredAutoTarget(actor);
    if (!pref) {
      ai.targetId = null;
      ai.lastDistance = Number.POSITIVE_INFINITY;
      ai.noImproveRolls = 0;
      return;
    }

    actor.facing = pref.target.x >= actor.x ? 1 : -1;

    if (ai.targetId !== pref.target.id) {
      ai.targetId = pref.target.id;
      ai.lastDistance = pref.distance;
      ai.noImproveRolls = 0;
      handleAction("roll", "auto", actor);
      return;
    }

    if (pref.distance < ai.lastDistance - AUTO_IMPROVE_EPS) ai.noImproveRolls = 0;
    else ai.noImproveRolls += 1;
    ai.lastDistance = pref.distance;

    if (ai.noImproveRolls >= AUTO_ROLL_NO_IMPROVE_LIMIT) {
      handleAction("bounce", "auto", actor);
      ai.noImproveRolls = 0;
      return;
    }

    handleAction("roll", "auto", actor);
  }

  function updateBattleNpcAI(npc, nowMs = performance.now()) {
    if (!npc || npc.kind === "item") return;
    if (npc.stageIndex !== ARENA_STAGE_INDEX) return;
    if (getCharacterState(npc) === "spectator") return;
    if (state.drag.active && state.drag.entityId === npc.id) return;

    if (!npc.battleAi) {
      npc.battleAi = {
        mode: "search",
        targetId: null,
        thinkAt: 0,
        strafeDir: Math.random() < 0.5 ? -1 : 1,
        comboPressureUntil: 0,
        lastActionAt: 0,
        lastModeChangeAt: 0,
        recoverThrownKnifeId: null,
        lastDecision: ""
      };
    }

    const ai = npc.battleAi;
    updateComboState(npc, nowMs);

    if (npc.combat && npc.combat.type) return;
    if ((npc.hitstopFrames || 0) > 0) return;
    if (npc.roll && npc.roll.active) return;
    if (npc.eatUntil && nowMs < npc.eatUntil) return;
    if (nowMs < ai.thinkAt) return;
    if (nowMs - (ai.lastActionAt || 0) < 140) return;

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
    const comboActive = (npc.comboCount || 0) >= 2 && nowMs - (npc.comboLastHitAt || 0) <= COMBO_RESET_MS;

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

      if (isKnifeName(item.name) && item.throwAttack && d < thrownKnifeDist) {
        thrownKnife = item;
        thrownKnifeDist = d;
      }
    }

    function setMode(nextMode) {
      if (ai.mode !== nextMode) {
        ai.mode = nextMode;
        ai.lastModeChangeAt = nowMs;
      }
    }

    function setNextThink(isCombatReaction = false) {
      ai.thinkAt = isCombatReaction
        ? nowMs + 120 + Math.random() * 60
        : nowMs + 260 + Math.random() * 120;
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

    function act(action, inputDir = "forward", decision = "") {
      if (decision && ai.lastDecision === decision && Math.random() < 0.35) return false;
      handleAction(action, "auto", npc, inputDir);
      ai.lastActionAt = nowMs;
      ai.lastDecision = decision || `${action}:${inputDir}`;
      return true;
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
        return act("pickup", "forward", "pickup-near");
      }
      return false;
    }

    if (!hasKnife && thrownKnife) {
      setMode("recoverKnife");
      if (tryPickupNearby(thrownKnife)) { setNextThink(false); return; }
      moveToward(thrownKnife.x, 1.15);
      if (thrownKnifeDist > midRange && canAct("roll") && Math.random() < 0.18) {
        act("roll", thrownKnife.x >= npc.x ? "forward" : "backward", "recover-roll");
        setNextThink(false);
        return;
      }
      setNextThink(false);
      return;
    }

    if (!hasKnife && nearestKnife) {
      setMode("arm");
      if (tryPickupNearby(nearestKnife)) { setNextThink(false); return; }
      moveToward(nearestKnife.x, 1.05);
      if (nearestKnifeDist > closeRange && canAct("roll") && Math.random() < 0.16) {
        act("roll", nearestKnife.x >= npc.x ? "forward" : "backward", "arm-roll");
        setNextThink(false);
        return;
      }
      setNextThink(false);
      return;
    }

    if (lowHp && nearestFood && nearestFoodDist <= farRange * 0.75) {
      setMode("recover");
      if (tryPickupNearby(nearestFood)) { setNextThink(false); return; }
      moveToward(nearestFood.x, dangerHp ? 1.15 : 1.0);
      if (dangerHp && canAct("roll") && Math.random() < 0.2) {
        act("roll", nearestFood.x >= npc.x ? "forward" : "backward", "recover-food-roll");
        setNextThink(false);
        return;
      }
      setNextThink(false);
      return;
    }

    if (targetAttacking && absDx <= midRange) {
      setMode("defense");
      if (targetCombat === "dropSlash" && hasKnife && canAct("roll")) {
        act("roll", "backward", "def-vs-drop");
        setNextThink(true);
        return;
      }
      if (targetCombat === "justGuard" && hasKnife && canAct("roll")) {
        act("roll", "forward", "punish-vs-guard");
        setNextThink(true);
        return;
      }
      if (targetCombat === "iaiSlash" && hasKnife && canAct("bounce")) {
        act("bounce", "forward", "air-counter-vs-iai");
        setNextThink(true);
        return;
      }
      if (canAct("roll") && Math.random() < 0.22) {
        act("roll", "backward", "generic-evade");
        setNextThink(true);
        return;
      }
    }

    if (comboActive && absDx <= midRange) {
      setMode("pressure");
      ai.comboPressureUntil = nowMs + 700;
      if (absDx <= closeRange && canAct("bounce")) {
        act("bounce", "forward", "pressure-bounce");
        setNextThink(true);
        return;
      }
      if (absDx <= midRange && canAct("roll")) {
        act("roll", "forward", "pressure-roll");
        setNextThink(true);
        return;
      }
    }

    if (absDx >= farRange) {
      setMode("approach");

      if (hasKnife && heldKnifeName === "コトのナイフ" && canAct("pickup") && Math.random() < 0.14) {
        act("pickup", "forward", "far-throw");
        setNextThink(false);
        return;
      }

      moveToward(target.x, heldKnifeName === "サテラのナイフ" ? 1.15 : 1.0);

      if (hasKnife && canAct("roll") && Math.random() < 0.16) {
        act("roll", "forward", "far-roll");
        setNextThink(false);
        return;
      }

      if (hasKnife && canAct("bounce") && Math.random() < 0.1) {
        act("bounce", "forward", "far-bounce");
        setNextThink(false);
        return;
      }

      setNextThink(false);
      return;
    }

    if (absDx > closeRange) {
      setMode("neutral");

      const option = pickWeighted([
        { type: "approach", weight: 24 },
        { type: "rollForward", weight: canAct("roll") ? 16 : 0 },
        { type: "iaiPrep", weight: hasKnife && canAct("roll") ? (heldKnifeName === "アヤのナイフ" ? 26 : 18) : 0 },
        { type: "dropPrep", weight: hasKnife && canAct("bounce") ? (heldKnifeName === "狐色のナイフ" ? 24 : 16) : 0 },
        { type: "throw", weight: hasKnife && canAct("pickup") ? (heldKnifeName === "コトのナイフ" ? 16 : 8) : 0 },
        { type: "retreat", weight: canAct("roll") ? (dangerHp ? 18 : 8) : 0 },
        { type: "wait", weight: 18 }
      ]);

      if (option?.type === "approach") { moveToward(target.x, 1.0); setNextThink(false); return; }
      if (option?.type === "rollForward") { act("roll", "forward", "mid-roll-forward"); setNextThink(false); return; }
      if (option?.type === "iaiPrep") { act("roll", "forward", "mid-iai-prep"); setNextThink(false); return; }
      if (option?.type === "dropPrep") { act("bounce", "forward", "mid-drop-prep"); setNextThink(false); return; }
      if (option?.type === "throw") { act("pickup", "forward", "mid-throw"); setNextThink(false); return; }
      if (option?.type === "retreat") { act("roll", "backward", "mid-retreat"); setNextThink(false); return; }

      softenVelocity();
      setNextThink(false);
      return;
    }

    setMode("close");
    const option = pickWeighted([
      { type: "normal", weight: canAct("bounce") ? 34 : 0 },
      { type: "backRoll", weight: canAct("roll") ? (dangerHp ? 24 : 14) : 0 },
      { type: "iai", weight: hasKnife && canAct("roll") ? (heldKnifeName === "アヤのナイフ" ? 22 : 14) : 0 },
      { type: "guard", weight: hasKnife && canAct("roll") ? (heldKnifeName === "漆黒のナイフ" ? 22 : 14) : 0 },
      { type: "throw", weight: hasKnife && canAct("pickup") ? (heldKnifeName === "コトのナイフ" ? 8 : 3) : 0 },
      { type: "wait", weight: 20 }
    ]);

    if (option?.type === "normal") { act("bounce", "forward", "close-normal"); setNextThink(false); return; }
    if (option?.type === "backRoll") { act("roll", "backward", "close-backroll"); setNextThink(false); return; }
    if (option?.type === "iai") { act("roll", "forward", "close-iai"); setNextThink(false); return; }
    if (option?.type === "guard") { act("roll", "backward", "close-guard"); setNextThink(false); return; }
    if (option?.type === "throw") { act("pickup", "forward", "close-throw"); setNextThink(false); return; }

    softenVelocity();
    setNextThink(false);
  }

  function runAutoBehavior(nowMs) {
    const actors = getAllEntities().filter((ent) => ent && ent.kind !== "item");
    actors.forEach((actor) => {
      if (actor.stageIndex === ARENA_STAGE_INDEX && actor.kind === "npc") {
        updateBattleNpcAI(actor, nowMs);
      } else {
        runAutoBehaviorForActor(actor, nowMs);
      }
    });
  }

  function getCarriedItem(carrier) {
    if (!carrier || !carrier.carryingItemId) return null;
    return getEntityById(carrier.carryingItemId);
  }

  function syncCarriedItemTransform(carrier, item) {
    if (!carrier || !item) return;
    const stage = stageOf(carrier.stageIndex);
    if (!stage) return;

    const dir = carrier.facing >= 0 ? 1 : -1;
    item.stageIndex = carrier.stageIndex;
    item.x = clamp(
      carrier.x + dir * carrier.w * 0.02,
      stage.x + item.w * 0.5,
      stage.x + stage.width - item.w * 0.5
    );
    item.y = carrier.y - carrier.h + item.h * 0.5;
    item.vx = carrier.vx;
    item.vy = carrier.vy;
    item.rot = carrier.rot * 0.18;
    item.wrot = 0;
    item.grounded = false;
  }

  function detachCarriedItem(carrier, dropToGround, throwDir = null) {
    const item = getCarriedItem(carrier);
    if (!carrier || !item) return null;

    carrier.carryingItemId = null;
    item.carriedById = null;
    item.stageIndex = carrier.stageIndex;

    if (dropToGround) {
      const dir = Number.isFinite(throwDir) && throwDir !== 0 ? Math.sign(throwDir) : (carrier.facing >= 0 ? 1 : -1);
      const targetX = carrier.x + dir * (carrier.w * 0.55 + item.w * 0.45);
      const targetY = carrier.y - carrier.h * 0.2;
      if (!applyMoveCandidate(item, targetX, targetY, true)) {
        placeEntitySafely(item, carrier.x);
      }
      item.vx = dir * 90;
      item.vy = -60;
      item.wrot += dir * 0.08;
    } else {
      item.x = carrier.x;
      item.y = carrier.y - carrier.h * 0.2;
      item.vx = 0;
      item.vy = 0;
    }

    return item;
  }

  function tryPickupNearbyItem(carrier) {
    if (!carrier || carrier.carryingItemId) return null;
    if (getCharacterState(carrier) === "spectator") return null;
    const bucket = bucketOf(carrier.stageIndex);
    if (!bucket) return null;

    let best = null;
    let bestDist = Number.POSITIVE_INFINITY;

    for (const item of bucket.items) {
      if (item.carriedById || item.throwAttack) continue;
      if (!overlapsEntity(carrier, item, 6)) continue;

      const dx = item.x - carrier.x;
      const dy = item.y - carrier.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < bestDist) {
        bestDist = d2;
        best = item;
      }
    }

    if (!best) return null;
    carrier.carryingItemId = best.id;
    best.carriedById = carrier.id;
    syncCarriedItemTransform(carrier, best);
    return best;
  }

  function updateCarriedItems() {
    for (const bucket of state.stageBuckets) {
      for (const item of bucket.items) {
        if (!item.carriedById) continue;
        const carrier = getEntityById(item.carriedById);
        if (!carrier) {
          item.carriedById = null;
          continue;
        }
        if (carrier.carryingItemId !== item.id) {
          carrier.carryingItemId = item.id;
        }
        syncCarriedItemTransform(carrier, item);
      }
    }
  }

  async function createEntity(kind, stageIndex, name, file, basePath, baseH) {
    const img = await loadImage(`${basePath}/${file}`);
    const sprite = getOpaqueBounds(img);
    const ratio = sprite.sw / sprite.sh;
    const isKnife = kind === "item" && String(name || "").includes("ナイフ");
    const nowMs = performance.now();

    let knifeScale = 1 / 3;
    if (isKnife) {
      const refDiag = await getKnifeReferenceDiag();
      const thisDiag = Math.hypot(Math.max(1, sprite.sw), Math.max(1, sprite.sh));
      if (refDiag > 0 && thisDiag > 0) knifeScale = (refDiag / thisDiag) / 5;
    }

    const entityH = isKnife ? Math.max(1, sprite.sh * knifeScale) : baseH;
    const entityW = isKnife
      ? Math.max(1, sprite.sw * knifeScale)
      : (kind === "item" ? entityH * ratio : clamp(entityH * ratio, 18, 180));
    const hitboxScaleX = isKnife ? 0.55 : 1;
    const hitboxScaleY = isKnife ? 0.55 : 1;

    return {
      id: nextEntityId++,
      kind,
      stageIndex,
      name,
      file,
      img,
      sprite,
      x: 0,
      y: entityH,
      w: entityW,
      h: entityH,
      hitboxScaleX,
      hitboxScaleY,
      vx: 0,
      vy: 0,
      grounded: false,
      facing: -1,
      rot: 0,
      wrot: 0,
      born: nowMs,
      animTime: 0,
      landPulse: 0,
      carryingItemId: null,
      carriedById: null,
      lastUserTouchAt: kind === "item" ? nowMs : 0,
      nextSpeechAt: nowMs + AUTO_SPEECH_INTERVAL_MS * (0.7 + Math.random() * 0.6),
      autoAi: {
        nextAt: nowMs + AUTO_BEHAVIOR_INTERVAL_MS * (0.7 + Math.random() * 0.6),
        targetId: null,
        lastDistance: Number.POSITIVE_INFINITY,
        noImproveRolls: 0
      },
      roll: { active: false, t: 0, dur: 0.56, dir: 1, justFinished: false, targetRot: 0 },
      bounceForwardActive: false,
      actionCooldownUntil: { bounce: 0, roll: 0, pickup: 0 },
      maxHp: kind === "item" ? 0 : HP_MAX,
      hp: kind === "item" ? 0 : HP_MAX,
      hitstopFrames: 0,
      combat: { type: null, frame: 0, dir: 1, hitIds: new Set(), flags: {} },
      commandBuffer: [],
      lastRollDir: 1,
      lastRollAt: 0,
      comboCount: 0,
      comboLastHitAt: 0,
      comboDisplayUntil: 0,
      comboCritUntil: 0
};
  }

  async function applyCharacterToPlayer(name) {
    const file = CHARACTER_FILES.get(name);
    if (!file || !state.player) return;

    const img = await loadImage(`${PUNI_BASE}/${file}`);
    const sprite = getOpaqueBounds(img);
    const ratio = sprite.sw / sprite.sh;
    const p = state.player;

    p.name = name;
    p.file = file;
    p.img = img;
    p.sprite = sprite;
    p.h = CHAR_BASE_H;
    p.w = clamp(CHAR_BASE_H * ratio, 18, 180);

    placeEntitySafely(p, p.x);
  }

  function updateEntityPhysics(ent, dt) {
    if (!ent) return;
    if (ent.carriedById) return;
    if (state.drag.active && state.drag.entityId === ent.id) return;
    if ((ent.hitstopFrames || 0) > 0) {
      ent.hitstopFrames = Math.max(0, ent.hitstopFrames - dt * COMBAT_FRAME_RATE);
      return;
    }

    ent.vy += PHYS.gravity * dt;
    ent.vx *= Math.pow(PHYS.drag, dt * 60);
    ent.vy *= Math.pow(PHYS.drag, dt * 60);
    ent.vy = clamp(ent.vy, -PHYS.maxFall, PHYS.maxFall);

    if (ent.roll && ent.roll.active) {
      const remain = ent.roll.targetRot - ent.rot;
      const timeLeft = Math.max(0.08, ent.roll.dur - ent.roll.t);
      const desiredWrot = clamp(remain / (timeLeft * 60), -1.4, 1.4);
      ent.wrot = ent.wrot * 0.52 + desiredWrot * 0.48;

      // 回転量と並進距離を一致させる（終端スパイクを抑制）
      const rollRadius = ent.h * 0.5;
      ent.vx = clamp(rollRadius * (ent.wrot * 60 * 0.25), -420, 420);
    }

    const step = 3;
    const canStepUp = ent.kind !== "item" && (ent.grounded || collidesForNormal(ent, ent.x, ent.y + 1));
    let mx = ent.vx * dt;
    let my = ent.vy * dt;
    let hitWall = false;
    let hitFloor = false;
    ent.grounded = false;

    while (Math.abs(mx) > 0) {
      const s = Math.abs(mx) > step ? step * Math.sign(mx) : mx;
      if (applyMoveCandidate(ent, ent.x + s, ent.y, true)) mx -= s;
      else {
        if (canStepUp && tryStepUpMove(ent, s)) {
          mx -= s;
          continue;
        }
        hitWall = true;
        ent.vx = -ent.vx * 0.55;
        break;
      }
    }

    while (Math.abs(my) > 0) {
      const s = Math.abs(my) > step ? step * Math.sign(my) : my;
      if (applyMoveCandidate(ent, ent.x, ent.y + s, s < 0)) my -= s;
      else {
        if (s > 0) {
          hitFloor = true;
          ent.grounded = true;
          ent.vy = -ent.vy * PHYS.bounce;
          if (Math.abs(ent.vy) < 14) ent.vy = 0;
        } else {
          ent.vy = Math.max(0, ent.vy);
        }
        break;
      }
    }

    // 回転摩擦 + 0°へ戻るばね（減衰振動）
    ent.wrot *= Math.pow(0.94, dt * 60);
    ent.wrot += clamp(ent.vx * 0.00012, -0.012, 0.012);
    const restFactor = (Math.abs(ent.vx) + Math.abs(ent.vy) < 18) ? 1.45 : 1.0;
    ent.wrot += (-ent.rot) * 0.012 * dt * 60 * restFactor;
    if (!(ent.roll && ent.roll.active)) {
      ent.wrot = clamp(ent.wrot, -0.45, 0.45);
    }

    ent.rot += ent.wrot * dt * 60;
    if (!(ent.roll && (ent.roll.active || ent.roll.justFinished))) {
      ent.rot = clamp(ent.rot, -4.5, 4.5);
    }

    // 前転後は並進を止め、回転だけ減衰させながら収束させる
    if (ent.roll && ent.roll.justFinished && (ent.grounded || hitFloor)) {
      ent.vx = 0;
      ent.roll.justFinished = false;
    }

    if (hitFloor) {
      if (ent.bounceForwardActive) {
        ent.vx = 0;
        ent.bounceForwardActive = false;
      }
      ent.landPulse = Math.min(1, ent.landPulse + 0.7);
    }
    if (hitWall) ent.landPulse = Math.min(1, ent.landPulse + 0.25);
  }

  function updateEntityAnim(ent, dt) {
    if ((ent.hitstopFrames || 0) > 0) return;
    ent.animTime += dt;
    ent.landPulse = Math.max(0, ent.landPulse - dt * 4.6);

    if (ent.roll && ent.roll.active) {
      ent.roll.t += dt;
      if (ent.roll.t >= ent.roll.dur) {
        ent.roll.active = false;
        ent.roll.justFinished = true;
        ent.roll.t = ent.roll.dur;
        ent.vx = 0;
        const turnUnit = Math.PI * 8;
        ent.rot -= Math.round(ent.rot / turnUnit) * turnUnit;
      }
    }
  }

function drawImageCover(img) {
    const cw = canvas.width;
    const ch = canvas.height;
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    const scale = Math.max(cw / iw, ch / ih);
    const dw = iw * scale;
    const dh = ih * scale;
    const dx = (cw - dw) * 0.5;
    const dy = (ch - dh) * 0.5;
    ctx.drawImage(img, dx, dy, dw, dh);
  }

  function updateFarBackground(nowMs, dt) {
    const bg = state.farBg;
    if (!bg.images.length) return;

    if (!bg.isFading && nowMs - bg.lastSwitchAt >= DAY_CYCLE_MS) {
      bg.isFading = true;
      bg.fadeProgress = 0;
      bg.nextIndex = (bg.currentIndex + 1) % bg.images.length;
    }

    if (bg.isFading) {
      bg.fadeProgress += (dt * 1000) / DAY_FADE_MS;
      if (bg.fadeProgress >= 1) {
        bg.fadeProgress = 1;
        bg.currentIndex = bg.nextIndex;
        bg.isFading = false;
        bg.lastSwitchAt = nowMs;
      }
    }
  }

  function drawFarBackground() {
    const bg = state.farBg;
    if (!bg.images.length) return;

    const current = bg.images[bg.currentIndex];
    if (current && current.naturalWidth > 0 && current.naturalHeight > 0) {
      drawImageCover(current);
    }

    if (bg.isFading) {
      const next = bg.images[bg.nextIndex];
      if (next && next.naturalWidth > 0 && next.naturalHeight > 0) {
        ctx.save();
        ctx.globalAlpha = clamp(bg.fadeProgress, 0, 1);
        drawImageCover(next);
        ctx.restore();
      }
    }
  }

  function buildSidebar() {
    const container = document.getElementById("charList");
    container.innerHTML = "";

    const mkTitle = (text, mt = "10px") => {
      const t = document.createElement("div");
      t.textContent = text;
      t.style.margin = `${mt} 4px 6px`;
      t.style.fontSize = "12px";
      t.style.color = "#9dc2ff";
      t.style.letterSpacing = "0.06em";
      container.appendChild(t);
    };

    const mkAction = (label, id) => {
      const b = document.createElement("button");
      b.type = "button";
      b.id = id;
      b.className = "char-item";
      b.style.justifyContent = "center";
      b.innerHTML = `<span class="name">${label}</span>`;
      container.appendChild(b);
      return b;
    };

    mkTitle("操作", "2px");
    const btnChar = mkAction("選択中キャラを追加", "btnSpawnChar");
    const btnItem = mkAction("選択中アイテムを配置", "btnSpawnItem");
    const btnReset = mkAction("リセット", "btnResetStageState");
    const btnBackTop = mkAction("トップ画面に戻る", "btnBackToStartScreen");

    btnChar.addEventListener("click", async () => {
      const bucket = bucketOf(state.currentStageIndex);
      if (bucket.npcs.length >= NPC_LIMIT) {
        hud.textContent = `追加キャラは1ステージにつき${NPC_LIMIT}体までです。`;
        return;
      }
      const file = CHARACTER_FILES.get(state.selectedCharacter);
      const ch = await createEntity("npc", state.currentStageIndex, state.selectedCharacter, file, PUNI_BASE, CHAR_BASE_H);
      const pivotX = state.player ? state.player.x + (Math.random() * 220 - 110) : stageOf(state.currentStageIndex).x + 240;
      placeEntitySafely(ch, pivotX);
      bucket.npcs.push(ch);
      state.ui.panelDirty = true;
      refreshSidebarSelection();
    });

    btnItem.addEventListener("click", async () => {
      const bucket = bucketOf(state.currentStageIndex);
      if (bucket.items.length >= ITEM_LIMIT) {
        hud.textContent = `アイテムは1ステージにつき${ITEM_LIMIT}個までです。`;
        return;
      }
      const file = ITEM_FILES.get(state.selectedItem);
      const item = await createEntity("item", state.currentStageIndex, state.selectedItem, file, ITEM_BASE, ITEM_BASE_H);
      const pivotX = state.player ? state.player.x + (Math.random() * 220 - 110) : stageOf(state.currentStageIndex).x + 200;
      placeEntitySafely(item, pivotX);
      bucket.items.push(item);
      state.ui.panelDirty = true;
      refreshSidebarSelection();
    });

    btnReset.addEventListener("click", () => {
      applyStartModeSpawn().catch((err) => {
        console.error(err);
        hud.textContent = `リセットエラー: ${err.message}`;
      });
    });

    btnBackTop.addEventListener("click", () => {
      returnToStartScreen();
    });
    mkTitle("キャラクター");
    CHARACTER_GROUPS.forEach((g) => {
      mkTitle(g.title, "8px");
      g.names.forEach((name) => {
        const file = CHARACTER_FILES.get(name);
        if (!file) return;
        const b = document.createElement("button");
        b.type = "button";
        b.className = "char-item pick-char";
        b.dataset.name = name;
        b.innerHTML = `<img alt="${name}" src="${PUNI_BASE}/${file}"><span class="name">${name}</span>`;
        b.addEventListener("click", () => {
          state.selectedCharacter = name;
          refreshSidebarSelection();
        });
        container.appendChild(b);
      });
    });

    mkTitle("アイテム", "12px");
    ITEM_FILES.forEach((file, name) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "char-item pick-item";
      b.dataset.name = name;
      b.innerHTML = `<img alt="${name}" src="${ITEM_BASE}/${file}"><span class="name">${name}</span>`;
      b.addEventListener("click", () => {
        state.selectedItem = name;
        refreshSidebarSelection();
      });
      container.appendChild(b);
    });

    refreshSidebarSelection();
  }
  function refreshSidebarSelection() {
    sidebar.querySelectorAll(".pick-char").forEach((el) => {
      el.classList.toggle("active", el.dataset.name === state.selectedCharacter);
    });
    sidebar.querySelectorAll(".pick-item").forEach((el) => {
      el.classList.toggle("active", el.dataset.name === state.selectedItem);
    });
  }

  async function deleteEntityById(id) {
    const ent = getEntityById(id);
    if (!ent) return;

    if (state.drag.active && state.drag.entityId === ent.id) {
      state.drag.active = false;
      state.drag.pointerId = null;
      state.drag.entityId = null;
    }

    if (ent.carryingItemId) {
      detachCarriedItem(ent, false);
    }

    if (ent.kind === "item") {
      if (ent.carriedById) {
        const carrier = getEntityById(ent.carriedById);
        if (carrier && carrier.carryingItemId === ent.id) carrier.carryingItemId = null;
        ent.carriedById = null;
      }
      const b = bucketOf(ent.stageIndex);
      const i = b.items.findIndex((x) => x.id === ent.id);
      if (i >= 0) b.items.splice(i, 1);
      state.ui.panelDirty = true;
      return;
    }

    if (state.player && ent.id === state.player.id) {
      const currentBucket = bucketOf(ent.stageIndex);
      let replacement = null;

      if (currentBucket.npcs.length > 0) {
        replacement = currentBucket.npcs.shift();
      } else {
        for (const b of state.stageBuckets) {
          if (b.npcs.length > 0) {
            replacement = b.npcs.shift();
            break;
          }
        }
      }

      if (replacement) {
        replacement.kind = "player";
        state.player = replacement;
        state.currentStageIndex = replacement.stageIndex;
      } else {
        state.player = null;
      }

      state.ui.panelDirty = true;
      return;
    }

    const b = bucketOf(ent.stageIndex);
    const i = b.npcs.findIndex((x) => x.id === ent.id);
    if (i >= 0) b.npcs.splice(i, 1);
    state.ui.panelDirty = true;
  }

  function onEntityPanelClick(e) {
    const btn = e.target.closest("button[data-action][data-id]");
    if (!btn) return;

    const action = btn.dataset.action;
    const id = Number(btn.dataset.id);
    if (!Number.isFinite(id)) return;
    if (action !== "set-player" && action !== "delete" && action !== "revive") return;

    e.preventDefault();
    e.stopPropagation();

    if (action === "set-player") {
      setPlayableCharacterById(id);
      return;
    }

    if (action === "delete") {
      deleteEntityById(id).catch((err) => {
        console.error(err);
        hud.textContent = `削除エラー: ${err.message}`;
      });
      return;
    }

    if (action === "revive") {
      const ent = getEntityById(id);
      if (!ent || ent.kind === "item") return;
      setCharacterHp(ent, Number.isFinite(ent.maxHp) ? ent.maxHp : HP_MAX);
      ent.rot = 0;
      ent.wrot = 0;
      ent.vx = 0;
      ent.vy = 0;
      state.ui.panelDirty = true;
    }
  }

  function setPlayableCharacterById(id) {
    const ent = getEntityById(id);
    if (!ent || ent.kind === "item") return;

    state.selectedCharacter = ent.name;
    refreshSidebarSelection();

    if (!state.player || state.player.id !== ent.id) {
      const prevPlayer = state.player;
      if (prevPlayer && prevPlayer.id !== ent.id) {
        prevPlayer.kind = "npc";
        const prevBucket = bucketOf(prevPlayer.stageIndex);
        if (prevBucket && !prevBucket.npcs.some((x) => x.id === prevPlayer.id)) {
          prevBucket.npcs.push(prevPlayer);
        }
      }

      const targetBucket = bucketOf(ent.stageIndex);
      if (targetBucket) {
        const idx = targetBucket.npcs.findIndex((x) => x.id === ent.id);
        if (idx >= 0) targetBucket.npcs.splice(idx, 1);
      }

      ent.kind = "player";
      state.player = ent;
    }

    state.currentStageIndex = ent.stageIndex;
    state.ui.panelDirty = true;
    updateStageLabel();
    updateStageNav();
    syncEntityPanelToPngEdge();
  }

  
  function pushSpeechLog(text) {
    const t = new Date();
    const hh = String(t.getHours()).padStart(2, "0");
    const mm = String(t.getMinutes()).padStart(2, "0");
    state.ui.speechLogs.unshift(`[${hh}:${mm}] ${text}`);
    if (state.ui.speechLogs.length > 40) state.ui.speechLogs.length = 40;
    renderSpeechLogs();
  }

  function renderSpeechLogs() {
    if (!Array.isArray(state.ui.speechLogs)) state.ui.speechLogs = [];
    const render = (el) => {
      if (!el) return;
      el.innerHTML = "";
      if (!state.ui.speechLogs.length) {
        const d = document.createElement("div");
        d.className = "speech-line";
        d.textContent = "ここにセリフログが表示されます。";
        el.appendChild(d);
        return;
      }
      state.ui.speechLogs.forEach((line) => {
        const d = document.createElement("div");
        d.className = "speech-line";
        d.textContent = line;
        el.appendChild(d);
      });
    };

    render(speechLogDesktop);
    render(speechLogMobile);
  }


  function setCombatHelpOpen(open) {
    if (!combatHelpBox) return;
    const nextOpen = !!open;
    combatHelpBox.hidden = !nextOpen;
    if (combatHelpBtn) combatHelpBtn.setAttribute("aria-expanded", nextOpen ? "true" : "false");
  }
  function closeMobileSidebars() {
    document.body.classList.remove("show-left-sidebar", "show-right-sidebar");
  }

  function getCharacterNameList() {
    const names = [];
    CHARACTER_GROUPS.forEach((g) => {
      g.names.forEach((n) => {
        if (CHARACTER_FILES.has(n) && !names.includes(n)) names.push(n);
      });
    });
    CHARACTER_FILES.forEach((_file, n) => {
      if (!names.includes(n)) names.push(n);
    });
    return names;
  }

  function getKnifeNameList() {
    const list = [];
    ITEM_FILES.forEach((_file, name) => {
      if (String(name).includes("ナイフ")) list.push(name);
    });
    return list;
  }

  function setStartMode(mode) {
    state.start.mode = mode === "stadium" ? "stadium" : "play";
    if (modePlayBtn) modePlayBtn.classList.toggle("active", state.start.mode === "play");
    if (modeStadiumBtn) modeStadiumBtn.classList.toggle("active", state.start.mode === "stadium");
    if (stadiumSetup) stadiumSetup.hidden = state.start.mode !== "stadium";
  }

  function setupStartSelectors() {
    const chars = getCharacterNameList();
    const knives = getKnifeNameList();

    function refreshPreview() {
      if (selfCharPreview) {
        const file = CHARACTER_FILES.get(state.start.selfChar);
        selfCharPreview.src = file ? `${PUNI_BASE}/${file}` : "";
      }
      if (enemyCharPreview) {
        const file = CHARACTER_FILES.get(state.start.enemyChar);
        enemyCharPreview.src = file ? `${PUNI_BASE}/${file}` : "";
      }
    }

    if (selfCharSelect) {
      selfCharSelect.innerHTML = chars.map((name) => `<option value="${name}">${name}</option>`).join("");
      if (!chars.includes(state.start.selfChar)) state.start.selfChar = chars[0] || "アカウ";
      selfCharSelect.value = state.start.selfChar;
      selfCharSelect.addEventListener("change", () => {
        state.start.selfChar = selfCharSelect.value;
        if (enemyCharSelect && enemyCharSelect.value === state.start.selfChar) {
          const alt = chars.find((n) => n !== state.start.selfChar) || state.start.selfChar;
          enemyCharSelect.value = alt;
          state.start.enemyChar = alt;
        }
        refreshPreview();
      });
    }

    if (enemyCharSelect) {
      enemyCharSelect.innerHTML = chars.map((name) => `<option value="${name}">${name}</option>`).join("");
      if (!chars.includes(state.start.enemyChar) || state.start.enemyChar === state.start.selfChar) {
        state.start.enemyChar = chars.find((n) => n !== state.start.selfChar) || state.start.selfChar;
      }
      enemyCharSelect.value = state.start.enemyChar;
      enemyCharSelect.addEventListener("change", () => {
        state.start.enemyChar = enemyCharSelect.value;
        refreshPreview();
      });
    }

    if (stadiumKnifeSelect) {
      stadiumKnifeSelect.innerHTML = knives.map((name) => `<option value="${name}">${name}</option>`).join("");
      if (!knives.includes(state.start.knife)) state.start.knife = knives[0] || "";
      stadiumKnifeSelect.value = state.start.knife;
      stadiumKnifeSelect.addEventListener("change", () => {
        state.start.knife = stadiumKnifeSelect.value;
      });
    }

    if (stadiumKnife2Select) {
      stadiumKnife2Select.innerHTML = knives.map((name) => `<option value="${name}">${name}</option>`).join("");
      if (!knives.includes(state.start.knife2)) state.start.knife2 = knives[1] || knives[0] || "";
      stadiumKnife2Select.value = state.start.knife2;
      stadiumKnife2Select.addEventListener("change", () => {
        state.start.knife2 = stadiumKnife2Select.value;
      });
    }

    refreshPreview();
  }

  function clearStageObjects() {
    state.stageBuckets.forEach((b) => {
      b.npcs.length = 0;
      b.items.length = 0;
    });
    state.combat.effects.length = 0;
    if (state.player) {
      state.player.carryingItemId = null;
      state.player.eatingItemId = null;
    }
  }

  async function applyStartModeSpawn() {
    if (!state.player) return;

    clearStageObjects();

    const selfName = state.start.selfChar;
    const enemyName = state.start.enemyChar;
    const knifeName = state.start.knife;
    const knife2Name = state.start.knife2;
    const mode = state.start.mode;

    if (CHARACTER_FILES.has(selfName)) {
      state.selectedCharacter = selfName;
      await applyCharacterToPlayer(selfName);
    }
    refreshSidebarSelection();

    const stageIndex = mode === "stadium" ? ARENA_STAGE_INDEX : 0;
    const stage = stageOf(stageIndex);

    state.player.stageIndex = stageIndex;
    state.player.vx = 0;
    state.player.vy = 0;
    state.player.rot = 0;
    state.player.wrot = 0;
    state.player.grounded = false;
    setCharacterHp(state.player, HP_MAX);
    placeEntitySafely(state.player, stage.x + stage.width * 0.48);

    if (mode === "stadium") {
      const bucket = bucketOf(stageIndex);

      if (CHARACTER_FILES.has(enemyName)) {
        const enemy = await createEntity("npc", stageIndex, enemyName, CHARACTER_FILES.get(enemyName), PUNI_BASE, CHAR_BASE_H);
        placeEntitySafely(enemy, state.player.x + state.player.w * 5.2);
        enemy.facing = -1;
        bucket.npcs.push(enemy);
      }

      if (ITEM_FILES.has(knifeName)) {
        const knife = await createEntity("item", stageIndex, knifeName, ITEM_FILES.get(knifeName), ITEM_BASE, ITEM_BASE_H);
        placeEntitySafely(knife, state.player.x);
        bucket.items.push(knife);
        state.player.carryingItemId = knife.id;
        knife.carriedById = state.player.id;
        syncCarriedItemTransform(state.player, knife);
      }

      if (ITEM_FILES.has(knife2Name) && bucket.npcs.length > 0) {
        const enemy = bucket.npcs[0];
        const knife2 = await createEntity("item", stageIndex, knife2Name, ITEM_FILES.get(knife2Name), ITEM_BASE, ITEM_BASE_H);
        placeEntitySafely(knife2, enemy.x);
        bucket.items.push(knife2);
        enemy.carryingItemId = knife2.id;
        knife2.carriedById = enemy.id;
        syncCarriedItemTransform(enemy, knife2);
      }
    }

    state.currentStageIndex = stageIndex;
    updateCamera();
    updateStageNav();
    syncStageSelector();
    syncEntityPanelToPngEdge();
    state.ui.panelDirty = true;
    renderEntityPanel();
  }

  async function beginFromStartScreen() {
    if (state.start.started) return;
    if (selfCharSelect) state.start.selfChar = selfCharSelect.value || state.start.selfChar;
    if (enemyCharSelect) state.start.enemyChar = enemyCharSelect.value || state.start.enemyChar;
    if (stadiumKnifeSelect) state.start.knife = stadiumKnifeSelect.value || state.start.knife;
    if (stadiumKnife2Select) state.start.knife2 = stadiumKnife2Select.value || state.start.knife2;

    await applyStartModeSpawn();

    state.start.started = true;
    state.ready = true;
    state.lastTime = performance.now();
    if (startScreen) startScreen.classList.add("hidden");
    if (!state.loopStarted) {
      state.loopStarted = true;
      requestAnimationFrame(tick);
    }
  }
  function returnToStartScreen() {
    if (state.player) {
      state.start.selfChar = state.player.name || state.start.selfChar;
      const held = getCarriedItem(state.player);
      if (held && held.kind === "item") state.start.knife = held.name || state.start.knife;
    }

    if (selfCharSelect) selfCharSelect.value = state.start.selfChar;
    if (enemyCharSelect) enemyCharSelect.value = state.start.enemyChar;
    if (stadiumKnifeSelect) stadiumKnifeSelect.value = state.start.knife;
    if (stadiumKnife2Select) stadiumKnife2Select.value = state.start.knife2;
    setStartMode(state.start.mode || "play");

    state.start.started = false;
    state.ready = false;
    closeMobileSidebars();
    if (startScreen) startScreen.classList.remove("hidden");
  }
  function handleAction(action, source = "system", actorOverride = null, inputDir = "forward") {
    const actor = actorOverride || getControlledActor();
    if (!actor) return;

    const nowMs = performance.now();
    if (!actor.actionCooldownUntil) {
      actor.actionCooldownUntil = { bounce: 0, roll: 0, pickup: 0 };
    }
    if (actor.combat && actor.combat.type) return;

    if (source === "auto" && actor.autoAi && actor.autoAi.targetId) {
      const autoTarget = getEntityById(actor.autoAi.targetId);
      if (autoTarget && autoTarget.stageIndex === actor.stageIndex) {
        actor.facing = autoTarget.x >= actor.x ? 1 : -1;
      }
    }

    const facingDir = actor.facing >= 0 ? 1 : -1;
    const motionDir = inputDir === "backward" ? -facingDir : facingDir;
    const knifeHeld = !!getHeldKnifeItem(actor);

    cleanupCombatInputBuffer(actor, nowMs);

    if (knifeHeld && (action === "bounce" || action === "roll")) {
      if (tryBeginCommandCombat(actor, action, motionDir, nowMs)) {
        rememberCombatInput(actor, action, motionDir, nowMs);
        actor.actionCooldownUntil[action] = nowMs + ACTION_COOLDOWN_MS;
        return;
      }
    }

    const actionKey = (action === "bounce" || action === "roll" || action === "pickup") ? action : null;
    if (actionKey && nowMs < (actor.actionCooldownUntil[actionKey] || 0)) return;

    if (action === "bounce") {
      if (knifeHeld) {
        if (!beginCombatAction(actor, "normal", motionDir)) return;
        rememberCombatInput(actor, action, motionDir, nowMs);
        actor.actionCooldownUntil.bounce = nowMs + ACTION_COOLDOWN_MS;
        return;
      }

      const canJump = actor.grounded || collidesForNormal(actor, actor.x, actor.y + 1);
      if (!canJump || (actor.roll && actor.roll.active)) return;
      const jumpHeight = actor.h * 2;
      const jumpV = Math.sqrt(2 * PHYS.gravity * jumpHeight);
      actor.vy = Math.min(actor.vy, -jumpV);
      actor.vx += motionDir * 65;
      actor.vx = clamp(actor.vx, -220, 220);
      actor.bounceForwardActive = true;
      actor.grounded = false;
      actor.actionCooldownUntil.bounce = nowMs + ACTION_COOLDOWN_MS;
      return;
    }

    if (action === "roll") {
      if (knifeHeld) {
        const combatType = motionDir === facingDir ? "rollForward" : "rollBackward";
        if (!beginCombatAction(actor, combatType, motionDir)) return;
        rememberCombatInput(actor, action, motionDir, nowMs);
        actor.lastRollDir = motionDir;
        actor.lastRollAt = nowMs;
        actor.actionCooldownUntil.roll = nowMs + ACTION_COOLDOWN_MS;
        return;
      }

      actor.roll.active = true;
      actor.roll.justFinished = false;
      actor.roll.t = 0;
      actor.roll.dur = 0.62;
      actor.roll.dir = motionDir;
      actor.roll.targetRot = actor.rot + motionDir * Math.PI * 8;
      actor.vx = 0;
      actor.vy = Math.min(actor.vy, -65);
      actor.wrot = motionDir * 0.35;
      actor.grounded = false;
      actor.lastRollDir = motionDir;
      actor.lastRollAt = nowMs;
      actor.actionCooldownUntil.roll = nowMs + ACTION_COOLDOWN_MS;
      return;
    }

    if (action === "pickup") {
      if (getCharacterState(actor) === "spectator") return;
      let acted = false;

      if (actor.carryingItemId) {
        const held = getCarriedItem(actor);
        if (source === "user" && held) markItemUserTouched(held, nowMs);

        if (held && isKnifeName(held.name)) {
          if (beginCombatAction(actor, "throwKnife", motionDir)) {
            actor.actionCooldownUntil.pickup = nowMs + ACTION_COOLDOWN_MS;
          }
          return;
        }

        if (inputDir !== "backward" && held && FOOD_ITEM_NAMES.has(held.name)) {
          startEating(actor, held, nowMs);
          setSpeechBubbleForEntity(actor.id, nowMs);
          acted = true;
        } else {
          detachCarriedItem(actor, true, motionDir);
          acted = true;
        }
      } else {
        const picked = tryPickupNearbyItem(actor);
        if (picked) {
          if (source === "user") markItemUserTouched(picked, nowMs);
          const foundLine = getFoundSpeechLine(actor.name, picked.name);
          if (foundLine) {
            pushSpeechLog(`${actor.name}: ${foundLine}`);
            setSpeechBubbleForEntity(actor.id, nowMs);
          }
          acted = true;
        }
      }

      if (acted) actor.actionCooldownUntil.pickup = nowMs + ACTION_COOLDOWN_MS;
      return;
    }
  }
  function onActionButtonClick(e) {
    const btn = e.target.closest(".action-trigger");
    if (!btn) return;
    const action = btn.dataset.action;
    if (!action) return;

    const actor = getControlledActor();
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

  function renderEntityPanel() {
    if (!entityPanel || !entityList) return;

    const list = getEntitiesInStage(state.currentStageIndex)
      .slice()
      .sort((a, b) => {
        if (a.kind === "item" && b.kind !== "item") return 1;
        if (a.kind !== "item" && b.kind === "item") return -1;
        return a.id - b.id;
      });

    if (entityCountTitle) {
      entityCountTitle.textContent = `現在ステージのキャラ/アイテム (${list.length})`;
    }

    entityList.innerHTML = "";

    if (!list.length) {
      const empty = document.createElement("div");
      empty.textContent = "表示中オブジェクトはありません";
      empty.style.color = "#9db4d9";
      empty.className = "speech-line";
      entityList.appendChild(empty);
      state.ui.panelDirty = false;
      state.ui.panelStage = state.currentStageIndex;
      return;
    }

    list.forEach((ent) => {
      const row = document.createElement("div");
      row.className = "entity-row";
      if (ent.kind !== "item") row.classList.add(`state-${getCharacterState(ent)}`);

      const name = document.createElement("div");
      name.className = "entity-name";
      name.textContent = ent.name;
      row.appendChild(name);

      const badge = document.createElement("span");
      badge.className = "badge";
      badge.textContent = ent.kind === "item" ? "アイテム" : "キャラ";
      row.appendChild(badge);

      if (ent.kind !== "item") {
        const hpWrap = document.createElement("div");
        hpWrap.className = "hp-wrap";

        const hpBar = document.createElement("div");
        hpBar.className = "hp-bar";

        const hpFill = document.createElement("div");
        hpFill.className = "hp-fill";
        hpFill.style.width = `${Math.round(getHpRatio(ent) * 100)}%`;

        const hpText = document.createElement("div");
        hpText.className = "hp-text";
        const hpVal = Math.max(0, Math.round(Number.isFinite(ent.hp) ? ent.hp : HP_MAX));
        const hpMax = Math.max(1, Math.round(Number.isFinite(ent.maxHp) ? ent.maxHp : HP_MAX));
        hpText.textContent = `HP ${hpVal}/${hpMax}`;

        hpBar.appendChild(hpFill);
        hpWrap.appendChild(hpBar);
        hpWrap.appendChild(hpText);
        row.appendChild(hpWrap);
      }

      const actions = document.createElement("div");
      actions.className = "entity-actions";

      if (ent.kind !== "item") {
        const setPlayerBtn = document.createElement("button");
        setPlayerBtn.className = "op";
        setPlayerBtn.type = "button";
        setPlayerBtn.textContent = state.player && ent.id === state.player.id ? "操作中" : "操作";
        setPlayerBtn.dataset.action = "set-player";
        setPlayerBtn.dataset.id = String(ent.id);
        actions.appendChild(setPlayerBtn);

        if (getCharacterState(ent) === "spectator") {
          const reviveBtn = document.createElement("button");
          reviveBtn.className = "op revive";
          reviveBtn.type = "button";
          reviveBtn.textContent = "観戦解除";
          reviveBtn.dataset.action = "revive";
          reviveBtn.dataset.id = String(ent.id);
          actions.appendChild(reviveBtn);
        }
      }

      const del = document.createElement("button");
      del.className = "op del";
      del.type = "button";
      del.textContent = "削除";
      del.dataset.action = "delete";
      del.dataset.id = String(ent.id);
      actions.appendChild(del);
      row.appendChild(actions);

      entityList.appendChild(row);
    });

    state.ui.panelDirty = false;
    state.ui.panelStage = state.currentStageIndex;
  }
  function updateCamera() {
    const stage = getCurrentStage();
    if (!stage) return;

    const view = getViewTransform();
    const viewW = canvas.width / Math.max(0.0001, view.zoom);

    if (!state.player) {
      state.camera.x = stage.x;
      state.camera.y = 0;
      return;
    }

    if (isMobilePortraitView() || isMobileLandscapeView()) {
      const minCamX = stage.x;
      const maxCamX = Math.max(stage.x, stage.x + stage.width - viewW);
      const targetX = clamp(state.player.x - viewW * 0.5, minCamX, maxCamX);
      const smooth = isMobileLandscapeView() ? 0.1 : 0.12;
      state.camera.x += (targetX - state.camera.x) * smooth;
      if (Math.abs(targetX - state.camera.x) < 0.35) state.camera.x = targetX;
      state.camera.y = 0;
      return;
    }

    state.camera.x = stage.x;
    state.camera.y = 0;
  }


  function syncEntityPanelToPngEdge() {
    if (!entityPanel || !gameWrap) return;
    const stage = getCurrentStage();
    if (!stage) return;

    const wrapRect = gameWrap.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();
    const cssPerCanvasX = canvasRect.width / Math.max(1, canvas.width);
    const cssPerCanvasY = canvasRect.height / Math.max(1, canvas.height);
    const view = getViewTransform();
    const stageCssWidth = stage.width * view.zoom * cssPerCanvasX;
    const stageCssHeight = stage.height * view.zoom * cssPerCanvasY;
    const stageCssLeft = (stage.x - state.camera.x) * view.zoom * cssPerCanvasX + view.offsetX * cssPerCanvasX;
    const edgeX = wrapRect.left + stageCssLeft + stageCssWidth;
    const left = Math.max(0, Math.min(window.innerWidth, edgeX));
    const width = Math.max(0, window.innerWidth - left);

    entityPanel.style.left = `${left}px`;
    entityPanel.style.width = `${width}px`;
    document.body.classList.toggle("use-action-overlay", width < 240);

    const navPad = 8;
    const navW = 48;
    const navH = 42;
    const mobilePortrait = isMobilePortraitView();
    const mobileOverlay = document.getElementById("mobileActionOverlay");
    let navTop = Math.max(navPad, stageCssHeight - navH - navPad - 100);
    if (mobilePortrait) {
      const overlayTop = mobileOverlay ? (mobileOverlay.getBoundingClientRect().top - wrapRect.top) : canvasRect.height;
      navTop = Math.max(navPad, overlayTop - navH - 10);
    }

    navLeft.style.bottom = "auto";
    navRight.style.bottom = "auto";
    navLeft.style.top = `${Math.round(navTop)}px`;
    navRight.style.top = `${Math.round(navTop)}px`;
    navLeft.style.zIndex = "12";
    navRight.style.zIndex = "12";

    if (mobilePortrait) {
      navLeft.style.left = `${navPad}px`;
      navRight.style.left = "auto";
      navRight.style.right = `${navPad}px`;
    } else {
      navLeft.style.left = `${navPad}px`;
      navRight.style.left = `${Math.max(navPad, Math.round(stageCssWidth - navW - navPad))}px`;
      navRight.style.right = "auto";
    }
  }
  function buildStageSelector() {
    if (!stageSelector) return;
    stageSelector.innerHTML = "";
    state.stages.forEach((s, i) => {
      const opt = document.createElement("option");
      const label = STAGE_SELECT_NAMES[i] || String(s.bg || `stage-${i + 1}`).replace(/\.png$/i, "");
      opt.value = String(i);
      opt.textContent = `${i + 1}: ${label}`;
      stageSelector.appendChild(opt);
    });
  }

  function syncStageSelector() {
    if (!stageSelector) return;
    const v = String(state.currentStageIndex);
    if (stageSelector.value !== v) stageSelector.value = v;
  }

  function movePlayerToStage(targetIndex) {
    if (!state.player) return;
    if (!Number.isFinite(targetIndex)) return;
    const nextIndex = Math.max(0, Math.min(state.stages.length - 1, targetIndex));

    const p = state.player;
    const oldIndex = p.stageIndex;
    if (nextIndex === oldIndex) {
      state.currentStageIndex = nextIndex;
      syncStageSelector();
      return;
    }

    const oldStage = stageOf(oldIndex);
    const old = { x: p.x, y: p.y, vx: p.vx, vy: p.vy, stageIndex: p.stageIndex };
    const localRatio = oldStage ? clamp((p.x - oldStage.x) / Math.max(1, oldStage.width), 0.05, 0.95) : 0.5;

    p.stageIndex = nextIndex;
    state.currentStageIndex = nextIndex;

    const targetStage = stageOf(nextIndex);
    const margin = p.w * 0.6;
    const targetX = clamp(targetStage.x + targetStage.width * localRatio, targetStage.x + margin, targetStage.x + targetStage.width - margin);

    if (!placeEntitySafely(p, targetX)) {
      p.x = old.x;
      p.y = old.y;
      p.vx = old.vx;
      p.vy = old.vy;
      p.stageIndex = old.stageIndex;
      state.currentStageIndex = oldIndex;
    } else {
      p.vx = 0;
      p.vy = 0;
    }

    updateCamera();
    updateStageNav();
    syncStageSelector();
    syncEntityPanelToPngEdge();
    state.ui.panelDirty = true;
  }

  function canMoveByEdge(fromIndex, toIndex) {
    if (!Number.isFinite(fromIndex) || !Number.isFinite(toIndex)) return false;
    if (toIndex < 0 || toIndex >= state.stages.length) return false;
    if (fromIndex === ARENA_STAGE_INDEX || toIndex === ARENA_STAGE_INDEX) return false;
    return Math.abs(toIndex - fromIndex) === 1;
  }
  function updateStageNav() {
    if (!state.player) return;
    const stage = getCurrentStage();
    if (!stage) return;

    const localX = state.player.x - stage.x;
    const hasLeft = canMoveByEdge(state.currentStageIndex, state.currentStageIndex - 1);
    const hasRight = canMoveByEdge(state.currentStageIndex, state.currentStageIndex + 1);

    navLeft.classList.toggle("show", hasLeft && localX <= EDGE_ICON_MARGIN);
    navRight.classList.toggle("show", hasRight && localX >= stage.width - EDGE_ICON_MARGIN);
  }

  function moveToAdjacentStage(dir) {
    if (!state.player) return;

    const oldIndex = state.currentStageIndex;
    const nextIndex = oldIndex + dir;
    if (!canMoveByEdge(oldIndex, nextIndex)) return;

    const p = state.player;
    const old = { x: p.x, y: p.y, vx: p.vx, vy: p.vy, stageIndex: p.stageIndex };

    p.stageIndex = nextIndex;
    state.currentStageIndex = nextIndex;

    const targetStage = stageOf(nextIndex);
    const margin = p.w * 0.6;
    const targetX = dir > 0
      ? targetStage.x + margin
      : targetStage.x + targetStage.width - margin;

    if (!placeEntitySafely(p, targetX)) {
      p.x = old.x;
      p.y = old.y;
      p.vx = old.vx;
      p.vy = old.vy;
      p.stageIndex = old.stageIndex;
      state.currentStageIndex = oldIndex;
    } else {
      p.vx = 0;
      p.vy = 0;
    }

    updateCamera();
    updateStageNav();
    syncStageSelector();
    syncEntityPanelToPngEdge();
    state.ui.panelDirty = true;
  }

  function pointOnEntity(ent, wx, wy) {
    const halfW = ent.kind === "item" ? ent.w * 0.5 : getCollisionHalfWidth(ent);
    const colH = ent.kind === "item" ? ent.h : getCollisionHeight(ent);
    return wx >= ent.x - halfW && wx <= ent.x + halfW && wy >= ent.y - colH && wy <= ent.y;
  }

  function pickEntityAt(wx, wy) {
    const list = getEntitiesInStage(state.currentStageIndex);
    const order = list.slice().sort((a, b) => a.y - b.y);

    for (let i = order.length - 1; i >= 0; i -= 1) {
      const ent = order[i];
      if (ent.kind === "item" && (ent.carriedById || ent.eatingById)) continue;
      if (pointOnEntity(ent, wx, wy)) return ent;
    }
    return null;
  }

  function startDrag(e) {
    if (e.button !== 0) return;
    const world = worldFromOffset(e.offsetX, e.offsetY);
    const ent = pickEntityAt(world.x, world.y);
    if (!ent) return;
    markItemUserTouched(ent, performance.now());

    const d = state.drag;
    d.active = true;
    d.pointerId = e.pointerId;
    d.entityId = ent.id;
    d.grabOffsetX = world.x - ent.x;
    d.grabOffsetY = world.y - ent.y;
    d.prevClientX = e.clientX;
    d.prevClientY = e.clientY;
    d.downX = ent.x;
    d.downY = ent.y;
    d.bestX = ent.x;
    d.bestY = ent.y;
    d.hasBest = !collidesForNormal(ent, ent.x, ent.y);
    d.faceOnly = false;
    d.groundOnly = false;

    const controlled = getControlledActor();
    if (state.currentStageIndex === ARENA_STAGE_INDEX && ent.kind !== "item" && controlled && ent.id === controlled.id) {
      d.groundOnly = true;
      if (!hasGroundSupportAt(ent, ent.x, ent.y)) {
        d.active = false;
        d.pointerId = null;
        d.entityId = null;
        d.groundOnly = false;
        return;
      }
    }

    if (state.currentStageIndex === ARENA_STAGE_INDEX) {
      if (ent.kind !== "item") {
        if (!(controlled && ent.id === controlled.id)) {
          ent.facing = world.x >= ent.x ? 1 : -1;
          d.faceOnly = true;
        }
      } else {
        d.active = false;
        d.pointerId = null;
        d.entityId = null;
        return;
      }
    }


    ent.vx = 0;
    ent.vy = 0;
    ent.wrot *= 0.5;
    canvas.setPointerCapture(e.pointerId);
  }

  function moveDrag(e) {
    const d = state.drag;
    if (!d.active || d.pointerId !== e.pointerId) return;

    const ent = getEntityById(d.entityId);
    if (!ent) return;
    markItemUserTouched(ent, performance.now());

    const world = worldFromOffset(e.offsetX, e.offsetY);
    if (d.faceOnly) {
      if (ent.kind !== "item") ent.facing = world.x >= ent.x ? 1 : -1;
      d.prevClientX = e.clientX;
      d.prevClientY = e.clientY;
      return;
    }

    const desiredX = world.x - d.grabOffsetX;
    const desiredY = world.y - d.grabOffsetY;

    const smooth = state.currentStageIndex === ARENA_STAGE_INDEX ? 0.01 : 0.28;
    const nx = ent.x + (desiredX - ent.x) * smooth;
    const ny = d.groundOnly ? ent.y : (ent.y + (desiredY - ent.y) * smooth);

    const px = ent.x;
    const py = ent.y;
    if (applyMoveCandidate(ent, nx, ny, true) && !collidesForNormal(ent, ent.x, ent.y)) {
      if (d.groundOnly && !hasGroundSupportAt(ent, ent.x, ent.y)) {
        if (!snapDownToGround(ent, Math.max(26, Math.min(72, Math.round(ent.h * 1.1))))) {
          ent.x = px;
          ent.y = py;
        }
      }
      if (!d.groundOnly || hasGroundSupportAt(ent, ent.x, ent.y)) {
        d.bestX = ent.x;
        d.bestY = ent.y;
        d.hasBest = true;
      }
    } else {
      const dragDx = nx - px;
      if (Math.abs(dragDx) > 0.1 && tryStepUpMove(ent, dragDx, Math.max(26, Math.min(52, Math.round(ent.h * 0.72))))) {
        if (d.groundOnly && !hasGroundSupportAt(ent, ent.x, ent.y)) {
          if (!snapDownToGround(ent, Math.max(26, Math.min(72, Math.round(ent.h * 1.1))))) {
            ent.x = px;
            ent.y = py;
          }
        }
        if (!d.groundOnly || hasGroundSupportAt(ent, ent.x, ent.y)) {
          d.bestX = ent.x;
          d.bestY = ent.y;
          d.hasBest = true;
        }
      }
    }

    const dx = ent.x - px;
    const dy = ent.y - py;
    ent.vx = 0;
    ent.vy = 0;

    if (ent.kind !== "item") {
      if (dx > 0.25) ent.facing = 1;
      if (dx < -0.25) ent.facing = -1;
    }

    ent.wrot *= 0.5;
    ent.wrot += clamp(dx * 0.0025 + dy * 0.0008, -0.06, 0.06);
    d.prevClientX = e.clientX;
    d.prevClientY = e.clientY;
  }

  function finishDrag(e) {
    const d = state.drag;
    if (!d.active || d.pointerId !== e.pointerId) return;

    const ent = getEntityById(d.entityId);
    const faceOnly = !!d.faceOnly;
    d.active = false;
    d.pointerId = null;
    d.entityId = null;
    d.faceOnly = false;
    d.groundOnly = false;

    if (ent) {
      if (!faceOnly && collidesForNormal(ent, ent.x, ent.y)) {
        if (d.hasBest) {
          ent.x = d.bestX;
          ent.y = d.bestY;
        } else {
          ent.x = d.downX;
          ent.y = d.downY;
        }
      }
      ent.vx = 0;
      ent.vy = 0;
      ent.wrot *= 0.5;
    }

    if (canvas.hasPointerCapture(e.pointerId)) {
      canvas.releasePointerCapture(e.pointerId);
    }
  }

  function cancelDrag(e) {
    const d = state.drag;
    if (!d.active || d.pointerId !== e.pointerId) return;

    const ent = getEntityById(d.entityId);
    const faceOnly = !!d.faceOnly;
    d.active = false;
    d.pointerId = null;
    d.entityId = null;
    d.faceOnly = false;
    d.groundOnly = false;

    if (ent && !faceOnly) {
      ent.x = d.downX;
      ent.y = d.downY;
      ent.vx = 0;
      ent.vy = 0;
      ent.wrot *= 0.5;
    }

    if (canvas.hasPointerCapture(e.pointerId)) {
      canvas.releasePointerCapture(e.pointerId);
    }
  }

  function drawWorld() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawFarBackground();
    const stage = getCurrentStage();
    if (!stage) return;
    const view = getViewTransform();
    const drawX = Math.round((stage.x - state.camera.x) * view.zoom + view.offsetX);
    const drawY = Math.round((0 - state.camera.y) * view.zoom + view.offsetY);
    const drawW = Math.round(stage.width * view.zoom);
    const drawH = Math.round(stage.height * view.zoom);
    const tileCanvas = document.createElement("canvas");
    tileCanvas.width = 128;
    tileCanvas.height = 64;
    const tctx = tileCanvas.getContext("2d");
    if (tctx) {
      const g = tctx.createLinearGradient(0, 0, 0, tileCanvas.height);
      g.addColorStop(0, "#1b2437");
      g.addColorStop(1, "#121a2b");
      tctx.fillStyle = g;
      tctx.fillRect(0, 0, tileCanvas.width, tileCanvas.height);
      tctx.strokeStyle = "rgba(150, 196, 255, 0.18)";
      tctx.lineWidth = 1;
      tctx.strokeRect(0.5, 0.5, tileCanvas.width - 1, tileCanvas.height - 1);
      tctx.strokeStyle = "rgba(140, 188, 246, 0.10)";
      tctx.lineWidth = 1;
      for (let y = 16; y < tileCanvas.height; y += 16) {
        tctx.beginPath();
        tctx.moveTo(0, y + 0.5);
        tctx.lineTo(tileCanvas.width, y + 0.5);
        tctx.stroke();
      }
      tctx.strokeStyle = "rgba(120, 170, 228, 0.08)";
      for (let x = 32; x < tileCanvas.width; x += 32) {
        tctx.beginPath();
        tctx.moveTo(x + 0.5, 0);
        tctx.lineTo(x + 0.5, tileCanvas.height);
        tctx.stroke();
      }
    }
    let pattern = null;
    try {
      pattern = ctx.createPattern(tileCanvas, "repeat");
    } catch (err) {
      pattern = null;
      console.warn("[drawWorld] createPattern failed:", err);
    }

    const stageLeft = drawX;
    const stageTop = drawY;
    const stageRight = drawX + drawW;
    const stageBottom = drawY + drawH;
    ctx.save();
    ctx.fillStyle = pattern || "#16223a";
    if (stageRight <= 0 || stageLeft >= canvas.width || stageBottom <= 0 || stageTop >= canvas.height) {
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      if (stageTop > 0) ctx.fillRect(0, 0, canvas.width, stageTop);
      if (stageBottom < canvas.height) ctx.fillRect(0, stageBottom, canvas.width, canvas.height - stageBottom);
      const midTop = Math.max(0, stageTop);
      const midBottom = Math.min(canvas.height, stageBottom);
      const midH = Math.max(0, midBottom - midTop);
      if (midH > 0) {
        if (stageLeft > 0) ctx.fillRect(0, midTop, stageLeft, midH);
        if (stageRight < canvas.width) ctx.fillRect(stageRight, midTop, canvas.width - stageRight, midH);
      }
    }
    ctx.restore();
    ctx.drawImage(stage.bg, drawX, drawY, drawW, drawH);
  }

  function drawEntity(ent, nowMs) {
    if (!ent || !ent.img) return;
    const view = getViewTransform();
    const x = (ent.x - state.camera.x) * view.zoom + view.offsetX;
    const y = (ent.y - state.camera.y) * view.zoom + view.offsetY;
    const drawW = ent.w * view.zoom;
    const drawH = ent.h * view.zoom;
    const rolling = ent.roll && ent.roll.active;
    const pendulum = !rolling && ent.grounded && (Math.abs(ent.rot) > 0.04 || Math.abs(ent.wrot) > 0.02);
    const velocitySquash = clamp((ent.vy / 1400) * 0.18, -0.2, 0.22);
    const idlePuni = (ent.grounded && Math.abs(ent.vx) + Math.abs(ent.vy) < 12)
      ? 0.01 * Math.sin(ent.animTime * 2.1 + ent.id * 0.4)
      : 0;
    const wobble = 0.006 * Math.sin((nowMs - ent.born) / 190 + ent.w * 0.5);
    const dragPush = (state.drag.active && state.drag.entityId === ent.id) ? 0.05 : 0;
    const eatingPulse = (ent.eatUntil && nowMs < ent.eatUntil) ? Math.sin((nowMs - ent.eatStartAt) / 85) : 0;
    let sx = 1 - velocitySquash + wobble + idlePuni + dragPush + ent.landPulse * 0.04 - eatingPulse * 0.05;
    let sy = 1 + velocitySquash - wobble - idlePuni - dragPush - ent.landPulse * 0.04 + eatingPulse * 0.05;
    const volumeComp = Math.sqrt(Math.max(0.62, sx * sy));
    sx = clamp(sx / volumeComp, 0.84, 1.2);
    sy = clamp(sy / volumeComp, 0.82, 1.22);
    if (pendulum && ent.kind !== "item") { sx = 1; sy = 1; }
    const pivotY = rolling ? (y - drawH * 0.5) : y;
    const spriteY = rolling ? (-drawH * 0.5) : (-drawH);
    const characterState = getCharacterState(ent);
    ctx.save();
    ctx.translate(x, pivotY);
    ctx.rotate((ent.rot || 0) * 0.25);
    const shouldMirror = ent.kind !== "item" && ent.facing > 0;
    if (shouldMirror) ctx.scale(-sx, sy); else ctx.scale(sx, sy);

    if (characterState === "spectator") {
      ctx.globalAlpha = 0.45;
      ctx.filter = "grayscale(0.35)";
    } else if (characterState === "danger") {
      ctx.filter = "sepia(0.58) saturate(1.95) hue-rotate(-18deg) brightness(1.04)";
    }

    ctx.drawImage(ent.img, ent.sprite.sx, ent.sprite.sy, ent.sprite.sw, ent.sprite.sh, -drawW * 0.5, spriteY, drawW, drawH);
    ctx.restore();
  }

  function drawEntityHpLabel(ent) {
    if (!ent || ent.kind === "item") return;
    const view = getViewTransform();
    const x = (ent.x - state.camera.x) * view.zoom + view.offsetX;
    const y = (ent.y - state.camera.y) * view.zoom + view.offsetY;
    const boxW = clamp(ent.w * 0.8 * view.zoom, 34, 72);
    const boxH = clamp(8 * view.zoom, 6, 10);
    const boxX = x - boxW * 0.5;
    const boxY = y + 4 * view.zoom;
    const hpRatio = getHpRatio(ent);
    const hp = Math.max(0, Math.round(Number.isFinite(ent.hp) ? ent.hp : HP_MAX));
    const stateName = getCharacterState(ent);

    ctx.save();
    ctx.fillStyle = "rgba(8, 14, 28, 0.72)";
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.fillStyle = stateName === "spectator" ? "rgba(160, 178, 206, 0.9)" : (stateName === "danger" ? "#ff6161" : "#57cf7c");
    ctx.fillRect(boxX, boxY, boxW * hpRatio, boxH);
    ctx.strokeStyle = "rgba(190, 220, 255, 0.5)";
    ctx.lineWidth = 1;
    ctx.strokeRect(boxX + 0.5, boxY + 0.5, boxW - 1, boxH - 1);
    ctx.fillStyle = "#ecf4ff";
    ctx.font = `${Math.max(10, Math.round(10 * view.zoom))}px "Segoe UI", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(stateName === "spectator" ? "観戦" : `${hp}`, x, boxY + boxH + 2);
    ctx.restore();
  }

  function drawEntities(nowMs) {
    const view = getViewTransform();
    const list = getEntitiesInStage(state.currentStageIndex)
      .slice()
      .sort((a, b) => a.y - b.y);

    list.forEach((ent) => {
      if (ent.kind === "item" && (ent.carriedById || ent.eatingById)) return;
      drawEntity(ent, nowMs);
    });

    // 食べ演出: 食GIFを食べ物の裏に描き、食べ物もぷにアニメで揺らす
    list.forEach((item) => {
      if (item.kind !== "item" || !item.eatingById) return;
      const actor = getEntityById(item.eatingById);
      if (!actor) return;

      const t = clamp((nowMs - actor.eatStartAt) / Math.max(1, actor.eatUntil - actor.eatStartAt), 0, 1);
      const bob = Math.sin((nowMs - actor.eatStartAt) / 90) * (item.h * 0.08);

      const ix = (actor.x - state.camera.x + (actor.facing > 0 ? actor.w * 0.18 : -actor.w * 0.18)) * view.zoom + view.offsetX;
      const iy = (actor.y - state.camera.y - actor.h * 0.62 + bob) * view.zoom + view.offsetY;

      if (state.speech.eatFxImg) {
        const fxW = item.w * 2.0 * view.zoom;
        const fxH = fxW * (state.speech.eatFxImg.naturalHeight / Math.max(1, state.speech.eatFxImg.naturalWidth));
        ctx.save();
        ctx.globalAlpha = 0.78 * (1 - t * 0.25);
        ctx.drawImage(state.speech.eatFxImg, ix - fxW * 0.5, iy - fxH * 0.55, fxW, fxH);
        ctx.restore();
      }

      const pulse = 1 + Math.sin((nowMs - actor.eatStartAt) / 80) * 0.08;
      ctx.save();
      ctx.translate(ix, iy);
      ctx.scale(pulse, 1 / pulse);
      ctx.drawImage(
        item.img,
        item.sprite.sx,
        item.sprite.sy,
        item.sprite.sw,
        item.sprite.sh,
        -item.w * 0.5 * view.zoom,
        -item.h * view.zoom,
        item.w * view.zoom,
        item.h * view.zoom
      );
      ctx.restore();
    });

    list.forEach((ent) => {
      if (ent.kind === "item" && ent.carriedById) drawEntity(ent, nowMs);
    });

    list.forEach((ent) => {
      if (ent.kind !== "item") drawEntityHpLabel(ent);
    });
  }
  function drawComboIndicators(nowMs) {
    const chars = getCharactersInStage(state.currentStageIndex);
    if (!chars || !chars.length) return;
    const view = getViewTransform();

    chars.forEach((ent) => {
      if (!ent || ent.kind === "item") return;
      updateComboState(ent, nowMs);

      const combo = Number.isFinite(ent.comboCount) ? ent.comboCount : 0;
      const showCombo = combo >= 2 && nowMs <= (Number.isFinite(ent.comboDisplayUntil) ? ent.comboDisplayUntil : 0);
      const showCrit = nowMs <= (Number.isFinite(ent.comboCritUntil) ? ent.comboCritUntil : 0);
      if (!showCombo && !showCrit) return;

      const x = (ent.x - state.camera.x) * view.zoom + view.offsetX;
      const y = (ent.y - state.camera.y) * view.zoom + view.offsetY - ent.h * view.zoom - 22;

      ctx.save();
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      if (showCombo) {
        const pulse = 1 + Math.sin(nowMs / 90) * 0.06;
        ctx.font = `${Math.round(16 * view.zoom * pulse)}px "Segoe UI", sans-serif`;
        ctx.fillStyle = "rgba(255, 220, 120, 0.98)";
        ctx.strokeStyle = "rgba(10, 24, 48, 0.95)";
        ctx.lineWidth = 4;
        const txt = `${combo} COMBO`;
        ctx.strokeText(txt, x, y);
        ctx.fillText(txt, x, y);
      }
      if (showCrit) {
        ctx.font = `${Math.round(13 * view.zoom)}px "Segoe UI", sans-serif`;
        ctx.fillStyle = "rgba(255, 110, 110, 0.98)";
        ctx.strokeStyle = "rgba(28, 8, 8, 0.95)";
        ctx.lineWidth = 3;
        ctx.strokeText("CRITICAL!", x, y - 18 * view.zoom);
        ctx.fillText("CRITICAL!", x, y - 18 * view.zoom);
      }
      ctx.restore();
    });
  }
  function drawDragGuide() {
    const d = state.drag;
    if (!d.active) return;
    const ent = getEntityById(d.entityId);
    if (!ent) return;
    markItemUserTouched(ent, performance.now());
    const view = getViewTransform();
    const sx = (d.downX - state.camera.x) * view.zoom + view.offsetX;
    const sy = (d.downY - ent.h * 0.5 - state.camera.y) * view.zoom + view.offsetY;
    const ex = (ent.x - state.camera.x) * view.zoom + view.offsetX;
    const ey = (ent.y - ent.h * 0.5 - state.camera.y) * view.zoom + view.offsetY;
    ctx.save();
    ctx.strokeStyle = "rgba(120, 220, 255, 0.95)";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(ex, ey);
    ctx.stroke();
    ctx.restore();
  }


  function updateActionCooldownUi(nowMs) {
    const actor = getControlledActor();
    const buttons = document.querySelectorAll(".action-trigger");
    if (!buttons.length) return;

    buttons.forEach((btn) => {
      const action = btn.dataset.action;
      const until = actor && actor.actionCooldownUntil ? (actor.actionCooldownUntil[action] || 0) : 0;
      const remain = Math.max(0, until - nowMs);
      if (remain > 0) {
        btn.classList.add("cooldown");
        btn.dataset.cd = `CD ${(remain / 1000).toFixed(1)}s`;
      } else {
        btn.classList.remove("cooldown");
        delete btn.dataset.cd;
      }
    });
  }
  function updateHud() {
    // デバッグHUD文言は非表示運用
  }

  function tick(now) {
    try {
      if (!state.ready) return;

      const dt = Math.min(0.033, Math.max(0.001, (now - state.lastTime) / 1000));
      state.lastTime = now;

      updateFarBackground(now, dt);
      getAllEntities().forEach((ent) => updateCombatActionForActor(ent, dt));
      updateThrownKnifeAttacks(dt);
      updateCombatEffects(dt);
      getAllEntities().forEach((ent) => {
        updateEntityPhysics(ent, dt);
        updateEntityAnim(ent, dt);
      });

      updateCarriedItems();
      updateEating(now);
      updateIdleItemsLifecycle(now);
      state.currentStageIndex = state.player ? state.player.stageIndex : 0;
      updateCamera();
      updateStageNav();
      syncStageSelector();
      syncEntityPanelToPngEdge();

      tryAutoSpeak(now);
      tryContactConversation(now);
      updateDialogueQueue(now);
      runAutoBehavior(now);
      drawWorld();
      drawEntities(now);
      drawSpeechBubble(now);
      drawDragGuide();
      drawCombatEffects();
      drawComboIndicators(now);
      updateActionCooldownUi(now);
      updateHud();
      if (state.ui.panelDirty || state.ui.panelStage !== state.currentStageIndex) renderEntityPanel();
    } catch (err) {
      console.error("[tick] runtime error:", err);
    } finally {
      requestAnimationFrame(tick);
    }
  }

  async function init() {
    resizeCanvas();

    await Promise.all([
        loadWorld(),
        loadFarBackgrounds(),
        loadSpeechAssets()
      ]);

    state.player = await createEntity(
      "player",
      0,
      state.selectedCharacter,
      CHARACTER_FILES.get(state.selectedCharacter),
      PUNI_BASE,
      CHAR_BASE_H
    );

    placeEntitySafely(state.player, stageOf(0).x + Math.max(150, state.player.w));
    state.currentStageIndex = 0;

    buildSidebar();
    buildStageSelector();
    syncStageSelector();
    renderEntityPanel();
    renderSpeechLogs();
    state.lastTime = performance.now();
    state.farBg.lastSwitchAt = state.lastTime;

    updateCamera();
    updateStageNav();
    syncStageSelector();
    syncEntityPanelToPngEdge();
    state.ui.panelDirty = true;

    setupStartSelectors();
    setStartMode("play");
    if (modePlayBtn) modePlayBtn.addEventListener("click", () => setStartMode("play"));
    if (modeStadiumBtn) modeStadiumBtn.addEventListener("click", () => setStartMode("stadium"));
    if (startGameBtn) {
      startGameBtn.addEventListener("click", () => {
        beginFromStartScreen().catch((err) => {
          console.error(err);
          hud.textContent = `開始エラー: ${err.message}`;
        });
      });
    }
  }

  window.addEventListener("resize", () => {
    closeMobileSidebars();
    resizeCanvas();
    updateCamera();
    updateStageNav();
    syncStageSelector();
    syncEntityPanelToPngEdge();
    state.ui.panelDirty = true;
  });
  canvas.addEventListener("pointerdown", startDrag);
  canvas.addEventListener("pointermove", moveDrag);
  canvas.addEventListener("pointerup", finishDrag);
  canvas.addEventListener("pointercancel", cancelDrag);
  canvas.addEventListener("contextmenu", (e) => e.preventDefault());
  navLeft.addEventListener("click", () => moveToAdjacentStage(-1));
  navRight.addEventListener("click", () => moveToAdjacentStage(1));
  if (stageSelector) stageSelector.addEventListener("change", (e) => {
    movePlayerToStage(Number(e.target.value));
  });
  if (entityPanel) entityPanel.addEventListener("click", onEntityPanelClick);
  document.addEventListener("click", onActionButtonClick);
  if (toggleLeftSidebar) toggleLeftSidebar.addEventListener("click", () => {
    document.body.classList.toggle("show-left-sidebar");
    document.body.classList.remove("show-right-sidebar");
  });
  if (toggleRightSidebar) toggleRightSidebar.addEventListener("click", () => {
    document.body.classList.toggle("show-right-sidebar");
    document.body.classList.remove("show-left-sidebar");
  });
  canvas.addEventListener("pointerdown", () => closeMobileSidebars());
  if (combatHelpBtn) combatHelpBtn.addEventListener("click", () => setCombatHelpOpen(combatHelpBox ? combatHelpBox.hidden : true));
  if (combatHelpClose) combatHelpClose.addEventListener("click", () => setCombatHelpOpen(false));

  init().catch((err) => {
    console.error(err);
    hud.textContent = `初期化エラー: ${err.message}`;
  });
})();
































































































































































































































