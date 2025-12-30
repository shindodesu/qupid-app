# app/routers/skips.py
# スキップ機能のルーター

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from sqlalchemy.orm import selectinload
from app.db.session import get_db
from app.models.skip import Skip
from app.models.user import User
from app.models.tag import UserTag
from app.schemas.skip import (
    SkipCreate,
    SkipRead,
    SkipListResponse,
    SkipDeleteResponse,
)
from app.schemas.user import UserWithTags
from app.core.security import get_current_user

router = APIRouter(prefix="/skips", tags=["skips"])


# ==================== スキップ作成エンドポイント ====================

@router.post("", response_model=SkipDeleteResponse, status_code=status.HTTP_201_CREATED)
async def create_skip(
    payload: SkipCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    ユーザーをスキップ
    
    - 自分自身をスキップすることは不可
    - 既にスキップしている場合はエラー
    """
    current_user_id = current_user.id
    
    # 自分自身をスキップできないようにチェック
    if payload.skipped_user_id == current_user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot skip yourself",
        )
    
    # 相手ユーザーの存在確認
    skipped_user = await db.get(User, payload.skipped_user_id)
    if not skipped_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    # 既存のスキップをチェック
    existing_skip_query = await db.execute(
        select(Skip).where(
            and_(
                Skip.skipper_id == current_user_id,
                Skip.skipped_id == payload.skipped_user_id,
            )
        )
    )
    existing_skip = existing_skip_query.scalar_one_or_none()
    
    if existing_skip:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already skipped this user",
        )
    
    # スキップを作成
    new_skip = Skip(
        skipper_id=current_user_id,
        skipped_id=payload.skipped_user_id,
    )
    db.add(new_skip)
    await db.commit()
    
    return SkipDeleteResponse(message="User skipped successfully")


# ==================== スキップ一覧取得エンドポイント ====================

@router.get("", response_model=SkipListResponse)
async def get_skips(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    スキップしたユーザー一覧を取得
    """
    # 総数取得
    count_query = select(func.count()).select_from(Skip).where(
        Skip.skipper_id == current_user.id
    )
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    
    # スキップ一覧取得
    query = (
        select(Skip)
        .where(Skip.skipper_id == current_user.id)
        .options(selectinload(Skip.skipped))
        .order_by(Skip.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    result = await db.execute(query)
    skips = result.scalars().all()
    
    # スキップしたユーザーIDのリスト
    skipped_user_ids = [skip.skipped_id for skip in skips]
    
    # タグ情報を一括取得
    if skipped_user_ids:
        skipped_user_tags_query = await db.execute(
            select(UserTag)
            .where(UserTag.user_id.in_(skipped_user_ids))
            .options(selectinload(UserTag.tag))
        )
        skipped_user_tags = skipped_user_tags_query.scalars().all()
    else:
        skipped_user_tags = []
    
    user_tags_dict = {}
    for user_tag in skipped_user_tags:
        user_tags_dict.setdefault(user_tag.user_id, []).append(
            {
                "id": user_tag.tag.id,
                "name": user_tag.tag.name,
                "description": user_tag.tag.description,
            }
        )
    
    # レスポンス整形
    skips_read = []
    for skip in skips:
        tags = user_tags_dict.get(skip.skipped_id, [])
        if not skip.skipped.show_tags:
            tags = []
        
        skipped_user = UserWithTags(
            id=skip.skipped.id,
            email=None,
            display_name=skip.skipped.display_name,
            bio=skip.skipped.bio if skip.skipped.show_bio else None,
            avatar_url=skip.skipped.avatar_url,
            campus=skip.skipped.campus,
            faculty=skip.skipped.faculty if skip.skipped.show_faculty else None,
            grade=skip.skipped.grade if skip.skipped.show_grade else None,
            birthday=skip.skipped.birthday if skip.skipped.show_birthday else None,
            gender=skip.skipped.gender if skip.skipped.show_gender else None,
            sexuality=skip.skipped.sexuality if skip.skipped.show_sexuality else None,
            looking_for=skip.skipped.looking_for if skip.skipped.show_looking_for else None,
            profile_completed=skip.skipped.profile_completed,
            is_active=skip.skipped.is_active,
            created_at=skip.skipped.created_at,
            show_faculty=skip.skipped.show_faculty,
            show_grade=skip.skipped.show_grade,
            show_birthday=skip.skipped.show_birthday,
            show_age=skip.skipped.show_age,
            show_gender=skip.skipped.show_gender,
            show_sexuality=skip.skipped.show_sexuality,
            show_looking_for=skip.skipped.show_looking_for,
            show_bio=skip.skipped.show_bio,
            show_tags=skip.skipped.show_tags,
            tags=tags,
        )
        
        skips_read.append(
            SkipRead(
                id=skip.id,
                skipped_user=skipped_user,
                created_at=skip.created_at,
            )
        )
    
    return SkipListResponse(
        skips=skips_read,
        total=total,
        limit=limit,
        offset=offset,
    )


# ==================== スキップ削除エンドポイント ====================

@router.delete("/{skipped_user_id}", response_model=SkipDeleteResponse)
async def remove_skip(
    skipped_user_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    スキップを取り消し
    """
    # スキップの存在確認
    query = await db.execute(
        select(Skip).where(
            and_(
                Skip.skipper_id == current_user.id,
                Skip.skipped_id == skipped_user_id,
            )
        )
    )
    skip = query.scalar_one_or_none()
    
    if not skip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Skip not found",
        )
    
    await db.delete(skip)
    await db.commit()
    
    return SkipDeleteResponse(message="Skip removed successfully")




