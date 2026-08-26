import asyncio
import json
from typing import Any, Dict, List, Optional

from fastapi import WebSocket

_event_loop: Optional[asyncio.AbstractEventLoop] = None

PING_INTERVAL_SECONDS = 30


class ConnectionManager:
    def __init__(self) -> None:
        self._lock = asyncio.Lock()
        self._connections: List[Dict[str, Any]] = []

    async def connect(self, websocket: WebSocket, user_id: int, division: Optional[str]) -> Dict[str, Any]:
        entry = {"websocket": websocket, "user_id": user_id, "division": division}
        async with self._lock:
            self._connections.append(entry)
        return entry

    async def disconnect(self, entry: Dict[str, Any]) -> None:
        async with self._lock:
            if entry in self._connections:
                self._connections.remove(entry)

    async def broadcast_request_created(self, division: str, data: Dict[str, Any]) -> None:
        async with self._lock:
            targets = [c for c in self._connections if c["division"] == division]

        payload = json.dumps(data)
        for entry in targets:
            try:
                await entry["websocket"].send_text(payload)
            except Exception:
                await self.disconnect(entry)


manager = ConnectionManager()


class ChatManager:
    def __init__(self) -> None:
        self._lock = asyncio.Lock()
        self._rooms: Dict[int, List[WebSocket]] = {}

    async def connect(self, request_id: int, websocket: WebSocket) -> None:
        async with self._lock:
            self._rooms.setdefault(request_id, []).append(websocket)

    async def disconnect(self, request_id: int, websocket: WebSocket) -> None:
        async with self._lock:
            room = self._rooms.get(request_id, [])
            if websocket in room:
                room.remove(websocket)
            if not room:
                self._rooms.pop(request_id, None)

    async def broadcast(self, request_id: int, sender: WebSocket, message: str) -> None:
        async with self._lock:
            targets = list(self._rooms.get(request_id, []))

        for websocket in targets:
            try:
                await websocket.send_json({"type": "message", "message": message, "sender": "self" if websocket is sender else "other"})
            except Exception:
                await self.disconnect(request_id, websocket)

    async def broadcast_presence(self, request_id: int) -> None:
        async with self._lock:
            targets = list(self._rooms.get(request_id, []))
            count = len(targets)
        for websocket in targets:
            try:
                await websocket.send_json({"type": "presence", "online_count": count})
            except Exception:
                await self.disconnect(request_id, websocket)


chat_manager = ChatManager()


def capture_loop() -> None:
    global _event_loop
    _event_loop = asyncio.get_running_loop()
def notify_feed_event(division: Optional[str], data: Dict[str, Any]) -> None:
    if _event_loop is None or not division:
        return
    asyncio.run_coroutine_threadsafe(manager.broadcast_request_created(division, data), _event_loop)
def notify_request_created(division: Optional[str], data: Dict[str, Any]) -> None:
    notify_feed_event(division, data)
async def run_ping_loop(websocket: WebSocket, interval: int = PING_INTERVAL_SECONDS) -> None:
    try:
        while True:
            await asyncio.sleep(interval)
            await websocket.send_text(json.dumps({"type": "ping"}))
    except Exception:
        pass
