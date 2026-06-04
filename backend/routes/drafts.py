from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_session
from schemas import DraftRequest, DraftResponse
from routes.auth import get_current_user

router = APIRouter(prefix="/drafts", tags=["drafts"])

@router.post("/generate", response_model=DraftResponse)
async def generate_draft(
    request: DraftRequest,
    db: AsyncSession = Depends(get_session),
    current_user=Depends(get_current_user),
):
    from services import ai_service
    import asyncio
    
    draft_content = await asyncio.to_thread(ai_service.generate_draft_new, request.dict())
    return DraftResponse(draft_text=draft_content)
