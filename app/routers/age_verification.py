import logging
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
)
from app.services.age_verification_service import age_verification_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/age-verification", tags=["age-verification"])


# === ユーザー向けエンドポイント ===


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
        verification = await age_verification_service.upload_student_id(
            db=db, user_id=current_user.id, email=current_user.email, image_file=file
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
