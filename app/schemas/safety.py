# app/schemas/safety.py

from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List
from app.models.enums import ReportStatus


# ==================== 通報関連スキーマ ====================

class ReportCreate(BaseModel):
    """通報作成リクエスト"""
    target_user_id: int = Field(..., gt=0, description="通報対象ユーザーのID")
    reason: str = Field(..., min_length=1, max_length=1000, description="通報理由")


class ReportStatusUpdate(BaseModel):
    """通報ステータス更新リクエスト（管理者用）"""
    status: ReportStatus = Field(..., description="通報ステータス")
    admin_note: Optional[str] = Field(None, max_length=1000, description="管理者メモ")


class UserInfo(BaseModel):
    """ユーザー基本情報"""
    id: int
    display_name: str

    class Config:
        from_attributes = True


class ReportRead(BaseModel):
    """通報情報読み取り"""
    id: int
    target_user: Optional[UserInfo] = None
    reason: str
    status: ReportStatus
    admin_note: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ReportDetailRead(BaseModel):
    """通報詳細（管理者用、通報者情報を含む）"""
    id: int
    reporter: Optional[UserInfo] = None
    target_user: Optional[UserInfo] = None
    reason: str
    status: ReportStatus
    admin_note: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ReportResponse(BaseModel):
    """通報作成レスポンス"""
    id: int
    target_user_id: int
    target_user_name: str
    reason: str
    status: ReportStatus
    created_at: datetime
    message: str


class ReportListResponse(BaseModel):
    """通報一覧レスポンス"""
    reports: List[ReportRead]
    total: int
    limit: int
    offset: int


class AdminReportListResponse(BaseModel):
    """管理者用通報一覧レスポンス"""
    reports: List[ReportDetailRead]
    total: int
    limit: int
    offset: int


class ReportStatusUpdateResponse(BaseModel):
    """通報ステータス更新レスポンス"""
    id: int
    status: ReportStatus
    admin_note: Optional[str]
    updated_at: datetime
    message: str


# ==================== ブロック関連スキーマ ====================

class BlockCreate(BaseModel):
    """ブロック作成リクエスト"""
    blocked_user_id: int = Field(..., gt=0, description="ブロック対象ユーザーのID")


class BlockRead(BaseModel):
    """ブロック情報読み取り"""
    id: int
    blocked_user: UserInfo
    created_at: datetime

    class Config:
        from_attributes = True


class BlockResponse(BaseModel):
    """ブロック作成レスポンス"""
    id: int
    blocked_user: UserInfo
    created_at: datetime
    message: str


class BlockListResponse(BaseModel):
    """ブロック一覧レスポンス"""
    blocks: List[BlockRead]
    total: int
    limit: int
    offset: int


class BlockRemoveResponse(BaseModel):
    """ブロック解除レスポンス"""
    message: str
    blocked_user_id: int

