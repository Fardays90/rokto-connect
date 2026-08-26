from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from app.schemas.auth import RegisterSchema, LoginSchema
from app.core.security import hash_password, create_access_token, verify_password, decode_access_token, ACCESS_TOKEN_EXPIRE_HOURS
from app.core.db import get_cursor
import os

COOKIE_NAME = "access_token"
COOKIE_MAX_AGE = ACCESS_TOKEN_EXPIRE_HOURS * 3600
COOKIE_SECURE = os.getenv("JWT_COOKIE_SECURE", "false").lower() == "true"
COOKIE_SAMESITE = "lax"

router = APIRouter()

@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(user_data: RegisterSchema, response: Response, cursor=Depends(get_cursor)):
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
    response.set_cookie(
        COOKIE_NAME,
        token,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
        max_age=COOKIE_MAX_AGE,
        path='/'
    )
    # also return the token so non-cookie clients (e.g. a cross-site deployed
    # frontend talking to a localhost API) can send it as a Bearer header —
    # session cookies don't survive third-party contexts
    return {"message": "User registered successfully", "access_token": token}
@router.post("/login", status_code=status.HTTP_200_OK)
def login(user_data: LoginSchema, response: Response, cursor=Depends(get_cursor)):
    print(user_data.phone_number)
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
    response.set_cookie(
        COOKIE_NAME,
        token,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
        max_age=COOKIE_MAX_AGE,
        path='/'
    )
    # same rationale as in register: hand the token to non-cookie clients
    return {"message": "Login successful", "access_token": token}


@router.get('/me')
def me(request: Request, cursor=Depends(get_cursor)):
    token = request.cookies.get(COOKIE_NAME)
    if not token:
        auth = request.headers.get('Authorization')
        if auth and auth.lower().startswith('bearer '):
            token = auth.split(' ', 1)[1]

    if not token:
        raise HTTPException(status_code=401, detail='Not authenticated')

    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(status_code=401, detail='Invalid or expired token')

    user_id = payload.get('user_id')
    cursor.execute('SELECT * FROM USERS WHERE user_id = %s', (user_id,))
    user = cursor.fetchone()
    if not user:
        raise HTTPException(status_code=404, detail='User not found')
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
def logout(response: Response):
    response.delete_cookie(COOKIE_NAME, path='/')
    return {"message": "Logged out"}
