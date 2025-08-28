# app/routers_users.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserRead

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

# 指定されたIDのユーザーをDBから探して、見つからなければ404、見つかれば整形して返す
@router.get("/{user_id}", response_model=UserRead)
async def get_user(user_id: int, db: AsyncSession = Depends(get_db)):
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
