from logging.config import fileConfig
from alembic import context
from sqlalchemy import engine_from_config, pool

# ---- アプリ側の設定/metadata を読み込む ----
from app.core.config import settings
from app.db.base import Base
from app.models.email_verification import EmailVerification
import app.models  # ← これが超重要：全モデルをimportして Base.metadata に登録させる

# Alembicの設定オブジェクト
config = context.config

# ログ設定
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# --- async URL を Alembic用に同期URLへ変換（psycopgで接続） ---
ASYNC_URL = settings.DATABASE_URL  # 例: postgresql+asyncpg://user:password@db:5432/mydatabase
SYNC_URL = (
    ASYNC_URL
    .replace("+asyncpg", "+psycopg")
    .replace("+aiopg", "+psycopg")
    .replace("+pg8000", "+psycopg")
)
config.set_main_option("sqlalchemy.url", SYNC_URL)

# ここが無いと autogenerate できない
target_metadata = Base.metadata

# オプション（型変更検知やschema比較のため）
COMPARE_KW = dict(compare_type=True, compare_server_default=True)

def run_migrations_offline() -> None:
    """オフライン（接続なし）でのマイグレーション"""
    context.configure(
        url=SYNC_URL,
        target_metadata=target_metadata,
        literal_binds=True,
        **COMPARE_KW,
    )
    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online() -> None:
    """オンライン（DB接続あり）でのマイグレーション"""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
        future=True,
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            **COMPARE_KW,
        )
        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
