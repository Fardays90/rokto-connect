from typing import Any, Dict, Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pymysql.cursors import Cursor

from app.api.v1.deps import get_current_user
from app.core.db import get_cursor
from app.schemas.donors import BecomeDonorSchema

router = APIRouter(tags=["donors"])


@router.get("/donors/leaderboard")
def get_leaderboard(
    sort: Literal["rating", "donation_count"] = Query(default="donation_count"),
    limit: int = Query(default=20, ge=1, le=50),
    user: Dict[str, Any] = Depends(get_current_user),
    cursor: Cursor = Depends(get_cursor),
):
    if sort == "rating":
        order_by = "rating DESC, donation_count DESC"
    else:
        order_by = "donation_count DESC, rating DESC"

    cursor.execute(
        f"""
        SELECT u.user_id, u.first_name, u.last_name,
               COALESCE(d.donation_count, 0) AS donation_count,
               COALESCE(AVG(CAST(dr.rating AS DECIMAL(3, 2))), 0) AS rating,
               COUNT(dr.review_id) AS review_count
        FROM DONOR d
        JOIN USERS u ON u.user_id = d.user_id
        LEFT JOIN DONOR_REVIEW dr ON dr.donor_id = d.user_id
        GROUP BY u.user_id, u.first_name, u.last_name, d.donation_count
        ORDER BY {order_by}, review_count DESC, u.user_id ASC
        LIMIT %s
        """,
        (limit,),
    )
    return cursor.fetchall()


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
