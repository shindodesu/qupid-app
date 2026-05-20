from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

# === ユーザー向けスキーマ ===

class VerificationCodeResponse(BaseModel):
    """撮影用4桁認証コードのレスポンス"""
    code: str  # 4桁の数字文字列
    expires_at: datetime
    expires_in_seconds: int  # 残り秒数


class StudentIdUploadResponse(BaseModel):
    """学生証アップロード後のレスポンス"""
    id: int
    user_id: int
    status: str  # "pending"
    created_at: datetime

    class Config:
        from_attributes = True


class AgeVerificationStatusResponse(BaseModel):
    """年齢確認ステータス取得レスポンス"""
    status: str  # "pending" / "approved" / "rejected"
    created_at: datetime
    rejected_at: Optional[datetime] = None
    reason: Optional[str] = None  # rejected の場合のみ

    class Config:
        from_attributes = True


# === 管理者向けスキーマ ===

class PendingVerificationResponse(BaseModel):
    """未確認ユーザー情報（管理者向け一覧）"""
    id: int
    user_id: int
    email: str
    image_url: Optional[str] = None
    verification_code: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ApproveVerificationRequest(BaseModel):
    """年齢確認承認リクエスト"""
    memo: Optional[str] = Field(None, max_length=500)  # 管理者メモ（オプション）


class RejectVerificationRequest(BaseModel):
    """年齢確認却下リクエスト"""
    reason: str = Field(..., max_length=500)  # 却下理由（必須）


class VerificationDetailResponse(BaseModel):
    """年齢確認詳細（管理者向け）"""
    id: int
    user_id: int
    email: str
    image_url: Optional[str] = None
    verification_code: Optional[str] = None
    status: str
    created_at: datetime
    approved_at: Optional[datetime] = None
    rejected_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None

    class Config:
        from_attributes = True
