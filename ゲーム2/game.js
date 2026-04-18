const SETTINGS_KEY = "axar_top_settings_v1";
const COLOR_HEX = {
  red: "#ff0000",
  green: "#00ff00",
  blue: "#0000ff",
  yellow: "#ffff00",
};
const COLOR_JP = {
  red: "赤",
  green: "緑",
  blue: "青",
  yellow: "黄",
};

const imagePromiseCache = new Map();

const DRAW_TYPES = new Set(["draw2", "draw4"]);
const RESTRICTED_BY_MON = new Set(["draw2", "draw4", "kybi", "knife"]);

const CHARACTERS = [
  { name: "サテラ", overlay: "./images/サテラ/サテラ_通常.png", cutin: "./images/cut_in/サテラ_カットイン.png" },
  { name: "アカウ", overlay: "./images/アカウ/アカウ_通常.png", cutin: "./images/cut_in/アカウ_カットイン.png" },
  { name: "コト", overlay: "./images/コト/コト_通常.png", cutin: "./images/cut_in/コト_カットイン.png" },
  { name: "アーシャ", overlay: "./images/アーシャ/アーシャ_通常.png", cutin: "./images/cut_in/アーシャ_カットイン.png" },
  { name: "アルカ", overlay: "./images/アルカ/アルカ_通常.png", cutin: "./images/cut_in/アルカ_カットイン.png" },
  { name: "チサ", overlay: "./images/チサ/チサ_通常.png", cutin: "./images/cut_in/チサ_カットイン.png" },
];

const state = {
  settings: loadSettings(),
  players: [],
  deck: [],
  discard: [],
  currentIndex: 0,
  direction: 1,
  skipCount: 0,
  activeColor: "red",
  gameOver: false,
  waitingHuman: false,
  pendingWildCardId: null,
  artCache: new Map(),
  idCounter: 1,
  cutinTimer: null,
  pendingAttack: {
    amount: 0,
    unblockable: false,
    label: "",
    sourceName: null,
    sourceType: null,
    sourceColor: null,
  },
  monLock: {
    active: false,
    ownerName: null,
    remaining: 0,
  },
  turnSkillContext: {
    playerName: null,
    kotoIntuition: false,
  },
  expressionStateByName: new Map(),
  initialExpressionLocked: true,
  chatByScene: new Map(),
};

const tableStage = document.getElementById("tableStage");
const gameScreen = document.getElementById("gameScreen");
const characterLayer = document.getElementById("characterLayer");
const countLayer = document.getElementById("countLayer");
const drawPile = document.getElementById("drawPile");
const drawAction = document.getElementById("drawAction");
const discardImage = document.getElementById("discardImage");
const drawCount = document.getElementById("drawCount");
const handCards = document.getElementById("handCards");
const turnInfo = document.getElementById("turnInfo");
const colorInfo = document.getElementById("colorInfo");
const attackInfo = document.getElementById("attackInfo");
const speechName = document.getElementById("speechName");
const speechLine = document.getElementById("speechLine");
const chatScene = document.getElementById("chatScene");
const chatSpeaker = document.getElementById("chatSpeaker");
const chatText = document.getElementById("chatText");
const chatLog = document.getElementById("chatLog");
const colorPicker = document.getElementById("colorPicker");
const cutinWrap = document.getElementById("cutinWrap");
const cutinImage = document.getElementById("cutinImage");
const ruleChips = document.getElementById("ruleChips");
const backTop = document.getElementById("backTop");
const resultOverlay = document.getElementById("resultOverlay");
const resultTitle = document.getElementById("resultTitle");
const resultList = document.getElementById("resultList");
const resultBackTop = document.getElementById("resultBackTop");
const resultClose = document.getElementById("resultClose");
const skillFxWrap = document.getElementById("skillFxWrap");
const skillFxTitle = document.getElementById("skillFxTitle");
const skillFxSub = document.getElementById("skillFxSub");
const kybiWrap = document.getElementById("kybiWrap");
const kybiResult = document.getElementById("kybiResult");
const sidePanel = document.getElementById("sidePanel");
const mobileInfoToggle = document.getElementById("mobileInfoToggle");
const mobileSidebarClose = document.getElementById("mobileSidebarClose");
const mobileSidebarBackdrop = document.getElementById("mobileSidebarBackdrop");

function isMobileViewport() {
  return window.matchMedia("(max-width: 960px)").matches;
}

function setMobileSidebarOpen(open) {
  if (!gameScreen) return;

  const shouldOpen = Boolean(open);
  gameScreen.classList.toggle("mobile-sidebar-open", shouldOpen);

  if (mobileInfoToggle) {
    mobileInfoToggle.setAttribute("aria-expanded", shouldOpen ? "true" : "false");
    mobileInfoToggle.textContent = shouldOpen ? "情報を格納" : "情報を展開";
  }

  if (sidePanel) {
    const hidden = isMobileViewport() && !shouldOpen;
    sidePanel.setAttribute("aria-hidden", hidden ? "true" : "false");
  }
}

function closeMobileSidebar() {
  setMobileSidebarOpen(false);
}

function loadSettings() {
  const defaults = {
    character: "サテラ",
    knifeCard: true,
    kybiCard: true,
    monCard: true,
    skillEnabled: true,
  };

  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return defaults;
    return {
      character: typeof parsed.character === "string" ? parsed.character : defaults.character,
      knifeCard: Boolean(parsed.knifeCard),
      kybiCard: Boolean(parsed.kybiCard),
      monCard: Boolean(parsed.monCard),
      skillEnabled: Boolean(parsed.skillEnabled),
    };
  } catch {
    return defaults;
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let skillFxTimer = null;

function showSkillEffect(playerName, effectName, detail = "") {
  if (!skillFxWrap || !skillFxTitle || !skillFxSub) return;

  skillFxTitle.textContent = `${playerName} SKILL`;
  skillFxSub.textContent = detail ? `${effectName} - ${detail}` : effectName;

  skillFxWrap.classList.remove("show");
  // reflow to restart animation reliably
  void skillFxWrap.offsetWidth;
  skillFxWrap.classList.add("show");

  clearTimeout(skillFxTimer);
  skillFxTimer = setTimeout(() => {
    skillFxWrap.classList.remove("show");
  }, 1100);
}

function shuffle(array) {
  const clone = [...array];
  for (let i = clone.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [clone[i], clone[j]] = [clone[j], clone[i]];
  }
  return clone;
}

function loadImage(src) {
  if (imagePromiseCache.has(src)) {
    return imagePromiseCache.get(src);
  }

  const promise = new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

  imagePromiseCache.set(src, promise);
  return promise;
}

function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  return {
    r: Number.parseInt(clean.slice(0, 2), 16),
    g: Number.parseInt(clean.slice(2, 4), 16),
    b: Number.parseInt(clean.slice(4, 6), 16),
  };
}

async function recolorBlackToColor(src, colorHex) {
  const image = await loadImage(src);
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(image, 0, 0);

  const { r, g, b } = hexToRgb(colorHex);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3];
    if (alpha === 0) continue;

    if (data[i] === 0 && data[i + 1] === 0 && data[i + 2] === 0) {
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL("image/png");
}

function getWildResolvedKey(type, color) {
  return `${type}:${color}`;
}

async function ensureWildResolvedArt(type, color) {
  if (!color) return null;
  if (type !== "wild" && type !== "draw4") return null;

  const key = getWildResolvedKey(type, color);
  if (state.artCache.has(key)) {
    return state.artCache.get(key);
  }

  const src = type === "wild" ? "./images/カード/wild.png" : "./images/カード/draw4.png";
  const url = await recolorBlackToColor(src, COLOR_HEX[color]);
  state.artCache.set(key, url);
  return url;
}

async function buildCardArts() {
  const uncoloredBases = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "draw2", "reverse", "skip"];
  const colors = ["red", "green", "blue", "yellow"];

  const tasks = [];
  for (const base of uncoloredBases) {
    for (const color of colors) {
      const key = `${base}:${color}`;
      const src = `./images/カード/uncolored/${base}.png`;
      tasks.push(
        recolorBlackToColor(src, COLOR_HEX[color]).then((url) => {
          state.artCache.set(key, url);
        }),
      );
    }
  }

  await Promise.all(tasks);

  // ワイルド/ドロー4の色付き差分は実際に色確定した時点で遅延生成する
  state.artCache.set("wild", "./images/カード/wild.png");
  state.artCache.set("draw4", "./images/カード/draw4.png");
  state.artCache.set("knife_red", "./images/カード/knife_red.png");
  state.artCache.set("knife_blue", "./images/カード/knife_white.png");
  state.artCache.set("kybi", "./images/カード/kybi.png");
  state.artCache.set("mon", "./images/カード/mon.png");
}

function buildPlayers() {
  const selected = state.settings.character;
  const orderedNames = [selected, ...CHARACTERS.map((c) => c.name).filter((name) => name !== selected)];

  state.players = orderedNames.map((name, index) => ({
    name,
    isHuman: index === 0,
    hand: [],
  }));
}

function getPlayerByName(name) {
  return state.players.find((player) => player.name === name) || null;
}

function formatSceneLabel(scene) {
  const labels = {
    conversation: "会話",
    Axar: "Axar",
    draw: "ドロー被弾",
    large_hand: "手札過多",
    wild: "ワイルド",
    knife: "ナイフ",
    kybi: "キュビ",
    mon: "モン",
    akau_skill: "アカウスキル",
    koto_skill: "コトスキル",
    satella_skill: "サテラスキル",
    arsha_skill: "アーシャスキル",
    arka_skill: "アルカスキル",
    chisa_skill: "チサスキル",
    win: "勝利",
    lose: "敗北",
  };
  return labels[scene] || "会話";
}

function formatChatText(text, replacements = {}) {
  let output = String(text || "");
  for (const [key, value] of Object.entries(replacements)) {
    output = output.replaceAll(`\${${key}}`, String(value));
  }
  return output;
}

function applyChatMessage(message) {
  if (!chatScene || !chatSpeaker || !chatText) return;

  chatScene.textContent = formatSceneLabel(message.scene);
  chatSpeaker.textContent = message.speaker || "System";
  chatText.textContent = message.text || "";

  if (!chatLog) return;

  const item = document.createElement("div");
  item.className = "chat-log-item";

  const meta = document.createElement("div");
  meta.className = "chat-log-meta";
  meta.textContent = `[${formatSceneLabel(message.scene)}] ${message.speaker || "System"}`;

  const line = document.createElement("div");
  line.className = "chat-log-line";
  line.textContent = message.text || "";

  item.appendChild(meta);
  item.appendChild(line);
  chatLog.prepend(item);

  const maxLogItems = 120;
  while (chatLog.childElementCount > maxLogItems) {
    chatLog.removeChild(chatLog.lastElementChild);
  }

  chatLog.scrollTop = 0;
}

function enqueueChatMessage(scene, speaker, text) {
  if (!text) return;
  applyChatMessage({ scene, speaker, text });
}

function parseChatByScene(raw) {
  const result = new Map();
  if (!Array.isArray(raw)) return result;

  let currentScene = null;
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;

    if (typeof item.scene === "string") {
      currentScene = item.scene;
      if (!result.has(currentScene)) {
        result.set(currentScene, []);
      }
      continue;
    }

    if (!currentScene) continue;
    result.get(currentScene).push(item);
  }

  return result;
}

async function loadChatScript() {
  try {
    const response = await fetch("./chat.json", { cache: "no-store" });
    if (!response.ok) return;
    const json = await response.json();
    state.chatByScene = parseChatByScene(json);
  } catch (error) {
    console.warn("chat.json の読み込みに失敗しました", error);
  }
}

function getSceneEntries(scene) {
  return state.chatByScene.get(scene) || [];
}

function getOtherPlayers(baseName) {
  return state.players.filter((player) => player.name !== baseName);
}

function getNextPlayerOfCurrentTurn() {
  const len = state.players.length;
  if (len === 0) return null;
  const nextIndex = (state.currentIndex + state.direction + len) % len;
  return state.players[nextIndex] || null;
}

function getFirstPlacePlayers(excludeName = null) {
  const minCards = getLeastCardsCount();
  return state.players.filter((player) => player.hand.length === minCards && player.name !== excludeName);
}

function getSecondPlacePlayers(excludeName = null) {
  if (state.players.length <= 1) return [];

  const uniqueCounts = [...new Set(state.players.map((player) => player.hand.length))].sort((a, b) => a - b);
  if (uniqueCounts.length < 2) return [];

  const second = uniqueCounts[1];
  return state.players.filter((player) => player.hand.length === second && player.name !== excludeName);
}

function getLastPlacePlayers(excludeName = null) {
  const maxCards = getMostCardsCount();
  return state.players.filter((player) => player.hand.length === maxCards && player.name !== excludeName);
}

function queueSceneDialogue(scene, characterA, characterB = null, replacements = {}) {
  const entries = getSceneEntries(scene);
  if (entries.length === 0) return false;

  let candidates = entries.filter((entry) => entry.character_A === characterA && entry.character_B === characterB);
  if (candidates.length === 0) {
    candidates = entries.filter((entry) => entry.character_A === characterA);
  }
  if (candidates.length === 0) return false;

  const entry = randomChoice(candidates);
  if (!entry || !Array.isArray(entry.dialogues) || entry.dialogues.length === 0) return false;

  const picked = randomChoice(entry.dialogues);
  if (!picked) return false;

  if (picked.A) {
    enqueueChatMessage(scene, characterA, formatChatText(picked.A, replacements));
  }
  if (picked.B) {
    enqueueChatMessage(scene, characterB || entry.character_B || "B", formatChatText(picked.B, replacements));
  }
  return true;
}

function queueSceneDeclaration(scene, character, keys, replacements = {}) {
  const entries = getSceneEntries(scene).filter((entry) => entry.character === character);
  if (entries.length === 0) return false;

  const entry = randomChoice(entries);
  if (!entry) return false;

  let list = null;
  for (const key of keys) {
    if (Array.isArray(entry[key])) {
      list = entry[key];
      break;
    }
  }

  if (!list) {
    const fallbackKey = Object.keys(entry).find((key) => key.endsWith("_declarations") && Array.isArray(entry[key]));
    if (fallbackKey) list = entry[fallbackKey];
  }

  if (!list || list.length === 0) return false;

  const picked = randomChoice(list);
  if (!picked || !picked.text) return false;

  enqueueChatMessage(scene, character, formatChatText(picked.text, replacements));
  return true;
}

function triggerConversationScene(player) {
  const partner = getNextPlayerOfCurrentTurn() || randomChoice(getOtherPlayers(player.name));
  queueSceneDialogue("conversation", player.name, partner ? partner.name : null);
}

function triggerLargeHandScene(player) {
  if (player.hand.length < 10) return;
  const partner = randomChoice(getOtherPlayers(player.name));
  queueSceneDialogue("large_hand", player.name, partner ? partner.name : null);
}

function triggerDrawScene(player, sourceName) {
  const partner = sourceName || (randomChoice(getOtherPlayers(player.name)) || {}).name || null;
  queueSceneDialogue("draw", player.name, partner);
}

function triggerWildScene(player, color) {
  queueSceneDeclaration("wild", player.name, ["color_change_declarations"], { color: COLOR_JP[color] || String(color) });
}

function triggerKnifeScene(player, knifeColor) {
  const key = knifeColor === "red" ? "red_knife_declarations" : "white_knife_declarations";
  queueSceneDeclaration("knife", player.name, [key]);
}

function triggerKybiScene(player) {
  const partner = randomChoice(getOtherPlayers(player.name));
  queueSceneDialogue("kybi", player.name, partner ? partner.name : null);
}

function triggerMonScene(player) {
  const partner = randomChoice(getOtherPlayers(player.name));
  queueSceneDialogue("mon", player.name, partner ? partner.name : null);
}

function triggerAkauSkillScene(player) {
  const first = randomChoice(getFirstPlacePlayers(player.name));
  if (!first) return;
  queueSceneDialogue("akau_skill", player.name, first.name);
}

function triggerChisaSkillScene(player) {
  const second = randomChoice(getSecondPlacePlayers(player.name));
  if (!second) return;
  queueSceneDialogue("chisa_skill", player.name, second.name);
}

function triggerWinScene(player) {
  queueSceneDeclaration("win", player.name, ["win_declarations"]);
}

function triggerLoseScene(player) {
  queueSceneDeclaration("lose", player.name, ["lose_declarations"]);
}

function buildOverlayPath(characterName, variant) {
  return `./images/${characterName}/${characterName}_${variant}.png`;
}

function getExpressionBucket(player) {
  if (!player) return "normal";

  if (player.hand.length >= 10) {
    return "sad";
  }

  if (isFirstPlace(player)) {
    return "happy";
  }

  return "middle";
}

function chooseExpressionVariant(player) {
  if (state.initialExpressionLocked) {
    state.expressionStateByName.set(player.name, {
      bucket: "initial",
      handLength: player.hand.length,
      variant: "通常",
    });
    return "通常";
  }

  const bucket = getExpressionBucket(player);
  const prev = state.expressionStateByName.get(player.name);

  if (bucket === "sad") {
    state.expressionStateByName.set(player.name, {
      bucket,
      handLength: player.hand.length,
      variant: "悲しみ",
    });
    return "悲しみ";
  }

  if (bucket === "happy") {
    state.expressionStateByName.set(player.name, {
      bucket,
      handLength: player.hand.length,
      variant: "喜び",
    });
    return "喜び";
  }

  let variant = "通常";
  if (prev && prev.bucket === "middle" && prev.handLength === player.hand.length) {
    variant = prev.variant;
  } else {
    variant = Math.random() < 0.5 ? "通常" : "企み";
  }

  state.expressionStateByName.set(player.name, {
    bucket,
    handLength: player.hand.length,
    variant,
  });
  return variant;
}

function makeCard(type, color, value, imageKey) {
  const image = state.artCache.get(imageKey) || imageKey;
  const card = {
    id: `card_${state.idCounter}`,
    type,
    color,
    value,
    image,
    baseImage: image,
  };
  state.idCounter += 1;
  return card;
}

function buildDeck() {
  const deck = [];
  const colors = ["red", "blue", "green", "yellow"];

  for (const color of colors) {
    deck.push(makeCard("number", color, 0, `0:${color}`));
    for (let n = 1; n <= 9; n += 1) {
      deck.push(makeCard("number", color, n, `${n}:${color}`));
      deck.push(makeCard("number", color, n, `${n}:${color}`));
    }

    for (const type of ["draw2", "reverse", "skip"]) {
      deck.push(makeCard(type, color, type, `${type}:${color}`));
      deck.push(makeCard(type, color, type, `${type}:${color}`));
    }
  }

  for (let i = 0; i < 4; i += 1) {
    deck.push(makeCard("wild", null, "wild", "wild"));
    deck.push(makeCard("draw4", null, "draw4", "draw4"));
  }

  if (state.settings.knifeCard) {
    for (let i = 0; i < 3; i += 1) {
      deck.push(makeCard("knife", "red", "knife", "knife_red"));
      deck.push(makeCard("knife", "blue", "knife", "knife_blue"));
    }
  }

  if (state.settings.kybiCard) {
    for (let i = 0; i < 3; i += 1) {
      deck.push(makeCard("kybi", "green", "kybi", "kybi"));
    }
  }

  if (state.settings.monCard) {
    for (let i = 0; i < 3; i += 1) {
      deck.push(makeCard("mon", "yellow", "mon", "mon"));
    }
  }

  state.deck = shuffle(deck);
}

function topCard() {
  return state.discard[state.discard.length - 1] || null;
}

function randomChoice(items) {
  if (!items || items.length === 0) return null;
  return items[Math.floor(Math.random() * items.length)] || null;
}

function getMostCardsCount() {
  if (state.players.length === 0) return 0;
  return Math.max(...state.players.map((player) => player.hand.length));
}

function getLeastCardsCount() {
  if (state.players.length === 0) return 0;
  return Math.min(...state.players.map((player) => player.hand.length));
}

function getRankByPlayerName() {
  const sorted = [...state.players].sort((a, b) => {
    if (a.hand.length !== b.hand.length) return a.hand.length - b.hand.length;
    return CHARACTERS.findIndex((c) => c.name === a.name) - CHARACTERS.findIndex((c) => c.name === b.name);
  });

  const rankMap = new Map();
  let prevCount = null;
  let currentRank = 1;

  for (let i = 0; i < sorted.length; i += 1) {
    const player = sorted[i];
    if (prevCount !== null && player.hand.length !== prevCount) {
      currentRank = i + 1;
    }
    rankMap.set(player.name, currentRank);
    prevCount = player.hand.length;
  }

  return rankMap;
}

function isLastPlace(player) {
  return player.hand.length === getMostCardsCount();
}

function isFirstPlace(player) {
  return player.hand.length === getLeastCardsCount();
}

function getLowestPlayers(excludeName = null) {
  const maxCards = getMostCardsCount();
  return state.players.filter((player) => player.hand.length === maxCards && player.name !== excludeName);
}

function getLuckWeightMultiplier(player) {
  if (!state.settings.skillEnabled) return 1;

  if (player.name === "アカウ" && isLastPlace(player)) {
    return 2.2;
  }

  if (player.name === "チサ" && isFirstPlace(player)) {
    return 2.2;
  }

  return 1;
}

function isDrawOrWildCard(card) {
  return card.type === "draw2" || card.type === "draw4" || card.type === "wild";
}

function chooseWeightedCard(player, cards, options = {}) {
  if (!cards || cards.length === 0) return null;
  const luckMultiplier = getLuckWeightMultiplier(player);
  const intuitionBoost = options.kotoIntuition ? 1.8 : 1;

  let total = 0;
  const weighted = cards.map((card) => {
    let weight = 1;
    if (isDrawOrWildCard(card)) {
      weight *= luckMultiplier;
      weight *= intuitionBoost;
    }
    total += weight;
    return { card, weight };
  });

  if (total <= 0) return randomChoice(cards);

  let threshold = Math.random() * total;
  for (const item of weighted) {
    threshold -= item.weight;
    if (threshold <= 0) {
      return item.card;
    }
  }

  return weighted[weighted.length - 1].card;
}

function ensureDeckHasCards() {
  if (state.deck.length > 0) return;
  if (state.discard.length <= 1) return;

  const last = state.discard.pop();
  state.deck = shuffle(state.discard);
  state.discard = [last];
}

function drawCards(player, count) {
  const drawn = [];
  for (let i = 0; i < count; i += 1) {
    ensureDeckHasCards();
    const card = state.deck.pop();
    if (!card) break;

    // ワイルド系は色確定前の見た目へ戻す
    if ((card.type === "wild" || card.type === "draw4") && card.baseImage) {
      card.image = card.baseImage;
    }

    player.hand.push(card);
    drawn.push(card);
  }
  return drawn;
}

async function applyResolvedWildArt(card, color) {
  if (!card || !color) return;
  if (card.type !== "wild" && card.type !== "draw4") return;

  const coloredImage = await ensureWildResolvedArt(card.type, color);
  if (coloredImage) {
    card.image = coloredImage;
  }
}

function getAdjustedDrawCountBySkill(player, requestedCount) {
  if (!state.settings.skillEnabled) return requestedCount;
  if (requestedCount <= 1) return requestedCount;

  if (player.name === "アーシャ" && Math.random() < (0.35 / 3)) {
    showSkillEffect(player.name, "ドロー半減", `${requestedCount} -> ${Math.max(1, Math.floor(requestedCount / 2))}`);
    return Math.max(1, Math.floor(requestedCount / 2));
  }

  return requestedCount;
}

function drawCardsInGame(player, count) {
  const adjusted = getAdjustedDrawCountBySkill(player, count);
  return {
    cards: drawCards(player, adjusted),
    requested: count,
    actual: adjusted,
  };
}

function preventSkillFinish() {
  for (const player of state.players) {
    if (player.hand.length === 0) {
      drawCards(player, 1);
    }
  }
}

function dealInitialHands() {
  for (let r = 0; r < 7; r += 1) {
    for (const player of state.players) {
      drawCards(player, 1);
    }
  }
}

function initializeDiscard() {
  let first = state.deck.pop();
  while (first && (first.type === "wild" || first.type === "draw4" || first.type === "kybi" || first.type === "mon" || first.type === "knife")) {
    state.deck.unshift(first);
    first = state.deck.pop();
  }

  if (!first) {
    first = makeCard("number", "red", 0, "0:red");
  }

  state.discard = [first];
  state.activeColor = first.color || "red";
}

function isMonRestrictionActive() {
  return state.monLock.active;
}

function canUseCardUnderMon(card) {
  if (!isMonRestrictionActive()) return true;
  return !RESTRICTED_BY_MON.has(card.type);
}

function isPlayableRegular(card) {
  if (!card) return false;
  if (!canUseCardUnderMon(card)) return false;

  // ワイルドとドロー4は例外
  if (card.type === "wild" || card.type === "draw4") return true;

  const top = topCard();
  if (!top) return true;

  // 同じ色
  if (card.color && card.color === state.activeColor) return true;

  // 同じ数字
  if (card.type === "number" && top.type === "number") {
    return card.value === top.value;
  }

  // 同じ記号
  const symbolTypes = new Set(["draw2", "reverse", "skip", "knife", "kybi", "mon"]);
  if (symbolTypes.has(card.type) && symbolTypes.has(top.type)) {
    return card.type === top.type;
  }

  return false;
}

function canRespondToAttack(card) {
  if (!card) return false;
  if (!canUseCardUnderMon(card)) return false;

  // draw4 を受けている時は draw2 では重ねられない
  if (state.pendingAttack.amount > 0 && state.pendingAttack.sourceType === "draw4" && card.type === "draw2") {
    return false;
  }

  if (state.pendingAttack.amount > 0) {
    const sourceType = state.pendingAttack.sourceType;
    const sourceColor = state.pendingAttack.sourceColor;

    const sourceIsKnife = sourceType === "knife";
    const sourceIsDraw4 = sourceType === "draw4";
    const sourceIsColoredDraw = sourceType === "draw2";
    const incomingIsKnife = card.type === "knife";
    const incomingIsColoredDraw = card.type === "draw2";

    // draw4 指定色に合わないナイフは重ね不可
    if (sourceIsDraw4 && incomingIsKnife) {
      if (sourceColor && card.color && sourceColor !== card.color) {
        return false;
      }
    }

    // ナイフと色違いのドロー2（draw4除く）は重ね不可
    if ((sourceIsKnife && incomingIsColoredDraw) || (sourceIsColoredDraw && incomingIsKnife)) {
      if (sourceColor && card.color && sourceColor !== card.color) {
        return false;
      }
    }
  }

  return card.type === "knife" || DRAW_TYPES.has(card.type);
}

function countHandColors(player) {
  const counts = { red: 0, green: 0, blue: 0, yellow: 0 };
  if (!player) return counts;

  for (const card of player.hand) {
    if (card.color && counts[card.color] !== undefined) {
      counts[card.color] += 1;
    }
  }

  return counts;
}

function randomColor() {
  const colors = ["red", "green", "blue", "yellow"];
  return randomChoice(colors) || "red";
}

function leastSeenColorInRecentDiscards(limit = 14) {
  const seen = { red: 0, green: 0, blue: 0, yellow: 0 };
  const recent = state.discard.slice(Math.max(0, state.discard.length - limit));
  for (const card of recent) {
    if (card.color && seen[card.color] !== undefined) {
      seen[card.color] += 1;
    }
  }

  let best = "red";
  let bestCount = Number.POSITIVE_INFINITY;
  for (const color of Object.keys(seen)) {
    if (seen[color] < bestCount) {
      best = color;
      bestCount = seen[color];
    }
  }
  return best;
}

function chooseAiColor(player) {
  const counts = { red: 0, green: 0, blue: 0, yellow: 0 };
  const numberSums = { red: 0, green: 0, blue: 0, yellow: 0 };

  for (const card of player.hand) {
    if (card.color && counts[card.color] !== undefined) {
      counts[card.color] += 1;
      if (card.type === "number") {
        numberSums[card.color] += Number(card.value) || 0;
      }
    }
  }

  // コト: 合理性よりフィーリング（赤寄り）
  if (player.name === "コト") {
    if (Math.random() < 0.58) return "red";
    return randomColor();
  }

  // チサ: フィーリング重視（ランダム）
  if (player.name === "チサ") {
    return randomColor();
  }

  // アーシャ: チサが少枚数なら色合わせしてアシスト気味
  if (player.name === "アーシャ") {
    const chisa = getPlayerByName("チサ");
    if (chisa && chisa.hand.length <= 3) {
      const chisaCounts = countHandColors(chisa);
      let supportColor = "red";
      let supportCount = -1;
      for (const color of Object.keys(chisaCounts)) {
        if (chisaCounts[color] > supportCount) {
          supportColor = color;
          supportCount = chisaCounts[color];
        }
      }
      if (supportCount > 0) return supportColor;
    }
  }

  // アルカ: 次プレイヤーが持っていなさそうな色を優先して攪乱
  if (player.name === "アルカ") {
    const nextPlayer = getNextPlayerOfCurrentTurn();
    if (nextPlayer && nextPlayer.name !== player.name) {
      const nextCounts = countHandColors(nextPlayer);
      const recentLeast = leastSeenColorInRecentDiscards(16);

      let sabotageColor = recentLeast;
      let minCount = Number.POSITIVE_INFINITY;
      for (const color of Object.keys(nextCounts)) {
        if (nextCounts[color] < minCount) {
          sabotageColor = color;
          minCount = nextCounts[color];
        } else if (nextCounts[color] === minCount && color === recentLeast) {
          sabotageColor = color;
        }
      }
      return sabotageColor;
    }

    return leastSeenColorInRecentDiscards(16);
  }

  let bestColor = "red";
  let bestCount = -1;
  let bestNumberSum = -1;

  for (const color of Object.keys(counts)) {
    if (
      counts[color] > bestCount
      || (counts[color] === bestCount && numberSums[color] > bestNumberSum)
      || (
        counts[color] === bestCount
        && numberSums[color] === bestNumberSum
        && bestColor === state.activeColor
        && color !== state.activeColor
      )
    ) {
      bestColor = color;
      bestCount = counts[color];
      bestNumberSum = numberSums[color];
    }
  }

  return bestColor;
}

function chooseAiAttackResponseCard(player, responses) {
  if (!responses || responses.length === 0) return null;

  const knifeCards = responses.filter((card) => card.type === "knife");
  const draw4Cards = responses.filter((card) => card.type === "draw4");
  const draw2Cards = responses.filter((card) => card.type === "draw2");

  // 報復優先: 可能なら knife で向きを反転して返す
  if (knifeCards.length > 0) {
    return randomChoice(knifeCards);
  }

  // 次点は負荷の大きい draw4
  if (draw4Cards.length > 0) {
    return randomChoice(draw4Cards);
  }

  if (draw2Cards.length > 0) {
    return randomChoice(draw2Cards);
  }

  return randomChoice(responses);
}

function scoreAiPlayableCard(player, card, context) {
  const {
    colorCounts,
    maxColorCount,
    dangerExists,
    nextPlayerDanger,
    nextPlayerName,
    nextPlayerRank,
    nonWildPlayableCount,
    useKotoIntuition,
  } = context;

  let score = 0;

  // サテラ: 堅実（数字優先、特殊は温存）
  if (player.name === "サテラ") {
    if (card.type === "number") {
      return 72 + (colorCounts[card.color] || 0) * 8;
    }
    if (card.type === "skip" || card.type === "reverse" || card.type === "draw2") {
      return 28 + (nextPlayerDanger ? 10 : 0);
    }
    if (card.type === "knife" || card.type === "mon") {
      return (dangerExists || player.hand.length <= 3) ? 36 : 8;
    }
    if (card.type === "kybi") {
      return 10;
    }
    if (card.type === "wild" || card.type === "draw4") {
      return (nonWildPlayableCount > 0 && player.hand.length > 2) ? 12 : 42;
    }
  }

  // アカウ: 劣勢逆転・対コトヘイト
  if (player.name === "アカウ") {
    if (nextPlayerName === "コト") {
      if (card.type === "draw4") return 150;
      if (card.type === "draw2") return 128;
      if (card.type === "skip") return 118;
      if (card.type === "reverse") return 108;
      if (card.type === "knife") return 102;
    }
    if (nextPlayerRank === 1) {
      if (card.type === "draw4") return 138;
      if (card.type === "draw2") return 122;
      if (card.type === "skip") return 110;
      if (card.type === "reverse") return 98;
    }
  }

  // コト: 直感時は回避札最優先、対アカウ攻撃強化
  if (player.name === "コト") {
    if (useKotoIntuition && (card.type === "skip" || card.type === "reverse" || card.type === "knife")) {
      return 140;
    }
    if (nextPlayerName === "アカウ") {
      if (card.type === "draw4") return 148;
      if (card.type === "draw2") return 130;
      if (card.type === "knife") return 112;
    }
  }

  // アーシャ: 損切りアグレッシブ、キュビ積極
  if (player.name === "アーシャ") {
    if (card.type === "draw4") return 134;
    if (card.type === "draw2") return 118;
    if (card.type === "kybi") return 126;
    if (card.type === "wild") return 100;
    if (card.type === "knife") return 32;
    if (card.type === "mon") return 36;
  }

  // アルカ: 盤面攪乱を最優先
  if (player.name === "アルカ") {
    if (card.type === "draw4") return 146;
    if (card.type === "wild") return 136;
    if (card.type === "draw2") return 124;
    if (card.type === "mon") return 116;
    if (card.type === "kybi") return 108;
    if (card.type === "skip" || card.type === "reverse" || card.type === "knife") return 86;
    if (card.type === "number") return 24;
  }

  // チサ: 早打ち、温存しない
  if (player.name === "チサ") {
    if (card.type === "draw4") return 132;
    if (card.type === "wild") return 128;
    if (card.type === "knife") return 122;
    if (card.type === "mon") return 120;
    if (card.type === "draw2" || card.type === "skip" || card.type === "reverse") return 114;
    if (card.type === "kybi") return 110;
    if (card.type === "number") return 102;
  }

  if (card.type === "number") {
    score = 40;
    score += (colorCounts[card.color] || 0) * 7;
    if ((colorCounts[card.color] || 0) === maxColorCount) score += 8;
    return score;
  }

  if (card.type === "skip") {
    score = 52;
    score += nextPlayerDanger ? 20 : 4;
    return score;
  }

  if (card.type === "reverse") {
    score = 46;
    score += nextPlayerDanger ? 12 : 3;
    return score;
  }

  if (card.type === "draw2") {
    score = 48;
    if (dangerExists) score += 24;
    if (nextPlayerDanger) score += 12;
    if (useKotoIntuition) score += 10;
    return score;
  }

  if (card.type === "knife") {
    score = 34;
    if (nextPlayerDanger) score += 15;
    if (player.hand.length <= 3) score += 8;
    return score;
  }

  if (card.type === "mon") {
    score = 20;
    if (player.hand.length <= 3) score += 42;
    if (dangerExists) score += 26;
    return score;
  }

  if (card.type === "kybi") {
    score = 16;
    if (isLastPlace(player)) score += 40;
    if (dangerExists) score += 25;
    if (isFirstPlace(player)) score -= 28;
    if (player.hand.length <= 3) score -= 18;
    return score;
  }

  if (card.type === "wild") {
    score = 24;
    if (nonWildPlayableCount > 0 && player.hand.length > 3) score -= 28;
    if (dangerExists) score += 16;
    if (player.hand.length <= 2) score += 40;
    if (useKotoIntuition) score += 10;
    return score;
  }

  if (card.type === "draw4") {
    score = 30;
    if (nonWildPlayableCount > 0 && player.hand.length > 3) score -= 34;
    if (dangerExists) score += 30;
    if (player.hand.length <= 2) score += 45;
    if (useKotoIntuition) score += 12;
    return score;
  }

  return 10;
}

function chooseAiNormalCard(player, playable, options = {}) {
  if (!playable || playable.length === 0) return null;

  // チサは出せるなら即出し（フィーリング）
  if (player.name === "チサ") {
    return randomChoice(playable);
  }

  const useKotoIntuition = Boolean(options.kotoIntuition);
  const colorCounts = { red: 0, green: 0, blue: 0, yellow: 0 };
  for (const card of player.hand) {
    if (card.color && colorCounts[card.color] !== undefined) {
      colorCounts[card.color] += 1;
    }
  }

  const maxColorCount = Math.max(...Object.values(colorCounts));
  const dangerExists = state.players.some((p) => p.name !== player.name && p.hand.length <= 2);
  const nextPlayer = getNextPlayerOfCurrentTurn();
  const rankMap = getRankByPlayerName();
  const nextPlayerDanger = Boolean(nextPlayer && nextPlayer.name !== player.name && nextPlayer.hand.length <= 2);
  const nonWildPlayableCount = playable.filter((card) => card.type !== "wild" && card.type !== "draw4").length;

  // サテラはまず数字を堅実に処理
  if (player.name === "サテラ") {
    const numberCards = playable.filter((card) => card.type === "number");
    if (numberCards.length > 0) {
      let best = numberCards[0];
      let bestCount = colorCounts[best.color] || 0;
      for (const card of numberCards) {
        const cnt = colorCounts[card.color] || 0;
        if (cnt > bestCount) {
          best = card;
          bestCount = cnt;
        }
      }
      return best;
    }
  }

  const context = {
    colorCounts,
    maxColorCount,
    dangerExists,
    nextPlayerDanger,
    nextPlayerName: nextPlayer ? nextPlayer.name : null,
    nextPlayerRank: nextPlayer ? (rankMap.get(nextPlayer.name) || null) : null,
    nonWildPlayableCount,
    useKotoIntuition,
  };

  let bestScore = Number.NEGATIVE_INFINITY;
  const bestCards = [];

  for (const card of playable) {
    const score = scoreAiPlayableCard(player, card, context);
    if (score > bestScore) {
      bestScore = score;
      bestCards.length = 0;
      bestCards.push(card);
    } else if (score === bestScore) {
      bestCards.push(card);
    }
  }

  return randomChoice(bestCards.length > 0 ? bestCards : playable);
}

function advanceTurn() {
  const len = state.players.length;
  state.currentIndex = (state.currentIndex + state.direction + len) % len;
}

function setSpeech(name, line) {
  speechName.textContent = name;
  speechLine.textContent = line;
}

function showCutin(characterName) {
  const char = CHARACTERS.find((c) => c.name === characterName);
  if (!char) return;

  cutinImage.src = char.cutin;
  cutinWrap.classList.add("show");
  clearTimeout(state.cutinTimer);
  state.cutinTimer = setTimeout(() => {
    cutinWrap.classList.remove("show");
  }, 1400);
}

function triggerAxar(player) {
  setSpeech(player.name, "Axar!（UNO宣言）");
  const partner = randomChoice(getOtherPlayers(player.name));
  queueSceneDialogue("Axar", player.name, partner ? partner.name : null);
  showCutin(player.name);
}

function endGame(winner) {
  state.gameOver = true;
  state.waitingHuman = false;
  triggerWinScene(winner);
  const loser = randomChoice(getLastPlacePlayers(winner.name));
  if (loser) {
    triggerLoseScene(loser);
  }
  showResultOverlay(winner);
  setSpeech("System", `${winner.name} の勝利です。ゲーム終了。`);
  render();
}

function showResultOverlay(winner) {
  if (!resultOverlay || !resultList) return;

  const rankMap = getRankByPlayerName();
  const rows = [...state.players].sort((a, b) => {
    const rankDiff = (rankMap.get(a.name) || 99) - (rankMap.get(b.name) || 99);
    if (rankDiff !== 0) return rankDiff;
    return a.hand.length - b.hand.length;
  });

  resultList.innerHTML = "";
  for (const player of rows) {
    const row = document.createElement("div");
    row.className = "result-row";

    const icon = document.createElement("img");
    icon.className = "result-icon";
    icon.src = `./images/アイコン/${player.name}.png`;
    icon.alt = player.name;

    const name = document.createElement("div");
    name.className = "result-name";
    name.textContent = player.name;

    const rank = document.createElement("div");
    rank.className = "result-rank";
    rank.textContent = `#${rankMap.get(player.name) || "-"}`;

    const count = document.createElement("div");
    count.className = "result-count";
    count.textContent = `${player.hand.length}枚`;

    row.appendChild(icon);
    row.appendChild(name);
    row.appendChild(rank);
    row.appendChild(count);
    resultList.appendChild(row);
  }

  if (resultTitle) {
    resultTitle.textContent = `リザルト - 勝者: ${winner.name}`;
  }
  resultOverlay.classList.remove("hidden");
}

async function showKybiCoinAnimation(resultText) {
  kybiResult.textContent = "コイントス...";
  kybiWrap.classList.add("show");
  await sleep(940);
  kybiResult.textContent = resultText;
  await sleep(780);
  kybiWrap.classList.remove("show");
}

async function resolveKybi(player) {
  const heads = Math.random() < 0.5;
  if (heads) {
    await showKybiCoinAnimation("表: 自分以外ドロー4");
    for (const target of state.players) {
      if (target.name === player.name) continue;
      drawCardsInGame(target, 4);
    }
    setSpeech(player.name, "キュビ成功。自分以外にドロー4。");
  } else {
    await showKybiCoinAnimation("裏: 自分がドロー4");
    drawCardsInGame(player, 4);
    setSpeech(player.name, "キュビ失敗。自分がドロー4。");
  }

  render();
  await sleep(420);
}

function activateMonLock(owner) {
  state.monLock.active = true;
  state.monLock.ownerName = owner.name;
  state.monLock.remaining = state.players.length - 1;
}

function updateMonLockAfterTurnEnded(player) {
  if (!state.monLock.active) return;
  if (player.name === state.monLock.ownerName) return;

  state.monLock.remaining -= 1;
  if (state.monLock.remaining <= 0) {
    state.monLock.active = false;
    state.monLock.ownerName = null;
    state.monLock.remaining = 0;
    setSpeech("System", "モンカードの制限が解除されました。");
  }
}

async function finishTurn() {
  if (state.gameOver) return;

  const player = state.players[state.currentIndex];
  updateMonLockAfterTurnEnded(player);

  // 初期表示は全員「通常差分」を維持し、最初の手番が終わってから通常ロジックへ戻す
  if (state.initialExpressionLocked) {
    state.initialExpressionLocked = false;
  }

  advanceTurn();
  await nextTurn();
}

function applyDrawAttack(amount, label, sourceName, unblockable = false, sourceType = null, sourceColor = null) {
  state.pendingAttack.amount += amount;
  state.pendingAttack.unblockable = unblockable;
  state.pendingAttack.label = label;
  state.pendingAttack.sourceName = sourceName;
  state.pendingAttack.sourceType = sourceType;
  state.pendingAttack.sourceColor = sourceColor;
}

function clearPendingAttack() {
  state.pendingAttack.amount = 0;
  state.pendingAttack.unblockable = false;
  state.pendingAttack.label = "";
  state.pendingAttack.sourceName = null;
  state.pendingAttack.sourceType = null;
  state.pendingAttack.sourceColor = null;
}

async function resolveAttackDraw(player) {
  const amount = state.pendingAttack.amount;
  if (amount <= 0) return;
  const sourceName = state.pendingAttack.sourceName;

  const result = drawCardsInGame(player, amount);
  triggerDrawScene(player, sourceName);

  if (result.actual < result.requested && player.name === "アーシャ" && sourceName) {
    queueSceneDialogue("arsha_skill", player.name, sourceName);
  }

  if (result.actual < result.requested) {
    setSpeech("System", `${player.name} は ${result.requested} 枚攻撃を ${result.actual} 枚に軽減。`);
  } else {
    setSpeech("System", `${player.name} は ${result.actual} 枚ドロー。`);
  }
  clearPendingAttack();
  render();
  await sleep(620);
  await finishTurn();
}

function getPreviousPlayerOfCurrentTurn() {
  const len = state.players.length;
  if (len === 0) return null;
  const prevIndex = (state.currentIndex - state.direction + len) % len;
  return state.players[prevIndex] || null;
}

async function tryKotoIntuition(player) {
  state.turnSkillContext.playerName = player.name;
  state.turnSkillContext.kotoIntuition = false;

  if (!state.settings.skillEnabled) return;
  if (player.name !== "コト") return;

  const previous = getPreviousPlayerOfCurrentTurn();
  if (!previous) return;

  const hasDrawCard = previous.hand.some((card) => card.type === "draw2" || card.type === "draw4");
  if (!hasDrawCard) return;

  if (Math.random() < (0.15 / 3)) {
    state.turnSkillContext.kotoIntuition = true;
    showSkillEffect(player.name, "直感", `${previous.name}のドローを感知`);
    queueSceneDialogue("koto_skill", player.name, previous.name);
    if (player.isHuman) {
      setSpeech(player.name, `${previous.name} の手札にドローの気配...`);
      render();
      await sleep(430);
    }
  }
}

async function trySatellaBalance(player) {
  if (!state.settings.skillEnabled) return;
  if (player.name !== "サテラ") return;
  if (Math.random() >= (0.14 / 3)) return;

  if (isLastPlace(player)) return;

  const candidates = getLowestPlayers(player.name);
  const target = randomChoice(candidates);
  if (!target || target.hand.length === 0) return;

  const moved = [...target.hand];
  target.hand = [];

  const recipients = state.players.filter((p) => p.name !== target.name);
  while (moved.length > 0 && recipients.length > 0) {
    recipients.sort((a, b) => a.hand.length - b.hand.length);
    const receiver = recipients[0];
    receiver.hand.push(moved.pop());
  }

  preventSkillFinish();

  showSkillEffect(player.name, "均衡分配", `${target.name}の手札を再分配`);
  setSpeech(player.name, `${target.name} のカードを再分配して場を均した。`);
  queueSceneDialogue("satella_skill", player.name, target.name);
  render();
  await sleep(520);
}

async function tryArukaPush(player) {
  if (!state.settings.skillEnabled) return;
  if (player.name !== "アルカ") return;
  if (Math.random() >= (0.18 / 3)) return;

  if (isLastPlace(player)) return;

  const candidates = getLowestPlayers(player.name);
  const target = randomChoice(candidates);
  if (!target) return;

  const donors = state.players.filter((p) => p.name !== player.name && p.name !== target.name && p.hand.length > 5);
  if (donors.length === 0) return;

  const requested = 2 + Math.floor(Math.random() * 3);
  let movedCount = 0;
  while (movedCount < requested) {
    const availableDonors = donors.filter((p) => p.hand.length > 5);
    if (availableDonors.length === 0) break;

    const donor = randomChoice(availableDonors);
    const idx = Math.floor(Math.random() * donor.hand.length);
    const [card] = donor.hand.splice(idx, 1);
    if (!card) break;

    target.hand.push(card);
    movedCount += 1;
  }

  if (movedCount <= 0) return;

  preventSkillFinish();

  showSkillEffect(player.name, "重圧転嫁", `${target.name}へ${movedCount}枚`);
  setSpeech(player.name, `${target.name} に他プレイヤーのカードを ${movedCount} 枚押しつけた。`);
  queueSceneDialogue("arka_skill", player.name, target.name);
  render();
  await sleep(520);
}

async function handleTurnStartSkills(player) {
  if (state.settings.skillEnabled && player.name === "アカウ" && isLastPlace(player)) {
    showSkillEffect(player.name, "逆境強運", "ドロー/ワイルド抽選率UP");
    triggerAkauSkillScene(player);
  }

  if (state.settings.skillEnabled && player.name === "チサ" && isFirstPlace(player)) {
    showSkillEffect(player.name, "追風強運", "ドロー/ワイルド抽選率UP");
    triggerChisaSkillScene(player);
  }

  await tryKotoIntuition(player);
  await trySatellaBalance(player);
  await tryArukaPush(player);
}

async function applyCardEffects(player, card, chosenColor = null, fromAttackResponse = false) {
  if (card.type === "wild" || card.type === "draw4") {
    state.activeColor = chosenColor || state.activeColor || "red";
    await applyResolvedWildArt(card, state.activeColor);
  } else {
    state.activeColor = card.color || state.activeColor;
  }

  switch (card.type) {
    case "draw2": {
      applyDrawAttack(2, "draw", player.name, false, "draw2", card.color);
      setSpeech(player.name, "ドロー2を押しつけた。");
      break;
    }
    case "draw4": {
      applyDrawAttack(4, "draw", player.name, false, "draw4", null);
      triggerWildScene(player, state.activeColor);
      setSpeech(player.name, `ワイルドドロー4。色は${COLOR_JP[state.activeColor]}。`);
      break;
    }
    case "wild": {
      triggerWildScene(player, state.activeColor);
      setSpeech(player.name, `ワイルド。色は${COLOR_JP[state.activeColor]}。`);
      break;
    }
    case "reverse": {
      state.direction *= -1;
      setSpeech(player.name, "リバース。手番方向が逆転。");
      break;
    }
    case "skip": {
      state.skipCount += 1;
      setSpeech(player.name, "スキップを発動。");
      break;
    }
    case "knife": {
      state.direction *= -1;
      triggerKnifeScene(player, card.color);
      if (fromAttackResponse && state.pendingAttack.amount > 0) {
        state.pendingAttack.sourceName = player.name;
        state.pendingAttack.sourceType = "knife";
        state.pendingAttack.sourceColor = card.color;
      }
      if (fromAttackResponse && state.pendingAttack.amount > 0) {
        setSpeech(player.name, "ナイフで反撃してリバース。");
      } else {
        setSpeech(player.name, "ナイフを使用。通常リバース。");
      }
      break;
    }
    case "kybi": {
      triggerKybiScene(player);
      await resolveKybi(player);
      break;
    }
    case "mon": {
      activateMonLock(player);
      triggerMonScene(player);
      setSpeech(player.name, "モン発動。一周の間ドロー系・キュビ・ナイフ禁止。");
      break;
    }
    default: {
      setSpeech(player.name, "カードを出しました。");
      break;
    }
  }
}

async function playCard(player, card, chosenColor = null, fromAttackResponse = false) {
  const index = player.hand.findIndex((c) => c.id === card.id);
  if (index < 0) return;

  player.hand.splice(index, 1);
  state.discard.push(card);

  await applyCardEffects(player, card, chosenColor, fromAttackResponse);

  if (player.hand.length === 1) {
    triggerAxar(player);
  }

  render();
  await sleep(420);

  if (player.hand.length === 0) {
    endGame(player);
    return;
  }

  await finishTurn();
}

function renderCharacterLayer() {
  if (characterLayer.childElementCount === 0) {
    const fragment = document.createDocumentFragment();
    const countFragment = document.createDocumentFragment();

    for (const char of CHARACTERS) {
      const img = document.createElement("img");
      img.className = "char-overlay";
      img.dataset.character = char.name;
      img.src = char.overlay;
      img.alt = "";
      fragment.appendChild(img);

      const count = document.createElement("div");
      count.className = "char-count";
      count.dataset.character = char.name;
      count.textContent = "0";
      countFragment.appendChild(count);
    }

    characterLayer.appendChild(fragment);
    countLayer.appendChild(countFragment);
  }

  const current = state.players[state.currentIndex];
  const rankMap = getRankByPlayerName();
  for (const char of CHARACTERS) {
    const node = characterLayer.querySelector(`[data-character="${char.name}"]`);
    const countNode = countLayer.querySelector(`[data-character="${char.name}"]`);
    if (!node || !countNode) continue;

    const owner = getPlayerByName(char.name);
    if (owner) {
      const rank = rankMap.get(owner.name) || "-";
      countNode.innerHTML = `<span class="char-count-main">${owner.hand.length}</span><span class="char-count-rank">#${rank}</span>`;
    } else {
      countNode.innerHTML = `<span class="char-count-main">0</span><span class="char-count-rank">#-</span>`;
    }

    if (owner) {
      const variant = chooseExpressionVariant(owner);
      const src = buildOverlayPath(char.name, variant);
      if (node.getAttribute("src") !== src) {
        node.src = src;
      }
    }

    node.classList.toggle("current-turn", current && current.name === char.name);
    node.classList.toggle("user-char", state.players[0] && state.players[0].name === char.name);
  }
}

function renderRuleChips() {
  ruleChips.innerHTML = "";

  const chips = [
    `特殊:${state.settings.knifeCard || state.settings.kybiCard || state.settings.monCard ? "ON" : "OFF"}`,
    `ナイフ:${state.settings.knifeCard ? "ON" : "OFF"}`,
    `キュビ:${state.settings.kybiCard ? "ON" : "OFF"}`,
    `モン:${state.settings.monCard ? "ON" : "OFF"}`,
    `スキル:${state.settings.skillEnabled ? "ON" : "OFF"}`,
    `モン制限:${state.monLock.active ? "有効" : "なし"}`,
  ];

  for (const text of chips) {
    const chip = document.createElement("span");
    chip.className = "rule-chip";
    chip.textContent = text;
    ruleChips.appendChild(chip);
  }
}

function renderPiles() {
  drawCount.textContent = String(state.deck.length);

  const top = topCard();
  if (top) {
    discardImage.src = top.image;
    discardImage.alt = `捨て札: ${top.type}`;
  }
}

function renderInfo() {
  const current = state.players[state.currentIndex];
  turnInfo.textContent = `手番: ${current ? current.name : "--"} (${state.direction === 1 ? "時計回り" : "反時計回り"})`;
  colorInfo.textContent = `有効色: ${COLOR_JP[state.activeColor] || "なし"}`;

  if (state.pendingAttack.amount > 0) {
    attackInfo.textContent = `攻撃: ${state.pendingAttack.amount} (${state.pendingAttack.unblockable ? "回避不可" : "押しつけ可能"})`;
  } else {
    attackInfo.textContent = "攻撃: なし";
  }
}

function renderHand() {
  const human = state.players[0];
  handCards.innerHTML = "";

  for (const card of human.hand) {
    const button = document.createElement("button");
    let playable = false;

    if (state.waitingHuman) {
      if (state.pendingAttack.amount > 0 && !state.pendingAttack.unblockable) {
        playable = canRespondToAttack(card);
      } else if (state.pendingAttack.amount === 0) {
        playable = isPlayableRegular(card);
      }
    }

    button.className = `card-btn${playable ? " playable" : ""}`;
    button.type = "button";
    button.disabled = !state.waitingHuman;
    button.dataset.cardId = card.id;

    const img = document.createElement("img");
    img.src = card.image;
    img.alt = `${card.type}`;
    button.appendChild(img);

    handCards.appendChild(button);
  }
}

function render() {
  renderCharacterLayer();
  renderPiles();
  renderInfo();
  renderHand();
  renderRuleChips();
}

async function handleSkipIfNeeded(player) {
  if (state.skipCount <= 0) return false;
  state.skipCount -= 1;
  setSpeech("System", `${player.name} はスキップされました。`);
  render();
  await sleep(520);
  await finishTurn();
  return true;
}

async function handlePendingAttackTurn(player) {
  if (state.pendingAttack.amount <= 0) return false;

  if (state.pendingAttack.unblockable) {
    await resolveAttackDraw(player);
    return true;
  }

  const responses = player.hand.filter((card) => canRespondToAttack(card));

  if (player.isHuman) {
    state.waitingHuman = true;
    if (responses.length > 0) {
      setSpeech(player.name, `攻撃 ${state.pendingAttack.amount}。ドローカードまたはナイフで押しつけ可能。`);
    } else {
      setSpeech(player.name, `攻撃 ${state.pendingAttack.amount}。対応カードなし、山札から引いてください。`);
    }
    render();
    return true;
  }

  await sleep(1300);
  if (responses.length === 0) {
    await resolveAttackDraw(player);
    return true;
  }

  const card = chooseAiAttackResponseCard(player, responses);
  let chosenColor = null;
  if (card.type === "draw4") chosenColor = chooseAiColor(player);
  await playCard(player, card, chosenColor, true);
  return true;
}

async function runAiNormalTurn(player) {
  await sleep(1500);

  const playable = player.hand.filter((card) => isPlayableRegular(card));
  if (playable.length === 0) {
    const drawn = drawCards(player, 1)[0];
    setSpeech(player.name, "山札から1枚引きました。");
    render();
    await sleep(500);

    if (drawn && isPlayableRegular(drawn)) {
      let chosenColor = null;
      if (drawn.type === "wild" || drawn.type === "draw4") {
        chosenColor = chooseAiColor(player);
      }
      await playCard(player, drawn, chosenColor, false);
      return;
    }

    await finishTurn();
    return;
  }

  const useKotoIntuition = state.turnSkillContext.playerName === player.name && state.turnSkillContext.kotoIntuition;
  const card = chooseAiNormalCard(player, playable, { kotoIntuition: useKotoIntuition });
  let chosenColor = null;
  if (card.type === "wild" || card.type === "draw4") {
    chosenColor = chooseAiColor(player);
  }

  await playCard(player, card, chosenColor, false);
}

function openColorPicker(cardId) {
  state.pendingWildCardId = cardId;
  colorPicker.classList.remove("hidden");
}

function closeColorPicker() {
  state.pendingWildCardId = null;
  colorPicker.classList.add("hidden");
}

async function onHumanPlayCard(cardId) {
  if (!state.waitingHuman || state.gameOver) return;

  const human = state.players[0];
  const card = human.hand.find((item) => item.id === cardId);
  if (!card) return;

  if (state.pendingAttack.amount > 0 && !state.pendingAttack.unblockable) {
    if (!canRespondToAttack(card)) {
      setSpeech("System", "この攻撃にはドローカードかナイフでのみ反撃できます。");
      return;
    }

    if (card.type === "draw4") {
      openColorPicker(card.id);
      return;
    }

    state.waitingHuman = false;
    await playCard(human, card, null, true);
    return;
  }

  if (!isPlayableRegular(card)) {
    setSpeech("System", isMonRestrictionActive() ? "モンカード制限中。このカードは使えません。" : "このカードは出せません。");
    return;
  }

  if (card.type === "wild" || card.type === "draw4") {
    openColorPicker(card.id);
    return;
  }

  state.waitingHuman = false;
  await playCard(human, card, null, false);
}

async function onHumanDraw() {
  if (!state.waitingHuman || state.gameOver) return;
  const human = state.players[0];

  if (state.pendingAttack.amount > 0) {
    await resolveAttackDraw(human);
    return;
  }

  drawCardsInGame(human, 1);
  setSpeech(human.name, "山札から1枚引いてターン終了。");
  state.waitingHuman = false;
  render();
  await sleep(420);
  await finishTurn();
}

async function nextTurn() {
  if (state.gameOver) return;

  closeColorPicker();
  render();

  const player = state.players[state.currentIndex];
  triggerConversationScene(player);
  triggerLargeHandScene(player);

  await handleTurnStartSkills(player);
  if (state.gameOver) return;

  if (await handleSkipIfNeeded(player)) {
    return;
  }

  if (await handlePendingAttackTurn(player)) {
    return;
  }

  if (player.isHuman) {
    state.waitingHuman = true;
    setSpeech(player.name, "あなたのターンです。カードを出すか、山札から1枚引いてください。");
    render();
    return;
  }

  state.waitingHuman = false;
  setSpeech(player.name, "思考中...");
  render();
  await runAiNormalTurn(player);
}

function bindEvents() {
  handCards.addEventListener("click", (event) => {
    const button = event.target.closest(".card-btn");
    if (!button) return;
    onHumanPlayCard(button.dataset.cardId);
  });

  drawPile.addEventListener("click", () => {
    onHumanDraw();
  });

  drawAction.addEventListener("click", () => {
    onHumanDraw();
  });

  if (mobileInfoToggle) {
    mobileInfoToggle.addEventListener("click", () => {
      const isOpen = Boolean(gameScreen && gameScreen.classList.contains("mobile-sidebar-open"));
      setMobileSidebarOpen(!isOpen);
    });
  }

  if (mobileSidebarClose) {
    mobileSidebarClose.addEventListener("click", () => {
      closeMobileSidebar();
    });
  }

  if (mobileSidebarBackdrop) {
    mobileSidebarBackdrop.addEventListener("click", () => {
      closeMobileSidebar();
    });
  }

  window.addEventListener("resize", () => {
    if (!isMobileViewport()) {
      closeMobileSidebar();
      if (sidePanel) {
        sidePanel.setAttribute("aria-hidden", "false");
      }
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMobileSidebar();
    }
  });

  colorPicker.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-color]");
    if (!button || !state.pendingWildCardId) return;

    const human = state.players[0];
    const card = human.hand.find((item) => item.id === state.pendingWildCardId);
    if (!card) {
      closeColorPicker();
      return;
    }

    const color = button.dataset.color;
    closeColorPicker();
    state.waitingHuman = false;
    await playCard(human, card, color, state.pendingAttack.amount > 0);
  });

  backTop.addEventListener("click", () => {
    window.location.href = "./index.html";
  });

  if (resultBackTop) {
    resultBackTop.addEventListener("click", () => {
      window.location.href = "./index.html";
    });
  }

  if (resultClose && resultOverlay) {
    resultClose.addEventListener("click", () => {
      resultOverlay.classList.add("hidden");
    });
  }

  tableStage.addEventListener("click", () => {
    if (!state.waitingHuman) return;
    setSpeech("System", "手札または山札を操作してください。");
  });
}

async function initGame() {
  bindEvents();
  closeMobileSidebar();
  setSpeech("System", "カードを準備中...");
  applyChatMessage({ scene: "conversation", speaker: "System", text: "会話データを読み込み中..." });

  await Promise.all([loadChatScript(), buildCardArts()]);
  if (state.chatByScene.size > 0) {
    applyChatMessage({ scene: "conversation", speaker: "System", text: "会話準備完了。" });
  } else {
    applyChatMessage({ scene: "conversation", speaker: "System", text: "会話データの読み込みに失敗しました。" });
  }

  buildPlayers();
  buildDeck();
  dealInitialHands();
  initializeDiscard();

  render();
  await sleep(500);
  await nextTurn();
}

initGame();


