from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, model_validator


class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=1000)


class TaskUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=1000)
    completed: bool | None = None

    @model_validator(mode="before")
    @classmethod
    def check_at_least_one_field(cls, data: dict) -> dict:
        if isinstance(data, dict) and not any(v is not None for v in data.values()):
            msg = "At least one field must be provided"
            raise ValueError(msg)
        return data


class TaskResponse(BaseModel):
    id: int
    title: str
    description: str | None
    completed: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
