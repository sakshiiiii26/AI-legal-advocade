from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
import logging
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_session
from models import Case
from schemas import ChatRequest, ChatResponse
from .auth import get_current_user, get_current_user_optional

router = APIRouter(tags=["chat"])
logger = logging.getLogger(__name__)


@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest, db: AsyncSession = Depends(get_session), current_user=Depends(get_current_user_optional)):
    # Import services here to avoid circular imports
    from services import ai_service, rag_service
    
    case_context = None
    if request.case_id:
        result = await db.execute(select(Case).where(Case.id == request.case_id))
        case = result.scalar_one_or_none()
        if not case:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")
        case_context = {
            "title": case.title,
            "description": case.description,
            "summary": case.summary,
            "strategy": case.strategy,
            "risk_level": case.risk_level,
        }
    logger.debug("Chat request received. query=%s, case_id=%s", request.query, request.case_id)
    try:
        logger.debug("Calling RAG search for query=%s", request.query)
        similar_cases = await rag_service.search_similar_cases(request.query, k=5)
        logger.debug("RAG search returned %d results", len(similar_cases))
    except Exception as e:
        logger.exception("RAG search failed: %s", e)
        similar_cases = []

    try:
        logger.debug("Calling AI assistant for query=%s", request.query)
        answer = ai_service.chat_assistant(
            query=request.query,
            case_context=case_context,
            retrieved_cases=similar_cases,
        )
        logger.debug("AI assistant returned keys: %s", ",".join(answer.keys() if isinstance(answer, dict) else []))
    except Exception as e:
        logger.exception("AI assistant failed: %s", e)
        return ChatResponse(
            answer=f"AI service error: {e}",
            strategy=[],
            risks=[],
            references=similar_cases,
        )

    # Coerce strategy/risks into lists to satisfy response model
    raw_strategy = answer.get("strategy") if isinstance(answer, dict) else None
    raw_risks = answer.get("risks") if isinstance(answer, dict) else None
    def _to_list(x):
        if x is None:
            return []
        if isinstance(x, list):
            return x
        if isinstance(x, str):
            return [x]
        try:
            return list(x)
        except Exception:
            return [str(x)]

    strategy_list = _to_list(raw_strategy)
    risks_list = _to_list(raw_risks)

    try:
        return ChatResponse(
            answer=answer.get("answer", "") if isinstance(answer, dict) else str(answer),
            strategy=strategy_list,
            risks=risks_list,
            references=similar_cases,
        )
    except Exception as e:
        logger.exception("Failed to build ChatResponse: %s", e)
        # Return a safe JSON response to avoid 500 on serialization errors
        return JSONResponse(status_code=200, content={
            "answer": answer.get("answer", str(answer)) if isinstance(answer, dict) else str(answer),
            "strategy": strategy_list,
            "risks": risks_list,
            "references": similar_cases,
        })


@router.post("/chat_debug", response_model=ChatResponse)
async def chat_debug():
    return ChatResponse(answer="debug ok", strategy=[], risks=[], references=[])


@router.post("/chat_raw")
async def chat_raw(request: ChatRequest, db: AsyncSession = Depends(get_session)):
    # Raw debug endpoint: call services and return JSONResponse to avoid response_model validation
    from services import ai_service, rag_service
    case_context = None
    if request.case_id:
        result = await db.execute(select(Case).where(Case.id == request.case_id))
        case = result.scalar_one_or_none()
        if case:
            case_context = {
                "title": case.title,
                "description": case.description,
                "summary": case.summary,
                "strategy": case.strategy,
                "risk_level": case.risk_level,
            }

    try:
        similar_cases = await rag_service.search_similar_cases(request.query, k=5)
    except Exception as e:
        similar_cases = []

    try:
        answer = ai_service.chat_assistant(
            query=request.query,
            case_context=case_context,
            retrieved_cases=similar_cases,
        )
    except Exception as e:
        answer = {"answer": f"AI error: {e}", "strategy": [], "risks": [], "references": []}

    # Ensure types are JSON-serializable
    def safe_list(x):
        if x is None:
            return []
        if isinstance(x, list):
            return [str(i) for i in x]
        return [str(x)]

    content = {
        "answer": answer.get("answer", str(answer)) if isinstance(answer, dict) else str(answer),
        "strategy": safe_list(answer.get("strategy") if isinstance(answer, dict) else None),
        "risks": safe_list(answer.get("risks") if isinstance(answer, dict) else None),
        "references": similar_cases,
    }
    return JSONResponse(status_code=200, content=content)
