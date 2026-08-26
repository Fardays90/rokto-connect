from typing import Any, Dict, Optional, Tuple

from fastapi import Depends, HTTPException, Request, WebSocket, status
from pymysql.cursors import Cursor

from app.core.db import get_cursor
from app.core.security import decode_access_token

COOKIE_NAME = "access_token"


def _extract_token(request: Request) -> Optional[str]:
    token = request.cookies.get(COOKIE_NAME)
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.lower().startswith("bearer "):
            token = auth_header.split(" ", 1)[1]
    return token


def get_current_user(request: Request, cursor: Cursor = Depends(get_cursor)):
    token = _extract_token(request)
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")

    user_id = payload.get("user_id")
    cursor.execute("SELECT * FROM USERS WHERE user_id = %s", (user_id,))
    user = cursor.fetchone()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return user


def get_ws_user(websocket: WebSocket, cursor: Cursor = Depends(get_cursor)) -> Tuple[Optional[Dict[str, Any]], bool]:
    token = websocket.cookies.get(COOKIE_NAME)
    payload = decode_access_token(token) if token else None

    if not payload or not payload.get("user_id"):
        return None, False

    try:
        cursor.execute("SELECT * FROM USERS WHERE user_id = %s", (payload["user_id"],))
        return cursor.fetchone(), False
    except Exception:
        return None, True
