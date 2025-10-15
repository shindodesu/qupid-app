from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.core.config import settings
from app.core.security import create_access_token
from app.models.user import User
from app.schemas.auth import LoginRequest, Token

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/login", response_model=Token, status_code=status.HTTP_200_OK)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    # ダミー認証：ドメイン制限があればチェック
    if settings.ALLOWED_EMAIL_DOMAIN:
        domain = payload.email.split("@")[-1]
        if domain != settings.ALLOWED_EMAIL_DOMAIN:
            raise HTTPException(status_code=403, detail="Email domain not allowed")

    # 既存ユーザー取得 or 自動作成
    q = await db.execute(select(User).where(User.email == payload.email))
    user = q.scalar_one_or_none()
    if not user:
        user = User(email=payload.email, display_name=payload.display_name or "Anonymous")
        db.add(user)
        await db.commit()
        await db.refresh(user)

    token = create_access_token(sub=str(user.id))
    return Token(access_token=token)

@router.get("/verify")
async def verify():
    # ダミー：常にOK（将来OTP/リンク検証に置換予定）
    return {"ok": True}
