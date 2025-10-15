#routはクライアントのリクエスト内容と、サーバーの処理内容を紐づける作業。

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.core.config import settings
from app.core.security import create_access_token
from app.models.user import User
from app.schemas.auth import LoginRequest, Token
from app.schemas.user import UserRead

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/login")
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    """ログイン（既存ユーザーのみ、MVPではパスワード検証なし）"""
    # 既存ユーザー取得 or 自動作成（MVP版）
    q = await db.execute(select(User).where(User.email == payload.email))
    user = q.scalar_one_or_none()
    if not user:
        # ユーザーが存在しない場合は自動作成（MVP版）
        user = User(email=payload.email, display_name=payload.display_name or "Anonymous")
        db.add(user)
        await db.commit()
        await db.refresh(user)

    token = create_access_token(sub=str(user.id))
    user_data = UserRead.model_validate(user)
    
    # フロントエンドが期待する形式で返却
    return {
        "token": token,
        "user": user_data.model_dump()
    }

@router.post("/register")
async def register(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    """新規登録"""
    # 既存ユーザーチェック
    q = await db.execute(select(User).where(User.email == payload.email))
    existing_user = q.scalar_one_or_none()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="このメールアドレスは既に登録されています"
        )

    # 新規ユーザー作成
    user = User(email=payload.email, display_name=payload.display_name or "Anonymous")
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = create_access_token(sub=str(user.id))
    user_data = UserRead.model_validate(user)
    
    return {
        "token": token,
        "user": user_data.model_dump()
    }

@router.get("/verify")
async def verify():
    # ダミー：常にOK（将来OTP/リンク検証に置換予定）
    return {"ok": True}

