# app/routers/tags.py

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from sqlalchemy.orm import selectinload
from app.db.session import get_db
from app.models.tag import Tag, UserTag
from app.models.user import User
from app.schemas.tag import (
    TagCreate,
    TagRead,
    TagWithUserCount,
    TagListResponse,
    UserTagAdd,
    UserTagRead,
    UserTagListResponse,
    TagAddResponse,
)
from app.core.security import get_current_user

router = APIRouter(prefix="/tags", tags=["tags"])

# ==================== タグ管理エンドポイント ====================

@router.get("", response_model=TagListResponse)
async def get_tags(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    search: str | None = Query(None, max_length=64),
    db: AsyncSession = Depends(get_db),
):
    """
    タグ一覧を取得（ページネーション、検索対応）
    """
    # ベースクエリ
    query = select(Tag)
    
    # 検索フィルタ
    if search:
        query = query.where(Tag.name.ilike(f"%{search}%"))
    
    # 総数取得
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    
    # ページネーション適用
    query = query.order_by(Tag.created_at.desc()).limit(limit).offset(offset)
    result = await db.execute(query)
    tags = result.scalars().all()
    
    # 各タグのユーザー数を取得
    tags_with_count = []
    for tag in tags:
        count_query = select(func.count()).select_from(UserTag).where(UserTag.tag_id == tag.id)
        count_result = await db.execute(count_query)
        user_count = count_result.scalar() or 0
        
        tags_with_count.append(
            TagWithUserCount(
                id=tag.id,
                name=tag.name,
                description=tag.description,
                created_at=tag.created_at,
                updated_at=tag.updated_at,
                user_count=user_count,
            )
        )
    
    return TagListResponse(
        tags=tags_with_count,
        total=total,
        limit=limit,
        offset=offset,
    )


@router.post("", response_model=TagRead, status_code=status.HTTP_201_CREATED)
async def create_tag(
    payload: TagCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    新しいタグを作成（認証必要）
    """
    # 既存タグの重複チェック
    existing_query = await db.execute(
        select(Tag).where(Tag.name == payload.name)
    )
    existing_tag = existing_query.scalar_one_or_none()
    
    if existing_tag:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tag with this name already exists",
        )
    
    # タグ作成
    new_tag = Tag(
        name=payload.name,
        description=payload.description,
    )
    db.add(new_tag)
    await db.commit()
    await db.refresh(new_tag)
    
    return new_tag


@router.get("/{tag_id}", response_model=TagRead)
async def get_tag(
    tag_id: int,
    db: AsyncSession = Depends(get_db),
):
    """
    タグの詳細を取得
    """
    tag = await db.get(Tag, tag_id)
    
    if not tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tag not found",
        )
    
    return tag


@router.delete("/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tag(
    tag_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    タグを削除（認証必要）
    注: 現時点では認証ユーザーなら誰でも削除可能。将来的に権限チェックを追加予定
    """
    tag = await db.get(Tag, tag_id)
    
    if not tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tag not found",
        )
    
    await db.delete(tag)
    await db.commit()
    
    return None



