# app/schemas/like.py

from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List
from app.schemas.user import UserRead, UserWithTags


class LikeCreate(BaseModel):
    liked_user_id: int = Field(..., gt=0, description="いいねを送るユーザーのID")


class LikeBase(BaseModel):
    id: int
    liker_id: int
    liked_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class LikeResponse(BaseModel):
    message: str | None = None
    like: LikeBase
    is_match: bool
    match: Optional[dict] = None


class SentLikeRead(BaseModel):
    id: int
    liked_user: UserWithTags
    created_at: datetime
    is_matched: bool

    class Config:
        from_attributes = True


class ReceivedLikeRead(BaseModel):
    id: int
    user: UserWithTags
    created_at: datetime
    is_matched: bool

    class Config:
        from_attributes = True


class LikeListResponse(BaseModel):
    likes: List[SentLikeRead] | List[ReceivedLikeRead]
    total: int
    limit: int
    offset: int


class MatchRead(BaseModel):
    id: int
    user: UserWithTags
    matched_at: datetime

    class Config:
        from_attributes = True


class MatchListResponse(BaseModel):
    matches: List[MatchRead]
    total: int
    limit: int
    offset: int


class MatchStatus(BaseModel):
    is_matched: bool
    match: Optional[MatchRead] = None
    like_status: Optional[dict] = None


class LikeDeleteResponse(BaseModel):
    message: str

