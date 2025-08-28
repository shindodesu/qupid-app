# app/db/session.py

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from app.core.config import settings

# Create an asynchronous engine using the database URL from settings
engine = create_async_engine(settings.DATABASE_URL, pool_pre_ping=True)
# Create a session factory for asynchronous sessions
Sessionlocal = async_sessionmaker(bind = engine, autoflush=False, class_=AsyncSession)

# Dependency to get a session
async def get_db() -> AsyncSession:
    async with Sessionlocal() as session:
        yield session