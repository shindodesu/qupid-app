# app/schemas/search.py

from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List
from enum import Enum


class SortOrder(str, Enum):
    """並び順"""
    RECENT = "recent"         # 新規順
    POPULAR = "popular"       # 人気順（将来実装）
    ALPHABETICAL = "alphabetical"  # 名前順


class TagInfo(BaseModel):
    """タグ情報"""
    id: int
    name: str
    description: Optional[str]

    class Config:
        from_attributes = True


class LikeStatus(BaseModel):
    """いいね状態"""
    i_liked: bool = Field(..., description="自分が相手にいいねしているか")
    they_liked: bool = Field(..., description="相手が自分にいいねしているか")
    is_matched: bool = Field(..., description="マッチしているか")


class UserSearchResult(BaseModel):
    """ユーザー検索結果"""
    id: int
    display_name: str
    bio: Optional[str]
    faculty: Optional[str]
    grade: Optional[str]
    tags: List[TagInfo]
    created_at: datetime
    like_status: LikeStatus

    class Config:
        from_attributes = True


class UserSearchResponse(BaseModel):
    """ユーザー検索レスポンス"""
    users: List[UserSearchResult]
    total: int
    limit: int
    offset: int
    filters_applied: dict


class UserSuggestion(BaseModel):
    """おすすめユーザー"""
    id: int
    display_name: str
    bio: Optional[str]
    faculty: Optional[str]
    grade: Optional[str]
    tags: List[TagInfo]
    match_score: float = Field(..., ge=0.0, le=1.0, description="マッチスコア（0.0～1.0）")
    reason: str = Field(..., description="おすすめ理由")
    has_received_like: bool = Field(default=False, description="すでにいいねをもらっているか")

    class Config:
        from_attributes = True


class UserSuggestionsResponse(BaseModel):
    """おすすめユーザーレスポンス"""
    users: List[UserSuggestion]
    total: int
    limit: int

