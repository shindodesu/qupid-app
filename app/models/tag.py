from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, ForeignKey, UniqueConstraint
from app.db.base import Base
from app.models.common import TimestampMixin

class Tag(Base, TimestampMixin):
    __tablename__ = "tags"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    description: Mapped[str | None] = mapped_column(String(255))

    users = relationship("UserTag", back_populates="tag", cascade="all, delete-orphan")

class UserTag(Base, TimestampMixin):
    __tablename__ = "user_tags"
    __table_args__ = (
        UniqueConstraint("user_id", "tag_id", name="uq_user_tag_unique"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    tag_id: Mapped[int] = mapped_column(ForeignKey("tags.id", ondelete="CASCADE"), nullable=False, index=True)

    user = relationship("User", back_populates="tags")
    tag = relationship("Tag", back_populates="users")
