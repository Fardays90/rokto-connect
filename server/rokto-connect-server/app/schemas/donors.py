from pydantic import BaseModel, Field, field_validator

from app.schemas.requests import clean_blood_type


class BecomeDonorSchema(BaseModel):
    """Submitted when a regular member registers as a donor."""

    blood_type: str = Field(..., min_length=2, max_length=3)

    @field_validator("blood_type")
    @classmethod
    def validate_blood_type(cls, value: str) -> str:
        return clean_blood_type(value)
