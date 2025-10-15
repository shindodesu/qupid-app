# app/schemas/user.py
# User schema definition: minimal example

from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


class userBase(BaseModel):
    email: EmailStr
    displayname: str

class UserCreate(BaseModel):
    pass

class UserRead(BaseModel):
    id: int
    email: str
    display_name: str
    bio: Optional[str] = None
    faculty: Optional[str] = None
    grade: Optional[str] = None
    is_active: Optional[bool] = True
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# タグ情報を含むユーザー詳細（マッチング用）
class UserWithTags(UserRead):
    tags: List[dict] = []

    class Config:
        from_attributes = True