#routはクライアントのリクエスト内容と、サーバーの処理内容を紐づける作業。

from fastapi import APIRouter
router = APIRouter(prefix="/auth", tags=["auth"])

# TODO: signup/login/verify を実装
