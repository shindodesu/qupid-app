import logging
import random
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.student_id_verification import StudentIdVerification
from app.schemas.age_verification import (
    StudentIdUploadResponse,
    AgeVerificationStatusResponse,
    PendingVerificationResponse,
    ApproveVerificationRequest,
    RejectVerificationRequest,
    VerificationDetailResponse,
    VerificationCodeResponse,
)
from app.services.age_verification_service import age_verification_service

logger = logging.getLogger(__name__)

# 撮影用認証コードのインメモリストア: { user_id: (code, expires_at) }
_verification_code_store: dict[int, tuple[str, datetime]] = {}
CODE_EXPIRY_MINUTES = 10

router = APIRouter(prefix="/age-verification", tags=["age-verification"])


# === ユーザー向けエンドポイント ===


@router.post("/verification-code", response_model=VerificationCodeResponse)
async def issue_verification_code(
    current_user: User = Depends(get_current_user),
):
    """
    撮影用4桁認証コードを発行（または再発行）する。

    - 認証済みユーザーのみ
    - コードは10分間有効
    - 再呼び出しで新しいコードを発行する
    """
    code = "{:04d}".format(random.randint(0, 9999))
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=CODE_EXPIRY_MINUTES)
    _verification_code_store[current_user.id] = (code, expires_at)

    logger.info(f"[AgeVerification] Code issued: user_id={current_user.id}, expires_at={expires_at}")

    return VerificationCodeResponse(
        code=code,
        expires_at=expires_at,
        expires_in_seconds=CODE_EXPIRY_MINUTES * 60,
    )


@router.get("/verification-code", response_model=VerificationCodeResponse)
async def get_verification_code(
    current_user: User = Depends(get_current_user),
):
    """
    現在の撮影用認証コードを取得する。

    - 有効なコードがなければ自動的に新規発行する
    """
    entry = _verification_code_store.get(current_user.id)
    now = datetime.now(timezone.utc)

    if entry is None or entry[1] <= now:
        # コードが存在しないか期限切れ → 新規発行
        code = "{:04d}".format(random.randint(0, 9999))
        expires_at = now + timedelta(minutes=CODE_EXPIRY_MINUTES)
        _verification_code_store[current_user.id] = (code, expires_at)
        logger.info(f"[AgeVerification] Code auto-issued: user_id={current_user.id}")
    else:
        code, expires_at = entry

    remaining_seconds = max(0, int((expires_at - now).total_seconds()))

    return VerificationCodeResponse(
        code=code,
        expires_at=expires_at,
        expires_in_seconds=remaining_seconds,
    )


@router.post("/upload", response_model=StudentIdUploadResponse)
async def upload_student_id(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    学生証画像をアップロード
    
    - 認証済みユーザーのみ
    - アップロード後は status=pending の状態で確認待機
    """
    logger.info(f"[AgeVerification] Upload started: user_id={current_user.id}, email={current_user.email}")

    try:
        # 現在の認証コードを取得（有効期限内であれば）
        code_entry = _verification_code_store.get(current_user.id)
        current_code = None
        if code_entry:
            code, expires_at = code_entry
            if expires_at > datetime.now(timezone.utc):
                current_code = code

        verification = await age_verification_service.upload_student_id(
            db=db, 
            user_id=current_user.id, 
            email=current_user.email, 
            image_file=file,
            verification_code=current_code
        )
        return StudentIdUploadResponse.from_orm(verification)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[AgeVerification] Upload failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload student ID",
        )


@router.get("/status", response_model=AgeVerificationStatusResponse)
async def get_verification_status(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    ユーザーの年齢確認ステータスを取得
    
    - status: pending / approved / rejected
    """
    verification = await age_verification_service.get_verification_status(db, current_user.id)

    if not verification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No verification found",
        )

    return AgeVerificationStatusResponse(
        status=verification.status,
        created_at=verification.created_at,
        rejected_at=verification.rejected_at,
        reason=verification.rejection_reason,
    )


# === 管理者向けエンドポイント ===


@router.get("/admin/pending", response_model=list[PendingVerificationResponse])
async def get_pending_verifications(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    limit: int = 50,
    offset: int = 0,
):
    """
    未確認の学生証一覧を取得（管理者向け）
    
    - 管理者ユーザーのみアクセス可能
    """
    # 管理者チェック
    if not current_user.is_admin:
        logger.warning(f"[AgeVerification] Unauthorized admin access attempt: user_id={current_user.id}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )

    verifications = await age_verification_service.get_pending_verifications(db, limit, offset)

    return [PendingVerificationResponse.from_orm(v) for v in verifications]


@router.post("/admin/{verification_id}/approve", response_model=VerificationDetailResponse)
async def approve_verification(
    verification_id: int,
    payload: ApproveVerificationRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    学生証を確認し、年齢確認を承認（画像は削除される）
    
    - 管理者ユーザーのみアクセス可能
    """
    # 管理者チェック
    if not current_user.is_admin:
        logger.warning(f"[AgeVerification] Unauthorized admin access attempt: user_id={current_user.id}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )

    logger.info(f"[AgeVerification] Approving verification: verification_id={verification_id}, admin_id={current_user.id}")

    try:
        verification = await age_verification_service.approve_verification(
            db=db, verification_id=verification_id, memo=payload.memo
        )
        return VerificationDetailResponse.from_orm(verification)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[AgeVerification] Approval failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to approve verification",
        )


@router.post("/admin/{verification_id}/reject", response_model=VerificationDetailResponse)
async def reject_verification(
    verification_id: int,
    payload: RejectVerificationRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    学生証を確認し、年齢確認を却下
    
    - 管理者ユーザーのみアクセス可能
    """
    # 管理者チェック
    if not current_user.is_admin:
        logger.warning(f"[AgeVerification] Unauthorized admin access attempt: user_id={current_user.id}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )

    logger.info(f"[AgeVerification] Rejecting verification: verification_id={verification_id}, admin_id={current_user.id}")

    try:
        verification = await age_verification_service.reject_verification(
            db=db, verification_id=verification_id, reason=payload.reason
        )
        return VerificationDetailResponse.from_orm(verification)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[AgeVerification] Rejection failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to reject verification",
        )


@router.get("/admin/{verification_id}", response_model=VerificationDetailResponse)
async def get_verification_detail(
    verification_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    特定の学生証確認詳細を取得（管理者向け）
    """
    # 管理者チェック
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )

    result = await db.execute(
        select(StudentIdVerification).where(StudentIdVerification.id == verification_id)
    )
    verification = result.scalar_one_or_none()

    if not verification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Verification not found",
        )

    return VerificationDetailResponse.from_orm(verification)
