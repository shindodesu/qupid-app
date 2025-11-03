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

# CORS設定（最初に追加して、すべてのレスポンスに適用されるようにする）
def get_cors_origins():
    """CORS設定を環境変数から読み込み、VercelのプレビューURLにも対応"""
    origins = []
    
    # 環境変数から読み込む
    if hasattr(settings, 'CORS_ORIGINS') and settings.CORS_ORIGINS:
        origins.extend([origin.strip() for origin in settings.CORS_ORIGINS.split(',') if origin.strip()])
    
    # デフォルトの開発環境URL
    if settings.APP_ENV == "development":
        origins.extend([
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ])
    
    # 重複を削除
    origins = list(set(origins))
    return origins

# CORS設定を適用
cors_origins_list = get_cors_origins()
# ログ出力（stderrにも出力して確実に表示されるようにする）
import sys
print(f"🌐 CORS allowed origins: {cors_origins_list}", file=sys.stderr)
print(f"🌐 CORS allowed origins: {cors_origins_list}")

# デバッグ: 環境変数が正しく読み込まれているか確認
print(f"🔍 DEBUG - settings.CORS_ORIGINS: {settings.CORS_ORIGINS}", file=sys.stderr)
print(f"🔍 DEBUG - settings.APP_ENV: {settings.APP_ENV}", file=sys.stderr)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins_list if cors_origins_list else ["*"],  # 空の場合はすべて許可（開発用）
    allow_origin_regex=r"https://.*\.vercel\.app",  # VercelのプレビューURLを正規表現で許可
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["Content-Type", "Authorization", "Accept", "Origin", "X-Requested-With"],
    expose_headers=["*"],
    max_age=600,
)

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



