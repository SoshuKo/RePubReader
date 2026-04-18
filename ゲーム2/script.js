const STORAGE_KEY = "axar_top_settings_v1";
const ALPHA_THRESHOLD = 16;

const state = {
  character: "サテラ",
  knifeCard: true,
  kybiCard: true,
  monCard: true,
  skillEnabled: true,
};

const characterButtons = [...document.querySelectorAll(".char-choice")];
const overlays = [...document.querySelectorAll(".char-overlay")];
const tableStage = document.getElementById("tableStage");
const knifeCard = document.getElementById("knifeCard");
const kybiCard = document.getElementById("kybiCard");
const monCard = document.getElementById("monCard");
const skillEnabled = document.getElementById("skillEnabled");
const statusLine = document.getElementById("statusLine");
const startButton = document.getElementById("startButton");

const overlayByCharacter = new Map(overlays.map((overlay) => [overlay.dataset.character, overlay]));
const maskCanvasByCharacter = new Map();

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    const loaded = JSON.parse(raw);
    if (!loaded || typeof loaded !== "object") return;

    if (typeof loaded.character === "string") {
      state.character = loaded.character;
    }
    state.knifeCard = Boolean(loaded.knifeCard);
    state.kybiCard = Boolean(loaded.kybiCard);
    state.monCard = Boolean(loaded.monCard);
    state.skillEnabled = Boolean(loaded.skillEnabled);
  } catch (error) {
    console.warn("設定の読み込みに失敗しました", error);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function applyCharacterSelection(character) {
  state.character = character;
  render();
  saveState();
}

function getMaskCanvas(character) {
  if (maskCanvasByCharacter.has(character)) {
    return maskCanvasByCharacter.get(character);
  }

  const overlay = overlayByCharacter.get(character);
  if (!overlay || !overlay.complete || overlay.naturalWidth === 0 || overlay.naturalHeight === 0) {
    return null;
  }

  const canvas = document.createElement("canvas");
  canvas.width = overlay.naturalWidth;
  canvas.height = overlay.naturalHeight;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(overlay, 0, 0, canvas.width, canvas.height);
  maskCanvasByCharacter.set(character, canvas);
  return canvas;
}

function mapClientToImagePoint(clientX, clientY, overlay) {
  const rect = tableStage.getBoundingClientRect();
  const localX = clientX - rect.left;
  const localY = clientY - rect.top;

  const boxW = rect.width;
  const boxH = rect.height;
  const imageW = overlay.naturalWidth;
  const imageH = overlay.naturalHeight;
  const boxRatio = boxW / boxH;
  const imageRatio = imageW / imageH;

  let drawW;
  let drawH;
  let offsetX;
  let offsetY;

  if (boxRatio > imageRatio) {
    drawH = boxH;
    drawW = drawH * imageRatio;
    offsetX = (boxW - drawW) / 2;
    offsetY = 0;
  } else {
    drawW = boxW;
    drawH = drawW / imageRatio;
    offsetX = 0;
    offsetY = (boxH - drawH) / 2;
  }

  if (localX < offsetX || localX > offsetX + drawW || localY < offsetY || localY > offsetY + drawH) {
    return null;
  }

  const x = Math.floor((localX - offsetX) * (imageW / drawW));
  const y = Math.floor((localY - offsetY) * (imageH / drawH));
  return { x, y };
}

function pickCharacterFromPoint(clientX, clientY) {
  for (let i = overlays.length - 1; i >= 0; i -= 1) {
    const overlay = overlays[i];
    const character = overlay.dataset.character;
    const point = mapClientToImagePoint(clientX, clientY, overlay);
    if (!point) continue;

    const canvas = getMaskCanvas(character);
    if (!canvas) continue;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) continue;

    const pixel = ctx.getImageData(point.x, point.y, 1, 1).data;
    if (pixel[3] >= ALPHA_THRESHOLD) {
      return character;
    }
  }

  return null;
}

function render() {
  characterButtons.forEach((button) => {
    const selected = button.dataset.character === state.character;
    button.classList.toggle("selected", selected);
    button.setAttribute("aria-checked", String(selected));
  });

  overlays.forEach((overlay) => {
    overlay.classList.toggle("selected", overlay.dataset.character === state.character);
  });

  knifeCard.checked = state.knifeCard;
  kybiCard.checked = state.kybiCard;
  monCard.checked = state.monCard;
  skillEnabled.checked = state.skillEnabled;

  const specialCardsOn = state.knifeCard || state.kybiCard || state.monCard;
  statusLine.textContent = `選択中: ${state.character} / 特殊カード${specialCardsOn ? "ON" : "OFF"} / スキル${state.skillEnabled ? "ON" : "OFF"}`;
}

function bindEvents() {
  characterButtons.forEach((button) => {
    button.addEventListener("click", () => applyCharacterSelection(button.dataset.character));
  });

  tableStage.addEventListener("click", (event) => {
    const hitCharacter = pickCharacterFromPoint(event.clientX, event.clientY);
    if (hitCharacter) {
      applyCharacterSelection(hitCharacter);
    }
  });

  knifeCard.addEventListener("change", () => {
    state.knifeCard = knifeCard.checked;
    render();
    saveState();
  });

  kybiCard.addEventListener("change", () => {
    state.kybiCard = kybiCard.checked;
    render();
    saveState();
  });

  monCard.addEventListener("change", () => {
    state.monCard = monCard.checked;
    render();
    saveState();
  });

  skillEnabled.addEventListener("change", () => {
    state.skillEnabled = skillEnabled.checked;
    render();
    saveState();
  });

  startButton.addEventListener("click", () => {
    saveState();
    window.location.href = "./game.html";
  });
}

loadState();
bindEvents();
render();
