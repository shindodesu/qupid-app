from fastapi import FastAPI
from app.routers import health, users
from app.core.config import settings

app = FastAPI(title=settings.APP_NAME)

# Include routers for different endpoints
app.include_router(health.router)
app.include_router(users.router)

# check root end point
@app.get("/")
async def root():
    return {"name": settings.APP_NAME, "env": settings.APP_ENV}

# 初期テーブル作成（超簡易版。Alembic導入後はこの自動createは削除）
from app.db.session import engine
from app.db.base import Base
from app.models.user import User  # noqa: F401

@app.on_event("startup")
async def on_startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

