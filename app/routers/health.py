from fastapi import APIRouter
from app.core.config import settings

router = APIRouter(tags=["health"])

@router.get("/health")
async def health_check():
    """ヘルスチェック"""
    return {
        "status": "healthy",
        "app_name": settings.APP_NAME,
        "environment": settings.APP_ENV
    }

@router.get("/config")
async def config_check():
    """設定確認（開発環境のみ）"""
    if settings.APP_ENV != "development":
        return {"error": "This endpoint is only available in development mode"}
    
    return {
        "app_name": settings.APP_NAME,
        "app_env": settings.APP_ENV,
        "email_enabled": settings.ENABLE_EMAIL,
        "smtp_server": settings.SMTP_SERVER,
        "smtp_port": settings.SMTP_PORT,
        "smtp_username": settings.SMTP_USERNAME,
        "from_email": settings.FROM_EMAIL,
        "allowed_domain": settings.ALLOWED_EMAIL_DOMAIN,
        # パスワードやシークレットキーは表示しない
    }
