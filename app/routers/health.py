# app/routers/health.py
# Health check endpoint
# FastAPIの稼働チェック、インフラ管理、デバック（これでhealthzがokならAPIは動いている。→問題はそこ以外にある。）

from fastapi import APIRouter

router = APIRouter(prefix="", tags=["health"])

@router.get("/healthz")
async def healthz():
    return {"status": "ok"}