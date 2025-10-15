# app/core/config.py
# Configuration settings for the application using pydantic-settings
# Pydanticとは、Pythonの型アノテーションを活用してデータ検証とデータ解析を自動で行うPythonライブラリ

from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "Qupid API"
    APP_ENV: str = "dev"
    DATABASE_URL: str

        # 追加
    SECRET_KEY: str = "CHANGE_ME"  # 本番は十分に長い乱数
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7日
    ALLOWED_EMAIL_DOMAIN: str | None = None  # 例: "kyushu-u.ac.jp"

    class Config:
        env_file = ".env"

settings = Settings()
print(f"Loaded settings: {settings.dict()}")