from fastapi import APIRouter, Depends, HTTPException, status, Request, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.db.session import get_db
from app.core.security import create_access_token, hash_password
from app.core.config import settings
from app.models.user import User
from app.models.email_verification import EmailVerification
from app.schemas.email_auth import (
    EmailVerificationRequest,
    EmailVerificationResponse,
    VerifyCodeRequest,
    VerifyCodeResponse,
    ResendCodeRequest,
    ResendCodeResponse,
    ResetPasswordRequest,
    ResetPasswordResponse
)
from app.schemas.user import UserRead
from app.services.email_service import email_service
from app.middleware.rate_limit import email_rate_limit_middleware
from datetime import datetime, timezone
import secrets

router = APIRouter(prefix="/auth/email", tags=["email-auth"])

# レート制限用の依存関数
async def check_email_rate_limit(request: Request) -> int:
    """メール送信レート制限をチェック"""
    try:
        return await email_rate_limit_middleware(request, max_emails=10)
    except HTTPException as e:
        # HTTPExceptionもそのまま伝播させる
        import logging
        logger = logging.getLogger(__name__)
        logger.warning(f"Rate limit check failed: {e.status_code} - {e.detail}")
        raise

@router.post("/send-code", response_model=EmailVerificationResponse)
async def send_verification_code(
    payload: EmailVerificationRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """認証コードをメールで送信"""
    import logging
    logger = logging.getLogger(__name__)
    
    # レート制限チェックを一時的に無効化（デバッグ用）
    # try:
    #     await check_email_rate_limit(http_request)
    # except HTTPException:
    #     raise
    
    logger.info(f"Received send-code request: email={payload.email}")
    try:
        email = payload.email.lower()
        
        # 九州大学メールドメインの検証
        if settings.ALLOWED_EMAIL_DOMAIN and not email.endswith(f"@{settings.ALLOWED_EMAIL_DOMAIN}"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"九州大学のメールアドレス（@{settings.ALLOWED_EMAIL_DOMAIN}）のみ登録できます"
            )
        
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
    except Exception as e:
        logger.error(f"Error in send-code endpoint: {e}", exc_info=True)
        raise
    
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
    
    # メール送信をバックグラウンドタスクとして実行（リクエストをブロックしない）
    # これにより、SMTP接続がタイムアウトしてもリクエストは成功を返す
    async def send_email_task(email: str, code: str):
        """バックグラウンドでメール送信を実行"""
        try:
            email_sent = await email_service.send_verification_email(email, code)
            logger.info(f"Background email send result: {email_sent}")
            if not email_sent:
                logger.error(f"メール送信に失敗しました: {email}")
        except Exception as e:
            logger.error(f"Background email sending error: {e}", exc_info=True)
    
    # バックグラウンドタスクとしてメール送信を追加
    background_tasks.add_task(send_email_task, email, verification_code)
    logger.info(f"メール送信タスクをバックグラウンドに追加: {email}")
    
    # 開発環境では認証コードをレスポンスに含める
    response_data = {
        "message": "認証コードを送信しました",
        "verification_id": verification.id
    }
    
    if settings.APP_ENV == "development":
        response_data["verification_code"] = verification_code
    
    # メール送信の成功を待たずに即座にレスポンスを返す
    return EmailVerificationResponse(**response_data)

@router.post("/verify-code", response_model=VerifyCodeResponse)
async def verify_code(
    request: VerifyCodeRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    認証コードを検証してログインまたは新規登録（2段階対応）
    
    フロー:
    1. 認証コードのみで呼び出し → 新規ユーザーなら requires_password=True を返す
    2. パスワード付きで再度呼び出し → ユーザー作成してログイン
    3. 既存ユーザーなら即座にログイン
    """
    email = request.email.lower()
    verification_code = request.verification_code
    password = request.password
    
    # 九州大学メールドメインの検証
    if settings.ALLOWED_EMAIL_DOMAIN and not email.endswith(f"@{settings.ALLOWED_EMAIL_DOMAIN}"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"九州大学のメールアドレス（@{settings.ALLOWED_EMAIL_DOMAIN}）のみ登録できます"
        )
    
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
    
    # ユーザーを取得
    user_result = await db.execute(
        select(User).where(User.email == email)
    )
    user = user_result.scalar_one_or_none()
    is_new_user = False
    
    if not user:
        # 新規ユーザーの場合
        if not password:
            # パスワードが提供されていない場合、パスワード設定を要求
            return VerifyCodeResponse(
                message="パスワードの設定が必要です",
                token=None,
                user=None,
                is_new_user=True,
                requires_password=True
            )
        
        # パスワード検証
        if len(password) < 8:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="パスワードは8文字以上である必要があります"
            )
        
        # 新規ユーザー作成（パスワードあり）
        hashed_password = hash_password(password)
        user = User(
            email=email,
            hashed_password=hashed_password,
            display_name="Anonymous"
        )
        db.add(user)
        is_new_user = True
        
        # 認証コードを有効化
        verification.is_verified = True
    else:
        # 既存ユーザーの場合、即座にログイン
        verification.is_verified = True
    
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
        is_new_user=is_new_user,
        requires_password=False
    )

@router.post("/resend-code", response_model=ResendCodeResponse)
async def resend_code(
    request: ResendCodeRequest,
    http_request: Request,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """認証コードを再送信"""
    import logging
    logger = logging.getLogger(__name__)
    
    # レート制限チェックを直接実行
    try:
        await check_email_rate_limit(http_request)
    except HTTPException:
        raise
    
    email = request.email.lower()
    
    # 九州大学メールドメインの検証
    if settings.ALLOWED_EMAIL_DOMAIN and not email.endswith(f"@{settings.ALLOWED_EMAIL_DOMAIN}"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"九州大学のメールアドレス（@{settings.ALLOWED_EMAIL_DOMAIN}）のみ登録できます"
        )
    
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
    
    # メール送信をバックグラウンドタスクとして実行
    async def send_email_task(email: str, code: str):
        """バックグラウンドでメール送信を実行"""
        try:
            email_sent = await email_service.send_verification_email(email, code)
            logger.info(f"Background resend email send result: {email_sent}")
            if not email_sent:
                logger.error(f"メール再送信に失敗しました: {email}")
        except Exception as e:
            logger.error(f"Background resend email sending error: {e}", exc_info=True)
    
    background_tasks.add_task(send_email_task, email, verification_code)
    logger.info(f"メール再送信タスクをバックグラウンドに追加: {email}")
    
    # 開発環境では認証コードをレスポンスに含める
    response_data = {
        "message": "認証コードを再送信しました",
        "verification_id": verification.id
    }
    
    if settings.APP_ENV == "development":
        response_data["verification_code"] = verification_code
    
    return ResendCodeResponse(**response_data)

@router.post("/reset-password", response_model=ResetPasswordResponse)
async def reset_password(
    request: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db)
):
    """パスワードをリセット"""
    email = request.email.lower()
    verification_code = request.verification_code
    new_password = request.new_password
    
    # 九州大学メールドメインの検証
    if settings.ALLOWED_EMAIL_DOMAIN and not email.endswith(f"@{settings.ALLOWED_EMAIL_DOMAIN}"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"九州大学のメールアドレス（@{settings.ALLOWED_EMAIL_DOMAIN}）のみ登録できます"
        )
    
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
    
    # ユーザーを取得
    user_result = await db.execute(
        select(User).where(User.email == email)
    )
    user = user_result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="ユーザーが見つかりません"
        )
    
    # パスワード検証
    if len(new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="パスワードは8文字以上である必要があります"
        )
    
    # パスワードを更新
    user.hashed_password = hash_password(new_password)
    
    # 認証コードを有効化
    verification.is_verified = True
    verification.user_id = user.id
    
    # コミット
    await db.commit()
    
    return ResetPasswordResponse(
        message="パスワードをリセットしました",
        success=True
    )
