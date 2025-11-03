from pydantic import BaseModel, EmailStr, Field

class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1, description="パスワード")
    display_name: str | None = None

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, description="パスワード（8文字以上）")
    display_name: str | None = None

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
