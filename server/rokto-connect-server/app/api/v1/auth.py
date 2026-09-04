from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.auth import RegisterSchema, LoginSchema, UpdateProfileSchema, ChangePasswordSchema
from app.core.security import hash_password, create_access_token, verify_password
from app.core.db import get_cursor
from app.api.v1.deps import get_current_user

router = APIRouter()

UPDATABLE_PROFILE_FIELDS = ("first_name", "last_name", "zip_code", "district", "division")


def _me_payload(user_row, donor_row):
    return {
        'user_id': user_row['user_id'],
        'first_name': user_row['first_name'],
        'zip_code': user_row['zip_code'],
        'district': user_row['district'],
        'division': user_row['division'],
        'last_name': user_row['last_name'],
        'phone_number': user_row['phone_number'],
        'verified': bool(user_row.get('verified', False)),
        'is_donor': donor_row is not None,
        'donor_blood_type': donor_row['blood_type'] if donor_row else None,
        'donation_count': donor_row['donation_count'] if donor_row else None,
        'accepted_request_id': donor_row['request_id'] if donor_row else None,
    }


def _fetch_donor(cursor, user_id):
    cursor.execute(
        'SELECT blood_type, donation_count, request_id FROM DONOR WHERE user_id = %s',
        (user_id,),
    )
    return cursor.fetchone()

@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(user_data: RegisterSchema, cursor=Depends(get_cursor)):
    cursor.execute("SELECT user_id FROM USERS WHERE phone_number = %s", (user_data.phone_number,))
    if cursor.fetchone():
        raise HTTPException(status_code=400, detail="Phone number is already registered.")
    hashed_pwd = hash_password(user_data.password)
    sql = """
        INSERT INTO USERS (first_name, last_name, phone_number, password_hash, zip_code, district, division)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """
    cursor.execute(sql, (
        user_data.first_name, user_data.last_name, user_data.phone_number,
        hashed_pwd, user_data.zip_code, user_data.district, user_data.division
    ))
    cursor.connection.commit()
    new_id = cursor.lastrowid
    
    token = create_access_token({"user_id": new_id, "phone": user_data.phone_number})
    return {"message": "User registered successfully", "access_token": token}
@router.post("/login", status_code=status.HTTP_200_OK)
def login(user_data: LoginSchema, cursor=Depends(get_cursor)):
    clean_phone = user_data.phone_number.strip()
    cursor.execute("SELECT user_id, password_hash from USERS WHERE phone_number = %s", (clean_phone,))
    user = cursor.fetchone()
    if user is None:
        raise HTTPException(status_code=401, detail="Phone number does not exist.")
    stored_hash = user["password_hash"]
    passwordCorrect = verify_password(user_data.password, stored_hash)
    if passwordCorrect is False:
        raise HTTPException(status_code=401, detail="Wrong phone number or password.")
    token = create_access_token({"user_id": user["user_id"], "phone": user_data.phone_number})
    return {"message": "Login successful", "access_token": token}


@router.get('/me')
def me(user=Depends(get_current_user), cursor=Depends(get_cursor)):
    return _me_payload(user, _fetch_donor(cursor, user['user_id']))


@router.patch('/users/me')
def update_me(
    payload: UpdateProfileSchema,
    user=Depends(get_current_user),
    cursor=Depends(get_cursor),
):
    if payload.phone_number is not None and payload.phone_number != user['phone_number']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone number cannot be changed.",
        )

    updates = []
    params = []
    for field in UPDATABLE_PROFILE_FIELDS:
        value = getattr(payload, field)
        if value is not None:
            updates.append(f"{field} = %s")
            params.append(value)

    if not updates:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nothing to update.",
        )

    params.append(user['user_id'])
    cursor.execute(
        f"UPDATE USERS SET {', '.join(updates)} WHERE user_id = %s",
        tuple(params),
    )
    cursor.connection.commit()

    cursor.execute("SELECT * FROM USERS WHERE user_id = %s", (user['user_id'],))
    updated = cursor.fetchone()
    return _me_payload(updated, _fetch_donor(cursor, user['user_id']))


@router.post('/users/me/password')
def change_password(
    payload: ChangePasswordSchema,
    user=Depends(get_current_user),
    cursor=Depends(get_cursor),
):
    cursor.execute(
        "SELECT password_hash FROM USERS WHERE user_id = %s",
        (user['user_id'],),
    )
    row = cursor.fetchone()
    if row is None or not verify_password(payload.current_password, row['password_hash']):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Current password is incorrect.",
        )
    cursor.execute(
        "UPDATE USERS SET password_hash = %s WHERE user_id = %s",
        (hash_password(payload.new_password), user['user_id']),
    )
    cursor.connection.commit()
    return {"message": "Password changed successfully."}


@router.post('/logout')
def logout():
    return {"message": "Logged out"}
