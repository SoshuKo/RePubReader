"""
RePuniS Online Server (ConoHa VPS)

Run:
  pip install fastapi uvicorn[standard] pydantic
  set REPUNIS_HOST_ADMIN_PASSWORD=your_admin_password
  python repunis_online_server.py

Default bind: 0.0.0.0:8765
"""

from __future__ import annotations

import asyncio
import secrets
import time
from dataclasses import dataclass, field
from typing import Dict, Optional, Any, List, Set

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import os


HOST_ADMIN_PASSWORD = os.environ.get("REPUNIS_HOST_ADMIN_PASSWORD", "")
SERVER_PORT = int(os.environ.get("REPUNIS_PORT", "8765"))

MAX_PLAYERS = 4
ROOM_TTL_SEC = 60 * 60 * 8


class HostOpenRoomRequest(BaseModel):
    admin_password: str = Field(min_length=1)
    username: str = Field(min_length=1, max_length=24)
    character: str = Field(min_length=1, max_length=32)
    knife: str = Field(min_length=1, max_length=32)
    room_password: str = Field(pattern=r"^\d{4}$")


class GuestJoinRoomRequest(BaseModel):
    room_code: str = Field(pattern=r"^\d{4}$")
    room_password: str = Field(pattern=r"^\d{4}$")
    username: str = Field(min_length=1, max_length=24)
    character: str = Field(min_length=1, max_length=32)
    knife: str = Field(min_length=1, max_length=32)


class UpdateLoadoutRequest(BaseModel):
    room_code: str = Field(pattern=r"^\d{4}$")
    session_token: str
    character: str = Field(min_length=1, max_length=32)
    knife: str = Field(min_length=1, max_length=32)


@dataclass
class PlayerState:
    session_token: str
    username: str
    character: str
    knife: str
    slot: int
    is_host: bool = False
    connected: bool = False
    ws: Optional[WebSocket] = None
    # runtime
    stage_index: int = 0
    x: float = 0.0
    y: float = 0.0
    facing: int = 1
    hp: int = 300
    carrying_item: str = ""
    knife_state: str = "none"  # "holding" | "throwing" | "none"


@dataclass
class RoomState:
    room_code: str
    room_password: str
    created_at: float
    updated_at: float
    host_token: str
    players: Dict[str, PlayerState] = field(default_factory=dict)
    phase: str = "play"  # play | battle
    pending_battle_invite: bool = False
    ready_tokens: Set[str] = field(default_factory=set)


rooms: Dict[str, RoomState] = {}
rooms_lock = asyncio.Lock()


app = FastAPI(title="RePuniS Online Server", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def now_ts() -> float:
    return time.time()


_KNIFE_STATE_VALUES = {"holding", "throwing", "none"}
_MAX_HP = 9999
_MAX_COORD = 1_000_000
_MAX_STAGE_INDEX = 99
_MAX_CARRYING_ITEM_LEN = 64  # carrying_item is a short asset name; 64 chars is ample
_ALLOWED_COMMAND_NAMES = {"/tp", "/heal", "/spawn", "/kill"}
_MAX_COMMAND_LEN = 512


def scrub_player_for_client(p: PlayerState) -> Dict[str, Any]:
    return {
        "username": p.username,
        "character": p.character,
        "knife": p.knife,
        "slot": p.slot,
        "is_host": p.is_host,
        "connected": p.connected,
        "stage_index": p.stage_index,
        "x": p.x,
        "y": p.y,
        "facing": p.facing,
        "hp": p.hp,
        "carrying_item": p.carrying_item,
        "knife_state": p.knife_state,
    }


def room_public_summary(room: RoomState) -> Dict[str, Any]:
    connected = sum(1 for p in room.players.values() if p.connected)
    return {
        "room_code": room.room_code,
        "players": len(room.players),
        "connected": connected,
        "capacity": MAX_PLAYERS,
        "phase": room.phase,
    }


def gen_room_code() -> str:
    # 4-digit numeric room code
    for _ in range(10000):
        code = f"{secrets.randbelow(10000):04d}"
        if code not in rooms:
            return code
    raise RuntimeError("room code pool exhausted")


def gen_token() -> str:
    return secrets.token_urlsafe(24)


def assign_next_slot(room: RoomState) -> int:
    used = {p.slot for p in room.players.values()}
    for i in range(1, MAX_PLAYERS + 1):
        if i not in used:
            return i
    return 0


async def broadcast(room: RoomState, payload: Dict[str, Any], exclude_token: Optional[str] = None) -> None:
    dead_tokens: List[str] = []
    for token, p in room.players.items():
        if exclude_token and token == exclude_token:
            continue
        if not p.ws:
            continue
        try:
            await p.ws.send_json(payload)
        except Exception:
            dead_tokens.append(token)

    for t in dead_tokens:
        pl = room.players.get(t)
        if pl:
            pl.connected = False
            pl.ws = None


async def cleanup_rooms() -> None:
    while True:
        await asyncio.sleep(30)
        t = now_ts()
        async with rooms_lock:
            remove_codes = []
            for code, room in rooms.items():
                if t - room.updated_at > ROOM_TTL_SEC:
                    remove_codes.append(code)
                    continue
                if not room.players:
                    remove_codes.append(code)
            for code in remove_codes:
                rooms.pop(code, None)


@app.on_event("startup")
async def on_startup() -> None:
    asyncio.create_task(cleanup_rooms())


@app.get("/api/health")
async def health() -> Dict[str, Any]:
    return {"ok": True, "rooms": len(rooms)}


@app.get("/api/rooms")
async def list_rooms() -> Dict[str, Any]:
    async with rooms_lock:
        open_rooms = [room_public_summary(r) for r in rooms.values()]
    open_rooms.sort(key=lambda x: x["room_code"])
    return {"rooms": open_rooms}


@app.post("/api/host/open-room")
async def host_open_room(req: HostOpenRoomRequest) -> Dict[str, Any]:
    if not HOST_ADMIN_PASSWORD:
        raise HTTPException(status_code=500, detail="REPUNIS_HOST_ADMIN_PASSWORD is not configured on server")
    if req.admin_password != HOST_ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="invalid host admin password")

    async with rooms_lock:
        code = gen_room_code()
        token = gen_token()
        host_player = PlayerState(
            session_token=token,
            username=req.username.strip(),
            character=req.character,
            knife=req.knife,
            slot=1,
            is_host=True,
            connected=False,
        )
        room = RoomState(
            room_code=code,
            room_password=req.room_password,
            created_at=now_ts(),
            updated_at=now_ts(),
            host_token=token,
            players={token: host_player},
        )
        rooms[code] = room

    return {
        "room_code": code,
        "session_token": token,
        "slot": 1,
        "capacity": MAX_PLAYERS,
        "ws_url": f"/ws/{code}/{token}",
    }


@app.post("/api/guest/join-room")
async def guest_join_room(req: GuestJoinRoomRequest) -> Dict[str, Any]:
    async with rooms_lock:
        room = rooms.get(req.room_code)
        if not room:
            raise HTTPException(status_code=404, detail="room not found")
        if room.room_password != req.room_password:
            raise HTTPException(status_code=401, detail="invalid room password")
        if len(room.players) >= MAX_PLAYERS:
            raise HTTPException(status_code=409, detail="room is full")

        token = gen_token()
        slot = assign_next_slot(room)
        if slot <= 0:
            raise HTTPException(status_code=409, detail="no slot available")

        p = PlayerState(
            session_token=token,
            username=req.username.strip(),
            character=req.character,
            knife=req.knife,
            slot=slot,
            is_host=False,
            connected=False,
        )
        room.players[token] = p
        room.updated_at = now_ts()

    # notify currently connected members
    async with rooms_lock:
        room2 = rooms.get(req.room_code)
        if room2:
            await broadcast(room2, {
                "type": "player_joined",
                "session_token": token,
                "player": scrub_player_for_client(p),
            })

    return {
        "room_code": req.room_code,
        "session_token": token,
        "slot": slot,
        "capacity": MAX_PLAYERS,
        "ws_url": f"/ws/{req.room_code}/{token}",
    }


@app.post("/api/room/update-loadout")
async def update_loadout(req: UpdateLoadoutRequest) -> Dict[str, Any]:
    async with rooms_lock:
        room = rooms.get(req.room_code)
        if not room:
            raise HTTPException(status_code=404, detail="room not found")
        p = room.players.get(req.session_token)
        if not p:
            raise HTTPException(status_code=404, detail="session not found")
        p.character = req.character
        p.knife = req.knife
        room.updated_at = now_ts()
        await broadcast(room, {
            "type": "player_loadout",
            "session_token": req.session_token,
            "player": scrub_player_for_client(p),
        })
    return {"ok": True}


@app.websocket("/ws/{room_code}/{session_token}")
async def ws_room(websocket: WebSocket, room_code: str, session_token: str) -> None:
    await websocket.accept()

    room: Optional[RoomState] = None
    me: Optional[PlayerState] = None

    async with rooms_lock:
        room = rooms.get(room_code)
        if not room:
            await websocket.send_json({"type": "error", "message": "room not found"})
            await websocket.close(code=4404)
            return
        me = room.players.get(session_token)
        if not me:
            await websocket.send_json({"type": "error", "message": "invalid session"})
            await websocket.close(code=4401)
            return

        me.connected = True
        me.ws = websocket
        room.updated_at = now_ts()

        await websocket.send_json({
            "type": "hello",
            "room_code": room.room_code,
            "session_token": session_token,
            "phase": room.phase,
            "slot": me.slot,
            "is_host": me.is_host,
            "players": {
                token: scrub_player_for_client(p)
                for token, p in room.players.items()
            },
            "ready_tokens": list(room.ready_tokens),
            "pending_battle_invite": room.pending_battle_invite,
        })

        await broadcast(room, {
            "type": "presence",
            "session_token": session_token,
            "connected": True,
            "player": scrub_player_for_client(me),
        }, exclude_token=session_token)

    try:
        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type", "")

            async with rooms_lock:
                room = rooms.get(room_code)
                if not room:
                    await websocket.send_json({"type": "error", "message": "room closed"})
                    break
                me = room.players.get(session_token)
                if not me:
                    await websocket.send_json({"type": "error", "message": "session removed"})
                    break

                room.updated_at = now_ts()

                if msg_type == "player_state":
                    raw_stage = int(data.get("stage_index", me.stage_index))
                    me.stage_index = max(0, min(raw_stage, _MAX_STAGE_INDEX))
                    raw_x = float(data.get("x", me.x))
                    me.x = max(-_MAX_COORD, min(raw_x, _MAX_COORD))
                    raw_y = float(data.get("y", me.y))
                    me.y = max(-_MAX_COORD, min(raw_y, _MAX_COORD))
                    me.facing = int(data.get("facing", me.facing))
                    raw_hp = int(data.get("hp", me.hp))
                    me.hp = max(0, min(raw_hp, _MAX_HP))
                    me.carrying_item = str(data.get("carrying_item", me.carrying_item))[:_MAX_CARRYING_ITEM_LEN]
                    raw_knife_state = str(data.get("knife_state", me.knife_state))
                    me.knife_state = raw_knife_state if raw_knife_state in _KNIFE_STATE_VALUES else "none"

                    await broadcast(room, {
                        "type": "player_state",
                        "session_token": session_token,
                        "state": {
                            "stage_index": me.stage_index,
                            "x": me.x,
                            "y": me.y,
                            "facing": me.facing,
                            "hp": me.hp,
                            "carrying_item": me.carrying_item,
                            "knife_state": me.knife_state,
                        },
                    }, exclude_token=session_token)

                elif msg_type == "chat":
                    text = str(data.get("text", "")).strip()
                    if text:
                        await broadcast(room, {
                            "type": "chat",
                            "session_token": session_token,
                            "username": me.username,
                            "text": text[:300],
                        })

                elif msg_type == "command":
                    # host-only command relay — re-verify host status server-side
                    if not me.is_host:
                        await websocket.send_json({"type": "error", "message": "host only command"})
                        continue

                    # Validate command line content before broadcasting
                    cmd_line = str(data.get("command", "") or data.get("line", "")).strip()
                    if not cmd_line:
                        await websocket.send_json({"type": "error", "message": "コマンドが空です"})
                        continue
                    if len(cmd_line) > _MAX_COMMAND_LEN:
                        await websocket.send_json({"type": "error", "message": f"コマンドが長すぎます (上限 {_MAX_COMMAND_LEN} 文字)"})
                        continue
                    if not cmd_line.startswith("/"):
                        await websocket.send_json({"type": "error", "message": "コマンドは / で始まる必要があります"})
                        continue
                    cmd_parts = cmd_line.split()
                    if not cmd_parts:
                        await websocket.send_json({"type": "error", "message": "コマンドが空です"})
                        continue
                    cmd_name = cmd_parts[0].lower()
                    if cmd_name not in _ALLOWED_COMMAND_NAMES:
                        await websocket.send_json({"type": "error", "message": f"不明コマンド: {cmd_name}"})
                        continue

                    await broadcast(room, {
                        "type": "command",
                        "session_token": session_token,
                        "command": cmd_line,
                        "line": cmd_line,
                        "args": data.get("args", {}),
                    })

                elif msg_type == "invite_battle":
                    if not me.is_host:
                        await websocket.send_json({"type": "error", "message": "host only"})
                        continue
                    room.pending_battle_invite = True
                    room.ready_tokens = {session_token}  # host is auto-ready; reset others
                    await broadcast(room, {
                        "type": "invite_battle",
                        "session_token": session_token,
                        "ready_tokens": list(room.ready_tokens),
                    })

                elif msg_type == "accept_battle":
                    room.ready_tokens.add(session_token)
                    await broadcast(room, {
                        "type": "accept_battle",
                        "session_token": session_token,
                        "ready_tokens": list(room.ready_tokens),
                    })

                elif msg_type == "phase":
                    if not me.is_host:
                        await websocket.send_json({"type": "error", "message": "host only"})
                        continue
                    phase = str(data.get("phase", "play"))
                    if phase not in ("play", "battle"):
                        phase = "play"
                    room.phase = phase
                    room.pending_battle_invite = False
                    if phase == "play":
                        room.ready_tokens.clear()
                    await broadcast(room, {
                        "type": "phase",
                        "phase": room.phase,
                        "session_token": session_token,
                        "ready_tokens": list(room.ready_tokens),
                    })

                elif msg_type == "kick":
                    if not me.is_host:
                        await websocket.send_json({"type": "error", "message": "host only"})
                        continue
                    target_token = str(data.get("target_session", ""))
                    if target_token and target_token in room.players and target_token != room.host_token:
                        target = room.players.pop(target_token)
                        if target.ws:
                            try:
                                await target.ws.send_json({"type": "kicked"})
                                await target.ws.close(code=4403)
                            except Exception:
                                pass
                        await broadcast(room, {
                            "type": "player_left",
                            "session_token": target_token,
                        })

                else:
                    await websocket.send_json({"type": "error", "message": f"unknown type: {msg_type}"})

    except WebSocketDisconnect:
        pass
    finally:
        async with rooms_lock:
            room = rooms.get(room_code)
            if not room:
                return
            me = room.players.get(session_token)
            if not me:
                return
            me.connected = False
            me.ws = None
            room.updated_at = now_ts()

            await broadcast(room, {
                "type": "presence",
                "session_token": session_token,
                "connected": False,
                "player": scrub_player_for_client(me),
            }, exclude_token=session_token)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("repunis_online_server:app", host="0.0.0.0", port=SERVER_PORT, reload=False)
