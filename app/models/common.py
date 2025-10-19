from datetime import datetime, timezone as dt_timezone
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import DateTime

def get_current_timestamp():
    """現在のUTCタイムスタンプを返す"""
    return datetime.now(dt_timezone.utc)

class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=get_current_timestamp, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=get_current_timestamp, onupdate=get_current_timestamp, nullable=False
    )
