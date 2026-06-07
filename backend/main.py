import os
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Request
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from sqlalchemy import select, func
import database
from models import User as UserModel
from routes.auth import router as auth_router
from routes.chat import router as chat_router
from routes.cases import router as cases_router
from routes.documents import router as documents_router
from routes.clients import router as clients_router
from routes.tasks import router as tasks_router
from routes.analytics import router as analytics_router
from routes.drafts import router as drafts_router
from utils import get_password_hash
import logging
import sys

# enable debug logs to stdout for troubleshooting
logging.basicConfig(stream=sys.stdout, level=logging.DEBUG)

load_dotenv()
logger = logging.getLogger(__name__)

app = FastAPI(title="LexAI Backend", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=".*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(chat_router)
app.include_router(cases_router)
app.include_router(documents_router)
app.include_router(clients_router)
app.include_router(tasks_router)
app.include_router(analytics_router)
app.include_router(drafts_router)

# API key setup moved to ai_service with lazy loading


@app.on_event("startup")
async def startup_event():
    try:
        await database.init_db()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        raise
    
    try:
        async with database.AsyncSessionLocal() as session:
            existing_user_count = await session.scalar(select(func.count()).select_from(UserModel))
            if existing_user_count == 0:
                admin = UserModel(
                    username="admin",
                    email="admin@example.com",
                    hashed_password=get_password_hash("StrongPass123!"),
                    role="admin",
                )
                session.add(admin)
                await session.commit()
                logger.info("Created default admin user")
    except Exception as e:
        logger.exception("Failed to create default admin user")
        # Don't fail startup, just log the error
    
    try:
        from services import rag_service
        async with database.AsyncSessionLocal() as session:
            await rag_service.build_index(session)
            logger.info("RAG index built successfully")
    except Exception as e:
        logger.exception("Failed to build RAG index")
        # Don't fail startup, just log the error


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled exception for %s %s: %s", request.method, request.url, exc)
    return JSONResponse(status_code=500, content={"detail": "Internal server error", "error": str(exc)})


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 8000)))
