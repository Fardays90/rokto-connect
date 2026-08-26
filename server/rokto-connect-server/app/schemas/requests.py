from typing import Optional

from pydantic import BaseModel, Field, field_validator

BLOOD_TYPES = {"A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"}
URGENCY_LEVELS = {"low", "medium", "high", "critical"}


def empty_to_none(value):
    # client sends "" for untouched optional fields; normalize so
    # length validation passes and profile fallbacks kick in
    if isinstance(value, str) and value.strip() == "":
        return None
    return value


def clean_blood_type(value: str) -> str:
    cleaned = value.strip().upper()
    if cleaned not in BLOOD_TYPES:
        raise ValueError("Invalid blood type.")
    return cleaned


def clean_urgency(value: str) -> str:
    cleaned = value.strip().lower()
    if cleaned not in URGENCY_LEVELS:
        raise ValueError("Urgency must be one of: low, medium, high, critical.")
    return cleaned.upper()


class CreateRequestSchema(BaseModel):
    blood_type: str = Field(..., min_length=2, max_length=3)
    urgency: str = Field(..., min_length=3, max_length=8)
    message: Optional[str] = Field(None, max_length=500)
    zip_code: Optional[str] = Field(None, min_length=4, max_length=10)
    division: Optional[str] = Field(None, max_length=100)
    district: Optional[str] = Field(None, max_length=100)

    @field_validator("message", "zip_code", "division", "district", mode="before")
    @classmethod
    def normalize_empty(cls, value):
        return empty_to_none(value)

    @field_validator("blood_type")
    @classmethod
    def validate_blood_type(cls, value: str) -> str:
        return clean_blood_type(value)

    @field_validator("urgency")
    @classmethod
    def validate_urgency(cls, value: str) -> str:
        return clean_urgency(value)


class UpdateRequestSchema(BaseModel):
    """Partial edit of an existing request.

    Location fields are intentionally absent: a request can't be moved
    after creation — delete it and create a new one instead.
    """

    blood_type: Optional[str] = Field(None, min_length=2, max_length=3)
    urgency: Optional[str] = Field(None, min_length=3, max_length=8)
    message: Optional[str] = Field(None, min_length=1, max_length=500)

    @field_validator("message", mode="before")
    @classmethod
    def normalize_message(cls, value):
        return empty_to_none(value)

    @field_validator("blood_type")
    @classmethod
    def validate_blood_type(cls, value: str) -> str:
        return clean_blood_type(value)

    @field_validator("urgency")
    @classmethod
    def validate_urgency(cls, value: str) -> str:
        return clean_urgency(value)


class CompleteRequestSchema(BaseModel):
    """Submitted by the requester when marking a request completed.

    A rating for the donor is mandatory; a written comment is optional.
    """

    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = Field(None, max_length=255)

    @field_validator("comment", mode="before")
    @classmethod
    def normalize_comment(cls, value):
        return empty_to_none(value)
