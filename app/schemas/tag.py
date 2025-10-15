# app/schemas/tag.py

from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class TagBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=64)
    description: Optional[str] = Field(None, max_length=255)

class TagCreate(TagBase):
    pass

class TagRead(TagBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class TagWithUserCount(TagRead):
    user_count: int

class TagListResponse(BaseModel):
    tags: list[TagWithUserCount]
    total: int
    limit: int
    offset: int

class UserTagAdd(BaseModel):
    tag_id: int

class UserTagRead(BaseModel):
    id: int
    name: str
    description: Optional[str]
    added_at: datetime

    class Config:
        from_attributes = True

class UserTagListResponse(BaseModel):
    tags: list[UserTagRead]

class TagAddResponse(BaseModel):
    message: str
    tag: TagRead

