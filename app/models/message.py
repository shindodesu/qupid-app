from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, ForeignKey, Boolean
from app.db.base import Base
from app.models.common import TimestampMixin

class Message(Base, TimestampMixin):
    __tablename__ = "messages"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    conversation_id: Mapped[int] = mapped_column(ForeignKey("conversations.id", ondelete="CASCADE"), index=True, nullable=False)
    sender_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    content: Mapped[str] = mapped_column(String(4000), nullable=False)
    is_read: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    conversation = relationship("Conversation", back_populates="messages")
    sender = relationship("User")
