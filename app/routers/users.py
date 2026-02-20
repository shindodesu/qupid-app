# app/routers_users.py

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func, distinct, text
from sqlalchemy.orm import selectinload
from app.db.session import get_db
from app.models.user import User
from app.models.tag import Tag, UserTag
from app.models.like import Like
from app.models.block import Block
from app.schemas.user import UserCreate, UserRead, UserWithTags, InitialProfileCreate, PrivacySettingsUpdate
from app.schemas.tag import (
    UserTagAdd,
    UserTagRead,
    UserTagListResponse,
    TagAddResponse,
    TagRead,
)
from app.schemas.search import (
    UserSearchResponse,
    UserSearchResult,
    UserSuggestionsResponse,
    UserSuggestion,
    TagInfo,
    LikeStatus,
    SortOrder,
)
from app.core.security import get_current_user
from typing import Optional
from datetime import date, datetime
import sys
import logging

logger = logging.getLogger(__name__)

# Define the router with a prefix and tags
router = APIRouter(prefix="/users", tags=["users"])

@router.post("/", response_model=UserRead, status_code=status.HTTP_201_CREATED)

# 関数シグネチャ
async def create_user(payload: UserCreate, db: AsyncSession = Depends(get_db)):
    #既存チェック
    # 既存チェック
    q = await db.execute(select(User).where(User.email == payload.email))
    if q.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already exists")
    user = User(email=payload.email, display_name=payload.display_name)
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user

# 追加: /users/me (/{user_id}より前に定義する必要がある)
@router.get("/me", response_model=UserRead)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

from pydantic import BaseModel
from datetime import date

class UserUpdate(BaseModel):
    display_name: str | None = None
    bio: str | None = None
    campus: str | None = None
    faculty: str | None = None
    grade: str | None = None
    birthday: date | None = None
    gender: str | None = None
    sexuality: str | None = None
    looking_for: str | None = None

@router.put("/me", response_model=UserRead)
async def update_me(
    payload: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if payload.display_name is not None:
        current_user.display_name = payload.display_name
    if payload.bio is not None:
        current_user.bio = payload.bio
    if payload.campus is not None:
        current_user.campus = payload.campus
    if payload.faculty is not None:
        current_user.faculty = payload.faculty
    if payload.grade is not None:
        current_user.grade = payload.grade
    if payload.birthday is not None:
        current_user.birthday = payload.birthday
    if payload.gender is not None:
        current_user.gender = payload.gender
    if payload.sexuality is not None:
        current_user.sexuality = payload.sexuality
    if payload.looking_for is not None:
        current_user.looking_for = payload.looking_for
    await db.commit()
    await db.refresh(current_user)
    return current_user

# 初回プロフィール登録エンドポイント
@router.post("/me/initial-profile", response_model=UserRead)
async def complete_initial_profile(
    payload: InitialProfileCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    初回プロフィール登録（必須項目の設定）
    """
    print(f"[InitialProfile API] Received request from user: {current_user.id}")
    print(f"[InitialProfile API] Current profile_completed status: {current_user.profile_completed}")
    print(f"[InitialProfile API] Payload: {payload}")
    
    # 既にプロフィールが完了している場合はエラー
    if current_user.profile_completed:
        print(f"[InitialProfile API] Profile already completed for user {current_user.id}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Profile already completed"
        )
    
    # プロフィール情報を設定
    print(f"[InitialProfile API] Setting profile data...")
    current_user.display_name = payload.display_name
    current_user.birthday = payload.birthday
    current_user.gender = payload.gender
    current_user.sexuality = payload.sexuality
    current_user.looking_for = payload.looking_for
    current_user.profile_completed = True
    
    print(f"[InitialProfile API] Committing to database...")
    await db.commit()
    await db.refresh(current_user)
    print(f"[InitialProfile API] Profile completed successfully for user {current_user.id}")
    return current_user


# ==================== プライバシー設定エンドポイント ====================

@router.put("/me/privacy", response_model=UserRead)
async def update_privacy_settings(
    payload: PrivacySettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    プライバシー設定を更新
    """
    # 各フィールドが指定されている場合のみ更新
    if payload.show_campus is not None:
        current_user.show_campus = payload.show_campus
    if payload.show_faculty is not None:
        current_user.show_faculty = payload.show_faculty
    if payload.show_grade is not None:
        current_user.show_grade = payload.show_grade
    if payload.show_birthday is not None:
        current_user.show_birthday = payload.show_birthday
    if payload.show_age is not None:
        current_user.show_age = payload.show_age
    if payload.show_gender is not None:
        current_user.show_gender = payload.show_gender
    if payload.show_sexuality is not None:
        current_user.show_sexuality = payload.show_sexuality
    if payload.show_looking_for is not None:
        current_user.show_looking_for = payload.show_looking_for
    if payload.show_bio is not None:
        current_user.show_bio = payload.show_bio
    if payload.show_tags is not None:
        current_user.show_tags = payload.show_tags
    
    await db.commit()
    await db.refresh(current_user)
    return current_user


# ==================== ユーザータグ管理エンドポイント ====================

@router.get("/me/tags", response_model=UserTagListResponse)
async def get_my_tags(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    自分のタグ一覧を取得（認証必要）
    """
    # ユーザーのタグを取得
    query = (
        select(UserTag)
        .where(UserTag.user_id == current_user.id)
        .options(selectinload(UserTag.tag))
        .order_by(UserTag.created_at.desc())
    )
    result = await db.execute(query)
    user_tags = result.scalars().all()
    
    # レスポンス形式に変換
    tags_read = [
        UserTagRead(
            id=ut.tag.id,
            name=ut.tag.name,
            description=ut.tag.description,
            added_at=ut.created_at,
        )
        for ut in user_tags
    ]
    
    return UserTagListResponse(tags=tags_read)


@router.post("/me/tags", response_model=TagAddResponse, status_code=status.HTTP_201_CREATED)
async def add_tag_to_me(
    payload: UserTagAdd,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    自分のタグに追加（認証必要）
    """
    # タグの存在確認
    tag = await db.get(Tag, payload.tag_id)
    if not tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tag not found",
        )
    
    # 既に追加済みかチェック
    existing_query = await db.execute(
        select(UserTag).where(
            and_(
                UserTag.user_id == current_user.id,
                UserTag.tag_id == payload.tag_id,
            )
        )
    )
    existing_user_tag = existing_query.scalar_one_or_none()
    
    if existing_user_tag:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tag already added to user",
        )
    
    # タグを追加
    new_user_tag = UserTag(
        user_id=current_user.id,
        tag_id=payload.tag_id,
    )
    db.add(new_user_tag)
    await db.commit()
    await db.refresh(new_user_tag)
    
    return TagAddResponse(
        message="Tag added successfully",
        tag=TagRead(
            id=tag.id,
            name=tag.name,
            description=tag.description,
            created_at=tag.created_at,
            updated_at=tag.updated_at,
        ),
    )


@router.delete("/me/tags/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_tag_from_me(
    tag_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    自分のタグから削除（認証必要）
    """
    # ユーザータグの存在確認
    query = await db.execute(
        select(UserTag).where(
            and_(
                UserTag.user_id == current_user.id,
                UserTag.tag_id == tag_id,
            )
        )
    )
    user_tag = query.scalar_one_or_none()
    
    if not user_tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tag not found in user's tags",
        )
    
    await db.delete(user_tag)
    await db.commit()
    
    return None


# ==================== ユーザー検索エンドポイント ====================

@router.get("/search", response_model=UserSearchResponse)
async def search_users(
    tags: Optional[str] = Query(None, description="カンマ区切りのタグ名"),
    campus: Optional[str] = Query(None, description="キャンパス名"),
    faculty: Optional[str] = Query(None, description="学部名"),
    grade: Optional[str] = Query(None, description="学年"),
    search: Optional[str] = Query(None, description="フリーテキスト検索（display_name, bio）"),
    limit: int = Query(20, ge=1, le=100, description="取得件数"),
    offset: int = Query(0, ge=0, description="オフセット"),
    sort: SortOrder = Query(SortOrder.RECENT, description="並び順"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    ユーザー検索・フィルタリング
    
    - タグや属性（学部・学年）で絞り込み検索
    - フリーテキスト検索（display_name, bio）
    - 複数条件での絞り込み
    - ページネーション対応
    - いいね状態を含む
    - ブロックユーザーを除外
    - 自分自身を除外
    - すでにいいねを送ったユーザーを除外（探す画面に表示しない）
    """
    try:
        # ========== リクエストパラメータのログ出力 ==========
        logger.info(f"[Search Debug] ========== Search Request Started ==========")
        logger.info(f"[Search Debug] User ID: {current_user.id}")
        logger.info(f"[Search Debug] Request params - tags: {tags}, campus: {campus}, faculty: {faculty}, grade: {grade}, search: {search}, limit: {limit}, offset: {offset}, sort: {sort}")
        print(f"[Search Debug] Request params - tags: {tags}, campus: {campus}, faculty: {faculty}, grade: {grade}, search: {search}, limit: {limit}, offset: {offset}, sort: {sort}", file=sys.stderr)
        
        # ========== 基本クエリ構築 ==========
        try:
            logger.info(f"[Search Debug] Building base query...")
            query = select(User).where(
                and_(
                    User.is_active == True,
                    User.id != current_user.id
                )
            )
            logger.info(f"[Search Debug] Base query built successfully")
        except Exception as e:
            logger.error(f"[Search Debug] Error building base query: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"クエリ構築エラー: {str(e)}"
            )
        
        # ========== ブロックユーザーを除外 ==========
        try:
            logger.info(f"[Search Debug] Fetching blocked users...")
            blocked_users_query = select(Block.blocked_id).where(Block.blocker_id == current_user.id)
            blocking_users_query = select(Block.blocker_id).where(Block.blocked_id == current_user.id)
            
            blocked_user_ids_result = await db.execute(blocked_users_query)
            blocked_user_ids = {row[0] for row in blocked_user_ids_result.all()}
            logger.info(f"[Search Debug] Blocked user IDs (I blocked): {len(blocked_user_ids)} users")
            
            blocking_users_ids_result = await db.execute(blocking_users_query)
            blocking_user_ids = {row[0] for row in blocking_users_ids_result.all()}
            logger.info(f"[Search Debug] Blocking user IDs (blocked me): {len(blocking_user_ids)} users")
            
            excluded_user_ids = blocked_user_ids | blocking_user_ids
            logger.info(f"[Search Debug] Total excluded user IDs: {len(excluded_user_ids)}")
            
            if excluded_user_ids:
                query = query.where(User.id.not_in(excluded_user_ids))
                logger.info(f"[Search Debug] Excluded user IDs filter applied")
        except Exception as e:
            logger.error(f"[Search Debug] Error fetching blocked users: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"ブロックユーザー取得エラー: {str(e)}"
            )

        # ========== すでにいいねを送ったユーザーを除外（探す画面に表示しない） ==========
        try:
            logger.info(f"[Search Debug] Fetching sent like user IDs...")
            sent_likes_query = await db.execute(
                select(Like.liked_id).where(Like.liker_id == current_user.id)
            )
            sent_like_user_ids = {row[0] for row in sent_likes_query.all()}
            logger.info(f"[Search Debug] Sent like user IDs: {len(sent_like_user_ids)} users")
            if sent_like_user_ids:
                excluded_user_ids = excluded_user_ids | sent_like_user_ids
                query = query.where(User.id.not_in(sent_like_user_ids))
                logger.info(f"[Search Debug] Excluded already-liked users from search results")
        except Exception as e:
            logger.error(f"[Search Debug] Error fetching sent likes: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"いいね取得エラー: {str(e)}"
            )
        
        # ========== フィルター条件の構築 ==========
        filters_applied = {}
        
        # タグでのフィルタリング
        if tags:
            try:
                logger.info(f"[Search Debug] Processing tags filter: {tags}")
                tag_names = [tag.strip() for tag in tags.split(",") if tag.strip()]
                logger.info(f"[Search Debug] Parsed tag names: {tag_names}")
                
                if tag_names:
                    filters_applied["tags"] = tag_names
                    
                    # 各タグに対してサブクエリを作成（AND条件）
                    for idx, tag_name in enumerate(tag_names):
                        try:
                            logger.info(f"[Search Debug] Processing tag {idx+1}/{len(tag_names)}: '{tag_name}'")
                            
                            # タグ名からタグIDを取得
                            tag_subquery = select(Tag.id).where(Tag.name.ilike(f"%{tag_name}%"))
                            tag_result = await db.execute(tag_subquery)
                            tag_ids = [row[0] for row in tag_result.all()]
                            logger.info(f"[Search Debug] Found {len(tag_ids)} tag IDs for '{tag_name}': {tag_ids}")
                            
                            if not tag_ids:
                                logger.warning(f"[Search Debug] No tags found matching '{tag_name}', skipping this tag")
                                continue
                            
                            # そのタグを持つユーザーIDを取得（タグを公開しているユーザーのみ）
                            user_with_tag_subquery = select(UserTag.user_id).where(
                                and_(
                                    UserTag.tag_id.in_(tag_ids),
                                    UserTag.user_id.in_(select(User.id).where(User.show_tags == True))
                                )
                            )
                            user_with_tag_result = await db.execute(user_with_tag_subquery)
                            user_ids_with_tag = [row[0] for row in user_with_tag_result.all()]
                            logger.info(f"[Search Debug] Found {len(user_ids_with_tag)} users with tag '{tag_name}' (showing tags)")
                            
                            query = query.where(User.id.in_(user_with_tag_subquery))
                            logger.info(f"[Search Debug] Tag filter '{tag_name}' applied to query")
                        except Exception as e:
                            logger.error(f"[Search Debug] Error processing tag '{tag_name}': {str(e)}", exc_info=True)
                            raise HTTPException(
                                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                                detail=f"タグフィルター処理エラー (tag: {tag_name}): {str(e)}"
                            )
            except Exception as e:
                logger.error(f"[Search Debug] Error in tags filter: {str(e)}", exc_info=True)
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"タグフィルターエラー: {str(e)}"
                )
        
        # キャンパスでのフィルタリング（複数選択対応）
        if campus:
            try:
                logger.info(f"[Search Debug] Processing campus filter: {campus}")
                campus_list = [c.strip() for c in campus.split(",") if c.strip()]
                logger.info(f"[Search Debug] Parsed campus list: {campus_list}")
                if campus_list:
                    filters_applied["campus"] = campus_list
                    # OR条件で複数のキャンパスに一致するユーザーを検索
                    campus_conditions = [User.campus.ilike(f"%{c}%") for c in campus_list]
                    query = query.where(or_(*campus_conditions))
                    logger.info(f"[Search Debug] Campus filter '{campus_list}' applied")
            except Exception as e:
                logger.error(f"[Search Debug] Error processing campus filter: {str(e)}", exc_info=True)
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"キャンパスフィルターエラー: {str(e)}"
                )
        
        # キャンパスでのフィルタリング（複数選択対応）
        if campus:
            try:
                logger.info(f"[Search Debug] Processing campus filter: {campus}")
                campus_list = [c.strip() for c in campus.split(",") if c.strip()]
                logger.info(f"[Search Debug] Parsed campus list: {campus_list}")
                if campus_list:
                    filters_applied["campus"] = campus_list
                    # OR条件で複数のキャンパスに一致するユーザーを検索
                    campus_conditions = [User.campus.ilike(f"%{c}%") for c in campus_list]
                    query = query.where(or_(*campus_conditions))
                    logger.info(f"[Search Debug] Campus filter '{campus_list}' applied")
            except Exception as e:
                logger.error(f"[Search Debug] Error processing campus filter: {str(e)}", exc_info=True)
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"キャンパスフィルターエラー: {str(e)}"
                )
        
        # 学部でのフィルタリング（複数選択対応）
        if faculty:
            try:
                logger.info(f"[Search Debug] Processing faculty filter: {faculty}")
                faculty_list = [f.strip() for f in faculty.split(",") if f.strip()]
                logger.info(f"[Search Debug] Parsed faculty list: {faculty_list}")
                if faculty_list:
                    filters_applied["faculty"] = faculty_list
                    # OR条件で複数の学部に一致するユーザーを検索（プライバシー設定を考慮）
                    faculty_conditions = [
                    and_(
                            User.faculty.ilike(f"%{f}%"),
                        User.show_faculty == True
                    )
                        for f in faculty_list
                    ]
                    query = query.where(or_(*faculty_conditions))
                    logger.info(f"[Search Debug] Faculty filter '{faculty_list}' applied")
            except Exception as e:
                logger.error(f"[Search Debug] Error processing faculty filter: {str(e)}", exc_info=True)
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"学部フィルターエラー: {str(e)}"
                )
        
        # 学年でのフィルタリング（複数選択対応）
        if grade:
            try:
                logger.info(f"[Search Debug] Processing grade filter: {grade}")
                grade_list = [g.strip() for g in grade.split(",") if g.strip()]
                logger.info(f"[Search Debug] Parsed grade list: {grade_list}")
                if grade_list:
                    filters_applied["grade"] = grade_list
                    # OR条件で複数の学年に一致するユーザーを検索（プライバシー設定を考慮）
                    grade_conditions = [
                    and_(
                            User.grade.ilike(f"%{g}%"),
                        User.show_grade == True
                    )
                        for g in grade_list
                    ]
                    query = query.where(or_(*grade_conditions))
                    logger.info(f"[Search Debug] Grade filter '{grade_list}' applied")
            except Exception as e:
                logger.error(f"[Search Debug] Error processing grade filter: {str(e)}", exc_info=True)
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"学年フィルターエラー: {str(e)}"
                )
        
        # フリーテキスト検索
        if search:
            try:
                logger.info(f"[Search Debug] Processing search filter: {search}")
                filters_applied["search"] = search
                search_filter = or_(
                    User.display_name.ilike(f"%{search}%"),
                    and_(User.bio.ilike(f"%{search}%"), User.show_bio == True)
                )
                query = query.where(search_filter)
                logger.info(f"[Search Debug] Search filter '{search}' applied")
            except Exception as e:
                logger.error(f"[Search Debug] Error processing search filter: {str(e)}", exc_info=True)
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"検索フィルターエラー: {str(e)}"
                )
        
        logger.info(f"[Search Debug] All filters applied: {filters_applied}")
        
        # ========== 総数取得 ==========
        try:
            logger.info(f"[Search Debug] Counting total results...")
            count_query = select(func.count()).select_from(query.subquery())
            total_result = await db.execute(count_query)
            total = total_result.scalar() or 0
            logger.info(f"[Search Debug] Total count: {total}")
        except Exception as e:
            logger.error(f"[Search Debug] Error counting results: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"件数取得エラー: {str(e)}"
            )
        
        # ========== 並び替え ==========
        try:
            logger.info(f"[Search Debug] Applying sort: {sort}")
            if sort == SortOrder.RECENT:
                query = query.order_by(User.created_at.desc())
            elif sort == SortOrder.ALPHABETICAL:
                query = query.order_by(User.display_name.asc())
            elif sort == SortOrder.POPULAR:
                # TODO: 将来的にいいね数などで並び替え
                query = query.order_by(User.created_at.desc())
            logger.info(f"[Search Debug] Sort applied: {sort}")
        except Exception as e:
            logger.error(f"[Search Debug] Error applying sort: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"並び替えエラー: {str(e)}"
            )
        
        # ========== ページネーション ==========
        try:
            logger.info(f"[Search Debug] Applying pagination: limit={limit}, offset={offset}")
            query = query.limit(limit).offset(offset)
        except Exception as e:
            logger.error(f"[Search Debug] Error applying pagination: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"ページネーションエラー: {str(e)}"
            )
        
        # ========== ユーザー取得 ==========
        try:
            logger.info(f"[Search Debug] Executing main query...")
            result = await db.execute(query)
            users = result.scalars().all()
            logger.info(f"[Search Debug] Found {len(users)} users")
            
            if not users:
                logger.info(f"[Search Debug] No users found, returning empty response")
                return UserSearchResponse(
                    users=[],
                    total=total,
                    limit=limit,
                    offset=offset,
                    filters_applied=filters_applied,
                )
        except Exception as e:
            logger.error(f"[Search Debug] Error executing main query: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"ユーザー取得エラー: {str(e)}"
            )
        
        user_ids = [user.id for user in users]
        logger.info(f"[Search Debug] User IDs found: {user_ids}")
        
        # ========== タグ情報の取得 ==========
        try:
            logger.info(f"[Search Debug] Fetching tags for {len(user_ids)} users...")
            user_tags_query = await db.execute(
                select(UserTag)
                .where(UserTag.user_id.in_(user_ids))
                .options(selectinload(UserTag.tag))
            )
            all_user_tags = user_tags_query.scalars().all()
            logger.info(f"[Search Debug] Found {len(all_user_tags)} user-tag relationships")
            
            # ユーザーIDごとにタグを整理
            user_tags_dict = {}
            for user_tag in all_user_tags:
                if user_tag.user_id not in user_tags_dict:
                    user_tags_dict[user_tag.user_id] = []
                user_tags_dict[user_tag.user_id].append(
                    TagInfo(
                        id=user_tag.tag.id,
                        name=user_tag.tag.name,
                        description=user_tag.tag.description,
                    )
                )
            logger.info(f"[Search Debug] Tags organized for {len(user_tags_dict)} users")
        except Exception as e:
            logger.error(f"[Search Debug] Error fetching tags: {str(e)}", exc_info=True)
            # タグ取得エラーは致命的ではないので、空の辞書で続行
            user_tags_dict = {}
        
        # ========== いいね状態の取得 ==========
        try:
            logger.info(f"[Search Debug] Fetching like statuses...")
            likes_query = await db.execute(
                select(Like).where(
                    or_(
                        and_(Like.liker_id == current_user.id, Like.liked_id.in_(user_ids)),
                        and_(Like.liker_id.in_(user_ids), Like.liked_id == current_user.id),
                    )
                )
            )
            all_likes = likes_query.scalars().all()
            logger.info(f"[Search Debug] Found {len(all_likes)} like relationships")
            
            # いいね状態を辞書に整理
            my_likes_dict = {}  # 自分が送ったいいね
            their_likes_dict = {}  # 相手が送ったいいね
            
            for like in all_likes:
                if like.liker_id == current_user.id:
                    my_likes_dict[like.liked_id] = like
                else:
                    their_likes_dict[like.liker_id] = like
            
            logger.info(f"[Search Debug] Like statuses: I liked {len(my_likes_dict)} users, {len(their_likes_dict)} users liked me")
        except Exception as e:
            logger.error(f"[Search Debug] Error fetching like statuses: {str(e)}", exc_info=True)
            # いいね取得エラーは致命的ではないので、空の辞書で続行
            my_likes_dict = {}
            their_likes_dict = {}
        
        # ========== レスポンス整形 ==========
        try:
            logger.info(f"[Search Debug] Building response...")
            search_results = []
            for user in users:
                i_liked = user.id in my_likes_dict
                they_liked = user.id in their_likes_dict
                is_matched = i_liked and they_liked
                
                search_results.append(
                    UserSearchResult(
                        id=user.id,
                        display_name=user.display_name,
                        bio=user.bio if user.show_bio else None,
                        avatar_url=user.avatar_url,
                        faculty=user.faculty if user.show_faculty else None,
                        grade=user.grade if user.show_grade else None,
                        tags=user_tags_dict.get(user.id, []) if user.show_tags else [],
                        created_at=user.created_at,
                        like_status=LikeStatus(
                            i_liked=i_liked,
                            they_liked=they_liked,
                            is_matched=is_matched,
                        ),
                    )
                )
            
            logger.info(f"[Search Debug] Response built with {len(search_results)} results")
            logger.info(f"[Search Debug] ========== Search Request Completed ==========")
            
            return UserSearchResponse(
                users=search_results,
                total=total,
                limit=limit,
                offset=offset,
                filters_applied=filters_applied,
            )
        except Exception as e:
            logger.error(f"[Search Debug] Error building response: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"レスポンス構築エラー: {str(e)}"
            )
    
    except HTTPException:
        # HTTPExceptionはそのまま再スロー
        raise
    except Exception as e:
        # 予期しないエラー
        logger.error(f"[Search Debug] Unexpected error in search_users: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"予期しないエラーが発生しました: {str(e)}"
        )


# ==================== おすすめユーザーエンドポイント ====================

@router.get("/suggestions", response_model=UserSuggestionsResponse)
async def get_user_suggestions(
    limit: int = Query(10, ge=1, le=100, description="取得件数"),
    sexuality: Optional[str] = Query(None, description="セクシュアリティフィルター（カンマ区切り）"),
    relationship_goal: Optional[str] = Query(None, description="関係性目標フィルター（カンマ区切り、dating, friends, casual, long_term, other）"),
    campus: Optional[str] = Query(None, description="キャンパス名"),
    faculty: Optional[str] = Query(None, description="学部名"),
    grade: Optional[str] = Query(None, description="学年"),
    sex: Optional[str] = Query(None, description="性別フィルター（カンマ区切り、male, female, inter_sex）"),
    age_min: Optional[int] = Query(None, ge=0, le=150, description="最小年齢"),
    age_max: Optional[int] = Query(None, ge=0, le=150, description="最大年齢"),
    sort: SortOrder = Query(SortOrder.RECENT, description="並び順（recent, alphabetical, popular）"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    おすすめユーザー取得
    
    - 共通タグ数に基づくおすすめ
    - マッチスコア付き
    - ブロックユーザーを除外
    - 自分自身を除外
    - すでにいいねを送ったユーザーを除外（探す画面に表示しない）
    - フィルター対応（sexuality, relationship_goal, campus, faculty, grade, sex, age_min, age_max）
    """
    try:
        # ========== リクエストパラメータのログ出力 ==========
        logger.info(f"[Suggestions Debug] ========== Suggestions Request Started ==========")
        logger.info(f"[Suggestions Debug] User ID: {current_user.id}")
        logger.info(f"[Suggestions Debug] Request params - limit: {limit}, sexuality: {sexuality}, relationship_goal: {relationship_goal}, campus: {campus}, faculty: {faculty}, grade: {grade}, sex: {sex}, age_min: {age_min}, age_max: {age_max}")
        print(f"[Suggestions Debug] Request params - limit: {limit}, sexuality: {sexuality}, relationship_goal: {relationship_goal}, campus: {campus}, faculty: {faculty}, grade: {grade}, sex: {sex}, age_min: {age_min}, age_max: {age_max}", file=sys.stderr)
    
        # ========== 自分のタグを取得 ==========
        try:
            logger.info(f"[Suggestions Debug] Fetching my tags...")
            my_tags_query = await db.execute(
                select(UserTag.tag_id).where(UserTag.user_id == current_user.id)
            )
            my_tag_ids = [row[0] for row in my_tags_query.all()]
            logger.info(f"[Suggestions Debug] Found {len(my_tag_ids)} tags for current user: {my_tag_ids}")
        except Exception as e:
            logger.error(f"[Suggestions Debug] Error fetching my tags: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"タグ取得エラー: {str(e)}"
            )

        # ========== ブロックユーザーを除外 ==========
        try:
            logger.info(f"[Suggestions Debug] Fetching blocked users...")
            blocked_users_query = select(Block.blocked_id).where(Block.blocker_id == current_user.id)
            blocking_users_query = select(Block.blocker_id).where(Block.blocked_id == current_user.id)

            blocked_user_ids_result = await db.execute(blocked_users_query)
            blocked_user_ids = {row[0] for row in blocked_user_ids_result.all()}
            logger.info(f"[Suggestions Debug] Blocked user IDs (I blocked): {len(blocked_user_ids)} users")

            blocking_users_ids_result = await db.execute(blocking_users_query)
            blocking_user_ids = {row[0] for row in blocking_users_ids_result.all()}
            logger.info(f"[Suggestions Debug] Blocking user IDs (blocked me): {len(blocking_user_ids)} users")

            excluded_user_ids = blocked_user_ids | blocking_user_ids
            logger.info(f"[Suggestions Debug] Total excluded user IDs (blocked): {len(excluded_user_ids)}")
        except Exception as e:
            logger.error(f"[Suggestions Debug] Error fetching blocked users: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"ブロックユーザー取得エラー: {str(e)}"
            )

        # ========== いいね送信済みユーザーを除外（探す画面に表示しない） ==========
        try:
            logger.info(f"[Suggestions Debug] Fetching sent like user IDs...")
            sent_likes_query = await db.execute(
                select(Like.liked_id).where(Like.liker_id == current_user.id)
            )
            sent_like_user_ids = {row[0] for row in sent_likes_query.all()}
            logger.info(f"[Suggestions Debug] Sent like user IDs: {len(sent_like_user_ids)} users")

            excluded_user_ids |= sent_like_user_ids  # いいね送信済みを除外（マッチ含む）
            excluded_user_ids.add(current_user.id)  # 自分自身も除外
            logger.info(f"[Suggestions Debug] Total excluded user IDs (including sent likes and self): {len(excluded_user_ids)}")
        except Exception as e:
            logger.error(f"[Suggestions Debug] Error fetching matched users: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"マッチユーザー取得エラー: {str(e)}"
            )

        # ========== フィルター条件を構築 ==========
        filter_conditions = []
        
        try:
            # セクシュアリティフィルター
            if sexuality:
                logger.info(f"[Suggestions Debug] Processing sexuality filter: {sexuality}")
                sexuality_list = [s.strip() for s in sexuality.split(",") if s.strip()]
                logger.info(f"[Suggestions Debug] Parsed sexuality list: {sexuality_list}")
                if sexuality_list:
                    # プライバシー設定を考慮：show_sexualityがTrueのユーザーのみを対象
                    filter_conditions.append(
                        and_(
                            User.sexuality.in_(sexuality_list),
                            User.show_sexuality == True
                        )
                    )
                    logger.info(f"[Suggestions Debug] Sexuality filter applied: {sexuality_list} (with privacy check)")
                    print(f"[Suggestions Debug] Sexuality filter applied: {sexuality_list} (with privacy check)", file=sys.stderr)
            
            # 関係性目標フィルター（複数選択対応、looking_forフィールドに対応）
            if relationship_goal:
                logger.info(f"[Suggestions Debug] Processing relationship_goal filter: {relationship_goal}")
                relationship_goal_list = [g.strip() for g in relationship_goal.split(",") if g.strip()]
                logger.info(f"[Suggestions Debug] Parsed relationship_goal list: {relationship_goal_list}")
                if relationship_goal_list:
                    # "all"が含まれている場合はフィルターを適用しない
                    if "all" in relationship_goal_list:
                        logger.info(f"[Suggestions Debug] Relationship goal contains 'all', skipping filter")
                        print(f"[Suggestions Debug] Relationship goal contains 'all', skipping filter", file=sys.stderr)
                else:
                        # 複数の関係性目標に一致するユーザーを検索（looking_forは単一またはカンマ区切り複数、プライバシー考慮）
                        def _looking_for_matches(goal: str):
                            return or_(
                                User.looking_for == goal,
                                User.looking_for.like(f"{goal},%"),
                                User.looking_for.like(f"%,{goal},%"),
                                User.looking_for.like(f"%,{goal}"),
                            )
                        relationship_goal_conditions = [
                            and_(
                                _looking_for_matches(goal),
                                User.show_looking_for == True,
                            )
                            for goal in relationship_goal_list
                        ]
                        filter_conditions.append(or_(*relationship_goal_conditions))
                        logger.info(f"[Suggestions Debug] Relationship goal filter applied: {relationship_goal_list} (with privacy check)")
                        print(f"[Suggestions Debug] Relationship goal filter applied: {relationship_goal_list} (with privacy check)", file=sys.stderr)
            
            # キャンパスフィルター（複数選択対応、プライバシー設定を考慮）
            if campus:
                logger.info(f"[Suggestions Debug] Processing campus filter: {campus}")
                campus_list = [c.strip() for c in campus.split(",") if c.strip()]
                logger.info(f"[Suggestions Debug] Parsed campus list: {campus_list}")
                if campus_list:
                    # OR条件で複数のキャンパスに一致するユーザーを検索（show_campusがTrueのユーザーのみ）
                    campus_conditions = [
                        and_(User.campus.ilike(f"%{c}%"), User.show_campus == True)
                        for c in campus_list
                    ]
                    filter_conditions.append(or_(*campus_conditions))
                    logger.info(f"[Suggestions Debug] Campus filter applied: {campus_list}")
                    print(f"[Suggestions Debug] Campus filter applied: {campus_list}", file=sys.stderr)
            
            # 学部フィルター（複数選択対応）
            if faculty:
                logger.info(f"[Suggestions Debug] Processing faculty filter: {faculty}")
                faculty_list = [f.strip() for f in faculty.split(",") if f.strip()]
                logger.info(f"[Suggestions Debug] Parsed faculty list: {faculty_list}")
                if faculty_list:
                    # OR条件で複数の学部に一致するユーザーを検索（プライバシー設定を考慮）
                    faculty_conditions = [
                        and_(
                            User.faculty.ilike(f"%{f}%"),
                            User.show_faculty == True
                        )
                        for f in faculty_list
                    ]
                    filter_conditions.append(or_(*faculty_conditions))
                    logger.info(f"[Suggestions Debug] Faculty filter applied: {faculty_list} (with privacy check)")
                    print(f"[Suggestions Debug] Faculty filter applied: {faculty_list} (with privacy check)", file=sys.stderr)
            
            # 学年フィルター（複数選択対応）
            if grade:
                logger.info(f"[Suggestions Debug] Processing grade filter: {grade}")
                grade_list = [g.strip() for g in grade.split(",") if g.strip()]
                logger.info(f"[Suggestions Debug] Parsed grade list: {grade_list}")
                if grade_list:
                    # OR条件で複数の学年に一致するユーザーを検索（プライバシー設定を考慮）
                    grade_conditions = [
                        and_(
                            User.grade.ilike(f"%{g}%"),
                            User.show_grade == True
                        )
                        for g in grade_list
                    ]
                    filter_conditions.append(or_(*grade_conditions))
                    logger.info(f"[Suggestions Debug] Grade filter applied: {grade_list} (with privacy check)")
                    print(f"[Suggestions Debug] Grade filter applied: {grade_list} (with privacy check)", file=sys.stderr)
            
            # 性別フィルター（genderフィールドに対応、sexパラメータを使用）
            if sex:
                logger.info(f"[Suggestions Debug] Processing sex filter: {sex}")
                sex_list = [s.strip() for s in sex.split(",") if s.strip()]
                logger.info(f"[Suggestions Debug] Parsed sex list: {sex_list}")
                if sex_list:
                    # プライバシー設定を考慮：show_genderがTrueのユーザーのみを対象
                    filter_conditions.append(
                        and_(
                            User.gender.in_(sex_list),
                            User.show_gender == True
                        )
                    )
                    logger.info(f"[Suggestions Debug] Sex filter applied: {sex_list} (with privacy check)")
                    print(f"[Suggestions Debug] Sex filter applied: {sex_list} (with privacy check)", file=sys.stderr)
            
            # 年齢フィルター（birthdayから年齢を計算）
            if age_min is not None or age_max is not None:
                logger.info(f"[Suggestions Debug] Processing age filter: age_min={age_min}, age_max={age_max}")
                # PostgreSQLのAGE関数を使用して年齢を計算
                # テーブル名はUserモデルの__tablename__を使用
                age_expr = text("EXTRACT(YEAR FROM AGE(users.birthday))")
                
                # 年齢条件を構築
                age_range_conditions = []
                if age_min is not None and age_max is not None:
                    # 両方指定されている場合
                    age_range_conditions.append(and_(age_expr >= age_min, age_expr <= age_max))
                    logger.info(f"[Suggestions Debug] Age filter range: {age_min} <= age <= {age_max}")
                elif age_min is not None:
                    # 最小年齢のみ指定
                    age_range_conditions.append(age_expr >= age_min)
                    logger.info(f"[Suggestions Debug] Age min filter: age >= {age_min}")
                elif age_max is not None:
                    # 最大年齢のみ指定
                    age_range_conditions.append(age_expr <= age_max)
                    logger.info(f"[Suggestions Debug] Age max filter: age <= {age_max}")
                
                # プライバシー設定を考慮：show_ageがTrueのユーザーのみを対象
                # birthdayがNULLの場合は除外（年齢が計算できないため）
                age_base_conditions = [
                    User.show_age == True,
                    User.birthday.isnot(None)
                ]
                if age_range_conditions:
                    age_base_conditions.extend(age_range_conditions)
                
                age_filter_condition = and_(*age_base_conditions)
                filter_conditions.append(age_filter_condition)
                logger.info(f"[Suggestions Debug] Age filter applied (with privacy check)")
                print(f"[Suggestions Debug] Age filter applied: age_min={age_min}, age_max={age_max} (with privacy check)", file=sys.stderr)
            
            logger.info(f"[Suggestions Debug] Total filter conditions: {len(filter_conditions)}")
            print(f"[Suggestions Debug] Total filter conditions: {len(filter_conditions)}", file=sys.stderr)
        except Exception as e:
            logger.error(f"[Suggestions Debug] Error building filter conditions: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"フィルター条件構築エラー: {str(e)}"
            )

        async def build_fallback_response(reason: str) -> UserSuggestionsResponse:
            try:
                logger.info(f"[Suggestions Debug] Building fallback response. Reason: {reason}")
                conditions = [
                    User.is_active == True,
                    User.profile_completed == True,
                ]
                if excluded_user_ids:
                    conditions.append(User.id.not_in(list(excluded_user_ids)))
                    logger.info(f"[Suggestions Debug] Excluded {len(excluded_user_ids)} users from fallback")
                
                # フィルター条件を追加
                if filter_conditions:
                    conditions.extend(filter_conditions)
                    logger.info(f"[Suggestions Debug] Added {len(filter_conditions)} filter conditions to fallback")

                fallback_query = (
                    select(User)
                    .where(and_(*conditions))
                    .order_by(User.created_at.desc())
                    .limit(limit)
                )

                logger.info(f"[Suggestions Debug] Executing fallback query...")
                fallback_result = await db.execute(fallback_query)
                fallback_users = fallback_result.scalars().all()
                logger.info(f"[Suggestions Debug] Fallback query returned {len(fallback_users)} users")

                if not fallback_users:
                    logger.info(f"[Suggestions Debug] No users in fallback response")
                    return UserSuggestionsResponse(
                        users=[],
                        total=0,
                        limit=limit,
                    )

                fallback_user_ids = [user.id for user in fallback_users]
                logger.info(f"[Suggestions Debug] Fallback user IDs: {fallback_user_ids}")

                try:
                    fallback_tags_query = await db.execute(
                        select(UserTag)
                        .where(UserTag.user_id.in_(fallback_user_ids))
                        .options(selectinload(UserTag.tag))
                    )
                    fallback_user_tags = fallback_tags_query.scalars().all()
                    logger.info(f"[Suggestions Debug] Found {len(fallback_user_tags)} tags for fallback users")

                    fallback_tags_dict = {}
                    for user_tag in fallback_user_tags:
                        fallback_tags_dict.setdefault(user_tag.user_id, []).append(
                            TagInfo(
                                id=user_tag.tag.id,
                                name=user_tag.tag.name,
                                description=user_tag.tag.description,
                            )
                        )
                except Exception as e:
                    logger.error(f"[Suggestions Debug] Error fetching tags in fallback: {str(e)}", exc_info=True)
                    fallback_tags_dict = {}

                try:
                    # すでにいいねをもらっているユーザーIDを取得（一度に取得して効率化）
                    received_likes_query = await db.execute(
                        select(Like.liker_id).where(Like.liked_id == current_user.id)
                    )
                    received_like_user_ids = {row[0] for row in received_likes_query.all()}
                    logger.info(f"[Suggestions Debug] Received likes from {len(received_like_user_ids)} users")
                except Exception as e:
                    logger.error(f"[Suggestions Debug] Error fetching likes in fallback: {str(e)}", exc_info=True)
                    received_like_user_ids = set()
                
                suggestions = []
                for user in fallback_users:
                    tags = fallback_tags_dict.get(user.id, [])
                    # すでにいいねをもらっているかチェック
                    has_received_like = user.id in received_like_user_ids
                    
                    suggestions.append(
                        UserSuggestion(
                            id=user.id,
                            display_name=user.display_name,
                            bio=user.bio if user.show_bio else None,
                            avatar_url=user.avatar_url,
                            faculty=user.faculty if user.show_faculty else None,
                            grade=user.grade if user.show_grade else None,
                            tags=tags if user.show_tags else [],
                            match_score=0.0,
                            reason=reason,
                            has_received_like=has_received_like,
                        )
                    )

                # 並び替え（fallback）
                if sort == SortOrder.ALPHABETICAL:
                    suggestions.sort(key=lambda x: (x.display_name or "").lower())
                elif sort == SortOrder.POPULAR:
                    suggestions.sort(key=lambda x: (x.display_name or "").lower())
                else:
                    pass  # RECENT: fallbackは既にcreated_at.desc()で取得済み

                logger.info(f"[Suggestions Debug] Fallback response built with {len(suggestions)} suggestions")
                return UserSuggestionsResponse(
                    users=suggestions,
                    total=len(suggestions),
                    limit=limit,
                )
            except Exception as e:
                logger.error(f"[Suggestions Debug] Error in build_fallback_response: {str(e)}", exc_info=True)
                raise

        # ========== タグがない場合の処理 ==========
        if not my_tag_ids:
            logger.info(f"[Suggestions Debug] No tags found, using fallback response")
            return await build_fallback_response("タグ未設定のため、最近登録したユーザーをおすすめします")
        
        # ========== フィルター条件を満たすユーザーIDを事前に取得 ==========
        filtered_user_ids = None
        if filter_conditions:
            try:
                # フィルター適用前のユーザー数を確認（デバッグ用）
                base_count_query = select(func.count(User.id)).where(
                    and_(
                        User.is_active == True,
                        User.profile_completed == True,
                    )
                )
                base_count_result = await db.execute(base_count_query)
                base_count = base_count_result.scalar() or 0
                logger.info(f"[Suggestions Debug] Base user count (active + profile_completed): {base_count}")
                print(f"[Suggestions Debug] Base user count (active + profile_completed): {base_count}", file=sys.stderr)
                
                logger.info(f"[Suggestions Debug] Applying filter conditions to query")
                print(f"[Suggestions Debug] Applying filter conditions to query", file=sys.stderr)
                filtered_users_query = select(User.id).where(
                    and_(
                        User.is_active == True,
                        User.profile_completed == True,
                        *filter_conditions
                    )
                )
                filtered_result = await db.execute(filtered_users_query)
                filtered_user_ids = {row[0] for row in filtered_result.all()}
                logger.info(f"[Suggestions Debug] Filtered user IDs count: {len(filtered_user_ids)} (out of {base_count} base users)")
                print(f"[Suggestions Debug] Filtered user IDs count: {len(filtered_user_ids)} (out of {base_count} base users)", file=sys.stderr)
                
                # フィルター結果が空の場合は空のレスポンスを返す
                if not filtered_user_ids:
                    logger.info(f"[Suggestions Debug] No users match filter conditions")
                    print(f"[Suggestions Debug] No users match filter conditions", file=sys.stderr)
                    return await build_fallback_response("フィルター条件に一致するユーザーが見つかりませんでした")
            except Exception as e:
                logger.error(f"[Suggestions Debug] Error applying filter conditions: {str(e)}", exc_info=True)
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"フィルター適用エラー: {str(e)}"
                )
        else:
            logger.info(f"[Suggestions Debug] No filter conditions to apply")
            print(f"[Suggestions Debug] No filter conditions to apply", file=sys.stderr)
        
        # ========== 共通タグを持つユーザーを検索 ==========
        try:
            logger.info(f"[Suggestions Debug] Searching for users with common tags...")
            common_tags_conditions = [
                UserTag.tag_id.in_(my_tag_ids),
            ]
            
            if excluded_user_ids:
                common_tags_conditions.append(UserTag.user_id.not_in(excluded_user_ids))
                logger.info(f"[Suggestions Debug] Excluded {len(excluded_user_ids)} users from common tags query")
            
            if filtered_user_ids:
                common_tags_conditions.append(UserTag.user_id.in_(filtered_user_ids))
                logger.info(f"[Suggestions Debug] Applied filtered user IDs to common tags query")
            
            common_tags_query = (
                select(
                    UserTag.user_id,
                    func.count(UserTag.tag_id).label("common_tag_count")
                )
                .where(and_(*common_tags_conditions))
                .group_by(UserTag.user_id)
                .order_by(func.count(UserTag.tag_id).desc())
                .limit(limit)
            )
            
            logger.info(f"[Suggestions Debug] Executing common tags query...")
            common_tags_result = await db.execute(common_tags_query)
            user_scores = common_tags_result.all()
            logger.info(f"[Suggestions Debug] Found {len(user_scores)} users with common tags")
            
            if not user_scores:
                logger.info(f"[Suggestions Debug] No common tags found, using fallback")
                return await build_fallback_response("共通タグが見つからなかったため、最近登録したユーザーをおすすめします")
        except Exception as e:
            logger.error(f"[Suggestions Debug] Error searching common tags: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"共通タグ検索エラー: {str(e)}"
            )
        
        # ========== ユーザー情報を取得 ==========
        try:
            suggested_user_ids = [row[0] for row in user_scores]
            user_score_dict = {row[0]: row[1] for row in user_scores}
            logger.info(f"[Suggestions Debug] Suggested user IDs: {suggested_user_ids}")
            logger.info(f"[Suggestions Debug] User scores: {user_score_dict}")
            
            # ユーザー情報を取得
            # 注意: suggested_user_idsは既にfiltered_user_idsでフィルタリングされているため、
            # ここで再度フィルター条件を適用する必要はない
            user_query_conditions = [
                User.id.in_(suggested_user_ids),
                User.is_active == True,
            ]
            
            logger.info(f"[Suggestions Debug] Executing user query for {len(suggested_user_ids)} user IDs...")
            users_query = await db.execute(
                select(User).where(and_(*user_query_conditions))
            )
            users = users_query.scalars().all()
            logger.info(f"[Suggestions Debug] Found {len(users)} users matching conditions")
        except Exception as e:
            logger.error(f"[Suggestions Debug] Error fetching user information: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"ユーザー情報取得エラー: {str(e)}"
            )
        
        # ========== ユーザーのタグを一括取得 ==========
        try:
            logger.info(f"[Suggestions Debug] Fetching tags for {len(suggested_user_ids)} users...")
            user_tags_query = await db.execute(
                select(UserTag)
                .where(UserTag.user_id.in_(suggested_user_ids))
                .options(selectinload(UserTag.tag))
            )
            all_user_tags = user_tags_query.scalars().all()
            logger.info(f"[Suggestions Debug] Found {len(all_user_tags)} user-tag relationships")
            
            # ユーザーIDごとにタグを整理
            user_tags_dict = {}
            for user_tag in all_user_tags:
                if user_tag.user_id not in user_tags_dict:
                    user_tags_dict[user_tag.user_id] = []
                user_tags_dict[user_tag.user_id].append(
                    TagInfo(
                        id=user_tag.tag.id,
                        name=user_tag.tag.name,
                        description=user_tag.tag.description,
                    )
                )
            logger.info(f"[Suggestions Debug] Tags organized for {len(user_tags_dict)} users")
        except Exception as e:
            logger.error(f"[Suggestions Debug] Error fetching user tags: {str(e)}", exc_info=True)
            # タグ取得エラーは致命的ではないので、空の辞書で続行
            user_tags_dict = {}
        
        # ========== いいね状態を取得 ==========
        try:
            logger.info(f"[Suggestions Debug] Fetching like statuses...")
            received_likes_query = await db.execute(
                select(Like.liker_id).where(Like.liked_id == current_user.id)
            )
            received_like_user_ids = {row[0] for row in received_likes_query.all()}
            logger.info(f"[Suggestions Debug] Received likes from {len(received_like_user_ids)} users")
        except Exception as e:
            logger.error(f"[Suggestions Debug] Error fetching like statuses: {str(e)}", exc_info=True)
            # いいね取得エラーは致命的ではないので、空のセットで続行
            received_like_user_ids = set()
        
        # ========== レスポンス整形 ==========
        try:
            logger.info(f"[Suggestions Debug] Building response...")
            suggestions = []
            my_tag_count = len(my_tag_ids)
            
            for user in users:
                try:
                    common_count = user_score_dict.get(user.id, 0)
                    user_tags = user_tags_dict.get(user.id, [])
                    
                    # マッチスコア計算（共通タグ数 / 自分のタグ数）
                    match_score = min(common_count / my_tag_count, 1.0) if my_tag_count > 0 else 0.0
                    
                    # 共通タグ名を取得
                    common_tag_names = [
                        tag.name for tag in user_tags
                        if any(my_tag_id == tag.id for my_tag_id in my_tag_ids)
                    ]
                    
                    if common_tag_names:
                        reason = f"共通タグ「{', '.join(common_tag_names[:3])}」を持っています"
                    else:
                        reason = "おすすめのユーザーです"
                    
                    # すでにいいねをもらっているかチェック
                    has_received_like = user.id in received_like_user_ids
                    
                    suggestions.append(
                        UserSuggestion(
                            id=user.id,
                            display_name=user.display_name,
                            bio=user.bio if user.show_bio else None,
                            avatar_url=user.avatar_url,
                            faculty=user.faculty if user.show_faculty else None,
                            grade=user.grade if user.show_grade else None,
                            tags=user_tags if user.show_tags else [],
                            match_score=match_score,
                            reason=reason,
                            has_received_like=has_received_like,
                        )
                    )
                except Exception as e:
                    logger.error(f"[Suggestions Debug] Error processing user {user.id}: {str(e)}", exc_info=True)
                    # 個別ユーザーの処理エラーはスキップして続行
                    continue
            
            # 並び替え: sort パラメータに応じてソート（recent=スコア優先のまま, alphabetical=名前順, popular=スコア優先）
            if sort == SortOrder.ALPHABETICAL:
                suggestions.sort(key=lambda x: (x.display_name or "").lower())
            elif sort == SortOrder.POPULAR:
                suggestions.sort(key=lambda x: (x.match_score, (x.display_name or "").lower()), reverse=True)
            else:
                # RECENT: スコア順を維持（既存の共通タグベースの並び）
                suggestions.sort(key=lambda x: x.match_score, reverse=True)
            logger.info(f"[Suggestions Debug] Response built with {len(suggestions)} suggestions")
            logger.info(f"[Suggestions Debug] ========== Suggestions Request Completed ==========")
            
            return UserSuggestionsResponse(
                users=suggestions,
                total=len(suggestions),
                limit=limit,
            )
        except Exception as e:
            logger.error(f"[Suggestions Debug] Error building response: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"レスポンス構築エラー: {str(e)}"
            )
    
    except HTTPException:
        # HTTPExceptionはそのまま再スロー
        raise
    except Exception as e:
        # 予期しないエラー
        logger.error(f"[Suggestions Debug] Unexpected error in get_user_suggestions: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"予期しないエラーが発生しました: {str(e)}"
        )


# ==================== 個別ユーザー取得エンドポイント（最後に定義） ====================
# 注意: このエンドポイントは必ず最後に定義すること！
# より具体的なルート（/me, /search, /suggestions等）の後に配置する必要がある

@router.get("/{user_id}", response_model=UserWithTags)
async def get_user(user_id: int, db: AsyncSession = Depends(get_db)):
    """
    指定されたIDのユーザーをDBから探して、見つからなければ404、見つかれば整形して返す
    
    注意: このエンドポイントは動的パスパラメータを使用するため、
    他のすべての /users/* エンドポイントの後に定義する必要がある
    """
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # タグ情報を取得
    user_tags_query = await db.execute(
        select(UserTag)
        .where(UserTag.user_id == user.id)
        .options(selectinload(UserTag.tag))
    )
    user_tags = user_tags_query.scalars().all()
    
    tags = [
        {
            "id": user_tag.tag.id,
            "name": user_tag.tag.name,
            "description": user_tag.tag.description,
        }
        for user_tag in user_tags
    ]
    
    return UserWithTags(
        id=user.id,
        email=None,  # プライバシー保護のため
        display_name=user.display_name,
        bio=user.bio if user.show_bio else None,
        avatar_url=user.avatar_url,
        campus=user.campus if user.show_campus else None,
        faculty=user.faculty if user.show_faculty else None,
        grade=user.grade if user.show_grade else None,
        birthday=user.birthday if user.show_birthday else None,
        gender=user.gender if user.show_gender else None,
        sexuality=user.sexuality if user.show_sexuality else None,
        looking_for=user.looking_for if user.show_looking_for else None,
        profile_completed=user.profile_completed,
        is_active=user.is_active,
        created_at=user.created_at,
        show_campus=user.show_campus,
        show_faculty=user.show_faculty,
        show_grade=user.show_grade,
        show_birthday=user.show_birthday,
        show_age=user.show_age,
        show_gender=user.show_gender,
        show_sexuality=user.show_sexuality,
        show_looking_for=user.show_looking_for,
        show_bio=user.show_bio,
        show_tags=user.show_tags,
        tags=tags if user.show_tags else [],
    )

