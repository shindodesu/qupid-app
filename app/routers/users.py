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
    """
    
    # 基本クエリ: アクティブユーザーで自分自身を除外
    query = select(User).where(
        and_(
            User.is_active == True,
            User.id != current_user.id
        )
    )
    
    # ブロックユーザーを除外
    # 自分がブロックしたユーザー or 自分をブロックしたユーザー
    blocked_users_query = select(Block.blocked_id).where(Block.blocker_id == current_user.id)
    blocking_users_query = select(Block.blocker_id).where(Block.blocked_id == current_user.id)
    
    blocked_user_ids_result = await db.execute(blocked_users_query)
    blocked_user_ids = {row[0] for row in blocked_user_ids_result.all()}
    
    blocking_users_ids_result = await db.execute(blocking_users_query)
    blocking_user_ids = {row[0] for row in blocking_users_ids_result.all()}
    
    excluded_user_ids = blocked_user_ids | blocking_user_ids
    
    if excluded_user_ids:
        query = query.where(User.id.not_in(excluded_user_ids))
    
    # タグでのフィルタリング（プライバシー設定でタグを公開しているユーザーのみ）
    filters_applied = {}
    
    if tags:
        tag_names = [tag.strip() for tag in tags.split(",") if tag.strip()]
        if tag_names:
            filters_applied["tags"] = tag_names
            
            # 各タグに対してサブクエリを作成（AND条件）
            for tag_name in tag_names:
                # タグ名からタグIDを取得
                tag_subquery = select(Tag.id).where(Tag.name.ilike(f"%{tag_name}%"))
                
                # そのタグを持つユーザーIDを取得（タグを公開しているユーザーのみ）
                user_with_tag_subquery = select(UserTag.user_id).where(
                    and_(
                        UserTag.tag_id.in_(tag_subquery),
                        UserTag.user_id.in_(select(User.id).where(User.show_tags == True))
                    )
                )
                
                query = query.where(User.id.in_(user_with_tag_subquery))
    
    # 学部でのフィルタリング（学部を公開しているユーザーのみ）
    if faculty:
        filters_applied["faculty"] = faculty
        query = query.where(
            and_(
                User.faculty.ilike(f"%{faculty}%"),
                User.show_faculty == True
            )
        )
    
    # 学年でのフィルタリング（学年を公開しているユーザーのみ）
    if grade:
        filters_applied["grade"] = grade
        query = query.where(
            and_(
                User.grade.ilike(f"%{grade}%"),
                User.show_grade == True
            )
        )
    
    # フリーテキスト検索（プライバシー設定を考慮）
    if search:
        filters_applied["search"] = search
        search_filter = or_(
            User.display_name.ilike(f"%{search}%"),
            and_(User.bio.ilike(f"%{search}%"), User.show_bio == True)
        )
        query = query.where(search_filter)
    
    # 総数取得
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    
    # 並び替え
    if sort == SortOrder.RECENT:
        query = query.order_by(User.created_at.desc())
    elif sort == SortOrder.ALPHABETICAL:
        query = query.order_by(User.display_name.asc())
    elif sort == SortOrder.POPULAR:
        # TODO: 将来的にいいね数などで並び替え
        query = query.order_by(User.created_at.desc())
    
    # ページネーション
    query = query.limit(limit).offset(offset)
    
    # ユーザー取得
    result = await db.execute(query)
    users = result.scalars().all()
    
    if not users:
        return UserSearchResponse(
            users=[],
            total=total,
            limit=limit,
            offset=offset,
            filters_applied=filters_applied,
        )
    
    user_ids = [user.id for user in users]
    
    # パフォーマンス最適化: 全ユーザーのタグを一括取得
    user_tags_query = await db.execute(
        select(UserTag)
        .where(UserTag.user_id.in_(user_ids))
        .options(selectinload(UserTag.tag))
    )
    all_user_tags = user_tags_query.scalars().all()
    
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
    
    # パフォーマンス最適化: 全ユーザーに対するいいね状態を一括取得
    likes_query = await db.execute(
        select(Like).where(
            or_(
                and_(Like.liker_id == current_user.id, Like.liked_id.in_(user_ids)),
                and_(Like.liker_id.in_(user_ids), Like.liked_id == current_user.id),
            )
        )
    )
    all_likes = likes_query.scalars().all()
    
    # いいね状態を辞書に整理
    my_likes_dict = {}  # 自分が送ったいいね
    their_likes_dict = {}  # 相手が送ったいいね
    
    for like in all_likes:
        if like.liker_id == current_user.id:
            my_likes_dict[like.liked_id] = like
        else:
            their_likes_dict[like.liker_id] = like
    
    # レスポンス整形（プライバシー設定を考慮）
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
    
    return UserSearchResponse(
        users=search_results,
        total=total,
        limit=limit,
        offset=offset,
        filters_applied=filters_applied,
    )


# ==================== おすすめユーザーエンドポイント ====================

@router.get("/suggestions", response_model=UserSuggestionsResponse)
async def get_user_suggestions(
    limit: int = Query(10, ge=1, le=50, description="取得件数"),
    sexuality: Optional[str] = Query(None, description="セクシュアリティフィルター（カンマ区切り）"),
    relationship_goal: Optional[str] = Query(None, description="関係性目標フィルター（friends, dating, all）"),
    sex: Optional[str] = Query(None, description="性別フィルター（カンマ区切り、male, female, other）"),
    age_min: Optional[int] = Query(None, ge=0, le=150, description="最小年齢"),
    age_max: Optional[int] = Query(None, ge=0, le=150, description="最大年齢"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    おすすめユーザー取得
    
    - 共通タグ数に基づくおすすめ
    - マッチスコア付き
    - ブロックユーザーを除外
    - 自分自身を除外
    - 既にマッチしているユーザーを除外
    - フィルター対応（sexuality, relationship_goal, sex, age_min, age_max）
    """
    
    # リクエストパラメータのログ出力
    logger.info(f"[Filter Debug] Request params - sexuality: {sexuality}, relationship_goal: {relationship_goal}, sex: {sex}, age_min: {age_min}, age_max: {age_max}")
    print(f"[Filter Debug] Request params - sexuality: {sexuality}, relationship_goal: {relationship_goal}, sex: {sex}, age_min: {age_min}, age_max: {age_max}", file=sys.stderr)
    
    # 自分のタグを取得
    my_tags_query = await db.execute(
        select(UserTag.tag_id).where(UserTag.user_id == current_user.id)
    )
    my_tag_ids = [row[0] for row in my_tags_query.all()]

    # ブロックユーザーを除外
    blocked_users_query = select(Block.blocked_id).where(Block.blocker_id == current_user.id)
    blocking_users_query = select(Block.blocker_id).where(Block.blocked_id == current_user.id)

    blocked_user_ids_result = await db.execute(blocked_users_query)
    blocked_user_ids = {row[0] for row in blocked_user_ids_result.all()}

    blocking_users_ids_result = await db.execute(blocking_users_query)
    blocking_user_ids = {row[0] for row in blocking_users_ids_result.all()}

    excluded_user_ids = blocked_user_ids | blocking_user_ids

    # 既にマッチしているユーザーを除外
    my_likes_query = select(Like.liked_id).where(Like.liker_id == current_user.id)
    received_likes_query = select(Like.liker_id).where(Like.liked_id == current_user.id)

    matched_users_query = select(User.id).where(
        and_(
            User.id.in_(my_likes_query),
            User.id.in_(received_likes_query),
        )
    )

    matched_users_result = await db.execute(matched_users_query)
    matched_user_ids = {row[0] for row in matched_users_result.all()}

    excluded_user_ids |= matched_user_ids
    excluded_user_ids.add(current_user.id)  # 自分自身も除外

    # フィルター条件を構築
    filter_conditions = []
    
    # セクシュアリティフィルター
    if sexuality:
        sexuality_list = [s.strip() for s in sexuality.split(",") if s.strip()]
        if sexuality_list:
            filter_conditions.append(User.sexuality.in_(sexuality_list))
            logger.info(f"[Filter Debug] Sexuality filter applied: {sexuality_list}")
            print(f"[Filter Debug] Sexuality filter applied: {sexuality_list}", file=sys.stderr)
    
    # 関係性目標フィルター（looking_forフィールドに対応）
    if relationship_goal:
        if relationship_goal == "all":
            # "all"の場合はフィルターを適用しない
            logger.info(f"[Filter Debug] Relationship goal is 'all', skipping filter")
            print(f"[Filter Debug] Relationship goal is 'all', skipping filter", file=sys.stderr)
        else:
            # "friends" または "dating" の場合
            filter_conditions.append(User.looking_for == relationship_goal)
            logger.info(f"[Filter Debug] Relationship goal filter applied: {relationship_goal}")
            print(f"[Filter Debug] Relationship goal filter applied: {relationship_goal}", file=sys.stderr)
    
    # 性別フィルター（genderフィールドに対応、sexパラメータを使用）
    if sex:
        sex_list = [s.strip() for s in sex.split(",") if s.strip()]
        if sex_list:
            filter_conditions.append(User.gender.in_(sex_list))
            logger.info(f"[Filter Debug] Sex filter applied: {sex_list}")
            print(f"[Filter Debug] Sex filter applied: {sex_list}", file=sys.stderr)
    
    # 年齢フィルター（birthdayから年齢を計算）
    # PostgreSQLのAGE関数を使用して年齢を計算
    if age_min is not None or age_max is not None:
        # 年齢を計算するためのSQL式
        # EXTRACT(YEAR FROM AGE(birthday)) で年齢を取得
        # text()を使用してPostgreSQLのAGE関数を直接使用
        # カラム参照を正しく行うために、User.birthdayのカラム名を直接指定
        # SQLAlchemyでは、text()内でカラム名を直接指定する必要がある
        age_expr = text("EXTRACT(YEAR FROM AGE(users.birthday))")
        
        if age_min is not None and age_max is not None:
            # 両方指定されている場合
            filter_conditions.append(and_(age_expr >= age_min, age_expr <= age_max))
            logger.info(f"[Filter Debug] Age filter applied: {age_min} <= age <= {age_max}")
            print(f"[Filter Debug] Age filter applied: {age_min} <= age <= {age_max}", file=sys.stderr)
        elif age_min is not None:
            # 最小年齢のみ指定
            filter_conditions.append(age_expr >= age_min)
            logger.info(f"[Filter Debug] Age min filter applied: age >= {age_min}")
            print(f"[Filter Debug] Age min filter applied: age >= {age_min}", file=sys.stderr)
        elif age_max is not None:
            # 最大年齢のみ指定
            filter_conditions.append(age_expr <= age_max)
            logger.info(f"[Filter Debug] Age max filter applied: age <= {age_max}")
            print(f"[Filter Debug] Age max filter applied: age <= {age_max}", file=sys.stderr)
        
        # birthdayがNULLの場合は除外（年齢が計算できないため）
        filter_conditions.append(User.birthday.isnot(None))
    
    logger.info(f"[Filter Debug] Total filter conditions: {len(filter_conditions)}")
    print(f"[Filter Debug] Total filter conditions: {len(filter_conditions)}", file=sys.stderr)

    async def build_fallback_response(reason: str) -> UserSuggestionsResponse:
        conditions = [
            User.is_active == True,
            User.profile_completed == True,
        ]
        if excluded_user_ids:
            conditions.append(User.id.not_in(list(excluded_user_ids)))
        
        # フィルター条件を追加
        if filter_conditions:
            conditions.extend(filter_conditions)

        fallback_query = (
            select(User)
            .where(and_(*conditions))
            .order_by(User.created_at.desc())
            .limit(limit)
        )

        fallback_result = await db.execute(fallback_query)
        fallback_users = fallback_result.scalars().all()

        if not fallback_users:
            return UserSuggestionsResponse(
                users=[],
                total=0,
                limit=limit,
            )

        fallback_user_ids = [user.id for user in fallback_users]

        fallback_tags_query = await db.execute(
            select(UserTag)
            .where(UserTag.user_id.in_(fallback_user_ids))
            .options(selectinload(UserTag.tag))
        )
        fallback_user_tags = fallback_tags_query.scalars().all()

        fallback_tags_dict = {}
        for user_tag in fallback_user_tags:
            fallback_tags_dict.setdefault(user_tag.user_id, []).append(
                TagInfo(
                    id=user_tag.tag.id,
                    name=user_tag.tag.name,
                    description=user_tag.tag.description,
                )
            )

        suggestions = []
        for user in fallback_users:
            tags = fallback_tags_dict.get(user.id, [])
            suggestions.append(
                UserSuggestion(
                    id=user.id,
                    display_name=user.display_name,
                    bio=user.bio if user.show_bio else None,
                    faculty=user.faculty if user.show_faculty else None,
                    grade=user.grade if user.show_grade else None,
                    tags=tags if user.show_tags else [],
                    match_score=0.0,
                    reason=reason,
                )
            )

        return UserSuggestionsResponse(
            users=suggestions,
            total=len(suggestions),
            limit=limit,
        )

    if not my_tag_ids:
        # タグがない場合は最近のユーザーを返す
        return await build_fallback_response("タグ未設定のため、最近登録したユーザーをおすすめします")
    
    # フィルター条件を満たすユーザーIDを事前に取得
    filtered_user_ids = None
    if filter_conditions:
        logger.info(f"[Filter Debug] Applying filter conditions to query")
        print(f"[Filter Debug] Applying filter conditions to query", file=sys.stderr)
        filtered_users_query = select(User.id).where(
            and_(
                User.is_active == True,
                User.profile_completed == True,
                *filter_conditions
            )
        )
        filtered_result = await db.execute(filtered_users_query)
        filtered_user_ids = {row[0] for row in filtered_result.all()}
        logger.info(f"[Filter Debug] Filtered user IDs count: {len(filtered_user_ids)}")
        print(f"[Filter Debug] Filtered user IDs count: {len(filtered_user_ids)}", file=sys.stderr)
        
        # フィルター結果が空の場合は空のレスポンスを返す
        if not filtered_user_ids:
            logger.info(f"[Filter Debug] No users match filter conditions")
            print(f"[Filter Debug] No users match filter conditions", file=sys.stderr)
            return await build_fallback_response("フィルター条件に一致するユーザーが見つかりませんでした")
    else:
        logger.info(f"[Filter Debug] No filter conditions to apply")
        print(f"[Filter Debug] No filter conditions to apply", file=sys.stderr)
    
    # 共通タグを持つユーザーを検索
    # 共通タグ数でスコアリング
    common_tags_conditions = [
        UserTag.tag_id.in_(my_tag_ids),
    ]
    
    if excluded_user_ids:
        common_tags_conditions.append(UserTag.user_id.not_in(excluded_user_ids))
    
    if filtered_user_ids:
        common_tags_conditions.append(UserTag.user_id.in_(filtered_user_ids))
    
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
    
    common_tags_result = await db.execute(common_tags_query)
    user_scores = common_tags_result.all()
    
    if not user_scores:
        return await build_fallback_response("共通タグが見つからなかったため、最近登録したユーザーをおすすめします")
    
    # ユーザー情報を取得
    suggested_user_ids = [row[0] for row in user_scores]
    user_score_dict = {row[0]: row[1] for row in user_scores}
    
    # ユーザー情報を取得（フィルター条件も適用）
    user_query_conditions = [
        User.id.in_(suggested_user_ids),
        User.is_active == True,
    ]
    if filter_conditions:
        user_query_conditions.extend(filter_conditions)
    
    users_query = await db.execute(
        select(User).where(and_(*user_query_conditions))
    )
    users = users_query.scalars().all()
    
    # ユーザーのタグを一括取得
    user_tags_query = await db.execute(
        select(UserTag)
        .where(UserTag.user_id.in_(suggested_user_ids))
        .options(selectinload(UserTag.tag))
    )
    all_user_tags = user_tags_query.scalars().all()
    
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
    
    # レスポンス整形
    suggestions = []
    my_tag_count = len(my_tag_ids)
    
    for user in users:
        common_count = user_score_dict[user.id]
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
        
        suggestions.append(
            UserSuggestion(
                id=user.id,
                display_name=user.display_name,
                bio=user.bio if user.show_bio else None,
                faculty=user.faculty if user.show_faculty else None,
                grade=user.grade if user.show_grade else None,
                tags=user_tags if user.show_tags else [],
                match_score=match_score,
                reason=reason,
            )
        )
    
    # スコア順にソート（既にクエリでソート済みだが念のため）
    suggestions.sort(key=lambda x: x.match_score, reverse=True)
    
    return UserSuggestionsResponse(
        users=suggestions,
        total=len(suggestions),
        limit=limit,
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
        campus=user.campus,
        faculty=user.faculty if user.show_faculty else None,
        grade=user.grade if user.show_grade else None,
        birthday=user.birthday if user.show_birthday else None,
        gender=user.gender if user.show_gender else None,
        sexuality=user.sexuality if user.show_sexuality else None,
        looking_for=user.looking_for if user.show_looking_for else None,
        profile_completed=user.profile_completed,
        is_active=user.is_active,
        created_at=user.created_at,
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

