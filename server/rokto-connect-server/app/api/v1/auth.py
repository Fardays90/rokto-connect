from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.auth import RegisterSchema, LoginSchema
from app.core.security import hash_password, create_access_token, verify_password
from app.core.db import get_cursor
from app.api.v1.deps import get_current_user

router = APIRouter()

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
    user_id = user['user_id']
    cursor.execute(
        'SELECT blood_type, donation_count, request_id FROM DONOR WHERE user_id = %s',
        (user_id,),
    )
    donor = cursor.fetchone()
    return {
        'user_id': user['user_id'],
        'first_name': user['first_name'],
        'zip_code': user['zip_code'],
        'district': user['district'],
        'division': user['division'],
        'last_name': user['last_name'],
        'phone_number': user['phone_number'],
        'verified': bool(user.get('verified', False)),
        'is_donor': donor is not None,
        'donor_blood_type': donor['blood_type'] if donor else None,
        'donation_count': donor['donation_count'] if donor else None,
        'accepted_request_id': donor['request_id'] if donor else None,
    }


@router.post('/logout')
def logout():
    return {"message": "Logged out"}
