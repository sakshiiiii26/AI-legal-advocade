import asyncio
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_session
from models import Case, Document, Task, Note
from schemas import CaseCreate, CaseResponse, AnalyzeCaseRequest, NoteCreate, NoteResponse, StatusUpdate
from .auth import get_current_user
import json

router = APIRouter(prefix="/cases", tags=["cases"])

@router.get("", response_model=list[CaseResponse])
async def list_cases(
    search: Optional[str] = None,
    status: Optional[str] = None,
    risk: Optional[str] = None,
    db: AsyncSession = Depends(get_session), 
    current_user=Depends(get_current_user)
):
    query = select(Case)
    if search:
        query = query.where(Case.title.ilike(f"%{search}%") | Case.description.ilike(f"%{search}%"))
    if status:
        query = query.where(Case.status == status)
    if risk:
        query = query.where(Case.risk_level == risk)
        
    result = await db.execute(query.order_by(Case.created_at.desc()))
    return result.scalars().all()

@router.post("", response_model=CaseResponse)
async def create_case(payload: CaseCreate, db: AsyncSession = Depends(get_session), current_user=Depends(get_current_user)):
    from services import rag_service
    
    case = Case(**payload.dict())
    db.add(case)
    await db.commit()
    await db.refresh(case)
    try:
        import asyncio, database
        async def _background_analyze(case_id: int, title: str, description: str):
            from services import ai_service, rag_service
            async with database.AsyncSessionLocal() as session:
                similar_cases = await rag_service.search_similar_cases(description, k=5)
                try:
                    analysis = await asyncio.to_thread(ai_service.analyze_case, title, description, similar_cases)
                except Exception:
                    analysis = None
                if isinstance(analysis, dict):
                    result = await session.execute(select(Case).where(Case.id == case_id))
                    c = result.scalar_one_or_none()
                    if c:
                        c.summary = analysis.get("summary")
                        strategies = analysis.get("strategies")
                        if strategies:
                            if isinstance(strategies, list):
                                c.strategy = json.dumps(strategies)
                            else:
                                c.strategy = json.dumps([{"name": "General Strategy", "description": str(strategies), "pros": [], "cons": []}])
                        session.add(c)
                        try:
                            await session.commit()
                        except Exception:
                            await session.rollback()
                        await rag_service.index_case(c.id, c.title, c.description, c.summary)
        asyncio.create_task(_background_analyze(case.id, case.title, case.description))
    except Exception:
        pass
    await rag_service.index_case(case.id, case.title, case.description, case.summary)
    return case

@router.get("/{case_id}", response_model=CaseResponse)
async def get_case(case_id: int, db: AsyncSession = Depends(get_session), current_user=Depends(get_current_user)):
    result = await db.execute(select(Case).where(Case.id == case_id))
    case = result.scalar_one_or_none()
    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")
    return case

@router.put("/{case_id}", response_model=CaseResponse)
async def update_case(case_id: int, payload: CaseCreate, db: AsyncSession = Depends(get_session), current_user=Depends(get_current_user)):
    from services import rag_service
    result = await db.execute(select(Case).where(Case.id == case_id))
    case = result.scalar_one_or_none()
    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")
    for key, value in payload.dict(exclude_unset=True).items():
        setattr(case, key, value)
    case.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(case)
    await rag_service.index_case(case.id, case.title, case.description, case.summary)
    return case

@router.get("/{case_id}/similar")
async def get_similar_cases(case_id: int, db: AsyncSession = Depends(get_session), current_user=Depends(get_current_user)):
    from services import rag_service
    result = await db.execute(select(Case).where(Case.id == case_id))
    case = result.scalar_one_or_none()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    similar_cases = await rag_service.search_similar_cases(case.description, k=6)
    similar_cases = [c for c in similar_cases if c.get("case_id") != case_id][:5]
    return similar_cases

@router.get("/{case_id}/strategy")
async def get_case_strategy(case_id: int, db: AsyncSession = Depends(get_session), current_user=Depends(get_current_user)):
    from services import ai_service
    result = await db.execute(select(Case).where(Case.id == case_id))
    case = result.scalar_one_or_none()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    if case.strategy and case.strategy != "None":
        try:
            strategies = json.loads(case.strategy)
            if isinstance(strategies, list):
                return strategies
        except:
            pass
            
    prompt = f"Case: {case.title}\nDescription: {case.description}\n\nGenerate 3 legal strategies. Return a JSON object with a single key 'strategies' which is an array of objects, where each object has keys: name (string), description (string), pros (array of strings), cons (array of strings)."
    system = "You are an expert Indian legal assistant. Return valid JSON only, starting with { and ending with }."
    
    def _call_llm():
        try:
            content = ai_service._chat_completion([
                {"role": "system", "content": system},
                {"role": "user", "content": prompt}
            ])
            parsed = ai_service._extract_json(content)
            if parsed and "strategies" in parsed:
                return parsed["strategies"]
            return None
        except:
            return None

    strategies_json = await asyncio.to_thread(_call_llm)
    
    if strategies_json and isinstance(strategies_json, list):
        case.strategy = json.dumps(strategies_json)
        await db.commit()
        return strategies_json
    else:
        return [{"name": "Error", "description": "Failed to generate strategies", "pros": [], "cons": []}]

@router.get("/{case_id}/timeline")
async def get_case_timeline(case_id: int, db: AsyncSession = Depends(get_session), current_user=Depends(get_current_user)):
    result = await db.execute(select(Case).where(Case.id == case_id))
    case = result.scalar_one_or_none()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
        
    events = []
    events.append({"type": "created", "date": case.created_at.isoformat(), "description": "Case created"})
    if case.updated_at and str(case.updated_at) != str(case.created_at):
        events.append({"type": "updated", "date": case.updated_at.isoformat(), "description": "Case updated"})
    
    docs_query = await db.execute(select(Document).where(Document.case_id == case_id))
    for doc in docs_query.scalars().all():
        events.append({"type": "document", "date": doc.uploaded_at.isoformat(), "description": f"Uploaded document: {doc.file_name}"})
        
    tasks_query = await db.execute(select(Task).where(Task.case_id == case_id))
    for task in tasks_query.scalars().all():
        events.append({"type": "task", "date": task.created_at.isoformat(), "description": f"Task added: {task.title}"})

    notes_query = await db.execute(select(Note).where(Note.case_id == case_id))
    for note in notes_query.scalars().all():
        events.append({"type": "note", "date": note.created_at.isoformat(), "description": f"Note added: {note.text[:30]}..."})
        
    events.sort(key=lambda x: x["date"], reverse=True)
    return events

@router.post("/{case_id}/notes", response_model=NoteResponse)
async def add_case_note(case_id: int, payload: NoteCreate, db: AsyncSession = Depends(get_session), current_user=Depends(get_current_user)):
    result = await db.execute(select(Case).where(Case.id == case_id))
    case = result.scalar_one_or_none()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    note = Note(case_id=case_id, text=payload.text)
    db.add(note)
    case.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(note)
    return note

@router.put("/{case_id}/status", response_model=CaseResponse)
async def update_case_status(case_id: int, payload: StatusUpdate, db: AsyncSession = Depends(get_session), current_user=Depends(get_current_user)):
    result = await db.execute(select(Case).where(Case.id == case_id))
    case = result.scalar_one_or_none()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    case.status = payload.status
    case.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(case)
    return case

@router.post("/analyze")
async def analyze_case(payload: AnalyzeCaseRequest, db: AsyncSession = Depends(get_session), current_user=Depends(get_current_user)):
    from services import rag_service, ai_service
    similar_cases = await rag_service.search_similar_cases(payload.description, k=5)
    analysis = await asyncio.to_thread(ai_service.analyze_case, payload.title, payload.description, similar_cases)
    return {
        "summary": analysis.get("summary") if isinstance(analysis, dict) else "",
        "similar_cases": similar_cases,
        "strategies": analysis.get("strategies") if isinstance(analysis, dict) else "",
        "risk_analysis": analysis.get("risk_analysis") if isinstance(analysis, dict) else "",
        "predicted_outcome": analysis.get("predicted_outcome") if isinstance(analysis, dict) else "",
    }
