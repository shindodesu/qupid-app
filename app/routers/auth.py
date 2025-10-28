#routはクライアントのリクエスト内容と、サーバーの処理内容を紐づける作業。

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.core.config import settings
from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User
from app.schemas.auth import LoginRequest, Token
from app.schemas.user import UserRead

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/login")
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    """ログイン - パスワード認証"""
    # パスワードが提供されていない場合はエラー
    if not payload.password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="パスワードが必要です"
        )
    
    # 九州大学メールドメインの検証
    if settings.ALLOWED_EMAIL_DOMAIN and not payload.email.endswith(f"@{settings.ALLOWED_EMAIL_DOMAIN}"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"九州大学のメールアドレス（@{settings.ALLOWED_EMAIL_DOMAIN}）のみ登録できます"
        )
    
    # ユーザーを取得
    q = await db.execute(select(User).where(User.email == payload.email))
    user = q.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="メールアドレスまたはパスワードが正しくありません"
        )
    
    # パスワード検証
    if not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="メールアドレスまたはパスワードが正しくありません"
        )
    
    # アカウントが無効化されている場合
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="このアカウントは無効化されています"
        )

    token = create_access_token(sub=str(user.id))
    user_data = UserRead.model_validate(user)
    
    # フロントエンドが期待する形式で返却
    return {
        "token": token,
        "user": user_data.model_dump()
    }

@router.post("/register")
async def register(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    """新規登録 - パスワード認証"""
    # パスワードが提供されていない場合はエラー
    if not payload.password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="パスワードが必要です"
        )
    
    # パスワードの強度チェック（最低8文字）
    if len(payload.password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="パスワードは8文字以上である必要があります"
        )
    
    # 九州大学メールドメインの検証
    if settings.ALLOWED_EMAIL_DOMAIN and not payload.email.endswith(f"@{settings.ALLOWED_EMAIL_DOMAIN}"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"九州大学のメールアドレス（@{settings.ALLOWED_EMAIL_DOMAIN}）のみ登録できます"
        )
    
    # 既存ユーザーチェック
    q = await db.execute(select(User).where(User.email == payload.email))
    existing_user = q.scalar_one_or_none()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="このメールアドレスは既に登録されています"
        )

    # パスワードをハッシュ化
    hashed_password = hash_password(payload.password)
    
    # 新規ユーザー作成
    user = User(
        email=payload.email,
        hashed_password=hashed_password,
        display_name=payload.display_name or "Anonymous"
    )
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

