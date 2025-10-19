from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Boolean, DateTime, ForeignKey
from app.db.base import Base
from app.models.common import TimestampMixin
from datetime import datetime, timedelta, timezone

class EmailVerification(Base, TimestampMixin):
    __tablename__ = "email_verifications"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    verification_code: Mapped[str] = mapped_column(String(6), nullable=False)  # 6桁の認証コード
    is_verified: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=True)  # 認証完了後にユーザーIDを設定
    
    # リレーション
    user = relationship("User", back_populates="email_verifications")

    @classmethod
    def create_verification(cls, email: str, verification_code: str, user_id: int = None) -> "EmailVerification":
        """認証コードを作成"""
        # タイムゾーンを考慮した現在時刻を使用
        now = datetime.now(timezone.utc)
        expires_at = now + timedelta(minutes=10)  # 10分で期限切れ
        return cls(
            email=email,
            verification_code=verification_code,
            expires_at=expires_at,
            user_id=user_id,
            is_verified=False
        )
