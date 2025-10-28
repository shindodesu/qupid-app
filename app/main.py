from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.routers import health, users, auth, tags, chat, files, email_auth, ws
from app.routers.likes import router as likes_router, matches_router
from app.routers.safety import reports_router, blocks_router, admin_router
from pathlib import Path

# Sentry統合 (本番環境のみ)
if settings.APP_ENV == "production" and hasattr(settings, 'SENTRY_DSN') and settings.SENTRY_DSN:
    import sentry_sdk
    from sentry_sdk.integrations.fastapi import FastAPIIntegration
    from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
    
    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        environment=settings.APP_ENV,
        traces_sample_rate=0.1,  # 10%のトランザクションをサンプリング
        profiles_sample_rate=0.1,  # 10%のプロファイルをサンプリング
        integrations=[
            FastAPIIntegration(auto_enabling_integrations=True),
            SqlalchemyIntegration(),
        ],
        # エラーのフィルタリング
        before_send=lambda event, hint: event if event.get('level') in ['error', 'fatal'] else None,
    )

app = FastAPI(title=settings.APP_NAME)

# エラーハンドラーを登録
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from app.middleware.error_handler import (
    validation_exception_handler,
    http_exception_handler,
    unhandled_exception_handler,
)

app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(StarletteHTTPException, http_exception_handler)
app.add_exception_handler(Exception, unhandled_exception_handler)

# CORS設定
# 開発環境では全てのオリジンを許可、本番環境ではVercelのみ許可
if settings.APP_ENV == "development":
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    # 本番環境：正規表現でVercelドメインのみ許可
    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex=r"https://.*\.vercel\.app",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Include routers for different endpoints
app.include_router(health.router)
app.include_router(auth.router)
app.include_router(email_auth.router)
app.include_router(users.router)
app.include_router(tags.router)
app.include_router(likes_router)
app.include_router(matches_router)
app.include_router(chat.router)
app.include_router(files.router)
app.include_router(reports_router)
app.include_router(blocks_router)
app.include_router(admin_router)
app.include_router(ws.router)

# 静的ファイル提供（画像など）
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

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



