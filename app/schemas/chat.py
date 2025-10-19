# app/schemas/chat.py

from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List
from app.models.enums import ConversationType, MessageType


class ConversationCreate(BaseModel):
    """会話作成リクエスト"""
    other_user_id: int = Field(..., gt=0, description="会話相手のユーザーID")


class MessageCreate(BaseModel):
    """メッセージ作成リクエスト"""
    content: str = Field(..., min_length=1, max_length=4000, description="メッセージ内容")
    message_type: MessageType = Field(default=MessageType.text, description="メッセージタイプ")
    file_path: Optional[str] = Field(None, max_length=500, description="ファイルパス")
    file_size: Optional[int] = Field(None, ge=0, description="ファイルサイズ（バイト）")
    duration_seconds: Optional[int] = Field(None, ge=0, description="音声メッセージの長さ（秒）")


class UserInfo(BaseModel):
    """ユーザー基本情報"""
    id: int
    display_name: str
    bio: Optional[str]
    is_online: bool = Field(default=False, description="オンライン状態")
    last_seen_at: Optional[datetime] = Field(None, description="最終アクセス時刻")

    class Config:
        from_attributes = True


class MessageRead(BaseModel):
    """メッセージ読み取り"""
    id: int
    content: str
    sender_id: int
    sender_name: str
    is_read: bool
    created_at: datetime
    message_type: MessageType = Field(default=MessageType.text, description="メッセージタイプ")
    file_path: Optional[str] = Field(None, description="ファイルパス")
    file_size: Optional[int] = Field(None, description="ファイルサイズ（バイト）")
    duration_seconds: Optional[int] = Field(None, description="音声メッセージの長さ（秒）")

    class Config:
        from_attributes = True


class LastMessage(BaseModel):
    """最後のメッセージ"""
    id: int
    content: str
    sender_id: int
    created_at: datetime
    is_read: bool

    class Config:
        from_attributes = True


class ConversationRead(BaseModel):
    """会話情報"""
    id: int
    type: ConversationType
    title: Optional[str]
    other_user: UserInfo
    last_message: Optional[LastMessage]
    unread_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ConversationDetail(BaseModel):
    """会話詳細"""
    id: int
    type: ConversationType
    title: Optional[str]
    other_user: UserInfo
    created_at: datetime

    class Config:
        from_attributes = True


class ConversationListResponse(BaseModel):
    """会話一覧レスポンス"""
    conversations: List[ConversationRead]
    total: int
    limit: int
    offset: int


class MessageListResponse(BaseModel):
    """メッセージ一覧レスポンス"""
    messages: List[MessageRead]
    total: int
    limit: int
    offset: int


class UnreadCountResponse(BaseModel):
    """未読メッセージ数レスポンス"""
    unread_count: int


class MessageReadResponse(BaseModel):
    """既読マークレスポンス"""
    message: str
    message_id: int

