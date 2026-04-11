window.RePuniSOnline = (function () {
  function create(ctx) {
    const {
      window,
      fetch,
      WebSocket,
      state,
      canvas,
      onlineRoomInfo,
      hostToolsSection,
      hostShowCoordsToggle,
      hostShowCommandToggle,
      hostCoordsBox,
      hostReadyList,
      hostCommandGuide,
      hostCommandBox,
      hostCommandInput,
      hostBattleStartBtn,
      onlineServerUrl,
      onlineRoleHostBtn,
      onlineRoleGuestBtn,
      onlineHostForm,
      onlineGuestForm,
      onlineRoomSelect,
      onlineHostAdminPassword,
      onlineHostUsername,
      onlineGuestUsername,
      onlineRoomPasswordHost,
      onlineRoomPasswordGuest,
      startScreen,
      clamp,
      getViewTransform,
      STAGE_SELECT_NAMES,
      getAllEntities,
      getEntityById,
      applyMoveCandidate,
      placeEntitySafely,
      pushSpeechLog,
      setCharacterHp,
      HP_MAX,
      CHARACTER_FILES,
      createEntity,
      bucketOf,
      ITEM_FILES,
      PUNI_BASE,
      CHAR_BASE_H,
      ITEM_BASE,
      ITEM_BASE_H,
      NPC_LIMIT,
      ITEM_LIMIT,
      deleteEntityById,
      ARENA_STAGE_INDEX,
      stageOf,
      detachCarriedItem,
      isKnifeName,
      getCarriedItem,
      ONLINE_STATE_SEND_MS,
      setStartMode
    } = ctx;

  function onlineSetInfo(text) {
    if (onlineRoomInfo) onlineRoomInfo.textContent = text || "";
  }

    function ensureHostReadyState() {
    if (!state.online.playerMetaByToken || typeof state.online.playerMetaByToken !== "object") {
      state.online.playerMetaByToken = {};
    }
    if (!state.online.readyByToken || typeof state.online.readyByToken !== "object") {
      state.online.readyByToken = {};
    }
  }

  function setOnlinePlayerMeta(token, info) {
    if (!token) return;
    ensureHostReadyState();
    const prev = state.online.playerMetaByToken[token] || {};
    state.online.playerMetaByToken[token] = {
      username: String((info && info.username) || prev.username || "?"),
      slot: Number.isFinite(Number(info && info.slot)) ? Number(info.slot) : (Number.isFinite(prev.slot) ? prev.slot : 0),
      connected: info && info.connected === false ? false : true,
      isHost: !!(info && info.is_host)
    };
    if (typeof state.online.readyByToken[token] !== "boolean") {
      state.online.readyByToken[token] = false;
    }
  }

  function removeOnlinePlayerMeta(token) {
    if (!token) return;
    ensureHostReadyState();
    delete state.online.playerMetaByToken[token];
    delete state.online.readyByToken[token];
  }

  function applyServerReadyTokens(readyTokens) {
    if (!Array.isArray(readyTokens)) return;
    ensureHostReadyState();
    readyTokens.forEach((t) => {
      if (state.online.playerMetaByToken[t] !== undefined) {
        state.online.readyByToken[t] = true;
      }
    });
  }

  function resetHostReadyList() {
    ensureHostReadyState();
    Object.keys(state.online.playerMetaByToken).forEach((token) => {
      state.online.readyByToken[token] = token === state.online.sessionToken;
    });
  }

  function markHostReady(token, ready) {
    if (!token) return;
    ensureHostReadyState();
    state.online.readyByToken[token] = !!ready;
  }

  function canHostStartBattleNow() {
    if (!isOnlineHostLocal()) return false;
    ensureHostReadyState();
    const tokens = Object.keys(state.online.playerMetaByToken).filter((t) => t !== state.online.sessionToken);
    if (!tokens.length) return true;
    return tokens.every((t) => !!state.online.readyByToken[t]);
  }

  function renderHostReadyList() {
    if (!hostReadyList) return;
    if (!isOnlineHostLocal()) {
      hostReadyList.innerHTML = "";
      return;
    }
    ensureHostReadyState();

    const esc = (v) => String(v || "").replace(/[&<>\"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));
    const rows = Object.entries(state.online.playerMetaByToken)
      .sort((a, b) => {
        const as = Number(a[1] && a[1].slot) || 0;
        const bs = Number(b[1] && b[1].slot) || 0;
        return as - bs;
      })
      .map(([token, meta]) => {
        const isSelf = token === state.online.sessionToken;
        const isReady = !!state.online.readyByToken[token];
        const isOffline = meta && meta.connected === false;
        const slotNum = Number(meta && meta.slot);
        const slotLabel = (!isNaN(slotNum) && slotNum >= 1 && slotNum <= 4) ? `${slotNum}P` : "?P";
        const name = `${slotLabel} ${meta && meta.username ? meta.username : "?"}${isSelf ? " (Host)" : ""}`;
        const cls = isOffline ? "offline" : (isReady ? "ready" : "");
        const label = isOffline ? "offline" : (isReady ? "Ready" : "Waiting");
        return `<div class="host-ready-item"><span>${esc(name)}</span><span class="host-ready-tag ${cls}">${label}</span></div>`;
      });

    hostReadyList.innerHTML = rows.length
      ? rows.join("")
      : '<div class="host-ready-item"><span>参加者なし</span><span class="host-ready-tag">-</span></div>';
  }

  function isOnlineHostLocal() {
    return !!(state.online.active && state.online.isHost);
  }

  function updateHostToolsUi() {
    const hostOn = isOnlineHostLocal();
    if (hostToolsSection) hostToolsSection.hidden = !hostOn;

    const showCoords = !!(hostOn && state.ui.hostUi && state.ui.hostUi.showCoords);
    const showCommand = !!(hostOn && state.ui.hostUi && state.ui.hostUi.showCommand);

    if (hostShowCoordsToggle) hostShowCoordsToggle.checked = !!(state.ui.hostUi && state.ui.hostUi.showCoords);
    if (hostShowCommandToggle) hostShowCommandToggle.checked = !!(state.ui.hostUi && state.ui.hostUi.showCommand);

    if (hostCoordsBox) hostCoordsBox.hidden = !showCoords;
    if (hostCommandGuide) hostCommandGuide.hidden = !showCommand;
    if (hostCommandBox) hostCommandBox.hidden = !showCommand;

    if (hostBattleStartBtn) {
      hostBattleStartBtn.hidden = !hostOn;
      const canStart = canHostStartBattleNow();
      hostBattleStartBtn.disabled = !canStart;
      hostBattleStartBtn.title = canStart ? "全員Readyで開始できます" : "全員のReadyを待っています";
    }

    renderHostReadyList();
  }
  function updateHostCoordsFromClient(clientX, clientY) {
    if (!canvas || !Number.isFinite(clientX) || !Number.isFinite(clientY)) return;
    const rect = canvas.getBoundingClientRect();
    if (!rect || rect.width <= 0 || rect.height <= 0) return;

    const px = clamp(clientX - rect.left, 0, rect.width);
    const py = clamp(clientY - rect.top, 0, rect.height);
    const view = getViewTransform();
    const canvasX = (px / rect.width) * canvas.width;
    const canvasY = (py / rect.height) * canvas.height;
    const worldX = (canvasX - view.offsetX) / Math.max(0.0001, view.zoom) + state.camera.x;
    const worldY = (canvasY - view.offsetY) / Math.max(0.0001, view.zoom) + state.camera.y;

    state.ui.hostUi.mouseWorldX = Math.round(worldX);
    state.ui.hostUi.mouseWorldY = Math.round(worldY);

    if (isOnlineHostLocal() && state.ui.hostUi.showCoords && hostCoordsBox) {
      hostCoordsBox.textContent = `x: ${state.ui.hostUi.mouseWorldX}, y: ${state.ui.hostUi.mouseWorldY}`;
    }
  }

      function parseCommandStageToken(token) {
    if (!token) return state.currentStageIndex;

    const num = Number(token);
    if (Number.isFinite(num)) return clamp(Math.round(num) - 1, 0, state.stages.length - 1);

    const lowered = String(token).trim().toLowerCase();
    if (!lowered) return state.currentStageIndex;
    if (lowered === "arena" || lowered === "アリーナ") return ARENA_STAGE_INDEX;
    if (lowered === "play" || lowered === "プレイ") return clamp(state.currentStageIndex, 0, Math.max(0, ARENA_STAGE_INDEX - 1));

    const normalize = (s) => String(s || "").replace(/^\s*\d+\s*[:：]\s*/, "").trim();
    const fromLabel = STAGE_SELECT_NAMES.findIndex((x) => {
      const l = normalize(x).toLowerCase();
      return l === lowered || String(x).toLowerCase() === lowered;
    });
    if (fromLabel >= 0) return fromLabel;

    return state.currentStageIndex;
  }

  // Strict variant: throws an explicit Error for any unrecognised or out-of-range
  // stage token instead of silently falling back to the current stage.
  function parseCommandStageTokenStrict(token) {
    if (!token) throw new Error("ステージを指定してください");

    const num = Number(token);
    if (Number.isFinite(num)) {
      const rawIdx = Math.round(num) - 1;
      if (rawIdx < 0 || rawIdx >= state.stages.length) {
        throw new Error(`ステージ不正: ${token} (有効範囲 1–${state.stages.length})`);
      }
      return rawIdx;
    }

    const lowered = String(token).trim().toLowerCase();
    if (!lowered) throw new Error("ステージを指定してください");
    if (lowered === "arena" || lowered === "アリーナ") return ARENA_STAGE_INDEX;
    if (lowered === "play" || lowered === "プレイ") {
      return clamp(state.currentStageIndex, 0, Math.max(0, ARENA_STAGE_INDEX - 1));
    }

    const normalize = (s) => String(s || "").replace(/^\s*\d+\s*[:：]\s*/, "").trim();
    const fromLabel = STAGE_SELECT_NAMES.findIndex((x) => {
      const l = normalize(x).toLowerCase();
      return l === lowered || String(x).toLowerCase() === lowered;
    });
    if (fromLabel >= 0) return fromLabel;

    throw new Error(`ステージが見つかりません: ${token}`);
  }

      function findEntitiesByCommandTarget(raw) {
    const key = String(raw || "").trim();
    if (!key) return [];
    const all = getAllEntities().filter(Boolean);

    if (key === "all") return all;
    if (key === "players" || key === "キャラ") return all.filter((ent) => ent.kind !== "item");
    if (key === "items" || key === "アイテム") return all.filter((ent) => ent.kind === "item");

    const slotMatch = key.match(/^([1-4])P$/i);
    if (slotMatch) {
      const slot = Number(slotMatch[1]);
      return all.filter((ent) => ent.isOnlinePlayer && Number(ent.onlineSlot) === slot);
    }

    const byId = Number(key);
    if (Number.isFinite(byId)) {
      const ent = getEntityById(byId);
      return ent ? [ent] : [];
    }

    const exact = all.filter((ent) => ent.name === key);
    if (exact.length) return exact;
    return all.filter((ent) => String(ent.name || "").includes(key));
  }

      async function executeHostCommandLine(line, fromNetwork = false) {
    if (!line || typeof line !== "string") return;
    const input = line.trim();
    if (!input.startsWith("/")) return;

    const parts = input.split(/\s+/).filter(Boolean);
    const cmd = parts[0].toLowerCase();

    if (cmd === "/tp") {
      if (parts.length < 5) throw new Error("/tp target stage x y");
      const targets = findEntitiesByCommandTarget(parts[1]);
      if (!targets.length) throw new Error(`対象が見つかりません: ${parts[1]}`);
      const stageIndex = parseCommandStageTokenStrict(parts[2]);
      const stage = stageOf(stageIndex);
      if (!stage) throw new Error(`ステージが不正です: ${parts[2]}`);
      const x = Number(parts[3]);
      const y = Number(parts[4]);
      if (!Number.isFinite(x) || !Number.isFinite(y)) throw new Error("座標が不正です");

      for (const ent of targets) {
        if (ent.kind === "item" && ent.carriedById) {
          const carrier = getEntityById(ent.carriedById);
          if (carrier) detachCarriedItem(carrier, true);
        }

        ent.stageIndex = stageIndex;
        if (!applyMoveCandidate(ent, x, y, ent.kind === "item")) {
          placeEntitySafely(ent, clamp(x, stage.x + 8, stage.x + stage.width - 8));
        }

        if (state.player && ent.id === state.player.id) {
          state.currentStageIndex = stageIndex;
          state.camera.x = stage.x;
        }
      }
      pushSpeechLog(`[CMD] tp: ${targets.length}件`);
    } else if (cmd === "/heal") {
      if (parts.length < 3) throw new Error("/heal target amount");
      const targets = findEntitiesByCommandTarget(parts[1]).filter((ent) => ent.kind !== "item");
      if (!targets.length) throw new Error(`対象が見つかりません: ${parts[1]}`);
      const amount = Number(parts[2]);
      if (!Number.isFinite(amount)) throw new Error(`回復量が不正です: ${parts[2]}`);
      targets.forEach((ent) => {
        setCharacterHp(ent, (Number.isFinite(ent.hp) ? ent.hp : HP_MAX) + amount);
      });
      pushSpeechLog(`[CMD] heal: ${targets.length}件 (${Math.round(amount)})`);
    } else if (cmd === "/spawn") {
      if (state.online.active && state.online.phase === "battle") throw new Error("バトル中はスポーン禁止です");
      if (parts.length < 5) throw new Error("/spawn entityName stage x y");
      const name = parts[1];
      const stageIndex = parseCommandStageTokenStrict(parts[2]);
      const stage = stageOf(stageIndex);
      if (!stage) throw new Error(`ステージが不正です: ${parts[2]}`);
      const x = Number(parts[3]);
      const y = Number(parts[4]);
      if (!Number.isFinite(x) || !Number.isFinite(y)) throw new Error(`座標が不正です: x=${parts[3]} y=${parts[4]}`);

      if (CHARACTER_FILES.has(name)) {
        const charCount = getAllEntities().filter((ent) => ent && ent.kind !== "item" && ent.stageIndex === stageIndex).length;
        if (charCount >= NPC_LIMIT) throw new Error(`キャラクター上限超過 (現在 ${charCount} / 上限 ${NPC_LIMIT})`);

        const bucket = bucketOf(stageIndex);
        if (!bucket) throw new Error(`ステージバケットが存在しません: ${stageIndex}`);
        const ent = await createEntity("npc", stageIndex, name, CHARACTER_FILES.get(name), PUNI_BASE, CHAR_BASE_H);
        ent.stageIndex = stageIndex;
        ent.x = x;
        ent.y = y;
        if (!applyMoveCandidate(ent, x, y, false)) placeEntitySafely(ent, clamp(x, stage.x + 8, stage.x + stage.width - 8));
        bucket.npcs.push(ent);
      } else if (ITEM_FILES.has(name)) {
        const itemCount = getAllEntities().filter((ent) => ent && ent.kind === "item" && ent.stageIndex === stageIndex).length;
        if (itemCount >= ITEM_LIMIT) throw new Error(`アイテム上限超過 (現在 ${itemCount} / 上限 ${ITEM_LIMIT})`);

        const bucket = bucketOf(stageIndex);
        if (!bucket) throw new Error(`ステージバケットが存在しません: ${stageIndex}`);
        const item = await createEntity("item", stageIndex, name, ITEM_FILES.get(name), ITEM_BASE, ITEM_BASE_H);
        item.stageIndex = stageIndex;
        item.x = x;
        item.y = y;
        if (!applyMoveCandidate(item, x, y, true)) placeEntitySafely(item, clamp(x, stage.x + 8, stage.x + stage.width - 8));
        bucket.items.push(item);
      } else {
        throw new Error(`未定義エンティティ: ${name}`);
      }

      pushSpeechLog(`[CMD] spawn: ${name}`);
    } else if (cmd === "/kill") {
      if (state.online.active && state.online.phase === "battle") throw new Error("バトル中は削除禁止です");
      if (parts.length < 2) throw new Error("/kill target");
      const targets = findEntitiesByCommandTarget(parts[1]);
      if (!targets.length) throw new Error(`対象が見つかりません: ${parts[1]}`);

      let deleted = 0;
      let spectator = 0;
      for (const ent of targets) {
        // Online players (including the local player) are never deleted; they are
        // spectated (HP set to 0) so the connection and slot stay intact.
        if (ent.kind !== "item" && (ent.isOnlinePlayer || (state.player && ent.id === state.player.id))) {
          setCharacterHp(ent, 0);
          spectator += 1;
          continue;
        }
        await deleteEntityById(ent.id);
        deleted += 1;
      }
      pushSpeechLog(`[CMD] kill: 削除${deleted}件 / 観戦化${spectator}件`);
    } else {
      throw new Error(`不明コマンド: ${parts[0]}`);
    }

    state.ui.panelDirty = true;

    if (!fromNetwork) {
      sendOnline("command", { command: input, line: input });
    }
  }

  async function submitHostChatOrCommand() {
    if (!isOnlineHostLocal() || !hostCommandInput) return;
    const line = hostCommandInput.value.trim();
    if (!line) return;

    try {
      if (line.startsWith("/")) {
        await executeHostCommandLine(line, false);
      } else {
        pushSpeechLog(`[HOST] ${line}`);
        sendOnline("chat", { text: line });
      }
      hostCommandInput.value = "";
    } catch (err) {
      pushSpeechLog(`[CMD-ERR] ${err.message}`);
    }
  }

  function updateOnlinePhaseHooks() {
    if (!state.online.active || !state.player) return;
    if (state.online.phase !== "play") return;

    const inArena = state.player.stageIndex === ARENA_STAGE_INDEX;
    if (isOnlineHostLocal()) {
      if (inArena && !state.ui.hostUi.phaseInviteSent) {
        sendOnline("invite_battle", {});
        resetHostReadyList();
        markHostReady(state.online.sessionToken, true);
        state.ui.hostUi.phaseInviteSent = true;
        pushSpeechLog("[NET] バトル招待を送信しました。");
      }
      if (!inArena) {
        state.ui.hostUi.phaseInviteSent = false;
      }
    }
  }


  function canMoveToStageOnline(nextIndex) {
    if (!state.online.active) return true;
    if (!Number.isFinite(nextIndex)) return false;

    if (nextIndex !== ARENA_STAGE_INDEX) return true;
    if (state.online.phase === "battle") return true;
    if (isOnlineHostLocal()) return true;
    if (state.online.pendingInvite || state.online.awaitingBattleLoadout) return true;

    pushSpeechLog("[NET] ホストの招待後にアリーナへ移動できます。");
    return false;
  }

  function startOnlineBattleAsHost() {
    if (!isOnlineHostLocal()) return;
    if (!canHostStartBattleNow()) {
      pushSpeechLog('[NET] Ready待ちの参加者がいます。');
      return;
    }

    const arenaBucket = bucketOf(ARENA_STAGE_INDEX);
    if (!arenaBucket) return;

    const survivors = arenaBucket.npcs.filter((ent) => ent && ent.isOnlinePlayer);
    arenaBucket.npcs = survivors;

    const keepIds = new Set();
    if (state.player && state.player.stageIndex === ARENA_STAGE_INDEX) keepIds.add(state.player.id);
    survivors.forEach((ent) => keepIds.add(ent.id));

    const chars = getAllEntities().filter((ent) => ent && ent.kind !== "item" && keepIds.has(ent.id));
    chars.forEach((ent, idx) => {
      if (ent.carryingItemId) detachCarriedItem(ent, true);
      setCharacterHp(ent, HP_MAX);
      ent.vx = 0;
      ent.vy = 0;
      ent.rot = 0;
      ent.wrot = 0;
      ent.stageIndex = ARENA_STAGE_INDEX;
      const stage = stageOf(ARENA_STAGE_INDEX);
      const x = stage.x + stage.width * (0.2 + (idx * 0.6) / Math.max(1, chars.length - 1));
      placeEntitySafely(ent, x);
    });

    arenaBucket.items = arenaBucket.items.filter((it) => it && !it.carriedById && !it.throwAttack && isKnifeName(it.name));

    state.online.phase = "battle";
    sendOnline("phase", { phase: "battle" });
    pushSpeechLog("[NET] バトル開始");
    state.ui.panelDirty = true;
  }
  function getOnlineServerBase() {
    const fromInput = onlineServerUrl && typeof onlineServerUrl.value === "string"
      ? onlineServerUrl.value.trim()
      : "";
    const base = fromInput || state.start.onlineServer || state.online.serverBase || "";
    return base.replace(/\/$/, "");
  }

  async function onlineApi(path, method = "GET", body = null) {
    const base = getOnlineServerBase();
    if (!base) throw new Error("オンラインサーバーURLを入力してください。");
    state.online.serverBase = base;
    state.start.onlineServer = base;
    const res = await fetch(`${base}${path}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(json.detail || json.message || `HTTP ${res.status}`);
    }
    return json;
  }

  function onlineSetRole(role) {
    state.start.onlineRole = role === "guest" ? "guest" : "host";
    state.online.role = state.start.onlineRole;
    if (onlineRoleHostBtn) onlineRoleHostBtn.classList.toggle("active", state.start.onlineRole === "host");
    if (onlineRoleGuestBtn) onlineRoleGuestBtn.classList.toggle("active", state.start.onlineRole === "guest");
    if (onlineHostForm) onlineHostForm.hidden = state.start.onlineRole !== "host";
    if (onlineGuestForm) onlineGuestForm.hidden = state.start.onlineRole !== "guest";
  }

  async function refreshOnlineRooms() {
    if (!onlineRoomSelect) return;
    try {
      const data = await onlineApi("/api/rooms");
      const rooms = Array.isArray(data.rooms) ? data.rooms : [];
      onlineRoomSelect.innerHTML = rooms.map((r) => `<option value="${r.room_code}">${r.room_code} (${r.players}/${r.capacity})</option>`).join("");
      if (!rooms.length) {
        onlineRoomSelect.innerHTML = '<option value="">(公開ルームなし)</option>';
      }
    } catch (err) {
      onlineSetInfo(`ルーム取得失敗: ${err.message}`);
    }
  }

  function onlineDisconnect() {
    if (state.online.ws) {
      try { state.online.ws.close(); } catch (_e) {}
    }
    state.online.ws = null;
    state.online.wsConnected = false;
    state.online.active = false;
    state.online.phase = "play";
    state.online.pendingInvite = false;
    state.online.awaitingBattleLoadout = false;
    state.online.peers.clear();
    state.online.peerCreatePending.clear();
    state.online.lastCarryingItem = undefined;
    state.ui.hostUi.phaseInviteSent = false;
    updateHostToolsUi();
  }

  async function ensureOnlinePeerEntity(token, playerInfo) {
    if (!token || token === state.online.sessionToken) return;
    const existing = state.online.peers.get(token);
    if (existing && getEntityById(existing.entityId)) return;
    if (state.online.peerCreatePending.has(token)) return;
    state.online.peerCreatePending.add(token);

    try {
      const charName = playerInfo.character;
      const file = CHARACTER_FILES.get(charName);
      if (!file) return;
      const stageIndex = Number.isFinite(playerInfo.stage_index) ? playerInfo.stage_index : 0;
      const ent = await createEntity("npc", stageIndex, playerInfo.username || charName, file, PUNI_BASE, CHAR_BASE_H);
      ent.isOnlinePlayer = true;
      ent.remoteControlled = true;
      ent.onlineToken = token;
      ent.onlineSlot = Number.isFinite(playerInfo.slot) ? playerInfo.slot : 0;
      ent.netTargetX = Number.isFinite(playerInfo.x) ? playerInfo.x : (stageOf(stageIndex).x + stageOf(stageIndex).width * 0.5);
      ent.netTargetY = Number.isFinite(playerInfo.y) ? playerInfo.y : ent.h;
      ent.x = ent.netTargetX;
      ent.y = ent.netTargetY;
      ent.facing = Number(playerInfo.facing) >= 0 ? 1 : -1;
      ent.hp = Number.isFinite(playerInfo.hp) ? playerInfo.hp : HP_MAX;
      ent.onlineCarryingItem = typeof playerInfo.carrying_item === "string" ? playerInfo.carrying_item : "";
      ent.onlineKnifeState = typeof playerInfo.knife_state === "string" ? playerInfo.knife_state : "none";

      const bucket = bucketOf(stageIndex);
      if (bucket) bucket.npcs.push(ent);
      state.online.peers.set(token, { entityId: ent.id, username: playerInfo.username || "Peer", slot: ent.onlineSlot });
      state.ui.panelDirty = true;
    } finally {
      state.online.peerCreatePending.delete(token);
    }
  }

  function removeOnlinePeerEntity(token) {
    const rec = state.online.peers.get(token);
    if (!rec) return;
    const ent = getEntityById(rec.entityId);
    if (ent) {
      const b = bucketOf(ent.stageIndex);
      if (b) {
        const idx = b.npcs.findIndex((x) => x.id === ent.id);
        if (idx >= 0) b.npcs.splice(idx, 1);
      }
    }
    state.online.peers.delete(token);
    state.ui.panelDirty = true;
  }

  async function handleOnlineMessage(msg) {
    if (!msg || typeof msg !== "object") return;
    const type = String(msg.type || "");

    if (type === "hello") {
      state.online.wsConnected = true;
      state.online.phase = msg.phase || "play";
      state.online.slot = Number(msg.slot) || 0;
      state.online.isHost = !!msg.is_host;
      ensureHostReadyState();
      Object.keys(state.online.playerMetaByToken).forEach((t) => { delete state.online.playerMetaByToken[t]; delete state.online.readyByToken[t]; });
      updateHostToolsUi();
      const players = msg.players || {};
      for (const [token, info] of Object.entries(players)) {
        setOnlinePlayerMeta(token, info || {});
        if (token !== state.online.sessionToken) await ensureOnlinePeerEntity(token, info || {});
      }
      setOnlinePlayerMeta(state.online.sessionToken, { username: state.start.onlineUsername || "Host", slot: state.online.slot, is_host: state.online.isHost, connected: true });
      // Restore ready state from server so reconnects don't lose accepted readiness
      applyServerReadyTokens(msg.ready_tokens);
      // Restore pending invite flag on reconnect
      if (msg.pending_battle_invite) {
        state.online.pendingInvite = true;
      }
      renderHostReadyList();
      onlineSetInfo(`接続中: ルーム ${state.online.roomCode} / ${state.online.slot}P`);
      return;
    }

    if (type === "player_joined" || type === "presence") {
      const token = String(msg.session_token || "");
      if (!token || token === state.online.sessionToken) return;
      if (msg.connected === false) {
        // Remove the game entity but keep the player meta so the ready state
        // survives disconnection and is restored on reconnect.
        removeOnlinePeerEntity(token);
        if (state.online.playerMetaByToken && state.online.playerMetaByToken[token]) {
          state.online.playerMetaByToken[token].connected = false;
        }
        renderHostReadyList();
        return;
      }
      setOnlinePlayerMeta(token, msg.player || {});
      await ensureOnlinePeerEntity(token, msg.player || {});
      renderHostReadyList();
      return;
    }

    if (type === "player_left") {
      const token = String(msg.session_token || "");
      if (token) { removeOnlinePeerEntity(token); removeOnlinePlayerMeta(token); renderHostReadyList(); }
      return;
    }

    if (type === "player_state") {
      const token = String(msg.session_token || "");
      if (!token || token === state.online.sessionToken) return;
      const peer = state.online.peers.get(token);
      if (!peer) {
        await ensureOnlinePeerEntity(token, { ...msg.state, username: token, character: state.start.enemyChar || "コト" });
      }
      const rec = state.online.peers.get(token);
      if (!rec) return;
      const ent = getEntityById(rec.entityId);
      if (!ent) return;
      const st = msg.state || {};

      const prevStageIndex = ent.stageIndex;
      if (Number.isFinite(st.stage_index)) ent.stageIndex = st.stage_index;
      if (Number.isFinite(st.x)) ent.netTargetX = st.x;
      if (Number.isFinite(st.y)) ent.netTargetY = st.y;

      // Snap directly when stage changed or position diverged beyond threshold
      // 300px ≒ about 2 player-widths; beyond this lerp looks like teleport anyway
      const SNAP_DIST = 300;
      const dx = (ent.netTargetX || 0) - ent.x;
      const dy = (ent.netTargetY || 0) - ent.y;
      if (ent.stageIndex !== prevStageIndex || Math.hypot(dx, dy) > SNAP_DIST) {
        ent.x = ent.netTargetX;
        ent.y = ent.netTargetY;
      }

      if (Number.isFinite(st.facing)) ent.facing = st.facing >= 0 ? 1 : -1;
      if (Number.isFinite(st.hp)) ent.hp = st.hp;
      if (typeof st.carrying_item === "string") ent.onlineCarryingItem = st.carrying_item;
      if (typeof st.knife_state === "string") ent.onlineKnifeState = st.knife_state;
      return;
    }

    if (type === "chat") {
      const user = msg.username || "?";
      const text = String(msg.text || "");
      if (text) pushSpeechLog(`[NET] ${user}: ${text}`);
      return;
    }

    if (type === "command") {
      const token = String(msg.session_token || "");
      if (token && token === state.online.sessionToken) return;
      const line = String(msg.line || msg.command || "").trim();
      if (!line) return;
      try {
        await executeHostCommandLine(line, true);
      } catch (err) {
        pushSpeechLog(`[NET-CMD-ERR] ${err.message}`);
      }
      return;
    }
    if (type === "accept_battle") {
      const token = String(msg.session_token || "");
      if (token) {
        // Prefer authoritative ready list from server when available
        if (Array.isArray(msg.ready_tokens)) {
          applyServerReadyTokens(msg.ready_tokens);
        } else {
          markHostReady(token, true);
        }
        renderHostReadyList();
        if (isOnlineHostLocal()) {
          const meta = (state.online.playerMetaByToken && state.online.playerMetaByToken[token]) || {};
          const uname = meta.username || "Guest";
          pushSpeechLog(`[NET] ${uname} が招待を受諾しました。`);
        }
      }
      return;
    }
    if (type === "invite_battle") {
      state.online.pendingInvite = true;
      ensureHostReadyState();
      resetHostReadyList();
      // Apply authoritative ready list from server (host is pre-marked ready)
      if (Array.isArray(msg.ready_tokens)) {
        applyServerReadyTokens(msg.ready_tokens);
      } else {
        markHostReady(state.online.sessionToken, state.online.isHost);
      }
      renderHostReadyList();
      if (!state.online.isHost) {
        const ok = window.confirm("ホストからバトル招待が届きました。参加しますか？");
        if (ok) {
          state.online.awaitingBattleLoadout = true;
          state.start.mode = "stadium";
          state.start.started = false;
          setStartMode("stadium");
          if (startScreen) startScreen.classList.remove("hidden");
          pushSpeechLog("[NET] バトル準備: キャラ/ナイフを選択して開始してください。");
        }
      } else {
        pushSpeechLog("[NET] 招待送信済み。全員の準備後にバトル開始してください。");
      }
      return;
    }
    if (type === "phase") {
      state.online.phase = msg.phase === "battle" ? "battle" : "play";
      state.online.pendingInvite = false;
      if (state.online.phase !== "battle") {
        state.online.awaitingBattleLoadout = false;
        // Allow re-invite when returning to play phase
        state.ui.hostUi.phaseInviteSent = false;
        ensureHostReadyState();
        // Server sends empty ready_tokens on play; reset local ready state
        Object.keys(state.online.readyByToken).forEach((t) => { state.online.readyByToken[t] = false; });
      }
      renderHostReadyList();
      pushSpeechLog(`[NET] フェーズ変更: ${state.online.phase}`);
      return;
    }
  }

  async function connectOnlineWs(roomCode, sessionToken) {
    const base = getOnlineServerBase();
    const wsBase = base.replace(/^http:/i, "ws:").replace(/^https:/i, "wss:");
    const wsUrl = `${wsBase}/ws/${roomCode}/${sessionToken}`;
    const ws = new WebSocket(wsUrl);
    state.online.ws = ws;

    ws.onopen = () => {
      state.online.wsConnected = true;
      onlineSetInfo(`WS接続: ${roomCode}`);
      updateHostToolsUi();
    };
    ws.onclose = () => {
      state.online.wsConnected = false;
      onlineSetInfo("オンライン接続が切断されました。");
      updateHostToolsUi();
    };
    ws.onerror = () => {
      state.online.wsConnected = false;
      onlineSetInfo("オンライン接続エラーが発生しました。");
      updateHostToolsUi();
    };
    ws.onmessage = async (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        await handleOnlineMessage(msg);
      } catch (_e) {
        // ignore malformed
      }
    };
  }

  function sendOnline(type, payload = {}) {
    if (!state.online.active || !state.online.ws || state.online.ws.readyState !== WebSocket.OPEN) return;
    state.online.ws.send(JSON.stringify({ type, ...payload }));
  }

  function sendOnlineLocalState(nowMs) {
    if (!state.online.active || !state.online.wsConnected || !state.player) return;
    if (nowMs - (state.online.lastStateSendAt || 0) < ONLINE_STATE_SEND_MS) return;
    state.online.lastStateSendAt = nowMs;
    const carried = getCarriedItem(state.player);
    const carryingItem = carried ? carried.name : "";

    // Detect knife throw: had a knife last tick, now empty → one tick of "throwing"
    const prevCarrying = state.online.lastCarryingItem !== undefined ? state.online.lastCarryingItem : carryingItem;
    let knifeState = "none";
    if (carryingItem && isKnifeName(carryingItem)) {
      knifeState = "holding";
    } else if (!carryingItem && prevCarrying && isKnifeName(prevCarrying)) {
      knifeState = "throwing";
    }
    state.online.lastCarryingItem = carryingItem;

    sendOnline("player_state", {
      stage_index: state.player.stageIndex,
      x: state.player.x,
      y: state.player.y,
      facing: state.player.facing,
      hp: state.player.hp,
      carrying_item: carryingItem,
      knife_state: knifeState,
    });
  }

  async function enterOnlineAsHost() {
  const adminPass = onlineHostAdminPassword ? onlineHostAdminPassword.value.trim() : "";
  const username = (onlineHostUsername && onlineHostUsername.value.trim()) || "Host";
  const roomPass = (onlineRoomPasswordHost && onlineRoomPasswordHost.value.trim()) || "";

  console.log("HOST roomPass raw =", JSON.stringify(roomPass), roomPass.length, /^\d{4}$/.test(roomPass));
  console.log("HOST input el =", onlineRoomPasswordHost);
  console.log("HOST input current value =", onlineRoomPasswordHost ? JSON.stringify(onlineRoomPasswordHost.value) : null);

  if (!/^\d{4}$/.test(roomPass)) throw new Error("ルームパスワードは4桁です。");

  const character = state.start.selfChar;
  const knife = state.start.knife;

  const res = await onlineApi("/api/host/open-room", "POST", {
    admin_password: adminPass,
    username,
    character,
    knife,
    room_password: roomPass,
  });

  state.online.active = true;
  state.online.isHost = true;
  state.online.roomCode = res.room_code;
  state.online.roomPassword = roomPass;
  state.online.sessionToken = res.session_token;
  state.online.slot = Number(res.slot) || 1;
  state.start.onlineUsername = username;
  state.ui.hostUi.phaseInviteSent = false;
  ensureHostReadyState();
  setOnlinePlayerMeta(res.session_token, { username, slot: Number(res.slot) || 1, is_host: true, connected: true });
  markHostReady(res.session_token, true);
  onlineSetInfo(`ルーム作成: ${res.room_code} (共有パス: ${roomPass})`);

  await connectOnlineWs(res.room_code, res.session_token);
  updateHostToolsUi();
}

  async function enterOnlineAsGuest() {
    const roomCode = onlineRoomSelect ? (onlineRoomSelect.value || "") : "";
    const roomPass = (onlineRoomPasswordGuest && onlineRoomPasswordGuest.value.trim()) || "";
    const username = (onlineGuestUsername && onlineGuestUsername.value.trim()) || "Guest";
    if (!/^\d{4}$/.test(roomCode)) throw new Error("参加先ルームを選択してください。");
    if (!/^\d{4}$/.test(roomPass)) throw new Error("ルームパスワードは4桁です。");

    const character = state.start.selfChar;
    const knife = state.start.knife;

    const res = await onlineApi("/api/guest/join-room", "POST", {
      room_code: roomCode,
      room_password: roomPass,
      username,
      character,
      knife,
    });

    state.online.active = true;
    state.online.isHost = false;
    state.online.roomCode = res.room_code;
    state.online.roomPassword = roomPass;
    state.online.sessionToken = res.session_token;
    state.online.slot = Number(res.slot) || 0;
    state.start.onlineUsername = username;
    ensureHostReadyState();
    setOnlinePlayerMeta(res.session_token, { username, slot: Number(res.slot) || 0, connected: true, is_host: false });
    markHostReady(res.session_token, false);
    onlineSetInfo(`ルーム参加: ${res.room_code} / ${state.online.slot}P`);

    await connectOnlineWs(res.room_code, res.session_token);
    updateHostToolsUi();
  }


      return {
        onlineSetInfo,
        isOnlineHostLocal,
        updateHostToolsUi,
        updateHostCoordsFromClient,
        parseCommandStageToken,
        parseCommandStageTokenStrict,
        findEntitiesByCommandTarget,
        executeHostCommandLine,
        submitHostChatOrCommand,
        updateOnlinePhaseHooks,
        canMoveToStageOnline,
        startOnlineBattleAsHost,
        getOnlineServerBase,
        onlineApi,
        onlineSetRole,
        refreshOnlineRooms,
        onlineDisconnect,
        ensureOnlinePeerEntity,
        removeOnlinePeerEntity,
        handleOnlineMessage,
        connectOnlineWs,
        sendOnline,
        sendOnlineLocalState,
        enterOnlineAsHost,
        enterOnlineAsGuest
      };
  }

  return { create };
})();



















