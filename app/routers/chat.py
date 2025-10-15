# app/routers/chat.py

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func, desc
from sqlalchemy.orm import selectinload
from app.db.session import get_db
from app.models.user import User
from app.models.conversation import Conversation, ConversationMember
from app.models.message import Message
from app.models.like import Like
from app.models.block import Block
from app.models.enums import ConversationType
from app.schemas.chat import (
    ConversationCreate,
    ConversationRead,
    ConversationDetail,
    ConversationListResponse,
    MessageCreate,
    MessageRead,
    MessageListResponse,
    UnreadCountResponse,
    MessageReadResponse,
    UserInfo,
    LastMessage,
)
from app.core.security import get_current_user
from typing import Optional
from datetime import datetime, timezone

router = APIRouter(prefix="/conversations", tags=["chat"])


# ==================== ヘルパー関数 ====================

async def check_conversation_member(
    conversation_id: int,
    user_id: int,
    db: AsyncSession
) -> bool:
    """ユーザーが会話の参加者かチェック"""
    query = await db.execute(
        select(ConversationMember).where(
            and_(
                ConversationMember.conversation_id == conversation_id,
                ConversationMember.user_id == user_id,
            )
        )
    )
    member = query.scalar_one_or_none()
    return member is not None


async def get_other_user_in_conversation(
    conversation_id: int,
    current_user_id: int,
    db: AsyncSession
) -> Optional[User]:
    """会話内の相手ユーザーを取得（1対1会話の場合）"""
    query = await db.execute(
        select(ConversationMember)
        .where(
            and_(
                ConversationMember.conversation_id == conversation_id,
                ConversationMember.user_id != current_user_id,
            )
        )
        .options(selectinload(ConversationMember.user))
    )
    member = query.scalar_one_or_none()
    return member.user if member else None


async def check_users_matched(user1_id: int, user2_id: int, db: AsyncSession) -> bool:
    """2人のユーザーがマッチしているかチェック"""
    # 両方向のいいねが存在するかチェック
    my_like_query = await db.execute(
        select(Like).where(
            and_(
                Like.liker_id == user1_id,
                Like.liked_id == user2_id,
            )
        )
    )
    my_like = my_like_query.scalar_one_or_none()
    
    their_like_query = await db.execute(
        select(Like).where(
            and_(
                Like.liker_id == user2_id,
                Like.liked_id == user1_id,
            )
        )
    )
    their_like = their_like_query.scalar_one_or_none()
    
    return my_like is not None and their_like is not None


async def check_users_blocked(user1_id: int, user2_id: int, db: AsyncSession) -> bool:
    """2人のユーザー間でブロックされているかチェック"""
    block_query = await db.execute(
        select(Block).where(
            or_(
                and_(Block.blocker_id == user1_id, Block.blocked_id == user2_id),
                and_(Block.blocker_id == user2_id, Block.blocked_id == user1_id),
            )
        )
    )
    block = block_query.scalar_one_or_none()
    return block is not None


async def get_existing_conversation(user1_id: int, user2_id: int, db: AsyncSession) -> Optional[Conversation]:
    """2人のユーザー間の既存の会話を取得"""
    # user1が参加している会話
    user1_conversations_query = select(ConversationMember.conversation_id).where(
        ConversationMember.user_id == user1_id
    )
    
    # user2が参加している会話
    user2_conversations_query = select(ConversationMember.conversation_id).where(
        ConversationMember.user_id == user2_id
    )
    
    # 両方が参加している会話を取得
    query = await db.execute(
        select(Conversation).where(
            and_(
                Conversation.id.in_(user1_conversations_query),
                Conversation.id.in_(user2_conversations_query),
                Conversation.type == ConversationType.direct,
            )
        )
    )
    
    return query.scalar_one_or_none()


# ==================== 会話一覧取得エンドポイント ====================

@router.get("", response_model=ConversationListResponse)
async def get_conversations(
    limit: int = Query(20, ge=1, le=100, description="取得件数"),
    offset: int = Query(0, ge=0, description="オフセット"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    会話一覧を取得
    
    - 自分が参加している会話の一覧
    - 最後のメッセージ情報を含む
    - 未読メッセージ数を含む
    - 最後のメッセージ日時順に並び替え
    """
    
    # 自分が参加している会話IDを取得
    my_conversations_query = select(ConversationMember.conversation_id).where(
        ConversationMember.user_id == current_user.id
    )
    
    # 総数取得
    count_query = select(func.count()).select_from(
        select(Conversation.id).where(
            Conversation.id.in_(my_conversations_query)
        ).subquery()
    )
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    
    # 会話取得
    conversations_query = await db.execute(
        select(Conversation)
        .where(Conversation.id.in_(my_conversations_query))
        .order_by(Conversation.updated_at.desc())
        .limit(limit)
        .offset(offset)
    )
    conversations = conversations_query.scalars().all()
    
    if not conversations:
        return ConversationListResponse(
            conversations=[],
            total=total,
            limit=limit,
            offset=offset,
        )
    
    conversation_ids = [conv.id for conv in conversations]
    
    # パフォーマンス最適化: 全会話のメンバーを一括取得
    members_query = await db.execute(
        select(ConversationMember)
        .where(ConversationMember.conversation_id.in_(conversation_ids))
        .options(selectinload(ConversationMember.user))
    )
    all_members = members_query.scalars().all()
    
    # 会話IDごとにメンバーを整理
    members_dict = {}
    for member in all_members:
        if member.conversation_id not in members_dict:
            members_dict[member.conversation_id] = []
        members_dict[member.conversation_id].append(member)
    
    # パフォーマンス最適化: 全会話の最後のメッセージを一括取得
    # 各会話の最新メッセージIDを取得するサブクエリ
    latest_message_subquery = (
        select(
            Message.conversation_id,
            func.max(Message.id).label("max_id")
        )
        .where(Message.conversation_id.in_(conversation_ids))
        .group_by(Message.conversation_id)
        .subquery()
    )
    
    # 最新メッセージを取得
    latest_messages_query = await db.execute(
        select(Message)
        .join(
            latest_message_subquery,
            and_(
                Message.conversation_id == latest_message_subquery.c.conversation_id,
                Message.id == latest_message_subquery.c.max_id
            )
        )
        .options(selectinload(Message.sender))
    )
    latest_messages = latest_messages_query.scalars().all()
    
    # 会話IDごとに最新メッセージを整理
    latest_message_dict = {msg.conversation_id: msg for msg in latest_messages}
    
    # パフォーマンス最適化: 全会話の未読メッセージ数を一括取得
    unread_counts_query = await db.execute(
        select(
            Message.conversation_id,
            func.count(Message.id).label("unread_count")
        )
        .where(
            and_(
                Message.conversation_id.in_(conversation_ids),
                Message.sender_id != current_user.id,
                Message.is_read == False
            )
        )
        .group_by(Message.conversation_id)
    )
    unread_counts = unread_counts_query.all()
    
    # 会話IDごとに未読数を整理
    unread_count_dict = {row[0]: row[1] for row in unread_counts}
    
    # レスポンス整形
    conversation_reads = []
    for conv in conversations:
        # 相手ユーザーを取得（1対1会話の場合）
        members = members_dict.get(conv.id, [])
        other_user = None
        for member in members:
            if member.user_id != current_user.id:
                other_user = member.user
                break
        
        if not other_user:
            continue  # 相手ユーザーがいない場合はスキップ
        
        # 最後のメッセージ
        last_msg = latest_message_dict.get(conv.id)
        last_message = None
        if last_msg:
            last_message = LastMessage(
                id=last_msg.id,
                content=last_msg.content,
                sender_id=last_msg.sender_id,
                created_at=last_msg.created_at,
                is_read=last_msg.is_read,
            )
        
        # 未読数
        unread_count = unread_count_dict.get(conv.id, 0)
        
        conversation_reads.append(
            ConversationRead(
                id=conv.id,
                type=conv.type,
                title=conv.title,
                other_user=UserInfo(
                    id=other_user.id,
                    display_name=other_user.display_name,
                    bio=other_user.bio,
                ),
                last_message=last_message,
                unread_count=unread_count,
                created_at=conv.created_at,
                updated_at=conv.updated_at,
            )
        )
    
    return ConversationListResponse(
        conversations=conversation_reads,
        total=total,
        limit=limit,
        offset=offset,
    )


# ==================== 会話作成エンドポイント ====================

@router.post("", response_model=ConversationDetail, status_code=status.HTTP_201_CREATED)
async def create_conversation(
    payload: ConversationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    会話を作成
    
    - マッチしたユーザー間のみ作成可能
    - ブロックユーザーとは作成不可
    - 既存の会話がある場合はそれを返す
    """
    
    # 自分自身との会話は作成不可
    if payload.other_user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot create conversation with yourself",
        )
    
    # 相手ユーザーの存在確認
    other_user = await db.get(User, payload.other_user_id)
    if not other_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    # ブロック状態をチェック
    is_blocked = await check_users_blocked(current_user.id, payload.other_user_id, db)
    if is_blocked:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot create conversation with this user",
        )
    
    # マッチング状態をチェック
    is_matched = await check_users_matched(current_user.id, payload.other_user_id, db)
    if not is_matched:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Can only create conversation with matched users",
        )
    
    # 既存の会話をチェック
    existing_conv = await get_existing_conversation(current_user.id, payload.other_user_id, db)
    if existing_conv:
        # 既存の会話を返す
        return ConversationDetail(
            id=existing_conv.id,
            type=existing_conv.type,
            title=existing_conv.title,
            other_user=UserInfo(
                id=other_user.id,
                display_name=other_user.display_name,
                bio=other_user.bio,
            ),
            created_at=existing_conv.created_at,
        )
    
    # 新しい会話を作成
    new_conversation = Conversation(
        type=ConversationType.direct,
    )
    db.add(new_conversation)
    await db.flush()  # IDを取得するためにflush
    
    # メンバーを追加
    member1 = ConversationMember(
        conversation_id=new_conversation.id,
        user_id=current_user.id,
    )
    member2 = ConversationMember(
        conversation_id=new_conversation.id,
        user_id=payload.other_user_id,
    )
    db.add(member1)
    db.add(member2)
    
    await db.commit()
    await db.refresh(new_conversation)
    
    return ConversationDetail(
        id=new_conversation.id,
        type=new_conversation.type,
        title=new_conversation.title,
        other_user=UserInfo(
            id=other_user.id,
            display_name=other_user.display_name,
            bio=other_user.bio,
        ),
        created_at=new_conversation.created_at,
    )


# ==================== メッセージ履歴取得エンドポイント ====================

@router.get("/{conversation_id}/messages", response_model=MessageListResponse)
async def get_messages(
    conversation_id: int,
    limit: int = Query(50, ge=1, le=100, description="取得件数"),
    offset: int = Query(0, ge=0, description="オフセット"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    メッセージ履歴を取得
    
    - 会話の参加者のみ取得可能
    - 古い順に並び替え
    - ページネーション対応
    """
    
    # 会話の存在確認
    conversation = await db.get(Conversation, conversation_id)
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found",
        )
    
    # 参加者チェック
    is_member = await check_conversation_member(conversation_id, current_user.id, db)
    if not is_member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this conversation",
        )
    
    # 総数取得
    count_query = select(func.count()).select_from(Message).where(
        Message.conversation_id == conversation_id
    )
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    
    # メッセージ取得（古い順）
    messages_query = await db.execute(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .options(selectinload(Message.sender))
        .order_by(Message.created_at.asc())
        .limit(limit)
        .offset(offset)
    )
    messages = messages_query.scalars().all()
    
    # レスポンス整形
    message_reads = [
        MessageRead(
            id=msg.id,
            content=msg.content,
            sender_id=msg.sender_id,
            sender_name=msg.sender.display_name,
            is_read=msg.is_read,
            created_at=msg.created_at,
        )
        for msg in messages
    ]
    
    return MessageListResponse(
        messages=message_reads,
        total=total,
        limit=limit,
        offset=offset,
    )


# ==================== メッセージ送信エンドポイント ====================

@router.post("/{conversation_id}/messages", response_model=MessageRead, status_code=status.HTTP_201_CREATED)
async def send_message(
    conversation_id: int,
    payload: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    メッセージを送信
    
    - 会話の参加者のみ送信可能
    - 会話のupdated_atを更新
    """
    
    # 会話の存在確認
    conversation = await db.get(Conversation, conversation_id)
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found",
        )
    
    # 参加者チェック
    is_member = await check_conversation_member(conversation_id, current_user.id, db)
    if not is_member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this conversation",
        )
    
    # メッセージを作成
    new_message = Message(
        conversation_id=conversation_id,
        sender_id=current_user.id,
        content=payload.content,
        is_read=False,
    )
    db.add(new_message)
    
    # 会話のupdated_atを更新
    conversation.updated_at = datetime.now(timezone.utc)
    
    await db.commit()
    await db.refresh(new_message)
    
    # 送信者情報を取得
    await db.refresh(new_message, ["sender"])
    
    return MessageRead(
        id=new_message.id,
        content=new_message.content,
        sender_id=new_message.sender_id,
        sender_name=new_message.sender.display_name,
        is_read=new_message.is_read,
        created_at=new_message.created_at,
    )


# ==================== 既読マークエンドポイント ====================

@router.put("/{conversation_id}/messages/{message_id}/read", response_model=MessageReadResponse)
async def mark_message_as_read(
    conversation_id: int,
    message_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    メッセージに既読マークをつける
    
    - 会話の参加者のみ可能
    - 自分が送信したメッセージ以外のみ
    """
    
    # メッセージの存在確認
    message = await db.get(Message, message_id)
    if not message or message.conversation_id != conversation_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found",
        )
    
    # 参加者チェック
    is_member = await check_conversation_member(conversation_id, current_user.id, db)
    if not is_member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this conversation",
        )
    
    # 自分が送信したメッセージは既読マークできない
    if message.sender_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot mark your own message as read",
        )
    
    # 既読マーク
    message.is_read = True
    await db.commit()
    
    return MessageReadResponse(
        message="Message marked as read",
        message_id=message_id,
    )


# ==================== 未読メッセージ数取得エンドポイント ====================

@router.get("/{conversation_id}/unread-count", response_model=UnreadCountResponse)
async def get_unread_count(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    未読メッセージ数を取得
    
    - 会話の参加者のみ取得可能
    - 自分以外が送信した未読メッセージの数
    """
    
    # 会話の存在確認
    conversation = await db.get(Conversation, conversation_id)
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found",
        )
    
    # 参加者チェック
    is_member = await check_conversation_member(conversation_id, current_user.id, db)
    if not is_member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this conversation",
        )
    
    # 未読メッセージ数を取得
    count_query = select(func.count()).select_from(Message).where(
        and_(
            Message.conversation_id == conversation_id,
            Message.sender_id != current_user.id,
            Message.is_read == False
        )
    )
    result = await db.execute(count_query)
    unread_count = result.scalar() or 0
    
    return UnreadCountResponse(unread_count=unread_count)

