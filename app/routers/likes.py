# app/routers/likes.py

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from sqlalchemy.orm import selectinload
from app.db.session import get_db
from app.models.like import Like
from app.models.user import User
from app.models.tag import UserTag
from app.models.block import Block
from app.schemas.like import (
    LikeCreate,
    LikeResponse,
    LikeBase,
    SentLikeRead,
    ReceivedLikeRead,
    LikeListResponse,
    MatchRead,
    MatchListResponse,
    MatchStatus,
    LikeDeleteResponse,
)
from app.schemas.user import UserRead, UserWithTags
from app.core.security import get_current_user

router = APIRouter(prefix="/likes", tags=["likes"])

# ==================== いいね送信エンドポイント ====================

@router.post("", response_model=LikeResponse, status_code=status.HTTP_201_CREATED)
async def send_like(
    payload: LikeCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    いいねを送信

    - 自分自身へのいいねは不可
    - 既にいいねを送信している場合はエラー
    - 相手も自分にいいねを送っている場合はマッチング成立
    """
    # 自分自身へのいいねをチェック
    if payload.liked_user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot like yourself",
        )

    # 相手ユーザーの存在確認
    liked_user = await db.get(User, payload.liked_user_id)
    if not liked_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # ブロック状態をチェック（双方向）
    block_check_query = await db.execute(
        select(Block).where(
            or_(
                and_(Block.blocker_id == current_user.id, Block.blocked_id == payload.liked_user_id),
                and_(Block.blocker_id == payload.liked_user_id, Block.blocked_id == current_user.id)
            )
        )
    )
    existing_block = block_check_query.scalar_one_or_none()
    
    if existing_block:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot send like to this user",
        )

    # 既存のいいねをチェック
    existing_like_query = await db.execute(
        select(Like).where(
            and_(
                Like.liker_id == current_user.id,
                Like.liked_id == payload.liked_user_id,
            )
        )
    )
    existing_like = existing_like_query.scalar_one_or_none()

    if existing_like:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already liked this user",
        )

    # いいねを作成
    new_like = Like(
        liker_id=current_user.id,
        liked_id=payload.liked_user_id,
    )
    db.add(new_like)
    await db.commit()
    await db.refresh(new_like)

    # マッチング判定：相手も自分にいいねを送っているかチェック
    reverse_like_query = await db.execute(
        select(Like).where(
            and_(
                Like.liker_id == payload.liked_user_id,
                Like.liked_id == current_user.id,
            )
        )
    )
    reverse_like = reverse_like_query.scalar_one_or_none()

    is_match = reverse_like is not None

    # レスポンスの準備
    like_base = LikeBase(
        id=new_like.id,
        liker_id=new_like.liker_id,
        liked_id=new_like.liked_id,
        created_at=new_like.created_at,
    )

    if is_match:
        # マッチング成立時のレスポンス
        return LikeResponse(
            message="Like sent successfully - It's a match!",
            like=like_base,
            is_match=True,
            match={
                "id": payload.liked_user_id,
                "user": {
                    "id": liked_user.id,
                    "display_name": liked_user.display_name,
                    "bio": liked_user.bio,
                    "faculty": liked_user.faculty,
                    "grade": liked_user.grade,
                },
            },
        )
    else:
        # 通常のいいね送信
        return LikeResponse(
            message="Like sent successfully",
            like=like_base,
            is_match=False,
            match=None,
        )


# ==================== 送信したいいね一覧 ====================

@router.get("/sent", response_model=LikeListResponse)
async def get_sent_likes(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    送信したいいね一覧を取得
    """
    # 総数取得
    count_query = select(func.count()).select_from(Like).where(
        Like.liker_id == current_user.id
    )
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # いいね一覧取得
    query = (
        select(Like)
        .where(Like.liker_id == current_user.id)
        .options(selectinload(Like.liked))
        .order_by(Like.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    result = await db.execute(query)
    likes = result.scalars().all()

    # パフォーマンス最適化：全ての相手からのいいねを一度に取得（N+1問題解消）
    liked_user_ids = [like.liked_id for like in likes]
    
    reverse_likes_query = await db.execute(
        select(Like).where(
            and_(
                Like.liker_id.in_(liked_user_ids),
                Like.liked_id == current_user.id,
            )
        )
    )
    reverse_likes = reverse_likes_query.scalars().all()
    
    # マッチング状態を高速に判定するための辞書を作成
    matched_user_ids = {like.liker_id for like in reverse_likes}

    # マッチング状態をチェックして整形
    likes_read = []
    for like in likes:
        is_matched = like.liked_id in matched_user_ids

        liked_user = UserRead(
            id=like.liked.id,
            display_name=like.liked.display_name,
            bio=like.liked.bio,
            faculty=like.liked.faculty,
            grade=like.liked.grade,
        )

        likes_read.append(
            SentLikeRead(
                id=like.id,
                liked_user=liked_user,
                created_at=like.created_at,
                is_matched=is_matched,
            )
        )

    return LikeListResponse(
        likes=likes_read,
        total=total,
        limit=limit,
        offset=offset,
    )


# ==================== 受け取ったいいね一覧 ====================

@router.get("/received", response_model=LikeListResponse)
async def get_received_likes(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    受け取ったいいね一覧を取得
    """
    # 総数取得
    count_query = select(func.count()).select_from(Like).where(
        Like.liked_id == current_user.id
    )
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # いいね一覧取得
    query = (
        select(Like)
        .where(Like.liked_id == current_user.id)
        .options(selectinload(Like.liker))
        .order_by(Like.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    result = await db.execute(query)
    likes = result.scalars().all()

    # パフォーマンス最適化：全ての自分からのいいねを一度に取得（N+1問題解消）
    liker_user_ids = [like.liker_id for like in likes]
    
    my_likes_query = await db.execute(
        select(Like).where(
            and_(
                Like.liker_id == current_user.id,
                Like.liked_id.in_(liker_user_ids),
            )
        )
    )
    my_likes = my_likes_query.scalars().all()
    
    # マッチング状態を高速に判定するための辞書を作成
    matched_user_ids = {like.liked_id for like in my_likes}

    # マッチング状態をチェックして整形
    likes_read = []
    for like in likes:
        is_matched = like.liker_id in matched_user_ids

        liker_user = UserRead(
            id=like.liker.id,
            display_name=like.liker.display_name,
            bio=like.liker.bio,
            faculty=like.liker.faculty,
            grade=like.liker.grade,
        )

        likes_read.append(
            ReceivedLikeRead(
                id=like.id,
                liker_user=liker_user,
                created_at=like.created_at,
                is_matched=is_matched,
            )
        )

    return LikeListResponse(
        likes=likes_read,
        total=total,
        limit=limit,
        offset=offset,
    )


# ==================== いいね取り消し ====================

@router.delete("/{liked_user_id}", response_model=LikeDeleteResponse)
async def remove_like(
    liked_user_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    いいねを取り消し
    """
    # いいねの存在確認
    query = await db.execute(
        select(Like).where(
            and_(
                Like.liker_id == current_user.id,
                Like.liked_id == liked_user_id,
            )
        )
    )
    like = query.scalar_one_or_none()

    if not like:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Like not found",
        )

    await db.delete(like)
    await db.commit()

    return LikeDeleteResponse(message="Like removed successfully")


# ==================== マッチングエンドポイント ====================

matches_router = APIRouter(prefix="/matches", tags=["matches"])


@matches_router.get("", response_model=MatchListResponse)
async def get_matches(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    マッチしたユーザー一覧を取得

    マッチング条件：
    - 自分が相手にいいねを送っている
    - 相手も自分にいいねを送っている
    """
    # マッチしたユーザーのIDを取得
    # 自分が送ったいいね
    my_likes_query = select(Like.liked_id).where(Like.liker_id == current_user.id)

    # 自分が受け取ったいいね
    received_likes_query = select(Like.liker_id).where(
        Like.liked_id == current_user.id
    )

    # 両方に存在するユーザーID（マッチング）を取得
    match_query = select(User).where(
        and_(
            User.id.in_(my_likes_query),
            User.id.in_(received_likes_query),
        )
    )

    # 総数取得
    count_query = select(func.count()).select_from(match_query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # マッチユーザー取得
    match_query = match_query.limit(limit).offset(offset)
    result = await db.execute(match_query)
    matched_users = result.scalars().all()
    
    if not matched_users:
        return MatchListResponse(
            matches=[],
            total=total,
            limit=limit,
            offset=offset,
        )

    matched_user_ids = [user.id for user in matched_users]

    # パフォーマンス最適化：全てのいいねを一度に取得（N+1問題解消）
    all_likes_query = await db.execute(
        select(Like).where(
            or_(
                and_(Like.liker_id == current_user.id, Like.liked_id.in_(matched_user_ids)),
                and_(Like.liker_id.in_(matched_user_ids), Like.liked_id == current_user.id),
            )
        )
    )
    all_likes = all_likes_query.scalars().all()
    
    # いいねを辞書に格納（高速検索用）
    my_likes_dict = {}
    their_likes_dict = {}
    
    for like in all_likes:
        if like.liker_id == current_user.id:
            my_likes_dict[like.liked_id] = like
        else:
            their_likes_dict[like.liker_id] = like

    # パフォーマンス最適化：全てのユーザータグを一度に取得（N+1問題解消）
    user_tags_query = await db.execute(
        select(UserTag)
        .where(UserTag.user_id.in_(matched_user_ids))
        .options(selectinload(UserTag.tag))
    )
    all_user_tags = user_tags_query.scalars().all()
    
    # ユーザーIDごとにタグを整理
    user_tags_dict = {}
    for user_tag in all_user_tags:
        if user_tag.user_id not in user_tags_dict:
            user_tags_dict[user_tag.user_id] = []
        user_tags_dict[user_tag.user_id].append({
            "id": user_tag.tag.id,
            "name": user_tag.tag.name,
            "description": user_tag.tag.description,
        })

    # レスポンス整形
    matches = []
    for user in matched_users:
        my_like = my_likes_dict[user.id]
        their_like = their_likes_dict[user.id]

        # マッチング成立日時は後にいいねした方の日時
        matched_at = max(my_like.created_at, their_like.created_at)

        # ユーザーのタグを取得
        tags = user_tags_dict.get(user.id, [])

        user_with_tags = UserWithTags(
            id=user.id,
            display_name=user.display_name,
            bio=user.bio,
            faculty=user.faculty,
            grade=user.grade,
            tags=tags,
        )

        matches.append(
            MatchRead(
                id=user.id,
                user=user_with_tags,
                matched_at=matched_at,
            )
        )

    # マッチング成立日時順にソート（新しい順）
    matches.sort(key=lambda x: x.matched_at, reverse=True)

    return MatchListResponse(
        matches=matches,
        total=total,
        limit=limit,
        offset=offset,
    )


@matches_router.get("/{user_id}", response_model=MatchStatus)
async def get_match_status(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    特定ユーザーとのマッチ状況確認
    """
    # 相手ユーザーの存在確認
    other_user = await db.get(User, user_id)
    if not other_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # パフォーマンス最適化：両方のいいねを一度に取得
    likes_query = await db.execute(
        select(Like).where(
            or_(
                and_(Like.liker_id == current_user.id, Like.liked_id == user_id),
                and_(Like.liker_id == user_id, Like.liked_id == current_user.id),
            )
        )
    )
    likes = likes_query.scalars().all()

    # いいねを振り分け
    my_like = None
    their_like = None
    
    for like in likes:
        if like.liker_id == current_user.id:
            my_like = like
        else:
            their_like = like

    # マッチング判定
    is_matched = my_like is not None and their_like is not None

    if is_matched:
        # マッチング成立している場合
        matched_at = max(my_like.created_at, their_like.created_at)

        # ユーザーのタグを取得
        user_tags_query = await db.execute(
            select(UserTag)
            .where(UserTag.user_id == user_id)
            .options(selectinload(UserTag.tag))
        )
        user_tags = user_tags_query.scalars().all()

        tags = [
            {
                "id": ut.tag.id,
                "name": ut.tag.name,
                "description": ut.tag.description,
            }
            for ut in user_tags
        ]

        user_with_tags = UserWithTags(
            id=other_user.id,
            display_name=other_user.display_name,
            bio=other_user.bio,
            faculty=other_user.faculty,
            grade=other_user.grade,
            tags=tags,
        )

        match = MatchRead(
            id=user_id,
            user=user_with_tags,
            matched_at=matched_at,
        )

        return MatchStatus(
            is_matched=True,
            match=match,
            like_status=None,
        )
    else:
        # マッチング未成立の場合
        return MatchStatus(
            is_matched=False,
            match=None,
            like_status={
                "i_liked": my_like is not None,
                "they_liked": their_like is not None,
            },
        )

