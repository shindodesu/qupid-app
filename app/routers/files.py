# app/routers/files.py

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.models.user import User
from app.core.security import get_current_user
from typing import Optional
import os
import uuid
import aiofiles
from pathlib import Path

router = APIRouter(prefix="/files", tags=["files"])

# ファイル保存ディレクトリ
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# 音声ファイル用ディレクトリ
VOICE_DIR = UPLOAD_DIR / "voice"
VOICE_DIR.mkdir(exist_ok=True)

# 画像ファイル用ディレクトリ
IMAGE_DIR = UPLOAD_DIR / "images"
IMAGE_DIR.mkdir(exist_ok=True)

# アバター画像用ディレクトリ
AVATAR_DIR = UPLOAD_DIR / "avatars"
AVATAR_DIR.mkdir(exist_ok=True)

# 許可されるファイルタイプ
ALLOWED_VOICE_TYPES = ["audio/mpeg", "audio/wav", "audio/ogg", "audio/mp4"]
ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"]

# 許可される拡張子
ALLOWED_VOICE_EXTENSIONS = {".mp3", ".wav", ".ogg", ".m4a", ".mp4"}
ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}

# ファイルサイズ制限（10MB）
MAX_FILE_SIZE = 10 * 1024 * 1024


@router.post("/upload/voice")
async def upload_voice_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """
    音声ファイルをアップロード
    
    - 音声メッセージ用のファイルアップロード
    - ファイルサイズ制限: 10MB
    - 許可形式: MP3, WAV, OGG, MP4
    """
    
    # ファイル名の検証
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ファイル名が不正です"
        )
    
    # ファイル拡張子のチェック
    file_extension = Path(file.filename).suffix.lower()
    if file_extension not in ALLOWED_VOICE_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"サポートされていないファイル形式です。許可されている拡張子: {', '.join(ALLOWED_VOICE_EXTENSIONS)}"
        )
    
    # ファイルタイプチェック（MIME type）
    if file.content_type not in ALLOWED_VOICE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"サポートされていないファイルタイプです。許可されているタイプ: {', '.join(ALLOWED_VOICE_TYPES)}"
        )
    
    # ファイルサイズチェック
    file_content = await file.read()
    if len(file_content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"ファイルサイズが大きすぎます。最大サイズ: {MAX_FILE_SIZE // (1024*1024)}MB"
        )
    
    # ファイルが空でないことを確認
    if len(file_content) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ファイルが空です"
        )
    
    # ファイル名生成
    file_extension = Path(file.filename).suffix
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = VOICE_DIR / unique_filename
    
    # ファイル保存
    async with aiofiles.open(file_path, 'wb') as f:
        await f.write(file_content)
    
    return {
        "file_path": str(file_path),
        "file_size": len(file_content),
        "original_filename": file.filename,
        "content_type": file.content_type,
    }


@router.post("/upload/image")
async def upload_image_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """
    画像ファイルをアップロード
    
    - 画像メッセージ用のファイルアップロード
    - ファイルサイズ制限: 10MB
    - 許可形式: JPEG, PNG, GIF, WebP
    """
    
    # ファイル名の検証
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ファイル名が不正です"
        )
    
    # ファイル拡張子のチェック
    file_extension = Path(file.filename).suffix.lower()
    if file_extension not in ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"サポートされていないファイル形式です。許可されている拡張子: {', '.join(ALLOWED_IMAGE_EXTENSIONS)}"
        )
    
    # ファイルタイプチェック（MIME type）
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"サポートされていないファイルタイプです。許可されているタイプ: {', '.join(ALLOWED_IMAGE_TYPES)}"
        )
    
    # ファイルサイズチェック
    file_content = await file.read()
    if len(file_content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"ファイルサイズが大きすぎます。最大サイズ: {MAX_FILE_SIZE // (1024*1024)}MB"
        )
    
    # ファイルが空でないことを確認
    if len(file_content) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ファイルが空です"
        )
    
    # ファイル名生成
    file_extension = Path(file.filename).suffix
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = IMAGE_DIR / unique_filename
    
    # ファイル保存
    async with aiofiles.open(file_path, 'wb') as f:
        await f.write(file_content)
    
    return {
        "file_path": str(file_path),
        "file_size": len(file_content),
        "original_filename": file.filename,
        "content_type": file.content_type,
    }


@router.post("/upload/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    プロフィール画像（アバター）をアップロード
    
    - ユーザーのプロフィール画像をアップロード
    - ファイルサイズ制限: 10MB
    - 許可形式: JPEG, PNG, GIF, WebP
    - 古いアバター画像は自動削除
    """
    
    # ファイル名の検証
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ファイル名が不正です"
        )
    
    # ファイル拡張子のチェック
    file_extension = Path(file.filename).suffix.lower()
    if file_extension not in ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"サポートされていないファイル形式です。許可されている拡張子: {', '.join(ALLOWED_IMAGE_EXTENSIONS)}"
        )
    
    # ファイルタイプチェック（MIME type）
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"サポートされていないファイルタイプです。許可されているタイプ: {', '.join(ALLOWED_IMAGE_TYPES)}"
        )
    
    # ファイルサイズチェック
    file_content = await file.read()
    if len(file_content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"ファイルサイズが大きすぎます。最大サイズ: {MAX_FILE_SIZE // (1024*1024)}MB"
        )
    
    # ファイルが空でないことを確認
    if len(file_content) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ファイルが空です"
        )
    
    # 古いアバター画像を削除
    if current_user.avatar_url:
        old_avatar_path = Path(current_user.avatar_url)
        if old_avatar_path.exists():
            try:
                os.remove(old_avatar_path)
            except Exception as e:
                print(f"Failed to delete old avatar: {e}")
    
    # ファイル名生成
    file_extension = Path(file.filename).suffix
    unique_filename = f"{current_user.id}_{uuid.uuid4()}{file_extension}"
    file_path = AVATAR_DIR / unique_filename
    
    # ファイル保存
    async with aiofiles.open(file_path, 'wb') as f:
        await f.write(file_content)
    
    # データベース更新
    current_user.avatar_url = str(file_path)
    await db.commit()
    await db.refresh(current_user)
    
    return {
        "avatar_url": str(file_path),
        "file_size": len(file_content),
        "original_filename": file.filename,
        "content_type": file.content_type,
    }


@router.get("/download/{file_path:path}")
async def download_file(
    file_path: str,
    current_user: User = Depends(get_current_user),
):
    """
    ファイルをダウンロード
    
    - アップロードされたファイルのダウンロード
    - セキュリティ: 認証済みユーザーのみアクセス可能
    """
    
    # パス検証（ディレクトリトラバーサル攻撃防止）
    full_path = Path(file_path).resolve()
    upload_dir = Path(UPLOAD_DIR).resolve()
    
    if not str(full_path).startswith(str(upload_dir)):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # ファイル存在チェック
    if not full_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    return FileResponse(
        path=str(full_path),
        filename=full_path.name,
        media_type='application/octet-stream'
    )


@router.delete("/{file_path:path}")
async def delete_file(
    file_path: str,
    current_user: User = Depends(get_current_user),
):
    """
    ファイルを削除
    
    - アップロードされたファイルの削除
    - セキュリティ: 認証済みユーザーのみ削除可能
    """
    
    # パス検証（ディレクトリトラバーサル攻撃防止）
    full_path = Path(file_path).resolve()
    upload_dir = Path(UPLOAD_DIR).resolve()
    
    if not str(full_path).startswith(str(upload_dir)):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # ファイル存在チェック
    if not full_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    # ファイル削除
    try:
        full_path.unlink()
        return {"message": "File deleted successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete file: {str(e)}"
        )
