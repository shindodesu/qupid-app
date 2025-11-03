"""
グローバルエラーハンドリングミドルウェア

すべての未処理エラーをキャッチしてSentryに送信し、
クライアントには適切なエラーレスポンスを返す
"""

from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from app.core.config import settings
import logging
import re

logger = logging.getLogger(__name__)


def is_origin_allowed(origin: str) -> bool:
    """オリジンが許可されているかチェック（環境変数と正規表現に対応）"""
    if not origin:
        return False
    
    # 環境変数から読み込む
    if hasattr(settings, 'CORS_ORIGINS') and settings.CORS_ORIGINS:
        allowed_origins = [o.strip() for o in settings.CORS_ORIGINS.split(',') if o.strip()]
        if origin in allowed_origins:
            return True
    
    # 開発環境のデフォルトURL
    if settings.APP_ENV == "development":
        if origin in ["http://localhost:3000", "http://127.0.0.1:3000"]:
            return True
    
    # VercelのプレビューURLパターン（正規表現でチェック）
    if re.match(r"https://.*\.vercel\.app$", origin):
        return True
    
    return False


def add_cors_headers(response: JSONResponse, request: Request) -> JSONResponse:
    """CORSヘッダーをレスポンスに追加"""
    origin = request.headers.get("origin")
    
    if is_origin_allowed(origin):
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, Accept, Origin, X-Requested-With"
        response.headers["Access-Control-Expose-Headers"] = "*"
    else:
        # デバッグ用: 許可されていないオリジンをログに記録
        logger.warning(f"CORS: Origin not allowed - {origin}")
    
    return response


async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """
    Pydanticバリデーションエラーのカスタムハンドラー
    
    422エラーをより読みやすい形式で返す
    """
    errors = []
    for error in exc.errors():
        field = " -> ".join([str(loc) for loc in error["loc"]])
        message = error["msg"]
        errors.append(f"{field}: {message}")
        # 詳細なログを出力
        logger.warning(f"Validation error detail: {error}")
    
    # リクエスト情報をログ出力
    logger.warning(f"Request URL: {request.url}")
    logger.warning(f"Request method: {request.method}")
    logger.warning(f"Request headers: {dict(request.headers)}")
    # リクエストボディは既に読み取られている可能性があるため、エラー情報から推測
    
    logger.warning(f"Validation error: {errors}")
    
    response = JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": "入力データが不正です",
            "errors": errors,
        },
    )
    return add_cors_headers(response, request)


async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """
    HTTPException のカスタムハンドラー
    
    Sentryにエラーログを送信し、クライアントには適切なレスポンスを返す
    """
    # 4xxエラーは通常のユーザーエラーなのでSentryには送信しない
    if exc.status_code >= 500:
        logger.error(f"HTTP {exc.status_code}: {exc.detail}", exc_info=True)
        # Sentryが自動的にキャッチ
    
    response = JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )
    return add_cors_headers(response, request)


async def unhandled_exception_handler(request: Request, exc: Exception):
    """
    未処理の例外のハンドラー
    
    すべての予期しないエラーをキャッチしてSentryに送信
    """
    logger.exception(f"Unhandled exception: {str(exc)}")
    # Sentryが自動的にキャッチ
    
    response = JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "サーバー内部エラーが発生しました。しばらくしてから再試行してください。",
        },
    )
    return add_cors_headers(response, request)





