"""
テスト用共通フィクスチャ

このファイルは pytest により自動的に読み込まれます。
"""

import asyncio
import pytest
import pytest_asyncio
from typing import AsyncGenerator, Generator
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import NullPool
from faker import Faker

from app.main import app
from app.db.base import Base
from app.db.session import get_db
from app.models.user import User
from app.core.security import hash_password

# すべてのモデルをインポートしてメタデータに登録
from app.models import (
    user, tag, like, block, conversation, message, 
    report, email_verification
)

# テスト用のSQLiteデータベース (一時ファイル)
import tempfile
import os

# 一時ディレクトリにテスト用DBを作成
TEST_DB_PATH = os.path.join(tempfile.gettempdir(), "test_qupid.db")
TEST_DATABASE_URL = f"sqlite+aiosqlite:///{TEST_DB_PATH}"

# Faker インスタンス
fake = Faker('ja_JP')


@pytest.fixture(scope="session")
def event_loop() -> Generator:
    """イベントループを作成"""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="function")
async def test_db() -> AsyncGenerator[AsyncSession, None]:
    """テスト用データベースセッション"""
    # 既存のテストDBファイルを削除
    if os.path.exists(TEST_DB_PATH):
        os.remove(TEST_DB_PATH)
    
    # テスト用エンジンを作成
    engine = create_async_engine(
        TEST_DATABASE_URL,
        poolclass=NullPool,
        echo=False,
        connect_args={"check_same_thread": False},
    )
    
    # テーブルを作成
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # セッションを作成
    async_session = async_sessionmaker(
        engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )
    
    async with async_session() as session:
        yield session
        await session.rollback()  # ロールバックして確実にクリーンアップ
    
    # テスト後にテーブルを削除
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    
    await engine.dispose()
    
    # テストDBファイルを削除
    if os.path.exists(TEST_DB_PATH):
        os.remove(TEST_DB_PATH)


@pytest_asyncio.fixture(scope="function")
async def client(test_db: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """テスト用HTTPクライアント"""
    from httpx import ASGITransport
    
    # データベースセッションをオーバーライド
    async def override_get_db():
        yield test_db
    
    app.dependency_overrides[get_db] = override_get_db
    
    # httpx 0.23+ ではtransportを使用
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client
    
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def test_user(test_db: AsyncSession) -> User:
    """テスト用ユーザーを作成"""
    user = User(
        email="test@s.kyushu-u.ac.jp",
        hashed_password=hash_password("Test1234"),
        display_name="Test User",
        profile_completed=True,
    )
    test_db.add(user)
    await test_db.commit()
    await test_db.refresh(user)
    return user


@pytest_asyncio.fixture
async def test_user_incomplete(test_db: AsyncSession) -> User:
    """プロフィール未完成のテスト用ユーザーを作成"""
    user = User(
        email="incomplete@s.kyushu-u.ac.jp",
        hashed_password=hash_password("Test1234"),
        display_name="Incomplete User",
        profile_completed=False,
    )
    test_db.add(user)
    await test_db.commit()
    await test_db.refresh(user)
    return user


@pytest.fixture
def auth_headers(test_user: User) -> dict:
    """認証ヘッダーを生成"""
    from app.core.security import create_access_token
    
    token = create_access_token(sub=str(test_user.id))
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def random_email() -> str:
    """ランダムなメールアドレスを生成"""
    email = fake.email()
    local_part = email.split('@')[0]
    return f"{local_part}@s.kyushu-u.ac.jp"


@pytest.fixture
def random_password() -> str:
    """ランダムなパスワードを生成"""
    return fake.password(length=12)

