from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import ForeignKey, UniqueConstraint, CheckConstraint
from app.db.base import Base
from app.models.common import TimestampMixin

class Like(Base, TimestampMixin):
    __tablename__ = "likes"
    __table_args__ = (
        UniqueConstraint("liker_id", "liked_id", name="uq_like_unique"),
        CheckConstraint("liker_id <> liked_id", name="ck_like_not_self"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    liker_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    liked_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)

    liker = relationship("User", foreign_keys=[liker_id])
    liked = relationship("User", foreign_keys=[liked_id])
