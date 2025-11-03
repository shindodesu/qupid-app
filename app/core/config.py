# app/core/config.py
# Configuration settings for the application using pydantic-settings
# Pydanticとは、Pythonの型アノテーションを活用してデータ検証とデータ解析を自動で行うPythonライブラリ

import secrets
import warnings
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "Qupid API"
    APP_ENV: str = "development"
    DATABASE_URL: str

    # 認証設定
    SECRET_KEY: str = None  # 環境変数から読み込む
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7日
    ALLOWED_EMAIL_DOMAIN: str = "s.kyushu-u.ac.jp"  # 九州大学メール限定
    
    # メール送信設定（本番環境用）
    ENABLE_EMAIL: bool = False  # 本番環境ではTrueに設定
    SMTP_SERVER: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    FROM_EMAIL: str = "noreply@qupid.com"
    EMAIL_MAX_RETRIES: int = 3  # メール送信の最大リトライ回数
    EMAIL_RETRY_DELAY: int = 2  # リトライ間の待機時間（秒）
    
    # レート制限設定
    EMAIL_RATE_LIMIT_PER_HOUR: int = 10  # 1時間あたりの最大メール送信数
    API_RATE_LIMIT_PER_MINUTE: int = 100  # 1分あたりの最大APIリクエスト数
    
    # Sentry設定（エラー監視）
    SENTRY_DSN: str = ""  # 本番環境で設定
    
    # CORS設定
    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"  # カンマ区切り

    class Config:
        env_file = ".env"
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        
        # SECRET_KEYが設定されていない場合の処理
        if not self.SECRET_KEY or self.SECRET_KEY == "CHANGE_ME":
            if self.APP_ENV == "development":
                # 開発環境: ランダムなキーを自動生成（警告を表示）
                self.SECRET_KEY = secrets.token_urlsafe(32)
                warnings.warn(
                    "\n⚠️  SECRET_KEY が設定されていないため、ランダムなキーを生成しました。\n"
                    "   .env ファイルに SECRET_KEY を設定することを推奨します。\n"
                    f"   生成されたキー: {self.SECRET_KEY}\n"
                    "   次回起動時は、このキーを .env ファイルに保存してください。",
                    UserWarning
                )
            else:
                # 本番環境: エラーを発生させる
                raise ValueError(
                    "SECRET_KEY must be set in production environment. "
                    "Generate one with: python -c \"import secrets; print(secrets.token_urlsafe(32))\""
                )

settings = Settings()
import sys
print(f"✅ Loaded settings: APP_NAME={settings.APP_NAME}, APP_ENV={settings.APP_ENV}, ENABLE_EMAIL={settings.ENABLE_EMAIL}, SMTP_SERVER={settings.SMTP_SERVER}, SMTP_USERNAME={settings.SMTP_USERNAME}, ALLOWED_EMAIL_DOMAIN={settings.ALLOWED_EMAIL_DOMAIN}", file=sys.stderr)
print(f"✅ Loaded settings: APP_NAME={settings.APP_NAME}, APP_ENV={settings.APP_ENV}, ENABLE_EMAIL={settings.ENABLE_EMAIL}, SMTP_SERVER={settings.SMTP_SERVER}, SMTP_USERNAME={settings.SMTP_USERNAME}, ALLOWED_EMAIL_DOMAIN={settings.ALLOWED_EMAIL_DOMAIN}")
print(f"📋 CORS_ORIGINS={settings.CORS_ORIGINS}", file=sys.stderr)
print(f"📋 CORS_ORIGINS={settings.CORS_ORIGINS}")