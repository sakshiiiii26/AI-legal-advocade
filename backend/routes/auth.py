from datetime import timedelta
import os
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from database import get_session
from models import User
from schemas import UserCreate, UserLogin, UserResponse
from utils import get_password_hash, verify_password, create_access_token, decode_access_token

router = APIRouter(prefix="/auth", tags=["auth"])
security = HTTPBearer(auto_error=False)

# Demo mode: if set to "1", allows unauthenticated access for testing
DEMO_MODE = os.getenv("DEMO_MODE", "0") == "1"


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: AsyncSession = Depends(get_session)):
    # Demo mode: allow requests without a valid token by returning/creating an admin user
    if DEMO_MODE:
        result = await db.execute(select(User).where(User.username == "admin"))
        user = result.scalar_one_or_none()
        if user:
            return user
        admin = User(
            username="admin",
            email="admin@example.com",
            hashed_password=get_password_hash("password"),
            role="admin",
        )
        db.add(admin)
        try:
            await db.commit()
            await db.refresh(admin)
        except:
            await db.rollback()
        return admin

    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication credentials")

    token = credentials.credentials
    try:
        payload = decode_access_token(token)
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication credentials")
    username = payload.get("sub")
    if not username:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
    result = await db.execute(select(User).where(User.username == username))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


async def get_current_user_optional(credentials: HTTPAuthorizationCredentials = Depends(security), db: AsyncSession = Depends(get_session)):
    """Optional auth - accepts token but doesn't require it. Returns user if valid token provided.
    In demo mode, creates/returns a test user when no token present.
    """
    # Demo mode: return or create admin user when no credentials provided
    if DEMO_MODE and not credentials:
        result = await db.execute(select(User).where(User.username == "admin"))
        user = result.scalar_one_or_none()
        if user:
            return user
        admin = User(
            username="admin",
            email="admin@example.com",
            hashed_password=get_password_hash("password"),
            role="admin",
        )
        db.add(admin)
        try:
            await db.commit()
            await db.refresh(admin)
        except:
            await db.rollback()
        return admin

    # If no credentials provided, return None (optional auth)
    if not credentials:
        return None

    # If credentials provided, validate token and return user (or raise)
    token = credentials.credentials
    try:
        payload = decode_access_token(token)
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication credentials")
    username = payload.get("sub")
    if not username:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
    result = await db.execute(select(User).where(User.username == username))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


@router.post("/register", response_model=UserResponse)
async def register_user(payload: UserCreate, db: AsyncSession = Depends(get_session)):
    existing = await db.execute(select(User).where((User.username == payload.username) | (User.email == payload.email)))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username or email already exists")
    user = User(
        username=payload.username,
        email=payload.email,
        hashed_password=get_password_hash(payload.password),
        role=payload.role,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@router.post("/login")
async def login(payload: UserLogin, db: AsyncSession = Depends(get_session)):
    result = await db.execute(select(User).where(User.username == payload.username))
    user = result.scalar_one_or_none()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username or password")
    access_token = create_access_token({"sub": user.username}, expires_delta=timedelta(hours=12))
    return {"access_token": access_token, "token_type": "bearer", "user": UserResponse.from_orm(user)}

from pydantic import BaseModel

class UserUpdate(BaseModel):
    username: str
    email: str

class PasswordUpdate(BaseModel):
    current_password: str
    new_password: str

@router.get("/me", response_model=UserResponse)
async def get_me(current_user=Depends(get_current_user)):
    return current_user

@router.put("/me", response_model=UserResponse)
async def update_me(payload: UserUpdate, db: AsyncSession = Depends(get_session), current_user=Depends(get_current_user)):
    if payload.username != current_user.username or payload.email != current_user.email:
        existing = await db.execute(select(User).where(((User.username == payload.username) | (User.email == payload.email)) & (User.id != current_user.id)))
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Username or email already in use")
    
    current_user.username = payload.username
    current_user.email = payload.email
    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)
    return current_user

@router.put("/me/password")
async def update_password(payload: PasswordUpdate, db: AsyncSession = Depends(get_session), current_user=Depends(get_current_user)):
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect current password")
    
    current_user.hashed_password = get_password_hash(payload.new_password)
    db.add(current_user)
    await db.commit()
    return {"status": "success", "message": "Password updated"}

@router.post("/refresh")
async def refresh_token(current_user=Depends(get_current_user)):
    access_token = create_access_token({"sub": current_user.username}, expires_delta=timedelta(hours=12))
    return {"access_token": access_token, "token_type": "bearer", "user": UserResponse.from_orm(current_user)}
