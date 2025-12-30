from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import ForeignKey, UniqueConstraint, CheckConstraint
from app.db.base import Base
from app.models.common import TimestampMixin

class Skip(Base, TimestampMixin):
    __tablename__ = "skips"
    __table_args__ = (
        UniqueConstraint("skipper_id", "skipped_id", name="uq_skip_unique"),
        CheckConstraint("skipper_id <> skipped_id", name="ck_skip_not_self"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    skipper_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    skipped_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)

    skipper = relationship("User", foreign_keys=[skipper_id], lazy="joined")
    skipped = relationship("User", foreign_keys=[skipped_id], lazy="joined")




