from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class EmailVerificationRequest(BaseModel):
    email: EmailStr = Field(..., description="メールアドレス")

class EmailVerificationResponse(BaseModel):
    message: str = Field(..., description="レスポンスメッセージ")
    verification_id: Optional[int] = Field(None, description="認証ID（開発用）")
    verification_code: Optional[str] = Field(None, description="認証コード（開発環境のみ）")

class VerifyCodeRequest(BaseModel):
    email: EmailStr = Field(..., description="メールアドレス")
    verification_code: str = Field(..., min_length=6, max_length=6, description="6桁の認証コード")
    password: Optional[str] = Field(None, min_length=8, description="パスワード（新規登録時のみ必須、8文字以上）")

class VerifyCodeResponse(BaseModel):
    message: str = Field(..., description="レスポンスメッセージ")
    token: Optional[str] = Field(None, description="認証トークン")
    user: Optional[dict] = Field(None, description="ユーザー情報")
    is_new_user: bool = Field(False, description="新規ユーザーかどうか")
    requires_password: bool = Field(False, description="パスワード設定が必要かどうか（新規ユーザー検出用）")

class ResendCodeRequest(BaseModel):
    email: EmailStr = Field(..., description="メールアドレス")

class ResendCodeResponse(BaseModel):
    message: str = Field(..., description="レスポンスメッセージ")
    verification_id: Optional[int] = Field(None, description="認証ID（開発用）")
    verification_code: Optional[str] = Field(None, description="認証コード（開発環境のみ）")

class ResetPasswordRequest(BaseModel):
    email: EmailStr = Field(..., description="メールアドレス")
    verification_code: str = Field(..., min_length=6, max_length=6, description="6桁の認証コード")
    new_password: str = Field(..., min_length=8, description="新しいパスワード（8文字以上）")

class ResetPasswordResponse(BaseModel):
    message: str = Field(..., description="レスポンスメッセージ")
    success: bool = Field(..., description="パスワードリセットが成功したかどうか")
