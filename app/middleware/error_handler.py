"""
グローバルエラーハンドリングミドルウェア

すべての未処理エラーをキャッチしてSentryに送信し、
クライアントには適切なエラーレスポンスを返す
"""

from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
import logging

logger = logging.getLogger(__name__)


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
    
    logger.warning(f"Validation error: {errors}")
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": "入力データが不正です",
            "errors": errors,
        },
    )


async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """
    HTTPException のカスタムハンドラー
    
    Sentryにエラーログを送信し、クライアントには適切なレスポンスを返す
    """
    # 4xxエラーは通常のユーザーエラーなのでSentryには送信しない
    if exc.status_code >= 500:
        logger.error(f"HTTP {exc.status_code}: {exc.detail}", exc_info=True)
        # Sentryが自動的にキャッチ
    
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )


async def unhandled_exception_handler(request: Request, exc: Exception):
    """
    未処理の例外のハンドラー
    
    すべての予期しないエラーをキャッチしてSentryに送信
    """
    logger.exception(f"Unhandled exception: {str(exc)}")
    # Sentryが自動的にキャッチ
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "サーバー内部エラーが発生しました。しばらくしてから再試行してください。",
        },
    )



