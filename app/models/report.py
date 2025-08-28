from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, ForeignKey
from app.db.base import Base
from app.models.common import TimestampMixin
from app.models.enums import ReportStatus

class Report(Base, TimestampMixin):
    __tablename__ = "reports"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    reporter_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), index=True, nullable=True)
    target_user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), index=True, nullable=True)
    reason: Mapped[str] = mapped_column(String(1000), nullable=False)
    status: Mapped[ReportStatus] = mapped_column(default=ReportStatus.open, nullable=False)
    admin_note: Mapped[str | None] = mapped_column(String(1000))

    reporter = relationship("User", foreign_keys=[reporter_id])
    target_user = relationship("User", foreign_keys=[target_user_id])
