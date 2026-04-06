
(() => {
  "use strict";

  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const statusText = document.getElementById("statusText");

  const FPS = 60;
  const DT = 1 / FPS;
  const UI_RATIO = 0.2;
  const GROUND_THICKNESS = 16;

  const MOVE = {
    groundMaxSpeed: 330,
    groundAcceleration: 2600,
    groundDeceleration: 2200,
    turnDeceleration: 4200,

    airMaxSpeed: 250,
    airAcceleration: 1150,
    airDeceleration: 800,
    airTurnDeceleration: 1500,

    jumpInitialVelocity: 760,
    jumpHoldFrames: 12,
    jumpCutMultiplier: 0.5,

    gravity: 1900,
    gravityAscendMultiplier: 0.88,
    gravityDescendMultiplier: 1.28,
    maxFallSpeed: 980,

    coyoteFrames: 6,

    dashSpeed: 650,
    dashDurationFrames: 126,
    dashEndLagFrames: 7,
    dashInvincibleFrames: 6,
    dashDistance: 140,
    dashJumpInertiaFrames: 42,
    hitstopOnHitFrames: 4
  };

  const INPUT_CFG = {
    bufferFrames: {
      attack: 7,
      jump: 7,
      dash: 7
    },
    directionMemoryFrames: 4,
    holdThresholdFrames: {
      attackPrimary: 18,
      attackSecondary: 22
    }
  };

  const CHARGE_CFG = {
    lv2Frames: 24,
    lv3Frames: 54,
    baseDamage: 8,
    breakFrames: 36,
    breakDamageScale: 1.3
  };

  const PRIORITY = {
    Hurt: 600,
    Attack: 500,
    Dash: 400,
    Jump: 300,
    Fall: 300,
    Run: 200,
    Idle: 100
  };

  const characters = {
    akau: {
      name: "アカウ",
      imagePath: "../assets/images/アカウ.png",
      weaponKey: "pureKnife",
      width: 92,
      height: 92,
      groundOffset: 10
    }
  };

  const weapons = {
    pureKnife: {
      name: "純白のナイフ",
      imagePath: "./image/純白のナイフ.png",
      width: 88,
      height: 28
    }
  };

  const backgroundPaths = [
    "./image/KL_01.png",
    "./image/KL_02.png",
    "./image/KL_03.png",
    "./image/KL_04.png",
    "./image/HL_01.png",
    "./image/HL_02.png",
    "./image/HL_03.png",
    "./image/HL_04.png"
  ];

  const attackCatalog = {
    neutral: [
      { label: "ニュートラル1", total: 26, lock: 18, combo: { onHit: { s: 10, e: 20 }, onWhiff: { s: 14, e: 22 } } },
      { label: "ニュートラル2", total: 28, lock: 20, combo: { onHit: { s: 11, e: 22 }, onWhiff: { s: 15, e: 24 } } }
    ],
    forward: [
      { label: "前攻撃1", total: 30, lock: 22, combo: { onHit: { s: 12, e: 22 }, onWhiff: { s: 16, e: 24 } } }
    ],
    up: [
      { label: "上攻撃", total: 31, lock: 23, combo: { onHit: { s: 12, e: 22 }, onWhiff: { s: 16, e: 24 } } }
    ],
    airDown: [
      { label: "空中下攻撃", total: 33, lock: 24, combo: { onHit: { s: 10, e: 20 }, onWhiff: { s: 14, e: 23 } } }
    ],
    dash: [
      { label: "ダッシュ攻撃", total: 29, lock: 20, combo: { onHit: { s: 11, e: 20 }, onWhiff: { s: 14, e: 22 } } }
    ]
  };

  const attackHitboxes = {
    neutral: { ox: 52, oy: -50, w: 72, h: 44, a0: 7, a1: 16 },
    forward: { ox: 64, oy: -48, w: 84, h: 42, a0: 8, a1: 18 },
    up: { ox: 20, oy: -82, w: 56, h: 56, a0: 8, a1: 17 },
    airDown: { ox: 14, oy: -24, w: 62, h: 58, a0: 7, a1: 17 },
    dash: { ox: 66, oy: -46, w: 88, h: 44, a0: 5, a1: 14 }
  };

  const runtime = {
    backgrounds: [],
    charImg: null,
    weaponImg: null,
    targets: [],
    combatEntities: [],
    hitLogs: [],
    debugDraw: {
      hitBox: true,
      hurtBox: true
    },
    screenShakeFrames: 0,
    screenShakePower: 0
  };

  const world = {
    width: 0,
    height: 0,
    worldHeight: 0
  };

  function makeButton() {
    return { down: false, pressed: false, released: false, hold: 0, lastHold: 0 };
  }

  const input = {
    frame: 0,
    queue: [],
    nextId: 1,
    directionHistory: [],
    buffer: [],
    physical: {
      KeyW: false,
      KeyA: false,
      KeyS: false,
      KeyD: false,
      Space: false,
      ShiftLeft: false,
      ShiftRight: false,
      KeyQ: false,
      KeyE: false,
      KeyR: false,
      KeyH: false,
      Mouse0: false,
      Mouse2: false
    },
    buttons: {
      up: makeButton(),
      left: makeButton(),
      down: makeButton(),
      right: makeButton(),
      jump: makeButton(),
      dash: makeButton(),
      ability: makeButton(),
      special: makeButton(),
      stance: makeButton(),
      debugHurt: makeButton(),
      attackPrimary: makeButton(),
      attackSecondary: makeButton()
    }
  };

  const player = {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    worldOffset: 0,
    groundY: 0,
    facing: -1,
    look: 0,
    lookTilt: 0,
    walkCycle: 0,
    bounce: 0,

    grounded: false,
    invincible: false,
    canAttack: true,
    canBeHurt: true,

    coyoteLeft: 0,
    jumpHoldLeft: 0,
    dashJumpInertiaLeft: 0,

    mainState: "Idle",
    stateFrames: 0,

    dashData: null,
    attackData: null,
    chargeData: null,
    hurtData: null,
    pendingHurt: null,

    abilityTimer: 0,
    abilityCd: 0,
    hitstopFrames: 0,

    meta: {
      charKey: "akau",
      weaponKey: "pureKnife",
      stance: 0,
      profile: "default"
    },

    lastAction: "待機",

    debug: {
      accepts: "-",
      appliedAccel: 0,
      dashLeft: 0,
      attackPhase: "-",
      attackFrame: 0,
      comboOpen: false,
      cancelOpen: false,
      activeHitBoxes: 0,
      lastHitTargetIds: "-",
      chargeLevel: 0,
      chargeFrames: 0,
      chargeActive: false,
      moveSpeedScale: 1,
      lastHit: false,
      breakApplied: false
    }
  };

  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function easeInOutSine(t) {
    return -(Math.cos(Math.PI * t) - 1) * 0.5;
  }

  function loadImage(path) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`画像読み込み失敗: ${path}`));
      img.src = path;
    });
  }

  function worldToScreenX(worldX) {
    return worldX - player.worldOffset;
  }

  function queueInputEvent(ev) {
    input.queue.push(ev);
  }
  async function loadJsonConfig(path) {
    const res = await fetch(path, { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`設定読込失敗: ${path} (${res.status})`);
    }
    return res.json();
  }

  function replaceObject(target, source) {
    for (const k of Object.keys(target)) delete target[k];
    Object.assign(target, source);
  }

  async function loadAllConfigs() {
    try {
      const [movement, inputCfg, priority, entities, assets, combat] = await Promise.all([
        loadJsonConfig("./config/movement.json"),
        loadJsonConfig("./config/input.json"),
        loadJsonConfig("./config/priority.json"),
        loadJsonConfig("./config/entities.json"),
        loadJsonConfig("./config/assets.json"),
        loadJsonConfig("./config/combat.json")
      ]);

      Object.assign(MOVE, movement || {});

      if (inputCfg && inputCfg.bufferFrames) Object.assign(INPUT_CFG.bufferFrames, inputCfg.bufferFrames);
      if (inputCfg && typeof inputCfg.directionMemoryFrames === "number") INPUT_CFG.directionMemoryFrames = inputCfg.directionMemoryFrames;
      if (inputCfg && inputCfg.holdThresholdFrames) Object.assign(INPUT_CFG.holdThresholdFrames, inputCfg.holdThresholdFrames);

      Object.assign(PRIORITY, priority || {});

      if (entities && entities.characters) replaceObject(characters, entities.characters);
      if (entities && entities.weapons) replaceObject(weapons, entities.weapons);

      if (assets && Array.isArray(assets.backgroundPaths)) {
        backgroundPaths.splice(0, backgroundPaths.length, ...assets.backgroundPaths);
      }

      if (combat && combat.attackCatalog) replaceObject(attackCatalog, combat.attackCatalog);
      if (combat && combat.attackHitboxes) replaceObject(attackHitboxes, combat.attackHitboxes);
    } catch (err) {
      console.warn("config JSONの読込に失敗したため、埋め込み設定を使用します", err);
    }

    if (!characters[player.meta.charKey]) {
      const first = Object.keys(characters)[0];
      if (first) player.meta.charKey = first;
    }

    const ch = characters[player.meta.charKey];
    if (ch && ch.weaponKey) player.meta.weaponKey = ch.weaponKey;
  }

  const HitEventBus = {
    handlers: {},
    on(eventName, handler) {
      if (!this.handlers[eventName]) this.handlers[eventName] = [];
      this.handlers[eventName].push(handler);
    },
    emit(eventName, payload) {
      const list = this.handlers[eventName] || [];
      for (const h of list) {
        try { h(payload); } catch (e) { console.warn("HitEvent handler error", e); }
      }
    }
  };

  function createCombatEntity(data) {
    return {
      id: data.id,
      name: data.name || data.id,
      faction: data.faction || "neutral",
      layer: data.layer || "default",
      worldX: data.worldX || 0,
      y: data.y || 0,
      radius: data.radius || 20,
      invincible: !!data.invincible,
      canBeHit: data.canBeHit !== false,
      hurtBoxes: data.hurtBoxes || [
        { shape: "circle", ox: 0, oy: 0, r: data.radius || 20, layer: data.layer || "default" }
      ],
      hp: typeof data.hp === "number" ? data.hp : 100,
      flash: 0,
      hitStunFrames: 0,
      hitHistory: [],
      breakFrames: 0,
      OnHit: data.OnHit || function OnHit(info) {
        if (this.invincible || !this.canBeHit) return { accepted: false, reason: "invincible" };
        this.hp = Math.max(0, this.hp - (info.damage || 0));
        this.hitStunFrames = Math.max(this.hitStunFrames, info.hitAttribute === "launch" ? 24 : info.hitAttribute === "knockback" ? 16 : 10);
        this.flash = 10;
        if (info.applyBreak) {
          this.breakFrames = Math.max(this.breakFrames || 0, CHARGE_CFG.breakFrames);
        }
        this.hitHistory.push({ frame: input.frame, attack: info.attackType, damage: info.damage, pos: info.hitPosition, breakApplied: !!info.applyBreak, guaranteed: !!info.guaranteed });
        return { accepted: true };
      }
    };
  }

  function resolveEntityHurtShapes(entity) {
    const shapes = [];
    for (const hb of entity.hurtBoxes || []) {
      if (hb.shape === "rect") {
        shapes.push({ shape: "rect", x: worldToScreenX(entity.worldX + (hb.ox || 0)) - (hb.w || 0) * 0.5, y: entity.y + (hb.oy || 0) - (hb.h || 0) * 0.5, w: hb.w || 0, h: hb.h || 0, layer: hb.layer || entity.layer });
      } else if (hb.shape === "sector") {
        shapes.push({ shape: "sector", cx: worldToScreenX(entity.worldX + (hb.ox || 0)), cy: entity.y + (hb.oy || 0), radius: hb.radius || 0, start: hb.start || 0, end: hb.end || Math.PI, layer: hb.layer || entity.layer });
      } else {
        shapes.push({ shape: "circle", cx: worldToScreenX(entity.worldX + (hb.ox || 0)), cy: entity.y + (hb.oy || 0), r: hb.r || entity.radius || 0, layer: hb.layer || entity.layer });
      }
    }
    return shapes;
  }

  function hitboxToWorldShape(hitbox) {
    if (hitbox.shape === "circle") {
      return { shape: "circle", cx: hitbox.cx, cy: hitbox.cy, r: hitbox.r };
    }
    if (hitbox.shape === "sector") {
      return { shape: "sector", cx: hitbox.cx, cy: hitbox.cy, radius: hitbox.radius, start: hitbox.start, end: hitbox.end };
    }
    return { shape: "rect", x: hitbox.x, y: hitbox.y, w: hitbox.w, h: hitbox.h };
  }
  function overlapShapes(a, b) {
    if (a.shape === "rect" && b.shape === "circle") return rectCircleOverlap(a, b);
    if (a.shape === "circle" && b.shape === "rect") return rectCircleOverlap(b, a);
    if (a.shape === "circle" && b.shape === "circle") return circleCircleOverlap(a, b);
    if (a.shape === "rect" && b.shape === "rect") return rectRectOverlap(a, b);
    if (a.shape === "sector" && b.shape === "circle") return sectorCircleOverlap(a, b);
    if (a.shape === "circle" && b.shape === "sector") return sectorCircleOverlap(b, a);
    return false;
  }

  function rectRectOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function circleCircleOverlap(a, b) {
    const dx = a.cx - b.cx;
    const dy = a.cy - b.cy;
    const rr = a.r + b.r;
    return (dx * dx + dy * dy) <= rr * rr;
  }

  function rectCircleOverlap(rect, circle) {
    const nx = clamp(circle.cx, rect.x, rect.x + rect.w);
    const ny = clamp(circle.cy, rect.y, rect.y + rect.h);
    const dx = circle.cx - nx;
    const dy = circle.cy - ny;
    return (dx * dx + dy * dy) <= circle.r * circle.r;
  }

  function sectorCircleOverlap(sector, circle) {
    const dx = circle.cx - sector.cx;
    const dy = circle.cy - sector.cy;
    const distSq = dx * dx + dy * dy;
    if (distSq > (sector.radius + circle.r) * (sector.radius + circle.r)) return false;
    const ang = Math.atan2(dy, dx);
    const s = normalizeAngle(sector.start);
    const e = normalizeAngle(sector.end);
    const a = normalizeAngle(ang);
    if (s <= e) return a >= s && a <= e;
    return a >= s || a <= e;
  }

  function normalizeAngle(rad) {
    let r = rad;
    while (r < 0) r += Math.PI * 2;
    while (r >= Math.PI * 2) r -= Math.PI * 2;
    return r;
  }
  function updateButton(btn, isDown) {
    btn.pressed = !btn.down && isDown;
    btn.released = btn.down && !isDown;
    if (btn.released) btn.lastHold = btn.hold;
    btn.down = isDown;
    btn.hold = btn.down ? btn.hold + 1 : 0;
  }

  function beginInputFrame() {
    input.frame += 1;

    while (input.queue.length > 0) {
      const ev = input.queue.shift();
      input.physical[ev.code] = ev.isDown;
    }

    const p = input.physical;
    updateButton(input.buttons.up, p.KeyW);
    updateButton(input.buttons.left, p.KeyA);
    updateButton(input.buttons.down, p.KeyS);
    updateButton(input.buttons.right, p.KeyD);
    updateButton(input.buttons.jump, p.Space);
    updateButton(input.buttons.dash, p.ShiftLeft || p.ShiftRight);
    updateButton(input.buttons.ability, p.KeyQ);
    updateButton(input.buttons.special, p.KeyE);
    updateButton(input.buttons.stance, p.KeyR);
    updateButton(input.buttons.debugHurt, p.KeyH);
    updateButton(input.buttons.attackPrimary, p.Mouse0);
    updateButton(input.buttons.attackSecondary, p.Mouse2);

    input.directionHistory.push({
      frame: input.frame,
      up: input.buttons.up.down,
      down: input.buttons.down.down,
      left: input.buttons.left.down,
      right: input.buttons.right.down,
      dash: input.buttons.dash.down
    });

    const minFrame = input.frame - INPUT_CFG.directionMemoryFrames;
    input.directionHistory = input.directionHistory.filter((d) => d.frame >= minFrame);
  }

  function enqueueBuffered(type, payload, ttl) {
    input.buffer.push({
      id: input.nextId++,
      type,
      payload,
      frame: input.frame,
      expireFrame: input.frame + ttl,
      consumed: false
    });
  }

  function cleanupBuffered() {
    input.buffer = input.buffer.filter((t) => !t.consumed && t.expireFrame >= input.frame);
  }

  function peekBuffered(type) {
    for (const t of input.buffer) {
      if (!t.consumed && t.type === type) return t;
    }
    return null;
  }

  function hasRecentDirection(test, framesBack = INPUT_CFG.directionMemoryFrames) {
    const minFrame = input.frame - framesBack;
    for (let i = input.directionHistory.length - 1; i >= 0; i -= 1) {
      const d = input.directionHistory[i];
      if (d.frame < minFrame) break;
      if (test(d)) return true;
    }
    return false;
  }

  function moveInput() {
    let move = 0;
    if (input.buttons.left.down) move -= 1;
    if (input.buttons.right.down) move += 1;
    return move;
  }

  function directionIntent() {
    const facingRight = player.facing === 1;
    return {
      up: hasRecentDirection((d) => d.up),
      down: hasRecentDirection((d) => d.down),
      forward: hasRecentDirection((d) => (facingRight ? d.right : d.left)),
      dash: player.mainState === "Dash" || hasRecentDirection((d) => d.dash, 3)
    };
  }

  function chargeLevelByFrames(framesHeld) {
    if (framesHeld >= CHARGE_CFG.lv3Frames) return 3;
    if (framesHeld >= CHARGE_CFG.lv2Frames) return 2;
    return 1;
  }

  function isChargingPrimary() {
    return !!(player.chargeData && player.chargeData.active && player.chargeData.button === "primary");
  }

  function currentMoveSpeedScale() {
    return isChargingPrimary() ? 0.5 : 1;
  }

  function beginPrimaryCharge() {
    player.chargeData = {
      attackId: "chargeSlash",
      button: "primary",
      active: true,
      startFrame: input.frame,
      framesHeld: 0,
      level: 1,
      moveSpeedScale: 0.5,
      damageTakenScale: 1.2,
      canCancel: false,
      armorPolicy: "none"
    };
    player.lastAction = "チャージ開始";
  }

  function releasePrimaryCharge() {
    if (!isChargingPrimary()) return;
    const charge = player.chargeData;
    charge.framesHeld = Math.max(charge.framesHeld, input.buttons.attackPrimary.lastHold || 0);
    charge.level = chargeLevelByFrames(charge.framesHeld);

    enqueueBuffered(
      "attack",
      {
        button: "primary",
        held: charge.framesHeld,
        isCharge: true,
        chargeLevel: charge.level,
        attackId: charge.attackId,
        dir: directionIntent()
      },
      INPUT_CFG.bufferFrames.attack
    );

    player.chargeData = null;
  }

  function sampleAndBufferInput() {
    const b = input.buttons;

    if (b.jump.pressed) enqueueBuffered("jump", { frame: input.frame }, INPUT_CFG.bufferFrames.jump);
    if (b.dash.pressed) enqueueBuffered("dash", { frame: input.frame }, INPUT_CFG.bufferFrames.dash);

    const rigidStance = player.meta.stance === 1;

    if (rigidStance) {
      if (b.attackPrimary.pressed && !player.chargeData && player.mainState !== "Attack" && player.mainState !== "Hurt") {
        beginPrimaryCharge();
      }

      if (isChargingPrimary()) {
        player.chargeData.framesHeld = b.attackPrimary.down ? b.attackPrimary.hold : player.chargeData.framesHeld;
        player.chargeData.level = chargeLevelByFrames(player.chargeData.framesHeld);
        if (b.attackPrimary.released) {
          releasePrimaryCharge();
        }
      }
    } else if (b.attackPrimary.released) {
      enqueueBuffered(
        "attack",
        {
          button: "primary",
          held: b.attackPrimary.lastHold,
          isCharge: b.attackPrimary.lastHold >= INPUT_CFG.holdThresholdFrames.attackPrimary,
          dir: directionIntent()
        },
        INPUT_CFG.bufferFrames.attack
      );
    }
    if (b.attackSecondary.released) {
      enqueueBuffered(
        "attack",
        {
          button: "secondary",
          held: b.attackSecondary.lastHold,
          isCharge: b.attackSecondary.lastHold >= INPUT_CFG.holdThresholdFrames.attackSecondary,
          dir: directionIntent()
        },
        INPUT_CFG.bufferFrames.attack
      );
    }

    if (b.debugHurt.pressed) {
      player.pendingHurt = {
        kind: "stagger",
        frames: 22,
        knockbackX: 170,
        knockbackY: -180,
        invulFrames: 18
      };
    }

    if (b.ability.pressed && player.abilityCd <= 0) {
      player.abilityTimer = 0.55;
      player.abilityCd = 1.6;
      player.lastAction = "固有能力";
    }

    if (b.stance.pressed) {
      player.meta.stance = player.meta.stance === 0 ? 1 : 0;
      player.lastAction = player.meta.stance === 0 ? "構えA" : "構えB";
    }
  }

  const ATTACK_PHASE = {
    STARTUP: "Startup",
    ACTIVE: "Active",
    RECOVERY: "Recovery",
    END: "End"
  };

  class AttackRuntime {
    constructor(def) {
      this.def = def;
      this.frame = 0;
      this.phase = ATTACK_PHASE.STARTUP;
      this.phaseFrame = 1;
      this.ended = false;
      this.hitConfirmed = false;
      this.comboOpen = false;
      this.cancelOpen = false;
      this.hitCounts = {};
      this.lastHitFrameByTarget = {};
      this.animationEventsFired = {};
    }

    get totalFrames() {
      return this.def.startup + this.def.active + this.def.recovery;
    }

    get progress01() {
      return clamp(this.frame / Math.max(1, this.totalFrames), 0, 1);
    }

    update(isHitstop, pauseOnHitstop) {
      if (this.ended) return;
      if (isHitstop && pauseOnHitstop) return;
      this.frame += 1;

      if (this.frame <= this.def.startup) {
        this.phase = ATTACK_PHASE.STARTUP;
        this.phaseFrame = this.frame;
      } else if (this.frame <= this.def.startup + this.def.active) {
        this.phase = ATTACK_PHASE.ACTIVE;
        this.phaseFrame = this.frame - this.def.startup;
      } else if (this.frame <= this.totalFrames) {
        this.phase = ATTACK_PHASE.RECOVERY;
        this.phaseFrame = this.frame - this.def.startup - this.def.active;
      } else {
        this.phase = ATTACK_PHASE.END;
        this.phaseFrame = 0;
        this.ended = true;
      }

      this.comboOpen = this.isComboWindowOpen();
      this.cancelOpen = this.isCancelWindowOpen();
    }

    isFrameWindowOpen(win) {
      if (!win) return false;
      const start = typeof win.s === "number" ? win.s : 1;
      const end = typeof win.e === "number" ? win.e : 9999;
      return this.frame >= start && this.frame <= end;
    }

    isPhaseWindowOpen(win) {
      if (!win) return false;
      if (win.phase && win.phase !== this.phase && win.phase !== "Any") return false;
      const from = typeof win.from === "number" ? win.from : 1;
      const to = typeof win.to === "number" ? win.to : 9999;
      return this.phaseFrame >= from && this.phaseFrame <= to;
    }

    isComboWindowOpen() {
      const win = this.hitConfirmed ? this.def.combo.window.onHit : this.def.combo.window.onWhiff;
      return this.isFrameWindowOpen(win);
    }

    isCancelWindowOpen() {
      const windows = this.def.cancelWindows[this.phase] || [];
      return windows.some((w) => this.isPhaseWindowOpen(w));
    }

    isHitboxActive() {
      if (this.phase !== ATTACK_PHASE.ACTIVE) return false;
      if (this.def.hitboxByAnimation && this.def.animationActiveWindow) {
        const af = this.getAnimationFrame();
        return af >= this.def.animationActiveWindow.start && af <= this.def.animationActiveWindow.end;
      }
      return true;
    }

    getAnimationFrame() {
      return this.frame;
    }

    popAnimationEvents() {
      const events = [];
      for (const ev of this.def.animationEvents || []) {
        const key = `${ev.event}@${ev.frame}`;
        if (this.animationEventsFired[key]) continue;
        if (this.frame >= ev.frame) {
          this.animationEventsFired[key] = true;
          events.push(ev);
        }
      }
      return events;
    }

    canHitTarget(targetId) {
      if (!this.isHitboxActive()) return false;
      const cfg = this.def.multiHit;
      const count = this.hitCounts[targetId] || 0;
      if (cfg.maxHitsPerTarget > 0 && count >= cfg.maxHitsPerTarget) return false;
      const last = this.lastHitFrameByTarget[targetId];
      if (typeof last === "number" && (this.frame - last) < cfg.rehitIntervalFrames) return false;
      return true;
    }

    registerHit(targetId) {
      this.hitConfirmed = true;
      this.hitCounts[targetId] = (this.hitCounts[targetId] || 0) + 1;
      this.lastHitFrameByTarget[targetId] = this.frame;
    }

    canCancelTo(actionName) {
      const windows = this.def.cancelWindows[this.phase] || [];
      for (const w of windows) {
        if (!this.isPhaseWindowOpen(w)) continue;
        if (!w.actions || w.actions.length === 0) return true;
        if (w.actions.includes(actionName)) return true;
      }
      return false;
    }

    currentMovementControl() {
      return this.def.movementControl[this.phase] || this.def.movementControl.Default;
    }
  }

  function resolveAttackTypeFromToken(token) {
    const dir = token.payload.dir;
    if (dir.dash) return "dash";
    if (!player.grounded && dir.down) return "airDown";
    if (dir.up) return "up";
    if (dir.forward) return "forward";
    return "neutral";
  }

  function getAttackStage(kind, idx) {
    const list = attackCatalog[kind] || attackCatalog.neutral;
    return list[Math.min(idx, list.length - 1)];
  }

  function buildAttackDefinition(token, stageIndex) {
    const payload = token && token.payload ? token.payload : {};
    const isChargeSlash = payload.attackId === "chargeSlash";

    if (isChargeSlash) {
      const lv = clamp(payload.chargeLevel || chargeLevelByFrames(payload.held || 0), 1, 3);
      const lvData = {
        1: { startup: 8, active: 4, recovery: 18, damageAdd: 2, hitAttribute: "stagger", knockbackPower: 180, hitstopFrames: 5, applyBreak: false },
        2: { startup: 10, active: 5, recovery: 22, damageAdd: 5, hitAttribute: "knockback", knockbackPower: 280, hitstopFrames: 6, applyBreak: true },
        3: { startup: 12, active: 6, recovery: 28, damageAdd: 10, hitAttribute: "launch", knockbackPower: 380, hitstopFrames: 7, applyBreak: true }
      }[lv];
      const hb = { ox: 66, oy: -52, w: 98, h: 52 };

      return {
        name: `チャージスラッシュ Lv${lv}`,
        attackType: "neutral",
        startup: lvData.startup,
        active: lvData.active,
        recovery: lvData.recovery,
        damage: CHARGE_CFG.baseDamage + lvData.damageAdd,
        hitAttribute: lvData.hitAttribute,
        knockbackPower: lvData.knockbackPower,
        unblockable: false,
        guardBreakCandidate: lv >= 3,
        hitPolicy: "first",
        hitbox: { shape: "rect", ox: hb.ox, oy: hb.oy, w: hb.w, h: hb.h, layer: "default" },
        canUseGround: true,
        canUseAir: false,
        combo: { stageIndex: 0, window: { onHit: { s: 999, e: 998 }, onWhiff: { s: 999, e: 998 } } },
        movementControl: {
          Startup: { mode: "slow", speedScale: 0.18 },
          Active: { mode: "forward", speed: MOVE.groundMaxSpeed * (lv >= 3 ? 1.08 : 0.92) },
          Recovery: { mode: "inertia" },
          Default: { mode: "slow", speedScale: 0.2 }
        },
        cancelWindows: {
          Startup: [],
          Active: [],
          Recovery: []
        },
        hitboxByAnimation: false,
        animationActiveWindow: { start: lvData.startup, end: lvData.startup + lvData.active - 1 },
        animationEvents: [
          { frame: 1, event: "charge_slash_start" },
          { frame: lvData.startup, event: "hit_start" },
          { frame: lvData.startup + lvData.active - 1, event: "hit_end" }
        ],
        pauseDuringHitstop: true,
        hitstopFrames: lvData.hitstopFrames,
        applyBreak: lvData.applyBreak,
        chargeLevel: lv,
        multiHit: {
          maxHitsPerTarget: 1,
          rehitIntervalFrames: 999
        }
      };
    }

    const type = resolveAttackTypeFromToken(token);
    const idx = typeof stageIndex === "number" ? stageIndex : 0;
    const base = getAttackStage(type, idx);
    const hb = attackHitboxes[type] || attackHitboxes.neutral;
    const secondary = payload.button === "secondary";
    const charge = !!payload.isCharge;

    const startup = hb.a0;
    const active = Math.max(1, hb.a1 - hb.a0 + 1);
    const recoveryBase = Math.max(1, base.total - startup - active);

    return {
      name: `${secondary ? "サブ" : ""}${base.label}${charge ? "(溜め)" : ""}`,
      attackType: type,
      startup,
      active,
      recovery: recoveryBase + (charge ? 6 : 0),
      damage: charge ? 18 : 10,
      hitAttribute: charge ? "heavy" : "normal",
      knockbackPower: type === "dash" ? 320 : 220,
      unblockable: false,
      guardBreakCandidate: false,
      hitPolicy: type === "dash" ? "all" : "first",
      hitbox: { shape: "rect", ox: hb.ox, oy: hb.oy, w: hb.w, h: hb.h, layer: "default" },
      canUseGround: type !== "airDown",
      canUseAir: true,
      combo: { stageIndex: idx, window: { onHit: base.combo.onHit, onWhiff: base.combo.onWhiff } },
      movementControl: {
        Startup: { mode: "slow", speedScale: 0.2 },
        Active: type === "dash" ? { mode: "forward", speed: MOVE.dashSpeed * 0.82 } : { mode: "slow", speedScale: 0.28 },
        Recovery: { mode: "inertia" },
        Default: { mode: "slow", speedScale: 0.2 }
      },
      cancelWindows: {
        Startup: [
          { phase: "Startup", from: Math.max(1, startup - 2), to: startup, actions: ["Dash"] }
        ],
        Active: [
          { phase: "Active", from: Math.max(1, active - 2), to: active, actions: ["Dash"] }
        ],
        Recovery: [
          { phase: "Recovery", from: 1, to: Math.max(1, recoveryBase), actions: ["Attack", "Dash", "Jump"] }
        ]
      },
      hitboxByAnimation: false,
      animationActiveWindow: { start: startup, end: startup + active - 1 },
      animationEvents: [
        { frame: startup, event: "hit_start" },
        { frame: startup + active - 1, event: "hit_end" }
      ],
      pauseDuringHitstop: true,
      hitstopFrames: MOVE.hitstopOnHitFrames,
      applyBreak: false,
      chargeLevel: 0,
      multiHit: {
        maxHitsPerTarget: type === "dash" ? 2 : 1,
        rehitIntervalFrames: type === "dash" ? 6 : 999
      }
    };
  }
  function applyHorizontalVelocity(targetVx, accelPerSec, dt) {
    const before = player.vx;
    const maxDelta = accelPerSec * dt;
    const delta = clamp(targetVx - player.vx, -maxDelta, maxDelta);
    player.vx += delta;
    player.debug.appliedAccel = (player.vx - before) / dt;
  }

  function applyGroundMovementResponse() {
    const move = moveInput();
    if (move !== 0) player.facing = move > 0 ? 1 : -1;

    const target = move * MOVE.groundMaxSpeed * currentMoveSpeedScale();
    const sameDir = move !== 0 && Math.sign(move) === Math.sign(player.vx || move);
    let accel = 0;

    if (move === 0) accel = MOVE.groundDeceleration;
    else if (sameDir) accel = MOVE.groundAcceleration;
    else accel = MOVE.turnDeceleration;

    applyHorizontalVelocity(target, accel, DT);
  }

  function applyAirMovementResponse() {
    const move = moveInput();

    if (player.dashJumpInertiaLeft > 0) {
      if (move === 0) {
        player.debug.appliedAccel = 0;
        return;
      }

      if (Math.sign(move) === Math.sign(player.vx || move)) {
        applyHorizontalVelocity(move * MOVE.airMaxSpeed, MOVE.airAcceleration * 0.45, DT);
      } else {
        applyHorizontalVelocity(move * MOVE.airMaxSpeed, MOVE.airTurnDeceleration * 0.45, DT);
      }

      if (move !== 0) player.facing = move > 0 ? 1 : -1;
      return;
    }

    if (move !== 0) player.facing = move > 0 ? 1 : -1;

    const target = move * MOVE.airMaxSpeed * currentMoveSpeedScale();
    const sameDir = move !== 0 && Math.sign(move) === Math.sign(player.vx || move);
    let accel = 0;

    if (move === 0) accel = MOVE.airDeceleration;
    else if (sameDir) accel = MOVE.airAcceleration;
    else accel = MOVE.airTurnDeceleration;

    applyHorizontalVelocity(target, accel, DT);
  }

  function groundedTransitionTarget() {
    return Math.abs(player.vx) > 8 || moveInput() !== 0 ? "Run" : "Idle";
  }

  function hasPendingHurt() {
    return !!player.pendingHurt && player.canBeHurt;
  }

  function takePendingHurt() {
    const h = player.pendingHurt;
    player.pendingHurt = null;
    return h;
  }

  function transition(to, payload, consume) {
    return { to, payload, consume, priority: PRIORITY[to] || 0 };
  }

  function chooseTransition(candidates) {
    if (!candidates.length) return null;
    let best = candidates[0];
    for (let i = 1; i < candidates.length; i += 1) {
      if (candidates[i].priority > best.priority) best = candidates[i];
    }
    return best;
  }
  class FSM {
    constructor(states, initial) {
      this.states = states;
      this.current = states[initial];
      this.currentName = initial;
      player.mainState = initial;
      this.current.enter({ from: null, payload: null });
    }

    setState(name, payload) {
      if (!this.states[name]) return;
      if (name === this.currentName && !(payload && payload.reenter)) return;
      const prev = this.currentName;
      this.current.exit({ to: name, payload });
      this.current = this.states[name];
      this.currentName = name;
      player.mainState = name;
      player.stateFrames = 0;
      this.current.enter({ from: prev, payload });
    }

    resolveTransitions(phase) {
      let c = this.current.getTransitions(phase);
      if (isChargingPrimary()) {
        c = c.filter((t) => t.to === "Hurt" || t.to === "Run" || t.to === "Idle" || t.to === "Fall");
      }
      const best = chooseTransition(c);
      if (!best) return;
      if (best.consume) best.consume();
      this.setState(best.to, best.payload || null);
    }

    update() {
      player.stateFrames += 1;
      this.current.update(DT);
    }

    acceptsText() {
      const a = this.current.accepts;
      return `move:${a.move ? "Y" : "N"} jump:${a.jump ? "Y" : "N"} dash:${a.dash ? "Y" : "N"} atk:${a.attack ? "Y" : "N"}`;
    }
  }

  function createStates() {
    const S = {};

    S.Idle = {
      accepts: { move: true, jump: true, dash: true, attack: true },
      enter() {
        player.canAttack = true;
        player.canBeHurt = true;
      },
      update() {
        applyGroundMovementResponse();
      },
      exit() {},
      getTransitions(phase) {
        const c = [];
        if (phase === "pre") {
          if (hasPendingHurt()) c.push(transition("Hurt", takePendingHurt()));

          const atk = peekBuffered("attack");
          if (atk && player.canAttack) c.push(transition("Attack", { token: atk }, () => { atk.consumed = true; }));

          const dash = peekBuffered("dash");
          if (dash) c.push(transition("Dash", null, () => { dash.consumed = true; }));

          const jump = peekBuffered("jump");
          if (jump && (player.grounded || player.coyoteLeft > 0)) {
            c.push(transition("Jump", null, () => { jump.consumed = true; }));
          }

          if (moveInput() !== 0) c.push(transition("Run"));
        }
        if (phase === "post") {
          if (!player.grounded) c.push(transition("Fall"));
        }
        return c;
      }
    };

    S.Run = {
      accepts: { move: true, jump: true, dash: true, attack: true },
      enter() {
        player.canAttack = true;
        player.canBeHurt = true;
      },
      update() {
        applyGroundMovementResponse();
      },
      exit() {},
      getTransitions(phase) {
        const c = [];
        if (phase === "pre") {
          if (hasPendingHurt()) c.push(transition("Hurt", takePendingHurt()));

          const atk = peekBuffered("attack");
          if (atk && player.canAttack) c.push(transition("Attack", { token: atk }, () => { atk.consumed = true; }));

          const dash = peekBuffered("dash");
          if (dash) c.push(transition("Dash", null, () => { dash.consumed = true; }));

          const jump = peekBuffered("jump");
          if (jump && (player.grounded || player.coyoteLeft > 0)) {
            c.push(transition("Jump", null, () => { jump.consumed = true; }));
          }

          if (moveInput() === 0 && Math.abs(player.vx) < 10) c.push(transition("Idle"));
        }
        if (phase === "post") {
          if (!player.grounded) c.push(transition("Fall"));
        }
        return c;
      }
    };

    S.Jump = {
      accepts: { move: true, jump: false, dash: true, attack: true },
      enter({ from }) {
        const wasDash = from === "Dash";
        player.vy = -MOVE.jumpInitialVelocity;
        player.jumpHoldLeft = MOVE.jumpHoldFrames;
        player.grounded = false;
        player.dashJumpInertiaLeft = wasDash ? MOVE.dashJumpInertiaFrames : 0;
        player.lastAction = wasDash ? "ダッシュジャンプ" : "ジャンプ";
      },
      update() {
        applyAirMovementResponse();
      },
      exit() {},
      getTransitions(phase) {
        const c = [];
        if (phase === "pre") {
          if (hasPendingHurt()) c.push(transition("Hurt", takePendingHurt()));

          const atk = peekBuffered("attack");
          if (atk && player.canAttack) c.push(transition("Attack", { token: atk }, () => { atk.consumed = true; }));

          const dash = peekBuffered("dash");
          if (dash) c.push(transition("Dash", null, () => { dash.consumed = true; }));
        }
        if (phase === "post") {
          if (player.vy >= 0) c.push(transition("Fall"));
          if (player.grounded) c.push(transition(groundedTransitionTarget()));
        }
        return c;
      }
    };

    S.Fall = {
      accepts: { move: true, jump: false, dash: true, attack: true },
      enter() {
        player.lastAction = "落下";
      },
      update() {
        applyAirMovementResponse();
      },
      exit() {},
      getTransitions(phase) {
        const c = [];
        if (phase === "pre") {
          if (hasPendingHurt()) c.push(transition("Hurt", takePendingHurt()));

          const atk = peekBuffered("attack");
          if (atk && player.canAttack) c.push(transition("Attack", { token: atk }, () => { atk.consumed = true; }));

          const dash = peekBuffered("dash");
          if (dash) c.push(transition("Dash", null, () => { dash.consumed = true; }));

          const jump = peekBuffered("jump");
          if (jump && player.coyoteLeft > 0) {
            c.push(transition("Jump", null, () => { jump.consumed = true; }));
          }
        }
        if (phase === "post") {
          if (player.grounded) c.push(transition(groundedTransitionTarget()));
        }
        return c;
      }
    };

    S.Dash = {
      accepts: { move: true, jump: true, dash: false, attack: true },
      enter() {
        const move = moveInput();
        const dir = move !== 0 ? (move > 0 ? 1 : -1) : player.facing;
        player.facing = dir;

        const tunedSpeed = MOVE.dashSpeed;

        player.dashData = {
          leftFrames: MOVE.dashDurationFrames,
          endLagFrames: MOVE.dashEndLagFrames,
          invulFrames: MOVE.dashInvincibleFrames,
          speed: tunedSpeed,
          dir
        };

        player.canBeHurt = MOVE.dashInvincibleFrames <= 0;
        player.invincible = MOVE.dashInvincibleFrames > 0;
        player.lastAction = "ダッシュ";
      },
      update() {
        const d = player.dashData;
        if (!d) return;

        const move = moveInput();
        if (move !== 0) {
          d.dir = move > 0 ? 1 : -1;
          player.facing = d.dir;
        }

        if (d.leftFrames > 0) {
          player.vx = d.dir * d.speed;
          d.leftFrames -= 1;
        } else {
          player.vx = 0;
          d.endLagFrames = Math.max(0, d.endLagFrames - 1);
        }

        if (d.invulFrames > 0) {
          d.invulFrames -= 1;
          player.invincible = true;
          player.canBeHurt = false;
        } else {
          player.invincible = false;
          player.canBeHurt = true;
        }
      },
      exit() {
        player.dashData = null;
        player.invincible = false;
        player.canBeHurt = true;
      },
      getTransitions(phase) {
        const c = [];
        if (phase === "pre") {
          if (hasPendingHurt() && player.canBeHurt) c.push(transition("Hurt", takePendingHurt()));

          const atk = peekBuffered("attack");
          if (atk && player.canAttack) c.push(transition("Attack", { token: atk }, () => { atk.consumed = true; }));

          const jump = peekBuffered("jump");
          if (jump && (player.grounded || player.coyoteLeft > 0)) {
            c.push(transition("Jump", null, () => { jump.consumed = true; }));
          }
        }
        if (phase === "post") {
          const d = player.dashData;
          const ended = !d || (d.leftFrames <= 0 && d.endLagFrames <= 0);
          if (ended) {
            if (!player.grounded) c.push(transition("Fall"));
            else c.push(transition(groundedTransitionTarget()));
          }
        }
        return c;
      }
    };

        S.Attack = {
      accepts: { move: true, jump: false, dash: false, attack: true },
      enter({ from, payload }) {
        const token = payload && payload.token ? payload.token : null;
        if (!token) return;

        const stage = payload && typeof payload.stage === "number" ? payload.stage : 0;
        const def = buildAttackDefinition(token, stage);
        if (player.grounded && !def.canUseGround) return;
        if (!player.grounded && !def.canUseAir) return;
        player.attackData = {
          definition: def,
          runtime: new AttackRuntime(def),
          queuedToken: null
        };

        player.canAttack = true;
        player.canBeHurt = true;
        player.lastAction = def.name;

        if (from === "Dash" || def.attackType === "dash") {
          player.dashJumpInertiaLeft = Math.max(player.dashJumpInertiaLeft, MOVE.dashJumpInertiaFrames);
        }
      },
      update() {
        const a = player.attackData;
        if (!a) return;

        a.runtime.update(player.hitstopFrames > 0, a.definition.pauseDuringHitstop);

        const move = moveInput();
        const mc = a.runtime.currentMovementControl();
        if (mc.mode === "forward") {
          const dir = move !== 0 ? (move > 0 ? 1 : -1) : player.facing;
          player.facing = dir;
          applyHorizontalVelocity(dir * (mc.speed || MOVE.dashSpeed), MOVE.groundAcceleration * 1.4, DT);
        } else if (mc.mode === "inertia") {
          player.debug.appliedAccel = 0;
        } else if (mc.mode === "lock") {
          applyHorizontalVelocity(0, MOVE.turnDeceleration, DT);
        } else {
          const scale = typeof mc.speedScale === "number" ? mc.speedScale : (player.grounded ? 0.24 : 0.2);
          const target = move * MOVE.groundMaxSpeed * scale;
          applyHorizontalVelocity(target, MOVE.groundAcceleration * 0.6, DT);
        }

        if (a.runtime.comboOpen && !a.queuedToken) {
          const next = peekBuffered("attack");
          if (next) {
            next.consumed = true;
            a.queuedToken = next;
            player.lastAction = `${a.definition.name} -> 次段予約`;
          }
        }
      },
      exit() {
        player.attackData = null;
      },
      getTransitions(phase) {
        const c = [];
        const a = player.attackData;

        if (phase === "pre") {
          if (hasPendingHurt() && player.canBeHurt) c.push(transition("Hurt", takePendingHurt()));

          if (a && a.runtime.canCancelTo("Dash")) {
            const dash = peekBuffered("dash");
            if (dash) c.push(transition("Dash", null, () => { dash.consumed = true; }));
          }

          if (a && a.runtime.canCancelTo("Jump")) {
            const jump = peekBuffered("jump");
            if (jump && (player.grounded || player.coyoteLeft > 0)) {
              c.push(transition("Jump", null, () => { jump.consumed = true; }));
            }
          }
        }

        if (phase === "post") {
          if (!a) return c;

          if (a.runtime.ended) {
            if (a.queuedToken) {
              const nextType = resolveAttackTypeFromToken(a.queuedToken);
              const nextStage = nextType === a.definition.attackType ? a.definition.combo.stageIndex + 1 : 0;
              c.push(transition("Attack", { token: a.queuedToken, stage: nextStage, reenter: true }));
            } else {
              if (!player.grounded) c.push(transition("Fall"));
              else c.push(transition(groundedTransitionTarget()));
            }
          }
        }
        return c;
      }
    };

    S.Hurt = {
      accepts: { move: false, jump: false, dash: false, attack: false },
      enter({ from, payload }) {
        const h = payload || { kind: "stagger", frames: 20, knockbackX: 150, knockbackY: -120, invulFrames: 10 };
        player.hurtData = {
          kind: h.kind || "stagger",
          leftFrames: h.frames || 20,
          invulFrames: h.invulFrames || 0
        };

        const sign = player.facing;
        player.vx = -sign * (h.knockbackX || 0);
        player.vy = h.knockbackY || 0;

        player.invincible = player.hurtData.invulFrames > 0;
        player.canAttack = false;
        player.canBeHurt = false;
        player.lastAction = `被弾:${player.hurtData.kind}`;
      },
      update() {
        const h = player.hurtData;
        if (!h) return;

        h.leftFrames -= 1;
        player.vx *= 0.92;

        if (h.invulFrames > 0) {
          h.invulFrames -= 1;
          player.invincible = true;
        } else {
          player.invincible = false;
        }
      },
      exit() {
        player.hurtData = null;
        player.invincible = false;
        player.canAttack = true;
        player.canBeHurt = true;
      },
      getTransitions(phase) {
        const c = [];
        if (phase === "post") {
          const done = !player.hurtData || player.hurtData.leftFrames <= 0;
          if (done) {
            if (!player.grounded) c.push(transition("Fall"));
            else c.push(transition(groundedTransitionTarget()));
          }
        }
        return c;
      }
    };

    return S;
  }

  let fsm = null;
  function updateLookTilt() {
    player.look = input.buttons.up.down ? -1 : input.buttons.down.down ? 1 : 0;
    const target = player.look * 0.08;
    player.lookTilt += (target - player.lookTilt) * clamp(DT * 12, 0, 1);
  }

  function updateVerticalPhysics() {
    const jumpHeld = input.buttons.jump.down;
    const currentlyRising = player.vy < 0;

    let gMul = currentlyRising ? MOVE.gravityAscendMultiplier : MOVE.gravityDescendMultiplier;

    if (player.mainState === "Jump" && jumpHeld && player.jumpHoldLeft > 0 && currentlyRising) {
      gMul *= 0.55;
      player.jumpHoldLeft -= 1;
    }

    if (!jumpHeld && currentlyRising) {
      if (player.vy < -MOVE.jumpInitialVelocity * MOVE.jumpCutMultiplier) {
        player.vy = -MOVE.jumpInitialVelocity * MOVE.jumpCutMultiplier;
      }
      player.jumpHoldLeft = 0;
    }

    player.vy += MOVE.gravity * gMul * DT;
    player.vy = clamp(player.vy, -9999, MOVE.maxFallSpeed);

    player.y += player.vy * DT;

    if (player.y >= player.groundY) {
      if (!player.grounded) {
        player.coyoteLeft = MOVE.coyoteFrames;
      }
      player.y = player.groundY;
      player.vy = 0;
      player.grounded = true;
      player.dashJumpInertiaLeft = 0;
    } else {
      if (player.grounded) {
        player.grounded = false;
        player.coyoteLeft = MOVE.coyoteFrames;
      } else {
        player.coyoteLeft = Math.max(0, player.coyoteLeft - 1);
      }
    }
  }

  function updateWorldMotion() {
    player.worldOffset += player.vx * DT;

    const speedRatio = clamp(Math.abs(player.vx) / MOVE.dashSpeed, 0, 1);
    const targetBounce = player.grounded ? speedRatio * 5 : 0;
    player.walkCycle += Math.abs(player.vx) * DT * 0.036;
    player.bounce += (targetBounce - player.bounce) * clamp(DT * 10, 0, 1);

    player.abilityTimer = Math.max(0, player.abilityTimer - DT);
    player.abilityCd = Math.max(0, player.abilityCd - DT);
  }

  function playerPose() {
    const ch = characters[player.meta.charKey];
    const hop = -Math.abs(Math.sin(player.walkCycle)) * player.bounce;
    return {
      x: player.x,
      y: player.y + ch.groundOffset + hop,
      tilt: player.lookTilt * (player.facing === -1 ? -1 : 1)
    };
  }

    function activeAttackHitBoxes() {
    const a = player.attackData;
    if (!a || !a.runtime || !a.definition) return [];
    if (!a.runtime.isHitboxActive()) return [];

    const hb = a.definition.hitbox;
    const p = playerPose();
    const facingSign = player.facing;

    const shape = hb.shape || "rect";
    if (shape === "circle") {
      return [{
        shape: "circle",
        cx: p.x + facingSign * hb.ox,
        cy: p.y + hb.oy,
        r: hb.r || Math.max(hb.w || 0, hb.h || 0) * 0.5,
        ownerId: "player",
        faction: "player",
        layer: hb.layer || "default"
      }];
    }

    if (shape === "sector") {
      const baseStart = typeof hb.start === "number" ? hb.start : -Math.PI * 0.25;
      const baseEnd = typeof hb.end === "number" ? hb.end : Math.PI * 0.25;
      const start = facingSign === 1 ? Math.PI - baseEnd : baseStart;
      const end = facingSign === 1 ? Math.PI - baseStart : baseEnd;
      return [{
        shape: "sector",
        cx: p.x + facingSign * hb.ox,
        cy: p.y + hb.oy,
        radius: hb.radius || 60,
        start,
        end,
        ownerId: "player",
        faction: "player",
        layer: hb.layer || "default"
      }];
    }

    return [{
      shape: "rect",
      x: p.x + facingSign * hb.ox - hb.w * 0.5,
      y: p.y + hb.oy - hb.h * 0.5,
      w: hb.w,
      h: hb.h,
      ownerId: "player",
      faction: "player",
      layer: hb.layer || "default"
    }];
  }

  function representativeHitPoint(hitShape, hurtShape) {
    if (hitShape.shape === "circle") return { x: hitShape.cx, y: hitShape.cy };
    if (hitShape.shape === "sector") return { x: hitShape.cx, y: hitShape.cy };
    if (hitShape.shape === "rect") return { x: hitShape.x + hitShape.w * 0.5, y: hitShape.y + hitShape.h * 0.5 };
    if (hurtShape.shape === "circle") return { x: hurtShape.cx, y: hurtShape.cy };
    return { x: player.x, y: player.y };
  }

  function buildHitInfo(attackerEntity, targetEntity, attackData, hitShape, hurtShape) {
    const hitPos = representativeHitPoint(hitShape, hurtShape);
    const kbDir = player.facing;
    const def = attackData.definition;
    let damage = def.damage;
    const breakGuaranteed = (targetEntity.breakFrames || 0) > 0;
    if (breakGuaranteed) {
      damage = Math.round(damage * CHARGE_CFG.breakDamageScale * 10) / 10;
    }

    return {
      attacker: attackerEntity,
      target: targetEntity,
      damage,
      knockbackDirection: { x: kbDir, y: def.attackType === "up" ? -1 : 0 },
      knockbackPower: def.knockbackPower || (def.attackType === "dash" ? 320 : 220),
      hitPosition: hitPos,
      attackType: def.attackType,
      hitAttribute: def.hitAttribute,
      unblockable: !!def.unblockable,
      isMultiHit: def.multiHit.maxHitsPerTarget > 1,
      guaranteed: breakGuaranteed,
      applyBreak: !!def.applyBreak,
      chargeLevel: def.chargeLevel || 0,
      frame: input.frame
    };
  }

  function updateCombat() {
    for (const e of runtime.combatEntities) {
      e.flash = Math.max(0, (e.flash || 0) - 1);
      e.hitStunFrames = Math.max(0, (e.hitStunFrames || 0) - 1);
      e.breakFrames = Math.max(0, (e.breakFrames || 0) - 1);
    }

    const atk = player.attackData;
    if (!atk || !atk.runtime) {
      player.debug.activeHitBoxes = 0;
      player.debug.lastHitTargetIds = "-";
      player.debug.lastHit = false;
      player.debug.breakApplied = false;
      return;
    }

    const attacker = runtime.combatEntities.find((e) => e.id === "player");
    if (!attacker) return;
    attacker.worldX = player.worldOffset + player.x;
    attacker.y = player.groundY - 28;

    const hitBoxes = activeAttackHitBoxes();
    player.debug.activeHitBoxes = hitBoxes.length;

    if (hitBoxes.length === 0) {
      player.debug.lastHitTargetIds = "-";
      player.debug.lastHit = false;
      player.debug.breakApplied = false;
      return;
    }

    const candidates = runtime.combatEntities
      .filter((e) => e.id !== attacker.id)
      .sort((a, b) => String(a.id).localeCompare(String(b.id)));

    const hitTargetIds = [];
    let hitAny = false;
    let breakAppliedAny = false;

    for (const hitShape of hitBoxes) {
      for (const target of candidates) {
        if (!target.canBeHit || target.invincible) continue;
        if (hitShape.ownerId === target.id) continue;
        if (hitShape.faction === target.faction) continue;

        const hurtShapes = resolveEntityHurtShapes(target);
        let hitResolved = false;

        for (const hs of hurtShapes) {
          if (hitShape.layer && hs.layer && hitShape.layer !== hs.layer) continue;
          if (!overlapShapes(hitboxToWorldShape(hitShape), hs)) continue;
          if (!atk.runtime.canHitTarget(target.id)) continue;

          const hitInfo = buildHitInfo(attacker, target, atk, hitShape, hs);
          const accepted = target.OnHit(hitInfo);
          if (accepted && accepted.accepted === false) continue;

          if (hitInfo.guaranteed) {
            target.breakFrames = 0;
          }
          if (hitInfo.applyBreak) {
            target.breakFrames = Math.max(target.breakFrames || 0, CHARGE_CFG.breakFrames);
            breakAppliedAny = true;
          }

          atk.runtime.registerHit(target.id);
          hitTargetIds.push(target.id);
          hitAny = true;

          runtime.hitLogs.push({
            frame: input.frame,
            attackerId: attacker.id,
            targetId: target.id,
            attackType: hitInfo.attackType,
            damage: hitInfo.damage,
            chargeLevel: hitInfo.chargeLevel,
            guaranteed: hitInfo.guaranteed,
            breakApplied: !!hitInfo.applyBreak,
            pos: hitInfo.hitPosition
          });
          if (runtime.hitLogs.length > 20) runtime.hitLogs.shift();

          HitEventBus.emit("hit", hitInfo);

          const hsFrames = atk.definition.hitstopFrames || MOVE.hitstopOnHitFrames;
          HitEventBus.emit("hitstop", { frames: hsFrames, info: hitInfo });

          player.hitstopFrames = Math.max(player.hitstopFrames, hsFrames);
          player.lastAction = `${atk.definition.name} HIT`;

          if (hitInfo.chargeLevel >= 3) {
            runtime.screenShakeFrames = Math.max(runtime.screenShakeFrames, 8);
            runtime.screenShakePower = Math.max(runtime.screenShakePower, 7);
          }

          hitResolved = true;
          break;
        }

        if (hitResolved && atk.definition.hitPolicy === "first") {
          player.debug.lastHitTargetIds = hitTargetIds.join(",");
          player.debug.lastHit = hitAny;
          player.debug.breakApplied = breakAppliedAny;
          return;
        }
      }
    }

    player.debug.lastHitTargetIds = hitTargetIds.length ? hitTargetIds.join(",") : "-";
    player.debug.lastHit = hitAny;
    player.debug.breakApplied = breakAppliedAny;
  }
  function fixedUpdate() {
    beginInputFrame();
    sampleAndBufferInput();
    cleanupBuffered();

    fsm.resolveTransitions("pre");
    fsm.update();

    updateLookTilt();
    updateVerticalPhysics();
    updateWorldMotion();
    updateCombat();

    fsm.resolveTransitions("post");

    if (player.dashJumpInertiaLeft > 0) {
      player.dashJumpInertiaLeft -= 1;
    }

    if (player.hitstopFrames > 0) {
      player.hitstopFrames -= 1;
    }

    player.debug.accepts = fsm.acceptsText();
    player.debug.dashLeft = player.dashData ? player.dashData.leftFrames : 0;
    if (player.attackData && player.attackData.runtime) {
      const evs = player.attackData.runtime.popAnimationEvents();
      for (const ev of evs) {
        HitEventBus.emit("attack_anim_event", { frame: input.frame, attack: player.attackData.definition.name, event: ev.event, eventFrame: ev.frame });
      }
      player.debug.attackPhase = player.attackData.runtime.phase;
      player.debug.attackFrame = player.attackData.runtime.frame;
      player.debug.comboOpen = player.attackData.runtime.comboOpen;
      player.debug.cancelOpen = player.attackData.runtime.cancelOpen;
    } else {
      player.debug.attackPhase = "-";
      player.debug.attackFrame = 0;
      player.debug.comboOpen = false;
      player.debug.cancelOpen = false;
    }

    const ch = player.chargeData;
    player.debug.chargeActive = !!ch;
    player.debug.chargeFrames = ch ? ch.framesHeld : 0;
    player.debug.chargeLevel = ch ? ch.level : 0;
    player.debug.moveSpeedScale = currentMoveSpeedScale();

    if (runtime.screenShakeFrames > 0) {
      runtime.screenShakeFrames -= 1;
      runtime.screenShakePower *= 0.9;
      if (runtime.screenShakeFrames <= 0) runtime.screenShakePower = 0;
    }
  }

  function resize() {
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    world.width = window.innerWidth;
    world.height = window.innerHeight;
    world.worldHeight = Math.floor(world.height * (1 - UI_RATIO));

    player.x = world.width * 0.5;
    player.groundY = world.worldHeight - GROUND_THICKNESS;
    if (!player.y) player.y = player.groundY;

    for (const t of runtime.targets) {
      t.y = player.groundY - 28;
    }

    for (const e of runtime.combatEntities) {
      if (e.id === "player") {
        e.worldX = player.worldOffset + player.x;
        e.y = player.groundY - 28;
      } else {
        e.y = player.groundY - 28;
      }
    }
  }

  function drawBackground() {
    const imgs = runtime.backgrounds;
    if (!imgs.length) return;

    const tileW = world.width;
    const tileH = world.worldHeight;
    const count = imgs.length;
    const scroll = player.worldOffset;

    const originTile = Math.floor(scroll / tileW);
    const xInTile = ((scroll % tileW) + tileW) % tileW;

    for (let i = -1; i <= 1; i += 1) {
      const tile = originTile + i;
      const idx = ((tile % count) + count) % count;
      ctx.drawImage(imgs[idx], i * tileW - xInTile, 0, tileW, tileH);
    }
  }

  function drawGround() {
    const y = player.groundY;
    ctx.fillStyle = "#314032";
    ctx.fillRect(0, y, world.width, GROUND_THICKNESS + 4);
    ctx.fillStyle = "#5f8762";
    ctx.fillRect(0, y - 6, world.width, 8);
  }

  function drawTargets() {
    const enemies = runtime.combatEntities.filter((e) => e.id !== "player");
    for (const e of enemies) {
      const x = worldToScreenX(e.worldX);
      const y = e.y;
      ctx.save();
      ctx.fillStyle = e.flash > 0 ? "#ff9d9d" : (e.breakFrames > 0 ? "#ffe1a8" : "#f2f2f2");
      ctx.strokeStyle = "#2d2d2d";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y, e.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      if (runtime.debugDraw.hurtBox) {
        const hurtShapes = resolveEntityHurtShapes(e);
        ctx.strokeStyle = "rgba(80, 180, 255, 0.9)";
        ctx.lineWidth = 1.5;
        for (const hs of hurtShapes) {
          if (hs.shape === "circle") {
            ctx.beginPath();
            ctx.arc(hs.cx, hs.cy, hs.r, 0, Math.PI * 2);
            ctx.stroke();
          } else if (hs.shape === "rect") {
            ctx.strokeRect(hs.x, hs.y, hs.w, hs.h);
          }
        }
      }

      ctx.fillStyle = "#111";
      ctx.font = "12px sans-serif";
      const breakText = e.breakFrames > 0 ? ` 崩し:${e.breakFrames}f` : "";
      ctx.fillText(`${e.id} HP:${Math.floor(e.hp)}${breakText}`, x - 38, y - e.radius - 8);
      ctx.restore();
    }
  }

  function attackProgress() {
    const a = player.attackData;
    if (!a || !a.runtime) return null;
    return a.runtime.progress01;
  }

  function drawKnife(p) {
    const w = weapons[player.meta.weaponKey];
    const img = runtime.weaponImg;
    const sign = player.facing === 1 ? 1 : -1;

    const active = player.mainState === "Attack";
    if (!active) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.tilt);
      ctx.scale(sign, 1);
      ctx.translate(-30, -32);
      ctx.rotate(-0.12);
      ctx.scale(-1, 1);
      ctx.drawImage(img, -w.width * 0.5, -w.height * 0.5, w.width, w.height);
      ctx.restore();
      return;
    }

    const t = easeInOutSine(attackProgress() || 0);
    const isDashAttack = player.attackData && player.attackData.definition.attackType === "dash";
    const start = isDashAttack ? -1.65 : -1.22;
    const end = isDashAttack ? 0.9 : 0.55;
    const radius = isDashAttack ? 54 : 42;
    const angle = lerp(start, end, t);

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.tilt);
    ctx.scale(sign, 1);
    ctx.translate(24, -54);
    ctx.rotate(angle);
    ctx.drawImage(img, -12, -w.height * 0.5, w.width, w.height);
    ctx.restore();

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.tilt);
    ctx.scale(sign, 1);
    ctx.globalAlpha = isDashAttack ? 0.32 : 0.24;
    ctx.strokeStyle = isDashAttack ? "#ffc9a0" : "#d6f3ff";
    ctx.lineWidth = isDashAttack ? 7 : 5;
    ctx.beginPath();
    ctx.arc(24, -50, radius, start, angle, false);
    ctx.stroke();
    ctx.restore();
  }

  function drawChargeEffect(p) {
    if (!isChargingPrimary()) return;
    const level = player.chargeData.level || 1;
    const frames = player.chargeData.framesHeld || 0;
    const pulse = 0.7 + Math.sin(input.frame * 0.32) * 0.2;
    const radius = 24 + level * 5 + Math.min(10, frames * 0.12);
    const color = level >= 3 ? "#ffac4f" : level === 2 ? "#9dd8ff" : "#d6f3ff";

    ctx.save();
    ctx.globalAlpha = 0.32 * pulse;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2 + level;
    ctx.beginPath();
    ctx.arc(p.x + player.facing * 8, p.y - 56, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  function drawPlayer() {
    const ch = characters[player.meta.charKey];
    const p = playerPose();

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.tilt);
    if (player.facing === 1) ctx.scale(-1, 1);
    ctx.drawImage(runtime.charImg, -ch.width * 0.5, -ch.height, ch.width, ch.height);
    ctx.restore();

    drawKnife(p);

    if (player.abilityTimer > 0) {
      ctx.save();
      ctx.globalAlpha = 0.45;
      ctx.fillStyle = "#9fbeff";
      ctx.beginPath();
      ctx.ellipse(p.x, p.y - 44, 58, 24, p.tilt, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawAttackDebug() {
    if (!runtime.debugDraw.hitBox) return;
    const hbs = activeAttackHitBoxes();
    if (!hbs.length) return;

    for (const hb of hbs) {
      ctx.save();
      ctx.strokeStyle = "rgba(255, 90, 90, 0.9)";
      ctx.lineWidth = 2;
      if (hb.shape === "circle") {
        ctx.beginPath();
        ctx.arc(hb.cx, hb.cy, hb.r, 0, Math.PI * 2);
        ctx.stroke();
      } else if (hb.shape === "sector") {
        ctx.beginPath();
        ctx.moveTo(hb.cx, hb.cy);
        ctx.arc(hb.cx, hb.cy, hb.radius, hb.start, hb.end);
        ctx.closePath();
        ctx.stroke();
      } else {
        ctx.strokeRect(hb.x, hb.y, hb.w, hb.h);
      }
      ctx.restore();
    }
  }

  function drawUi() {
    const combo = player.attackData
      ? `${player.attackData.definition.name} ${player.debug.attackFrame}f ${player.debug.attackPhase}`
      : "なし";

    const latest = runtime.hitLogs.length ? runtime.hitLogs[runtime.hitLogs.length - 1] : null;
    const hitLog = latest ? `${latest.attackerId}->${latest.targetId} ${latest.attackType} dmg:${latest.damage}` : "なし";

    statusText.textContent =
      `State:${player.mainState} | 接地:${player.grounded ? "地上" : "空中"} | ` +
      `速度:${player.vx.toFixed(1)},${player.vy.toFixed(1)} | Dash残:${player.debug.dashLeft}f | ` +
      `加速度:${player.debug.appliedAccel.toFixed(1)} | 入力受付:${player.debug.accepts} | ` +
      `Atk:${combo} | HitBox:${player.debug.activeHitBoxes} | Hit済:${player.debug.lastHitTargetIds} | Hit:${player.debug.lastHit ? "Y" : "N"} | 崩し付与:${player.debug.breakApplied ? "Y" : "N"} | ` +
      `Charge:${player.debug.chargeActive ? "ON" : "OFF"} Lv:${player.debug.chargeLevel} Time:${player.debug.chargeFrames}f | 移動補正:${player.debug.moveSpeedScale.toFixed(2)} | ` +
      `Combo受:${player.debug.comboOpen ? "ON" : "OFF"} | Cancel受:${player.debug.cancelOpen ? "ON" : "OFF"} | Hitstop:${player.hitstopFrames} | HitLog:${hitLog}`;
  }

  function render() {
    ctx.clearRect(0, 0, world.width, world.height);

    let sx = 0;
    let sy = 0;
    if (runtime.screenShakeFrames > 0 && runtime.screenShakePower > 0) {
      sx = (Math.random() * 2 - 1) * runtime.screenShakePower;
      sy = (Math.random() * 2 - 1) * runtime.screenShakePower * 0.5;
    }

    ctx.save();
    ctx.translate(sx, sy);
    drawBackground();
    drawGround();
    drawTargets();
    drawPlayer();
    drawAttackDebug();
    ctx.restore();

    drawUi();
  }

  let lastTime = performance.now();
  let acc = 0;

  function loop(now) {
    const frameDt = clamp((now - lastTime) / 1000, 0, 0.1);
    lastTime = now;
    acc += frameDt;

    while (acc >= DT) {
      fixedUpdate();
      acc -= DT;
    }

    render();
    requestAnimationFrame(loop);
  }

  window.addEventListener("resize", resize);
  window.addEventListener("keydown", (e) => {
    if (["Space", "KeyW", "KeyA", "KeyS", "KeyD", "ShiftLeft", "ShiftRight", "KeyQ", "KeyE", "KeyR", "KeyH"].includes(e.code)) {
      e.preventDefault();
    }
    queueInputEvent({ code: e.code, isDown: true });
  });
  window.addEventListener("keyup", (e) => {
    queueInputEvent({ code: e.code, isDown: false });
  });

  canvas.addEventListener("contextmenu", (e) => e.preventDefault());
  canvas.addEventListener("mousedown", (e) => {
    if (e.button === 0) queueInputEvent({ code: "Mouse0", isDown: true });
    if (e.button === 2) queueInputEvent({ code: "Mouse2", isDown: true });
  });
  canvas.addEventListener("mouseup", (e) => {
    if (e.button === 0) queueInputEvent({ code: "Mouse0", isDown: false });
    if (e.button === 2) queueInputEvent({ code: "Mouse2", isDown: false });
  });

  async function boot() {
    try {
      await loadAllConfigs();

      const ch = characters[player.meta.charKey];
      const weapon = weapons[ch.weaponKey];

      const [charImg, weaponImg, ...bg] = await Promise.all([
        loadImage(ch.imagePath),
        loadImage(weapon.imagePath),
        ...backgroundPaths.map((p) => loadImage(p))
      ]);

      runtime.charImg = charImg;
      runtime.weaponImg = weaponImg;
      runtime.backgrounds = bg;

      resize();

      runtime.targets = [
        { id: "enemy_1", worldX: player.worldOffset + player.x + 240, y: player.groundY - 28, r: 22, flash: 0 },
        { id: "enemy_2", worldX: player.worldOffset + player.x - 220, y: player.groundY - 28, r: 22, flash: 0 }
      ];

      runtime.combatEntities = [
        createCombatEntity({
          id: "player",
          name: "Player",
          faction: "player",
          layer: "default",
          worldX: player.worldOffset + player.x,
          y: player.groundY - 28,
          radius: 22,
          hp: 999,
          hurtBoxes: [
            { shape: "circle", ox: 0, oy: 0, r: 20, layer: "default" }
          ],
          OnHit(info) {
            if (player.invincible || !player.canBeHurt) return { accepted: false, reason: "player-invincible" };
            const takenScale = isChargingPrimary() ? (player.chargeData.damageTakenScale || 1.2) : 1;
            const scaledDamage = Math.round((info.damage || 0) * takenScale * 10) / 10;
            player.pendingHurt = {
              kind: info.hitAttribute === "launch" ? "launch" : "stagger",
              frames: info.hitAttribute === "launch" ? 26 : 18,
              knockbackX: Math.abs(info.knockbackDirection.x) * info.knockbackPower,
              knockbackY: info.knockbackDirection.y < 0 ? -220 : -120,
              invulFrames: 14,
              damage: scaledDamage
            };
            return { accepted: true };
          }
        }),
        ...runtime.targets.map((t) => createCombatEntity({
          id: t.id,
          name: t.id,
          faction: "enemy",
          layer: "default",
          worldX: t.worldX,
          y: t.y,
          radius: t.r,
          hp: 120,
          hurtBoxes: [
            { shape: "circle", ox: 0, oy: 0, r: t.r, layer: "default" }
          ]
        }))
      ];

      HitEventBus.on("hitstop", (ev) => {
        player.hitstopFrames = Math.max(player.hitstopFrames, ev.frames || 0);
      });

      fsm = new FSM(createStates(), "Idle");

      requestAnimationFrame((t) => {
        lastTime = t;
        loop(t);
      });
    } catch (err) {
      statusText.textContent = `初期化エラー: ${err.message}`;
      console.error(err);
    }
  }

  boot();
})();





















































