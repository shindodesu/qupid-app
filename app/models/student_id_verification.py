from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Integer, DateTime, ForeignKey, Index
from app.db.base import Base
from app.models.common import TimestampMixin
from datetime import datetime

class StudentIdVerification(Base, TimestampMixin):
    """学生証年齢確認モデル"""
    
    __tablename__ = "student_id_verifications"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)  # 確認用の冗長キー
    
    # 画像ファイル（承認後に削除される）
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    
    # ステータス: pending / approved / rejected
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending", index=True)
    
    # 撮影時に表示されていた認証コード
    verification_code: Mapped[str | None] = mapped_column(String(10), nullable=True)
    
    # 却下理由
    rejection_reason: Mapped[str | None] = mapped_column(String(500), nullable=True)
    
    # 承認/却下日時
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    rejected_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # リレーション
    user = relationship("User", backref="student_id_verifications")

# インデックス
Index("ix_student_id_user_status", StudentIdVerification.user_id, StudentIdVerification.status)
Index("ix_student_id_email_status", StudentIdVerification.email, StudentIdVerification.status)
