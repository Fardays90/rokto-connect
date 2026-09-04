from pydantic import BaseModel, ConfigDict, Field, field_validator
from typing import Optional
import re

class RegisterSchema(BaseModel):
    first_name: str = Field(..., min_length=2, max_length=50)
    last_name: str = Field(..., min_length=2, max_length=50)
    phone_number: str = Field(..., min_length=11, max_length=20)
    password: str = Field(..., min_length=8, description="Plaintext password to be hashed")
    zip_code: str = Field(..., min_length=2, max_length=10)
    district: str = Field(..., min_length=2, max_length=100)
    division: str = Field(..., min_length=2, max_length=100)

    @field_validator("phone_number")
    @classmethod
    def validate_phone_number(cls, value: str) -> str:
        cleaned = re.sub(r"[\s\-\(\)]", "", value)
        if not re.match(r"^\+?\d{11,15}$", cleaned):
            raise ValueError("Phone number must contain between 11 and 15 digits.")
        return cleaned
class LoginSchema(BaseModel):
    phone_number: str = Field(..., min_length=2)
    password: str = Field(..., min_length=2)


def _empty_to_none(value):
    if isinstance(value, str) and value.strip() == "":
        return None
    return value


class UpdateProfileSchema(BaseModel):
    model_config = ConfigDict(extra="ignore")

    first_name: Optional[str] = Field(None, min_length=2, max_length=50)
    last_name: Optional[str] = Field(None, min_length=2, max_length=50)
    phone_number: Optional[str] = Field(None, min_length=11, max_length=20)
    zip_code: Optional[str] = Field(None, min_length=2, max_length=10)
    district: Optional[str] = Field(None, min_length=2, max_length=100)
    division: Optional[str] = Field(None, min_length=2, max_length=100)

    @field_validator(
        "first_name", "last_name", "phone_number",
        "zip_code", "district", "division", mode="before",
    )
    @classmethod
    def normalize_empty(cls, value):
        return _empty_to_none(value)


class ChangePasswordSchema(BaseModel):
    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=8)
class UserResponse(BaseModel):
    user_id: int
    first_name: str
    last_name: str
    phone_number: str
    zip_code: str
    district: str
    division: str
    verified: bool = False
    class Config:
        from_attributes = True
class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Optional[UserResponse] = None