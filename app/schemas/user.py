# app/schemas/user.py
# User schema definition: minimal example

from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime, date


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
    avatar_url: Optional[str] = None
    campus: Optional[str] = None
    faculty: Optional[str] = None
    grade: Optional[str] = None
    birthday: Optional[date] = None
    gender: Optional[str] = None
    sexuality: Optional[str] = None
    looking_for: Optional[str] = None
    profile_completed: Optional[bool] = False
    is_active: Optional[bool] = True
    created_at: Optional[datetime] = None
    
    # プライバシー設定
    show_faculty: Optional[bool] = True
    show_grade: Optional[bool] = True
    show_birthday: Optional[bool] = False
    show_age: Optional[bool] = True
    show_gender: Optional[bool] = True
    show_sexuality: Optional[bool] = True
    show_looking_for: Optional[bool] = True
    show_bio: Optional[bool] = True
    show_tags: Optional[bool] = True

    class Config:
        from_attributes = True

# 初回プロフィール登録用スキーマ
class InitialProfileCreate(BaseModel):
    display_name: str
    birthday: date | None = None
    gender: str
    sexuality: str
    looking_for: str

    class Config:
        from_attributes = True

# タグ情報を含むユーザー詳細（マッチング用）
class UserWithTags(UserRead):
    tags: List[dict] = []

    class Config:
        from_attributes = True

# プライバシー設定更新用スキーマ
class PrivacySettingsUpdate(BaseModel):
    show_faculty: Optional[bool] = None
    show_grade: Optional[bool] = None
    show_birthday: Optional[bool] = None
    show_age: Optional[bool] = None
    show_gender: Optional[bool] = None
    show_sexuality: Optional[bool] = None
    show_looking_for: Optional[bool] = None
    show_bio: Optional[bool] = None
    show_tags: Optional[bool] = None

    class Config:
        from_attributes = True