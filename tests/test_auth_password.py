"""
パスワード認証APIのテスト

/auth/login と /auth/register エンドポイントをテスト
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User


@pytest.mark.auth
class TestPasswordLogin:
    """パスワードログインのテスト"""
    
    async def test_login_success(self, client: AsyncClient, test_user: User):
        """正常なログイン"""
        response = await client.post(
            "/auth/login",
            json={
                "email": "test@s.kyushu-u.ac.jp",
                "password": "Test1234",
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == "test@s.kyushu-u.ac.jp"
    
    async def test_login_wrong_password(self, client: AsyncClient, test_user: User):
        """間違ったパスワードでログイン"""
        response = await client.post(
            "/auth/login",
            json={
                "email": "test@s.kyushu-u.ac.jp",
                "password": "WrongPassword123",
            }
        )
        
        assert response.status_code == 401
        assert "正しくありません" in response.json()["detail"]
    
    async def test_login_nonexistent_user(self, client: AsyncClient):
        """存在しないユーザーでログイン"""
        response = await client.post(
            "/auth/login",
            json={
                "email": "nonexistent@s.kyushu-u.ac.jp",
                "password": "TestPassword123",
            }
        )
        
        assert response.status_code == 401
    
    async def test_login_invalid_email_domain(self, client: AsyncClient):
        """不正なメールドメインでログイン"""
        response = await client.post(
            "/auth/login",
            json={
                "email": "test@gmail.com",
                "password": "TestPassword123",
            }
        )
        
        assert response.status_code == 403
        assert "九州大学" in response.json()["detail"]
    
    async def test_login_missing_password(self, client: AsyncClient):
        """パスワードなしでログイン"""
        response = await client.post(
            "/auth/login",
            json={
                "email": "test@s.kyushu-u.ac.jp",
            }
        )
        
        assert response.status_code == 422  # Validation error


@pytest.mark.auth
class TestPasswordRegister:
    """パスワード登録のテスト"""
    
    async def test_register_success(self, client: AsyncClient, random_email: str):
        """正常な新規登録"""
        response = await client.post(
            "/auth/register",
            json={
                "email": random_email,
                "password": "NewPassword123",
                "display_name": "New User",
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == random_email
        assert data["user"]["display_name"] == "New User"
    
    async def test_register_short_password(self, client: AsyncClient, random_email: str):
        """短すぎるパスワードで登録"""
        response = await client.post(
            "/auth/register",
            json={
                "email": random_email,
                "password": "short",  # 8文字未満
            }
        )
        
        assert response.status_code == 422  # Validation error
    
    async def test_register_duplicate_email(self, client: AsyncClient, test_user: User):
        """既に存在するメールアドレスで登録"""
        response = await client.post(
            "/auth/register",
            json={
                "email": "test@s.kyushu-u.ac.jp",
                "password": "NewPassword123",
            }
        )
        
        assert response.status_code == 400
        assert "既に登録されています" in response.json()["detail"]
    
    async def test_register_invalid_email_domain(self, client: AsyncClient):
        """不正なメールドメインで登録"""
        response = await client.post(
            "/auth/register",
            json={
                "email": "test@gmail.com",
                "password": "NewPassword123",
            }
        )
        
        assert response.status_code == 403
        assert "九州大学" in response.json()["detail"]
    
    async def test_register_without_password(self, client: AsyncClient, random_email: str):
        """パスワードなしで登録"""
        response = await client.post(
            "/auth/register",
            json={
                "email": random_email,
            }
        )
        
        assert response.status_code == 422  # Validation error

