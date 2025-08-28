# app/models/user.py
# User model definition: minimal example

# Import necessary SQLAlchemy components
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Boolean, Index
from app.db.base import Base
from app.models.common import TimestampMixin

class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    display_name: Mapped[str] = mapped_column(String(100), nullable=False, default="Anonymous")
    bio: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    # 学内属性（必要に応じて調整）
    faculty: Mapped[str | None] = mapped_column(String(100), nullable=True)
    grade: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # relations（必要に応じ追加）
    tags = relationship("UserTag", back_populates="user", cascade="all, delete-orphan")

Index("ix_users_active_name", User.is_active, User.display_name)
