from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException, status
from pymysql.cursors import Cursor

from app.api.v1.deps import get_current_user
from app.core.db import get_cursor
from app.schemas.donors import BecomeDonorSchema

router = APIRouter(tags=["donors"])


@router.post("/donors/become")
def become_donor(
    payload: BecomeDonorSchema,
    user: Dict[str, Any] = Depends(get_current_user),
    cursor: Cursor = Depends(get_cursor),
):
    user_id = user["user_id"]

    cursor.execute("SELECT user_id FROM DONOR WHERE user_id = %s", (user_id,))
    if cursor.fetchone():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You are already registered as a donor.",
        )

    cursor.execute(
        "INSERT INTO DONOR (user_id, donation_count, blood_type, request_id) VALUES (%s, 0, %s, NULL)",
        (user_id, payload.blood_type),
    )
    cursor.connection.commit()

    return {
        "message": "You are now a registered donor.",
        "blood_type": payload.blood_type,
    }
