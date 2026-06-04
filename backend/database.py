import os
import logging
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker, declarative_base

load_dotenv()
logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv("DATABASE_URL")
SQLITE_PATH = Path(__file__).resolve().parent / "lexai.db"
SQLITE_URL = f"sqlite+aiosqlite:///{SQLITE_PATH}"

engine = None
AsyncSessionLocal = None
Base = declarative_base()


async def create_engine_with_fallback():
    global engine, AsyncSessionLocal
    
    # Try PostgreSQL first
    if DATABASE_URL:
        try:
            test_engine = create_async_engine(DATABASE_URL, future=True, echo=False)
            # Test the connection
            async with test_engine.begin() as conn:
                await conn.execute("SELECT 1")
            engine = test_engine
            logger.info("Connected to PostgreSQL database")
        except Exception as e:
            logger.warning(f"PostgreSQL connection failed: {e}, falling back to SQLite")
            engine = None
    
    # Fall back to SQLite
    if engine is None:
        engine = create_async_engine(SQLITE_URL, future=True, echo=False)
        logger.info(f"Using SQLite database at {SQLITE_PATH}")
    
    # Initialize session maker
    AsyncSessionLocal = sessionmaker(
        bind=engine,
        expire_on_commit=False,
        class_=AsyncSession,
    )
    # Store in module globals
    globals()['AsyncSessionLocal'] = AsyncSessionLocal


async def get_session():
    if AsyncSessionLocal is None:
        raise RuntimeError("Database not initialized. Call init_db() first.")
    async with AsyncSessionLocal() as session:
        yield session


async def init_db():
    await create_engine_with_fallback()
    if engine is None:
        raise RuntimeError("Failed to initialize database engine")
    
    # Create all tables
    from models import Base
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables created/verified")
