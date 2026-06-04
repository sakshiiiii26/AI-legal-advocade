from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_session
from models import Case, Task, Document
from .auth import get_current_user
from datetime import datetime

router = APIRouter(prefix="/analytics", tags=["analytics"])

@router.get("")
async def analytics_overview(db: AsyncSession = Depends(get_session), current_user=Depends(get_current_user)):
    cases = await db.execute(select(Case))
    all_cases = cases.scalars().all()
    
    total_cases = len(all_cases)
    open_cases = sum(1 for c in all_cases if c.status == "Active")
    high_risk_cases = sum(1 for c in all_cases if c.risk_level == "High")
    closed_cases = sum(1 for c in all_cases if c.status == "Closed")
    
    closed_cases_list = [c for c in all_cases if c.status == "Closed"]
    success_count = sum(1 for c in closed_cases_list if c.outcome in ("Won", "Settled"))
    success_rate = (success_count / len(closed_cases_list) * 100) if closed_cases_list else 0.0
    
    duration_days = []
    for c in closed_cases_list:
        if c.updated_at and c.created_at:
            duration_days.append((c.updated_at - c.created_at).days)
    avg_duration_days = int(sum(duration_days) / len(duration_days)) if duration_days else 0
    
    cases_by_status = {}
    for c in all_cases:
        cases_by_status[c.status] = cases_by_status.get(c.status, 0) + 1
        
    cases_by_outcome = {}
    for c in all_cases:
        out = c.outcome or "Ongoing"
        cases_by_outcome[out] = cases_by_outcome.get(out, 0) + 1
        
    cases_over_time = []
    now = datetime.utcnow()
    for i in range(5, -1, -1):
        m = now.month - i
        y = now.year
        while m <= 0:
            m += 12
            y -= 1
        month_str = datetime(y, m, 1).strftime("%b %Y")
        count = sum(1 for c in all_cases if c.created_at.year == y and c.created_at.month == m)
        cases_over_time.append({"month": month_str, "count": count})
        
    recent_docs_query = await db.execute(
        select(Document, Case.title)
        .outerjoin(Case, Document.case_id == Case.id)
        .order_by(Document.uploaded_at.desc())
        .limit(5)
    )
    recent_docs = recent_docs_query.all()
    
    documents = [
        {
            "id": row[0].id, 
            "filename": row[0].file_name, 
            "case_title": row[1] if row[1] else "Unknown", 
            "uploaded_at": row[0].uploaded_at.isoformat() if row[0].uploaded_at else ""
        }
        for row in recent_docs
    ]

    return {
        "total_cases": total_cases,
        "open_cases": open_cases,
        "high_risk_cases": high_risk_cases,
        "closed_cases": closed_cases,
        "success_rate": round(success_rate, 1),
        "avg_duration_days": avg_duration_days,
        "cases_by_status": cases_by_status,
        "cases_by_outcome": cases_by_outcome,
        "cases_over_time": cases_over_time,
        "recent_documents": documents,
    }

@router.get("/activity")
async def get_recent_activity(db: AsyncSession = Depends(get_session), current_user=Depends(get_current_user)):
    from models import Case, Document, Task
    
    cases = await db.execute(select(Case).order_by(Case.created_at.desc()).limit(10))
    docs = await db.execute(select(Document, Case.title).outerjoin(Case, Document.case_id == Case.id).order_by(Document.uploaded_at.desc()).limit(10))
    tasks = await db.execute(select(Task).order_by(Task.created_at.desc()).limit(10))
    
    activities = []
    for c in cases.scalars().all():
        activities.append({
            "id": f"case_{c.id}",
            "type": "case",
            "title": "Case Opened",
            "description": f'Case "{c.title}" was opened',
            "time": c.created_at.isoformat() if c.created_at else ""
        })
        
    for row in docs.all():
        d = row[0]
        case_title = row[1] or "Unknown Case"
        activities.append({
            "id": f"doc_{d.id}",
            "type": "document",
            "title": "Document uploaded",
            "description": f'{d.file_name} added to "{case_title}"',
            "time": d.uploaded_at.isoformat() if d.uploaded_at else ""
        })
        
    for t in tasks.scalars().all():
        activities.append({
            "id": f"task_{t.id}",
            "type": "task",
            "title": "Task added",
            "description": f'"{t.title}" was added',
            "time": t.created_at.isoformat() if t.created_at else ""
        })
        
    activities.sort(key=lambda x: x["time"], reverse=True)
    return activities[:10]
