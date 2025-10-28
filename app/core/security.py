import time
import jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.config import settings
from app.db.session import get_db
from app.models.user import User

ALGORITHM = "HS256"
auth_scheme = HTTPBearer(auto_error=True)

# パスワードハッシュ化の設定
# bcrypt__rounds=12: 適度なセキュリティとパフォーマンスのバランス
# bcrypt__ident="2b": 最新のbcrypt識別子を使用
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=12,
    bcrypt__ident="2b"
)

def create_access_token(sub: str, expires_minutes: int | None = None) -> str:
    now = int(time.time())
    exp = now + 60 * (expires_minutes or settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": sub, "iat": now, "exp": exp}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

async def get_current_user(
    creds: HTTPAuthorizationCredentials = Depends(auth_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    payload = decode_token(creds.credentials)
    sub = payload.get("sub")
    if not sub:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    q = await db.execute(select(User).where(User.id == int(sub)))
    user = q.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

async def get_current_admin_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    管理者権限チェック
    現在のユーザーが管理者かどうかを確認する
    """
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user

# ============================================================
# パスワードハッシュ化・検証関数
# ============================================================

def hash_password(password: str) -> str:
    """
    パスワードをハッシュ化する
    
    Args:
        password: 平文のパスワード
    
    Returns:
        ハッシュ化されたパスワード
    """
    # bcryptは72バイトまでしか処理できないため、長いパスワードは切り詰める
    if len(password.encode('utf-8')) > 72:
        password = password[:72]
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    平文のパスワードとハッシュ化されたパスワードを比較する
    
    Args:
        plain_password: 平文のパスワード
        hashed_password: ハッシュ化されたパスワード
    
    Returns:
        パスワードが一致する場合はTrue、それ以外はFalse
    """
    return pwd_context.verify(plain_password, hashed_password)
