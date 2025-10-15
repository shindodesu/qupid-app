# app/routers/safety.py
# 通報・ブロック機能のルーター

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func
from sqlalchemy.orm import selectinload
from app.db.session import get_db
from app.models.user import User
from app.models.report import Report
from app.models.block import Block
from app.models.enums import ReportStatus
from app.schemas.safety import (
    ReportCreate,
    ReportRead,
    ReportDetailRead,
    ReportResponse,
    ReportListResponse,
    AdminReportListResponse,
    ReportStatusUpdate,
    ReportStatusUpdateResponse,
    BlockCreate,
    BlockRead,
    BlockResponse,
    BlockListResponse,
    BlockRemoveResponse,
    UserInfo,
)
from app.core.security import get_current_user, get_current_admin_user
from typing import Optional

# 通報ルーター
reports_router = APIRouter(prefix="/reports", tags=["reports"])

# ブロックルーター  
blocks_router = APIRouter(prefix="/blocks", tags=["blocks"])

# 管理者用ルーター
admin_router = APIRouter(prefix="/admin", tags=["admin"])


# ==================== 通報エンドポイント ====================

@reports_router.post("", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
async def create_report(
    payload: ReportCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    ユーザーを通報する
    
    - 自分自身を通報することはできない
    - 対象ユーザーの存在を確認
    """
    
    # 自分自身を通報できない
    if payload.target_user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot report yourself",
        )
    
    # 対象ユーザーの存在確認
    target_user = await db.get(User, payload.target_user_id)
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Target user not found",
        )
    
    # 通報を作成
    new_report = Report(
        reporter_id=current_user.id,
        target_user_id=payload.target_user_id,
        reason=payload.reason,
        status=ReportStatus.open,
    )
    db.add(new_report)
    await db.commit()
    await db.refresh(new_report)
    
    return ReportResponse(
        id=new_report.id,
        target_user_id=target_user.id,
        target_user_name=target_user.display_name,
        reason=new_report.reason,
        status=new_report.status,
        created_at=new_report.created_at,
        message="Report submitted successfully",
    )


@reports_router.get("/my", response_model=ReportListResponse)
async def get_my_reports(
    limit: int = Query(20, ge=1, le=100, description="取得件数"),
    offset: int = Query(0, ge=0, description="オフセット"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    自分が送信した通報一覧を取得
    
    - 自分が通報者である通報のみ
    - 通報者情報は含まない（自分なので不要）
    """
    
    # 総数取得
    count_query = select(func.count()).select_from(Report).where(
        Report.reporter_id == current_user.id
    )
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    
    # 通報一覧取得
    reports_query = await db.execute(
        select(Report)
        .where(Report.reporter_id == current_user.id)
        .options(selectinload(Report.target_user))
        .order_by(Report.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    reports = reports_query.scalars().all()
    
    # レスポンス整形
    reports_read = []
    for report in reports:
        target_user_info = None
        if report.target_user:
            target_user_info = UserInfo(
                id=report.target_user.id,
                display_name=report.target_user.display_name,
            )
        
        reports_read.append(
            ReportRead(
                id=report.id,
                target_user=target_user_info,
                reason=report.reason,
                status=report.status,
                admin_note=report.admin_note,
                created_at=report.created_at,
                updated_at=report.updated_at,
            )
        )
    
    return ReportListResponse(
        reports=reports_read,
        total=total,
        limit=limit,
        offset=offset,
    )


@reports_router.get("/{report_id}", response_model=ReportRead)
async def get_report_detail(
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    通報詳細を取得
    
    - 自分が送信した通報のみ閲覧可能
    """
    
    # 通報の存在確認
    report = await db.get(Report, report_id)
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found",
        )
    
    # 権限チェック（自分が送信した通報のみ）
    if report.reporter_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view your own reports",
        )
    
    # 対象ユーザー情報を取得
    await db.refresh(report, ["target_user"])
    
    target_user_info = None
    if report.target_user:
        target_user_info = UserInfo(
            id=report.target_user.id,
            display_name=report.target_user.display_name,
        )
    
    return ReportRead(
        id=report.id,
        target_user=target_user_info,
        reason=report.reason,
        status=report.status,
        admin_note=report.admin_note,
        created_at=report.created_at,
        updated_at=report.updated_at,
    )


# ==================== ブロックエンドポイント ====================

@blocks_router.post("", response_model=BlockResponse, status_code=status.HTTP_201_CREATED)
async def create_block(
    payload: BlockCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    ユーザーをブロックする
    
    - 自分自身をブロックすることはできない
    - 既にブロック済みの場合はエラー
    - 対象ユーザーの存在を確認
    """
    
    # 自分自身をブロックできない
    if payload.blocked_user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot block yourself",
        )
    
    # 対象ユーザーの存在確認
    blocked_user = await db.get(User, payload.blocked_user_id)
    if not blocked_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    # 既にブロック済みかチェック
    existing_block_query = await db.execute(
        select(Block).where(
            and_(
                Block.blocker_id == current_user.id,
                Block.blocked_id == payload.blocked_user_id,
            )
        )
    )
    existing_block = existing_block_query.scalar_one_or_none()
    
    if existing_block:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already blocked",
        )
    
    # ブロックを作成
    new_block = Block(
        blocker_id=current_user.id,
        blocked_id=payload.blocked_user_id,
    )
    db.add(new_block)
    await db.commit()
    await db.refresh(new_block)
    
    return BlockResponse(
        id=new_block.id,
        blocked_user=UserInfo(
            id=blocked_user.id,
            display_name=blocked_user.display_name,
        ),
        created_at=new_block.created_at,
        message="User blocked successfully",
    )


@blocks_router.get("/my", response_model=BlockListResponse)
async def get_my_blocks(
    limit: int = Query(20, ge=1, le=100, description="取得件数"),
    offset: int = Query(0, ge=0, description="オフセット"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    自分がブロックしたユーザー一覧を取得
    """
    
    # 総数取得
    count_query = select(func.count()).select_from(Block).where(
        Block.blocker_id == current_user.id
    )
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    
    # ブロック一覧取得
    blocks_query = await db.execute(
        select(Block)
        .where(Block.blocker_id == current_user.id)
        .options(selectinload(Block.blocked))
        .order_by(Block.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    blocks = blocks_query.scalars().all()
    
    # レスポンス整形
    blocks_read = [
        BlockRead(
            id=block.id,
            blocked_user=UserInfo(
                id=block.blocked.id,
                display_name=block.blocked.display_name,
            ),
            created_at=block.created_at,
        )
        for block in blocks
    ]
    
    return BlockListResponse(
        blocks=blocks_read,
        total=total,
        limit=limit,
        offset=offset,
    )


@blocks_router.delete("/{blocked_user_id}", response_model=BlockRemoveResponse)
async def remove_block(
    blocked_user_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    ブロックを解除する
    """
    
    # ブロックの存在確認
    block_query = await db.execute(
        select(Block).where(
            and_(
                Block.blocker_id == current_user.id,
                Block.blocked_id == blocked_user_id,
            )
        )
    )
    block = block_query.scalar_one_or_none()
    
    if not block:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Block not found",
        )
    
    await db.delete(block)
    await db.commit()
    
    return BlockRemoveResponse(
        message="Block removed successfully",
        blocked_user_id=blocked_user_id,
    )


# ==================== 管理者用エンドポイント ====================

@admin_router.get("/reports", response_model=AdminReportListResponse)
async def get_all_reports(
    status_filter: Optional[ReportStatus] = Query(None, description="ステータスフィルター"),
    limit: int = Query(20, ge=1, le=100, description="取得件数"),
    offset: int = Query(0, ge=0, description="オフセット"),
    current_admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """
    全ての通報一覧を取得（管理者用）
    
    - 管理者権限が必要
    - ステータスでフィルター可能
    - 通報者と対象ユーザーの両方の情報を含む
    """
    
    # クエリ作成
    query = select(Report)
    
    # ステータスフィルター
    if status_filter:
        query = query.where(Report.status == status_filter)
    
    # 総数取得
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    
    # 通報一覧取得
    query = query.options(
        selectinload(Report.reporter),
        selectinload(Report.target_user),
    ).order_by(Report.created_at.desc()).limit(limit).offset(offset)
    
    reports_result = await db.execute(query)
    reports = reports_result.scalars().all()
    
    # レスポンス整形
    reports_read = []
    for report in reports:
        reporter_info = None
        if report.reporter:
            reporter_info = UserInfo(
                id=report.reporter.id,
                display_name=report.reporter.display_name,
            )
        
        target_user_info = None
        if report.target_user:
            target_user_info = UserInfo(
                id=report.target_user.id,
                display_name=report.target_user.display_name,
            )
        
        reports_read.append(
            ReportDetailRead(
                id=report.id,
                reporter=reporter_info,
                target_user=target_user_info,
                reason=report.reason,
                status=report.status,
                admin_note=report.admin_note,
                created_at=report.created_at,
                updated_at=report.updated_at,
            )
        )
    
    return AdminReportListResponse(
        reports=reports_read,
        total=total,
        limit=limit,
        offset=offset,
    )


@admin_router.put("/reports/{report_id}", response_model=ReportStatusUpdateResponse)
async def update_report_status(
    report_id: int,
    payload: ReportStatusUpdate,
    current_admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """
    通報のステータスを更新する（管理者用）
    
    - 管理者権限が必要
    - ステータスと管理者メモを更新可能
    """
    
    # 通報の存在確認
    report = await db.get(Report, report_id)
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found",
        )
    
    # ステータスを更新
    report.status = payload.status
    if payload.admin_note is not None:
        report.admin_note = payload.admin_note
    
    await db.commit()
    await db.refresh(report)
    
    return ReportStatusUpdateResponse(
        id=report.id,
        status=report.status,
        admin_note=report.admin_note,
        updated_at=report.updated_at,
        message="Report status updated successfully",
    )

