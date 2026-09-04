from datetime import datetime, timezone
from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException, status
from pymysql.cursors import Cursor

from app.api.v1.deps import get_current_user
from app.core.db import get_cursor

router = APIRouter(tags=["notifications"])


def _serialize(row: Dict[str, Any]) -> Dict[str, Any]:
    created_at = row.get("created_at")
    if isinstance(created_at, datetime):
        if created_at.tzinfo is None:
            created_at = created_at.replace(tzinfo=timezone.utc)
        row["created_at"] = created_at.astimezone(timezone.utc).isoformat()
    return row


@router.get("/notifications")
def list_notifications(
    user: Dict[str, Any] = Depends(get_current_user),
    cursor: Cursor = Depends(get_cursor),
):
    user_id = user["user_id"]

    cursor.execute(
        """
        SELECT n.notification_id, n.request_id, n.read_status, n.created_at,
               r.blood_type, r.division, r.district
        FROM NOTIFICATION n
        INNER JOIN SENT_TO s ON s.notification_id = n.notification_id
        LEFT JOIN REQUEST r ON r.request_id = n.request_id
        WHERE s.user_id = %s
        ORDER BY n.created_at DESC
        """,
        (user_id,),
    )
    rows: List[Dict[str, Any]] = cursor.fetchall()

    cursor.execute(
        """
        SELECT COUNT(*) AS total
        FROM NOTIFICATION n
        INNER JOIN SENT_TO s ON s.notification_id = n.notification_id
        WHERE s.user_id = %s AND n.read_status != 'READ'
        """,
        (user_id,),
    )
    unread_count = cursor.fetchone()["total"]

    return {
        "notifications": [_serialize(r) for r in rows],
        "unread_count": unread_count,
    }


@router.patch("/notifications/{notification_id}/read")
def mark_read(
    notification_id: int,
    user: Dict[str, Any] = Depends(get_current_user),
    cursor: Cursor = Depends(get_cursor),
):
    cursor.execute(
        "SELECT 1 FROM SENT_TO WHERE notification_id = %s AND user_id = %s",
        (notification_id, user["user_id"]),
    )
    if not cursor.fetchone():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found.")

    cursor.execute(
        "UPDATE NOTIFICATION SET read_status = 'READ' WHERE notification_id = %s",
        (notification_id,),
    )
    cursor.connection.commit()
    return {"message": "Marked as read."}


@router.post("/notifications/read-all")
def mark_all_read(
    user: Dict[str, Any] = Depends(get_current_user),
    cursor: Cursor = Depends(get_cursor),
):
    cursor.execute(
        """
        UPDATE NOTIFICATION n
        INNER JOIN SENT_TO s ON s.notification_id = n.notification_id
        SET n.read_status = 'READ'
        WHERE s.user_id = %s AND n.read_status != 'READ'
        """,
        (user["user_id"],),
    )
    cursor.connection.commit()
    return {"message": "All marked as read."}


@router.delete("/notifications")
def delete_all_notifications(
    user: Dict[str, Any] = Depends(get_current_user),
    cursor: Cursor = Depends(get_cursor),
):
    """Remove every notification from the current user's inbox.

    Deletes the user's SENT_TO links (the per-user association), then cleans
    up any NOTIFICATION rows that no longer have a link to any user.
    """
    cursor.connection.begin()
    cursor.execute(
        """
        UPDATE NOTIFICATION n
        INNER JOIN SENT_TO s ON s.notification_id = n.notification_id
        SET n.read_status = 'READ'
        WHERE s.user_id = %s
        """,
        (user["user_id"],),
    )
    cursor.execute(
        "DELETE FROM SENT_TO WHERE user_id = %s",
        (user["user_id"],),
    )
    cursor.execute(
        """
        DELETE FROM NOTIFICATION
        WHERE notification_id NOT IN (
            SELECT notification_id FROM SENT_TO
        )
        """,
    )
    cursor.connection.commit()
    return {"message": "All notifications cleared."}
