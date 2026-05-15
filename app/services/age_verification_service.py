import logging
import os
from datetime import datetime, timezone
from fastapi import UploadFile, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.student_id_verification import StudentIdVerification
from app.models.user import User
from app.services.email_service import email_service

logger = logging.getLogger(__name__)

UPLOADS_DIR = "uploads/student_ids"
ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB


class AgeVerificationService:
    """年齢確認サービス"""

    @staticmethod
    async def upload_student_id(
        db: AsyncSession, user_id: int, email: str, image_file: UploadFile
    ) -> StudentIdVerification:
        """
        学生証画像をアップロード
        
        Args:
            db: DBセッション
            user_id: ユーザーID
            email: メールアドレス
            image_file: アップロードファイル
            
        Returns:
            StudentIdVerification レコード
        """
        # ファイルバリデーション
        AgeVerificationService._validate_image_file(image_file)

        # ファイル保存
        file_path = await AgeVerificationService._save_image_file(image_file, user_id, email)

        # 既存の pending レコードを削除（重複排除）
        await AgeVerificationService._delete_existing_pending(db, user_id)

        # StudentIdVerification レコード作成
        verification = StudentIdVerification(
            user_id=user_id,
            email=email,
            image_url=file_path,
            status="pending",
        )
        db.add(verification)
        await db.commit()
        await db.refresh(verification)

        logger.info(f"[AgeVerification] Student ID uploaded: user_id={user_id}, verification_id={verification.id}")

        return verification

    @staticmethod
    async def get_verification_status(
        db: AsyncSession, user_id: int
    ) -> StudentIdVerification | None:
        """ユーザーの最新の年齢確認ステータスを取得"""
        result = await db.execute(
            select(StudentIdVerification)
            .where(StudentIdVerification.user_id == user_id)
            .order_by(StudentIdVerification.created_at.desc())
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def approve_verification(
        db: AsyncSession, verification_id: int, memo: str | None = None
    ) -> StudentIdVerification:
        """
        年齢確認を承認し、画像を削除
        
        Args:
            db: DBセッション
            verification_id: 確認レコードID
            memo: 管理者メモ（オプション）
            
        Returns:
            更新された StudentIdVerification レコード
        """
        # 確認レコード取得
        result = await db.execute(
            select(StudentIdVerification).where(StudentIdVerification.id == verification_id)
        )
        verification = result.scalar_one_or_none()

        if not verification:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Verification not found")

        if verification.status != "pending":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot approve verification with status: {verification.status}",
            )

        # User の age_verified を True に更新
        user_result = await db.execute(select(User).where(User.id == verification.user_id))
        user = user_result.scalar_one()

        user.age_verified = True
        user.age_verified_at = datetime.now(timezone.utc)

        user_email = user.email
        user_id = user.id

        # StudentIdVerification を承認状態に更新
        verification.status = "approved"
        verification.approved_at = datetime.now(timezone.utc)

        # 画像ファイルを削除
        await AgeVerificationService._delete_image_file(verification.image_url)
        verification.image_url = None

        await db.commit()
        await db.refresh(verification)

        logger.info(f"[AgeVerification] Verification approved: verification_id={verification_id}, user_id={user_id}")

        # メール送信（プロフィール設定URL）
        try:
            await AgeVerificationService._send_approval_email(user_email, user_id)
        except Exception as e:
            logger.error(f"[AgeVerification] Failed to send approval email: {e}")

        return verification

    @staticmethod
    async def reject_verification(
        db: AsyncSession, verification_id: int, reason: str
    ) -> StudentIdVerification:
        """
        年齢確認を却下
        
        Args:
            db: DBセッション
            verification_id: 確認レコードID
            reason: 却下理由
            
        Returns:
            更新された StudentIdVerification レコード
        """
        result = await db.execute(
            select(StudentIdVerification).where(StudentIdVerification.id == verification_id)
        )
        verification = result.scalar_one_or_none()

        if not verification:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Verification not found")

        if verification.status != "pending":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot reject verification with status: {verification.status}",
            )

        user_result = await db.execute(select(User).where(User.id == verification.user_id))
        user = user_result.scalar_one()
        user_email = user.email

        # StudentIdVerification を却下状態に更新
        verification.status = "rejected"
        verification.rejection_reason = reason
        verification.rejected_at = datetime.now(timezone.utc)

        # 画像ファイルを削除
        await AgeVerificationService._delete_image_file(verification.image_url)
        verification.image_url = None

        await db.commit()
        await db.refresh(verification)

        logger.info(f"[AgeVerification] Verification rejected: verification_id={verification_id}, reason={reason}")

        # メール送信（再提出依頼）
        try:
            await AgeVerificationService._send_rejection_email(user_email, reason)
        except Exception as e:
            logger.error(f"[AgeVerification] Failed to send rejection email: {e}")

        return verification

    @staticmethod
    async def get_pending_verifications(db: AsyncSession, limit: int = 50, offset: int = 0):
        """未確認の一覧を取得（管理者向け）"""
        result = await db.execute(
            select(StudentIdVerification)
            .where(StudentIdVerification.status == "pending")
            .order_by(StudentIdVerification.created_at.asc())
            .limit(limit)
            .offset(offset)
        )
        return result.scalars().all()

    # === プライベートメソッド ===

    @staticmethod
    def _validate_image_file(image_file: UploadFile) -> None:
        """ファイルバリデーション"""
        if not image_file.filename:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Filename is empty")

        ext = image_file.filename.split(".")[-1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}",
            )

        if image_file.size and image_file.size > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File size exceeds maximum {MAX_FILE_SIZE / 1024 / 1024}MB",
            )

    @staticmethod
    async def _save_image_file(image_file: UploadFile, user_id: int, email: str) -> str:
        """ファイルをディスクに保存"""
        os.makedirs(UPLOADS_DIR, exist_ok=True)

        # ファイル名生成: user_id_email_timestamp.ext
        timestamp = datetime.now(timezone.utc).timestamp()
        ext = image_file.filename.split(".")[-1]
        file_name = f"{user_id}_{email.split('@')[0]}_{int(timestamp)}.{ext}"
        file_path = os.path.join(UPLOADS_DIR, file_name)

        # ファイル保存
        content = await image_file.read()
        with open(file_path, "wb") as f:
            f.write(content)

        logger.info(f"[AgeVerification] Image saved: {file_path}")

        return file_path

    @staticmethod
    async def _delete_image_file(file_path: str | None) -> None:
        """ファイルをディスクから削除"""
        if not file_path:
            return

        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                logger.info(f"[AgeVerification] Image deleted: {file_path}")
        except Exception as e:
            logger.error(f"[AgeVerification] Failed to delete image: {file_path}, error: {e}")

    @staticmethod
    async def _delete_existing_pending(db: AsyncSession, user_id: int) -> None:
        """既存の pending レコードをクリーンアップ"""
        result = await db.execute(
            select(StudentIdVerification).where(
                (StudentIdVerification.user_id == user_id)
                & (StudentIdVerification.status == "pending")
            )
        )
        existing = result.scalars().all()

        for record in existing:
            await AgeVerificationService._delete_image_file(record.image_url)
            await db.delete(record)

        if existing:
            await db.commit()
            logger.info(f"[AgeVerification] Cleaned up {len(existing)} pending records for user_id={user_id}")

    @staticmethod
    async def _send_approval_email(email: str, user_id: int) -> None:
        """承認メール送信"""
        # TODO: プロフィール設定URLのトークンを生成（実装時に詳細を決める）
        profile_url = f"https://qupid.example.com/initial-profile?user_id={user_id}"

        subject = "Qupidの年齢確認が完了しました"
        body = f"""
年齢確認が完了しました。

プロフィール設定をお進めください：
{profile_url}

このリンクは24時間有効です。
"""

        await email_service.send_email(email, subject, body)

    @staticmethod
    async def _send_rejection_email(email: str, reason: str) -> None:
        """却下メール送信"""
        subject = "Qupidの年齢確認が却下されました"
        body = f"""
年齢確認が却下されました。

理由: {reason}

新しい学生証画像で再度ご提出ください：
https://qupid.example.com/student-id-upload
"""

        await email_service.send_email(email, subject, body)


# グローバルインスタンス
age_verification_service = AgeVerificationService()
