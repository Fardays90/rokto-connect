import asyncio
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect, status
from pymysql.cursors import Cursor

from app.api.v1.deps import get_current_user, get_ws_user
from app.core.db import get_cursor
from app.core.ws import chat_manager, manager, notify_feed_event, notify_users, run_ping_loop
from app.schemas.requests import CompleteRequestSchema, CreateRequestSchema, UpdateRequestSchema

router = APIRouter(tags=["requests"])

WS_AUTH_FAILED = 4401
ACTIVE_STATUS = "PENDING"
DONOR_FOUND_STATUS = "DONOR_FOUND"
COMPLETED_STATUS = "COMPLETED"
DEFAULT_FEED_LIMIT = 10
MAX_FEED_LIMIT = 50


def serialize_created_at(request_row: Dict[str, Any]) -> Dict[str, Any]:
    created_at = request_row.get("created_at")
    if isinstance(created_at, datetime):
        if created_at.tzinfo is None:
            created_at = created_at.replace(tzinfo=timezone.utc)
        request_row["created_at"] = created_at.astimezone(timezone.utc).isoformat()
    return request_row


def fetch_request(cursor: Cursor, request_id: int) -> Dict[str, Any]:
    cursor.execute(
        """
        SELECT request_id, blood_type, urgency, status, user_id, division
        FROM REQUEST
        WHERE request_id = %s
        """,
        (request_id,),
    )
    request_row = cursor.fetchone()
    if not request_row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found.")
    return request_row


def ensure_owner(request_row: Dict[str, Any], user: Dict[str, Any]) -> None:
    if request_row["user_id"] != user["user_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only manage your own requests.",
        )


@router.post("/requests", status_code=status.HTTP_201_CREATED)
def create_request(
    payload: CreateRequestSchema,
    user: Dict[str, Any] = Depends(get_current_user),
    cursor: Cursor = Depends(get_cursor),
):
    user_id = user["user_id"]
    cursor.execute(
        "SELECT request_id FROM REQUEST WHERE user_id = %s AND status IN (%s, %s)",
        (user_id, ACTIVE_STATUS, DONOR_FOUND_STATUS),
    )
    if cursor.fetchone():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You already have an active blood request.",
        )
    division = payload.division or user.get("division")
    district = payload.district or user.get("district")
    zip_code = payload.zip_code or user.get("zip_code")
    cursor.execute(
        """
        INSERT INTO REQUEST (blood_type, urgency, status, user_id, message, zip_code, division, district, created_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, UTC_TIMESTAMP())
        """,
        (
            payload.blood_type,
            payload.urgency,
            ACTIVE_STATUS,
            user_id,
            payload.message,
            zip_code,
            division,
            district,
        ),
    )
    request_id = cursor.lastrowid
    cursor.connection.begin()
    cursor.execute(
        "INSERT INTO CHATROOM (request_id, created_time) VALUES (%s, UTC_TIMESTAMP())",
        (request_id,),
    )
    chat_id = cursor.lastrowid
    cursor.connection.commit()
    notify_feed_event(
        division,
        {
            "type": "request_created",
            "request_id": request_id,
            "blood_type": payload.blood_type,
            "urgency": payload.urgency,
            "district": district,
            "division": division,
        },
    )

    cursor.execute(
        """
        SELECT d.user_id
        FROM DONOR d
        INNER JOIN USERS u ON u.user_id = d.user_id
        WHERE LOWER(TRIM(u.division)) = LOWER(TRIM(%s))
          AND d.request_id IS NULL
          AND d.user_id != %s
        """,
        (division, user_id),
    )
    donors = cursor.fetchall()
    if donors:
        donor_ids: list[int] = [d["user_id"] for d in donors]
        cursor.execute(
            "INSERT INTO NOTIFICATION (request_id, read_status, created_at) VALUES (%s, 'PENDING', UTC_TIMESTAMP())",
            (request_id,),
        )
        notif_id = cursor.lastrowid
        for did in donor_ids:
            cursor.execute(
                "INSERT INTO SENT_TO (user_id, notification_id) VALUES (%s, %s)",
                (did, notif_id),
            )
        cursor.connection.commit()
        notify_users(
            donor_ids,
            {
                "type": "new_notification",
                "notification_id": notif_id,
                "request_id": request_id,
                "blood_type": payload.blood_type,
                "division": division,
                "district": district,
                "message": f"New {payload.blood_type} blood request in {district or division}.",
            },
        )

    return {
        "message": "Blood request created successfully",
        "request_id": request_id,
        "chat_id": chat_id,
        "status": ACTIVE_STATUS,
    }
@router.get("/requests/mine")
def list_my_requests(
    user: Dict[str, Any] = Depends(get_current_user),
    cursor: Cursor = Depends(get_cursor),
):
    cursor.execute(
        """
        SELECT r.request_id, r.blood_type, r.urgency, r.status, r.created_at,
               r.message, r.zip_code, r.district, r.division,
               c.chat_id,
               d.user_id AS donor_id,
               du.first_name AS donor_first_name,
               du.last_name AS donor_last_name,
               du.phone_number AS donor_phone_number,
               du.district AS donor_district,
               du.division AS donor_division,
               du.verified AS donor_verified,
               d.blood_type AS donor_blood_type,
               d.donation_count AS donor_donation_count,
               COALESCE(AVG(CAST(dr.rating AS DECIMAL(3, 2))), 0) AS donor_rating
        FROM REQUEST r
        LEFT JOIN CHATROOM c ON c.request_id = r.request_id
        LEFT JOIN DONOR d ON d.request_id = r.request_id
        LEFT JOIN USERS du ON du.user_id = d.user_id
        LEFT JOIN DONOR_REVIEW dr ON dr.donor_id = d.user_id
        WHERE r.user_id = %s
        GROUP BY r.request_id, c.chat_id, d.user_id, du.first_name, du.last_name,
                 du.phone_number, du.district, du.division, du.verified,
                 d.blood_type, d.donation_count
        ORDER BY r.created_at DESC
        """,
        (user["user_id"],),
    )
    requests: List[Dict[str, Any]] = cursor.fetchall()
    return [serialize_created_at(request_row) for request_row in requests]
@router.patch("/requests/{request_id}")
def update_request(
    request_id: int,
    payload: UpdateRequestSchema,
    user: Dict[str, Any] = Depends(get_current_user),
    cursor: Cursor = Depends(get_cursor),
):
    request_row = fetch_request(cursor, request_id)
    ensure_owner(request_row, user)

    if request_row["status"] == COMPLETED_STATUS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Completed requests can no longer be edited.",
        )

    updates = []
    params = []
    if payload.blood_type is not None:
        updates.append("blood_type = %s")
        params.append(payload.blood_type)
    if payload.urgency is not None:
        updates.append("urgency = %s")
        params.append(payload.urgency)
    if payload.message is not None:
        updates.append("message = %s")
        params.append(payload.message)

    if not updates:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nothing to update.",
        )

    params.append(request_id)
    cursor.execute(
        f"UPDATE REQUEST SET {', '.join(updates)} WHERE request_id = %s",
        tuple(params),
    )
    cursor.connection.commit()
    cursor.execute(
        """
        SELECT request_id, blood_type, urgency, status, created_at,
               message, zip_code, district, division
        FROM REQUEST
        WHERE request_id = %s
        """,
        (request_id,),
    )
    updated = serialize_created_at(cursor.fetchone())
    notify_feed_event(
        request_row["division"],
        {
            "type": "request_updated",
            "request_id": request_id,
            "division": request_row["division"],
        },
    )
    return {"message": "Blood request updated successfully", "request": updated}
@router.delete("/requests/{request_id}")
def delete_request(
    request_id: int,
    user: Dict[str, Any] = Depends(get_current_user),
    cursor: Cursor = Depends(get_cursor),
):
    request_row = fetch_request(cursor, request_id)
    ensure_owner(request_row, user)

    # unlink any attached donor first: DONOR.request_id references REQUEST
    # with ON DELETE CASCADE, so deleting the request would otherwise delete
    # the donor's whole DONOR row and silently revoke their donor status
    cursor.execute(
        "UPDATE DONOR SET request_id = NULL WHERE request_id = %s",
        (request_id,),
    )
    cursor.execute("DELETE FROM REQUEST WHERE request_id = %s", (request_id,))
    cursor.connection.commit()

    notify_feed_event(
        request_row["division"],
        {
            "type": "request_deleted",
            "request_id": request_id,
            "division": request_row["division"],
        },
    )

    return {"message": "Blood request deleted"}


@router.post("/requests/{request_id}/accept")
def accept_request(
    request_id: int,
    user: Dict[str, Any] = Depends(get_current_user),
    cursor: Cursor = Depends(get_cursor),
):
    user_id = user["user_id"]
    cursor.execute(
        "SELECT request_id FROM DONOR WHERE user_id = %s",
        (user_id,),
    )
    donor = cursor.fetchone()
    if not donor:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only registered donors can accept requests.",
        )
    if donor["request_id"] is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You are already engaged with another request. Let go of it first.",
        )
    request_row = fetch_request(cursor, request_id)
    if request_row["user_id"] == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot accept your own request.",
        )
    if request_row["status"] != ACTIVE_STATUS:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This request is no longer accepting donors.",
        )

    cursor.connection.begin()
    claimed = cursor.execute(
        "UPDATE REQUEST SET status = %s WHERE request_id = %s AND status = %s",
        (DONOR_FOUND_STATUS, request_id, ACTIVE_STATUS),
    )
    if not claimed:
        cursor.connection.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This request was just taken by another donor.",
        )
    engaged = cursor.execute(
        "UPDATE DONOR SET request_id = %s WHERE user_id = %s AND request_id IS NULL",
        (request_id, user_id),
    )
    if not engaged:
        cursor.connection.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You are already engaged with another request. Let go of it first.",
        )

    cursor.connection.commit()

    notify_feed_event(
        request_row["division"],
        {
            "type": "request_updated",
            "request_id": request_id,
            "division": request_row["division"],
        },
    )

    cursor.execute(
        "INSERT INTO NOTIFICATION (request_id, read_status, created_at) VALUES (%s, 'PENDING', UTC_TIMESTAMP())",
        (request_id,),
    )
    notif_id = cursor.lastrowid
    cursor.execute(
        "INSERT INTO SENT_TO (user_id, notification_id) VALUES (%s, %s)",
        (request_row["user_id"], notif_id),
    )
    cursor.connection.commit()
    notify_users(
        [request_row["user_id"]],
        {
            "type": "new_notification",
            "notification_id": notif_id,
            "request_id": request_id,
            "blood_type": request_row["blood_type"],
            "division": request_row["division"],
            "message": "Your blood request has been accepted by a donor.",
        },
    )

    cursor.execute("SELECT chat_id FROM CHATROOM WHERE request_id = %s", (request_id,))
    chat = cursor.fetchone()
    return {
        "message": "Request accepted",
        "status": DONOR_FOUND_STATUS,
        "chat_id": chat["chat_id"] if chat else None,
    }


@router.delete("/requests/{request_id}/donor")
def release_donor(
    request_id: int,
    user: Dict[str, Any] = Depends(get_current_user),
    cursor: Cursor = Depends(get_cursor),
):
    request_row = fetch_request(cursor, request_id)

    is_owner = request_row["user_id"] == user["user_id"]
    cursor.execute(
        "SELECT user_id FROM DONOR WHERE request_id = %s AND user_id = %s",
        (request_id, user["user_id"]),
    )
    is_linked_donor = cursor.fetchone() is not None

    if not is_owner and not is_linked_donor:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the requester or the accepted donor can release this request.",
        )
    if request_row["status"] != DONOR_FOUND_STATUS:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This request has no donor attached.",
        )
    cursor.connection.begin()
    cursor.execute("UPDATE DONOR SET request_id = NULL WHERE request_id = %s", (request_id,))
    cursor.execute(
        "UPDATE REQUEST SET status = %s WHERE request_id = %s",
        (ACTIVE_STATUS, request_id),
    )
    cursor.connection.commit()

    notify_feed_event(
        request_row["division"],
        {
            "type": "request_updated",
            "request_id": request_id,
            "division": request_row["division"],
        },
    )

    return {"message": "Donor removed. The request is open again.", "status": ACTIVE_STATUS}
@router.post("/requests/{request_id}/complete")
def complete_request(
    request_id: int,
    payload: CompleteRequestSchema,
    user: Dict[str, Any] = Depends(get_current_user),
    cursor: Cursor = Depends(get_cursor),
):
    request_row = fetch_request(cursor, request_id)
    ensure_owner(request_row, user)

    if request_row["status"] != DONOR_FOUND_STATUS:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Only requests with an accepted donor can be completed.",
        )
    cursor.execute(
        "SELECT user_id AS donor_id FROM DONOR WHERE request_id = %s",
        (request_id,),
    )
    donor = cursor.fetchone()
    if not donor:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="No donor is attached to this request.",
        )
    cursor.connection.begin()
    cursor.execute(
        "INSERT INTO DONOR_REVIEW (donor_id, user_id, comment, rating) VALUES (%s, %s, %s, %s)",
        (donor["donor_id"], user["user_id"], payload.comment, str(payload.rating)),
    )
    cursor.execute(
        "UPDATE DONOR SET donation_count = COALESCE(donation_count, 0) + 1, request_id = NULL WHERE user_id = %s",
        (donor["donor_id"],),
    )
    cursor.execute(
        "DELETE FROM REQUEST WHERE request_id = %s",
        (request_id,),
    )
    cursor.connection.commit()

    notify_feed_event(
        request_row["division"],
        {
            "type": "request_deleted",
            "request_id": request_id,
            "division": request_row["division"],
        },
    )

    return {"message": "Request completed. Thanks for confirming!", "status": COMPLETED_STATUS}


@router.get("/requests/{request_id}/chat")
def get_request_chat(
    request_id: int,
    user: Dict[str, Any] = Depends(get_current_user),
    cursor: Cursor = Depends(get_cursor),
):
    cursor.execute(
        """
        SELECT r.request_id, r.blood_type, r.urgency, r.status, r.created_at,
               r.message,
               r.user_id AS requester_id,
               ru.first_name AS requester_first_name,
               ru.last_name AS requester_last_name,
               c.chat_id,
               d.user_id AS donor_id,
               du.first_name AS donor_first_name,
               du.last_name AS donor_last_name
        FROM REQUEST r
        INNER JOIN USERS ru ON ru.user_id = r.user_id
        INNER JOIN CHATROOM c ON c.request_id = r.request_id
        LEFT JOIN DONOR d ON d.request_id = r.request_id
        LEFT JOIN USERS du ON du.user_id = d.user_id
        WHERE r.request_id = %s
        """,
        (request_id,),
    )
    request_row = cursor.fetchone()
    if not request_row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat not found.")
    if user["user_id"] not in (request_row["requester_id"], request_row["donor_id"]):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You cannot access this chat.")
    other_user_id = (
        request_row["donor_id"]
        if user["user_id"] == request_row["requester_id"]
        else request_row["requester_id"]
    )
    cursor.execute(
        """
        SELECT d.donation_count,
               COALESCE(AVG(CAST(dr.rating AS DECIMAL(3, 2))), 0) AS rating,
               COUNT(dr.review_id) AS review_count
        FROM DONOR d
        LEFT JOIN DONOR_REVIEW dr ON dr.donor_id = d.user_id
        WHERE d.user_id = %s
        GROUP BY d.user_id, d.donation_count
        """,
        (other_user_id,),
    )
    donor_history = cursor.fetchone()
    request_row["other_party_donation_count"] = donor_history["donation_count"] if donor_history else None
    request_row["other_party_rating"] = donor_history["rating"] if donor_history else None
    request_row["other_party_review_count"] = donor_history["review_count"] if donor_history else 0
    cursor.execute(
        """
        SELECT rating, comment
        FROM DONOR_REVIEW
        WHERE donor_id = %s
        ORDER BY review_id DESC
        """,
        (other_user_id,),
    )
    request_row["other_party_reviews"] = cursor.fetchall()
    return serialize_created_at(request_row)


@router.websocket("/ws/requests/{request_id}/chat")
async def request_chat_socket(
    request_id: int,
    websocket: WebSocket,
    auth: Tuple[Optional[Dict[str, Any]], bool] = Depends(get_ws_user),
    cursor: Cursor = Depends(get_cursor),
):
    user, db_error = auth
    await websocket.accept()
    if db_error:
        await websocket.close(code=1011)
        return
    if not user:
        await websocket.close(code=WS_AUTH_FAILED)
        return

    cursor.execute(
        """
        SELECT r.user_id AS requester_id, d.user_id AS donor_id
        FROM REQUEST r
        LEFT JOIN DONOR d ON d.request_id = r.request_id
        INNER JOIN CHATROOM c ON c.request_id = r.request_id
        WHERE r.request_id = %s
        """,
        (request_id,),
    )
    room = cursor.fetchone()
    if not room or user["user_id"] not in (room["requester_id"], room["donor_id"]):
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await chat_manager.connect(request_id, websocket)
    await chat_manager.broadcast_presence(request_id)
    try:
        while True:
            message = (await websocket.receive_text()).strip()
            if message:
                await chat_manager.broadcast(request_id, websocket, message[:1000])
    except WebSocketDisconnect:
        pass
    finally:
        await chat_manager.disconnect(request_id, websocket)
        await chat_manager.broadcast_presence(request_id)


@router.get("/requests")
def list_requests(
    limit: int = Query(DEFAULT_FEED_LIMIT, ge=1, le=MAX_FEED_LIMIT),
    user: Dict[str, Any] = Depends(get_current_user),
    cursor: Cursor = Depends(get_cursor),
):
    division = user.get("division")
    district = user.get("district")

    if not division:
        return []

    cursor.execute(
        """
        SELECT r.request_id, r.user_id, r.blood_type, r.urgency, r.status, r.created_at,
               r.message, r.zip_code, r.district, r.division, c.chat_id
        FROM REQUEST r
        LEFT JOIN CHATROOM c ON c.request_id = r.request_id
        WHERE r.status IN (%s, %s) AND r.division = %s
        ORDER BY CASE WHEN r.status = %s THEN 0 ELSE 1 END,
                 CASE WHEN r.district = %s THEN 0 ELSE 1 END,
                 r.created_at DESC
        LIMIT %s
        """,
        (ACTIVE_STATUS, DONOR_FOUND_STATUS, division, ACTIVE_STATUS, district, limit),
    )
    requests: List[Dict[str, Any]] = cursor.fetchall()
    return [serialize_created_at(request_row) for request_row in requests]


@router.websocket("/ws/requests")
async def requests_feed_socket(
    websocket: WebSocket,
    auth: Tuple[Optional[Dict[str, Any]], bool] = Depends(get_ws_user),
):
    user, db_error = auth
    await websocket.accept()
    if db_error:
        await websocket.close(code=1011)
        return
    if not user:
        await websocket.close(code=WS_AUTH_FAILED)
        return
    entry = await manager.connect(websocket, user["user_id"], user.get("division"))
    ping_task = asyncio.create_task(run_ping_loop(websocket))
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        ping_task.cancel()
        await manager.disconnect(entry)
