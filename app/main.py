from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.routers import health, users, auth, tags, chat
from app.routers.likes import router as likes_router, matches_router
from app.routers.safety import reports_router, blocks_router, admin_router

app = FastAPI(title=settings.APP_NAME)

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers for different endpoints
app.include_router(health.router)
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(tags.router)
app.include_router(likes_router)
app.include_router(matches_router)
app.include_router(chat.router)
app.include_router(reports_router)
app.include_router(blocks_router)
app.include_router(admin_router)

# check root end point
@app.get("/")
async def root():
    return {"name": settings.APP_NAME, "env": settings.APP_ENV}

# 初期テーブル作成（超簡易版。Alembic導入後はこの自動createは削除）
from app.db.session import engine
from app.db.base import Base
from app.models.user import User  # noqa: F401
from app.models.tag import Tag, UserTag  # noqa: F401

# Temporarily disabled for testing
# @app.on_event("startup")
# async def on_startup():
#     async with engine.begin() as conn:
#         await conn.run_sync(Base.metadata.create_all)



