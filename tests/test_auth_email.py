"""
メール認証APIのテスト

/auth/email/send-code, /auth/email/verify-code, /auth/email/reset-password をテスト
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.user import User
from app.models.email_verification import EmailVerification


@pytest.mark.auth
class TestEmailAuthentication:
    """メール認証のテスト"""
    
    async def test_send_code_success(self, client: AsyncClient, random_email: str):
        """認証コード送信成功"""
        response = await client.post(
            "/auth/email/send-code",
            json={"email": random_email}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "認証コードを送信しました"
        assert "verification_id" in data
    
    async def test_send_code_invalid_email(self, client: AsyncClient):
        """不正なメールアドレスで認証コード送信"""
        response = await client.post(
            "/auth/email/send-code",
            json={"email": "invalid-email"}
        )
        
        assert response.status_code == 422  # Validation error
    
    async def test_verify_code_new_user_without_password(
        self, 
        client: AsyncClient, 
        test_db: AsyncSession,
        random_email: str
    ):
        """新規ユーザー: 認証コード検証（パスワードなし）"""
        # まず認証コードを送信
        await client.post(
            "/auth/email/send-code",
            json={"email": random_email}
        )
        
        # データベースから認証コードを取得
        result = await test_db.execute(
            select(EmailVerification)
            .where(EmailVerification.email == random_email.lower())
            .order_by(EmailVerification.created_at.desc())
        )
        verification = result.scalar_one()
        
        # 認証コードを検証（パスワードなし）
        response = await client.post(
            "/auth/email/verify-code",
            json={
                "email": random_email,
                "verification_code": verification.verification_code,
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["requires_password"] is True
        assert data["is_new_user"] is True
        assert data["token"] is None
    
    async def test_verify_code_new_user_with_password(
        self, 
        client: AsyncClient, 
        test_db: AsyncSession,
        random_email: str
    ):
        """新規ユーザー: 認証コード検証（パスワードあり）"""
        # 認証コードを送信
        await client.post(
            "/auth/email/send-code",
            json={"email": random_email}
        )
        
        # 認証コードを取得
        result = await test_db.execute(
            select(EmailVerification)
            .where(EmailVerification.email == random_email.lower())
            .order_by(EmailVerification.created_at.desc())
        )
        verification = result.scalar_one()
        
        # 認証コードをパスワード付きで検証
        response = await client.post(
            "/auth/email/verify-code",
            json={
                "email": random_email,
                "verification_code": verification.verification_code,
                "password": "NewPassword123",
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["requires_password"] is False
        assert data["is_new_user"] is True
        assert data["token"] is not None
        assert data["user"]["email"] == random_email.lower()
    
    async def test_verify_code_existing_user(
        self, 
        client: AsyncClient, 
        test_db: AsyncSession,
        test_user: User
    ):
        """既存ユーザー: 認証コード検証"""
        email = test_user.email
        
        # 認証コードを送信
        await client.post(
            "/auth/email/send-code",
            json={"email": email}
        )
        
        # 認証コードを取得
        result = await test_db.execute(
            select(EmailVerification)
            .where(EmailVerification.email == email)
            .order_by(EmailVerification.created_at.desc())
        )
        verification = result.scalar_one()
        
        # 認証コードを検証
        response = await client.post(
            "/auth/email/verify-code",
            json={
                "email": email,
                "verification_code": verification.verification_code,
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["requires_password"] is False
        assert data["is_new_user"] is False
        assert data["token"] is not None
    
    async def test_verify_code_invalid_code(self, client: AsyncClient, random_email: str):
        """無効な認証コードで検証"""
        await client.post(
            "/auth/email/send-code",
            json={"email": random_email}
        )
        
        response = await client.post(
            "/auth/email/verify-code",
            json={
                "email": random_email,
                "verification_code": "000000",  # 無効なコード
            }
        )
        
        assert response.status_code == 400
        assert "無効または期限切れ" in response.json()["detail"]
    
    async def test_verify_code_short_password(
        self, 
        client: AsyncClient, 
        test_db: AsyncSession,
        random_email: str
    ):
        """短いパスワードで検証"""
        await client.post(
            "/auth/email/send-code",
            json={"email": random_email}
        )
        
        result = await test_db.execute(
            select(EmailVerification)
            .where(EmailVerification.email == random_email.lower())
            .order_by(EmailVerification.created_at.desc())
        )
        verification = result.scalar_one()
        
        response = await client.post(
            "/auth/email/verify-code",
            json={
                "email": random_email,
                "verification_code": verification.verification_code,
                "password": "short",  # 8文字未満
            }
        )
        
        assert response.status_code == 422  # Pydantic validation error
        # Pydantic validation error message check
        assert "password" in str(response.json()).lower()


@pytest.mark.auth
class TestPasswordReset:
    """パスワードリセットのテスト"""
    
    async def test_reset_password_success(
        self,
        client: AsyncClient,
        test_db: AsyncSession,
        test_user: User
    ):
        """パスワードリセット成功"""
        email = test_user.email
        
        # 認証コードを送信
        await client.post(
            "/auth/email/send-code",
            json={"email": email}
        )
        
        # 認証コードを取得
        result = await test_db.execute(
            select(EmailVerification)
            .where(EmailVerification.email == email)
            .order_by(EmailVerification.created_at.desc())
        )
        verification = result.scalar_one()
        
        # パスワードをリセット
        response = await client.post(
            "/auth/email/reset-password",
            json={
                "email": email,
                "verification_code": verification.verification_code,
                "new_password": "NewPassword456",
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        
        # 新しいパスワードでログインできることを確認
        login_response = await client.post(
            "/auth/login",
            json={
                "email": email,
                "password": "NewPassword456",
            }
        )
        assert login_response.status_code == 200
    
    async def test_reset_password_invalid_code(self, client: AsyncClient, test_user: User):
        """無効な認証コードでパスワードリセット"""
        response = await client.post(
            "/auth/email/reset-password",
            json={
                "email": test_user.email,
                "verification_code": "000000",
                "new_password": "NewPassword456",
            }
        )
        
        assert response.status_code == 400
    
    async def test_reset_password_nonexistent_user(
        self,
        client: AsyncClient,
        random_email: str
    ):
        """存在しないユーザーのパスワードリセット"""
        # 認証コードを送信
        await client.post(
            "/auth/email/send-code",
            json={"email": random_email}
        )
        
        response = await client.post(
            "/auth/email/reset-password",
            json={
                "email": random_email,
                "verification_code": "123456",  # 存在しないユーザー
                "new_password": "NewPassword456",
            }
        )
        
        # 認証コードが無効なので400エラー
        assert response.status_code == 400
    
    async def test_reset_password_short_password(
        self,
        client: AsyncClient,
        test_db: AsyncSession,
        test_user: User
    ):
        """短いパスワードでリセット"""
        email = test_user.email
        
        await client.post(
            "/auth/email/send-code",
            json={"email": email}
        )
        
        result = await test_db.execute(
            select(EmailVerification)
            .where(EmailVerification.email == email)
            .order_by(EmailVerification.created_at.desc())
        )
        verification = result.scalar_one()
        
        response = await client.post(
            "/auth/email/reset-password",
            json={
                "email": email,
                "verification_code": verification.verification_code,
                "new_password": "short",
            }
        )
        
        assert response.status_code == 422  # Pydantic validation error
        # Pydantic validation error message check
        assert "new_password" in str(response.json()).lower()


@pytest.mark.auth
class TestCodeResend:
    """認証コード再送信のテスト"""
    
    async def test_resend_code_success(
        self,
        client: AsyncClient,
        random_email: str
    ):
        """認証コード再送信成功"""
        # 最初のコード送信
        await client.post(
            "/auth/email/send-code",
            json={"email": random_email}
        )
        
        # 再送信
        response = await client.post(
            "/auth/email/resend-code",
            json={"email": random_email}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "認証コードを再送信しました"

