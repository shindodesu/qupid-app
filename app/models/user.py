# app/models/user.py
# User model definition: minimal example

# Import necessary SQLAlchemy components
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Boolean, Index, DateTime, Date
from app.db.base import Base
from app.models.common import TimestampMixin
from datetime import datetime, date

class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    display_name: Mapped[str] = mapped_column(String(100), nullable=False, default="Anonymous")
    bio: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)  # プロフィール画像URL
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    is_admin: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    # 学内属性（必要に応じて調整）
    faculty: Mapped[str | None] = mapped_column(String(100), nullable=True)
    grade: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # プロフィール基本情報（初回登録時に必須）
    birthday: Mapped[date | None] = mapped_column(Date, nullable=True)
    gender: Mapped[str | None] = mapped_column(String(50), nullable=True)
    sexuality: Mapped[str | None] = mapped_column(String(50), nullable=True)
    looking_for: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # オンライン状態管理
    is_online: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    last_seen_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # 初回プロフィール完了フラグ
    profile_completed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    # プライバシー設定（各項目の公開/非公開）
    show_faculty: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    show_grade: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    show_birthday: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)  # デフォルトは非公開
    show_age: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)  # 年齢は公開
    show_gender: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    show_sexuality: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    show_looking_for: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    show_bio: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    show_tags: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    # relations（必要に応じ追加）
    tags = relationship("UserTag", back_populates="user", cascade="all, delete-orphan")
    email_verifications = relationship("EmailVerification", back_populates="user", cascade="all, delete-orphan")

Index("ix_users_active_name", User.is_active, User.display_name)
