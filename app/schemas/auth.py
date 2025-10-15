from pydantic import BaseModel, EmailStr

class LoginRequest(BaseModel):
    email: EmailStr
    password: str | None = None  # MVPではパスワード検証なし
    display_name: str | None = None

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
