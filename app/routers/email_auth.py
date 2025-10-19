from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.db.session import get_db
from app.core.security import create_access_token
from app.models.user import User
from app.models.email_verification import EmailVerification
from app.schemas.email_auth import (
    EmailVerificationRequest,
    EmailVerificationResponse,
    VerifyCodeRequest,
    VerifyCodeResponse,
    ResendCodeRequest,
    ResendCodeResponse
)
from app.schemas.user import UserRead
from app.services.email_service import email_service
from datetime import datetime, timezone

router = APIRouter(prefix="/auth/email", tags=["email-auth"])

@router.post("/send-code", response_model=EmailVerificationResponse)
async def send_verification_code(
    request: EmailVerificationRequest,
    db: AsyncSession = Depends(get_db)
):
    """認証コードをメールで送信"""
    email = request.email.lower()
    
    # 既存の未使用認証コードを無効化
    now = datetime.now(timezone.utc)
    await db.execute(
        select(EmailVerification)
        .where(
            and_(
                EmailVerification.email == email,
                EmailVerification.is_verified == False,
                EmailVerification.expires_at > now
            )
        )
    )
    
    # 新しい認証コードを生成
    verification_code = email_service.generate_verification_code()
    
    # 認証コードをデータベースに保存
    verification = EmailVerification.create_verification(
        email=email,
        verification_code=verification_code
    )
    db.add(verification)
    await db.commit()
    await db.refresh(verification)
    
    # メール送信
    email_sent = await email_service.send_verification_email(email, verification_code)
    
    if not email_sent:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="メール送信に失敗しました"
        )
    
    return EmailVerificationResponse(
        message="認証コードを送信しました",
        verification_id=verification.id
    )

@router.post("/verify-code", response_model=VerifyCodeResponse)
async def verify_code(
    request: VerifyCodeRequest,
    db: AsyncSession = Depends(get_db)
):
    """認証コードを検証してログインまたは新規登録"""
    email = request.email.lower()
    verification_code = request.verification_code
    
    # 認証コードを検証
    now = datetime.now(timezone.utc)
    result = await db.execute(
        select(EmailVerification)
        .where(
            and_(
                EmailVerification.email == email,
                EmailVerification.verification_code == verification_code,
                EmailVerification.is_verified == False,
                EmailVerification.expires_at > now
            )
        )
    )
    verification = result.scalar_one_or_none()
    
    if not verification:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="認証コードが無効または期限切れです"
        )
    
    # 認証コードを有効化
    verification.is_verified = True
    
    # ユーザーを取得または作成
    user_result = await db.execute(
        select(User).where(User.email == email)
    )
    user = user_result.scalar_one_or_none()
    is_new_user = False
    
    if not user:
        # 新規ユーザー作成
        user = User(email=email, display_name="Anonymous")
        db.add(user)
        is_new_user = True
    
    # 認証コードとユーザーを紐付け
    verification.user_id = user.id if user.id else None
    
    # すべての変更を一度にコミット
    await db.commit()
    await db.refresh(user)
    await db.refresh(verification)
    
    # ウェルカムメール送信（新規ユーザーの場合）
    if is_new_user:
        await email_service.send_welcome_email(email, user.display_name)
    
    # アクセストークンを生成
    token = create_access_token(sub=str(user.id))
    user_data = UserRead.model_validate(user)
    
    return VerifyCodeResponse(
        message="認証が完了しました",
        token=token,
        user=user_data.model_dump(),
        is_new_user=is_new_user
    )

@router.post("/resend-code", response_model=ResendCodeResponse)
async def resend_code(
    request: ResendCodeRequest,
    db: AsyncSession = Depends(get_db)
):
    """認証コードを再送信"""
    email = request.email.lower()
    
    # 既存の未使用認証コードを無効化
    await db.execute(
        select(EmailVerification)
        .where(
            and_(
                EmailVerification.email == email,
                EmailVerification.is_verified == False
            )
        )
    )
    
    # 新しい認証コードを生成
    verification_code = email_service.generate_verification_code()
    
    # 認証コードをデータベースに保存
    verification = EmailVerification.create_verification(
        email=email,
        verification_code=verification_code
    )
    db.add(verification)
    await db.commit()
    await db.refresh(verification)
    
    # メール送信
    email_sent = await email_service.send_verification_email(email, verification_code)
    
    if not email_sent:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="メール送信に失敗しました"
        )
    
    return ResendCodeResponse(
        message="認証コードを再送信しました",
        verification_id=verification.id
    )
