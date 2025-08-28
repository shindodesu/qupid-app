# app/core/config.py
# Configuration settings for the application using pydantic-settings
# Pydanticとは、Pythonの型アノテーションを活用してデータ検証とデータ解析を自動で行うPythonライブラリ

from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "Qupid API"
    APP_ENV: str = "dev"
    DATABASE_URL: str

    class Config:
        env_file = ".env"

settings = Settings()
print(f"Loaded settings: {settings.dict()}")