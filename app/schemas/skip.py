# app/schemas/skip.py

from __future__ import annotations

from pydantic import BaseModel, Field
from datetime import datetime
from typing import List
from app.schemas.user import UserWithTags


class SkipCreate(BaseModel):
    skipped_user_id: int = Field(..., gt=0, description="スキップするユーザーのID")


class SkipRead(BaseModel):
    id: int
    skipped_user: UserWithTags
    created_at: datetime

    class Config:
        from_attributes = True


class SkipListResponse(BaseModel):
    skips: List[SkipRead]
    total: int
    limit: int
    offset: int


class SkipDeleteResponse(BaseModel):
    message: str




