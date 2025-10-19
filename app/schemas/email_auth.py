from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class EmailVerificationRequest(BaseModel):
    email: EmailStr = Field(..., description="メールアドレス")

class EmailVerificationResponse(BaseModel):
    message: str = Field(..., description="レスポンスメッセージ")
    verification_id: Optional[int] = Field(None, description="認証ID（開発用）")

class VerifyCodeRequest(BaseModel):
    email: EmailStr = Field(..., description="メールアドレス")
    verification_code: str = Field(..., min_length=6, max_length=6, description="6桁の認証コード")

class VerifyCodeResponse(BaseModel):
    message: str = Field(..., description="レスポンスメッセージ")
    token: Optional[str] = Field(None, description="認証トークン")
    user: Optional[dict] = Field(None, description="ユーザー情報")
    is_new_user: bool = Field(False, description="新規ユーザーかどうか")

class ResendCodeRequest(BaseModel):
    email: EmailStr = Field(..., description="メールアドレス")

class ResendCodeResponse(BaseModel):
    message: str = Field(..., description="レスポンスメッセージ")
    verification_id: Optional[int] = Field(None, description="認証ID（開発用）")
