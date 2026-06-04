from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form
from pydantic import BaseModel
from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from pathlib import Path
from database import get_session
from models import Document, Case
from schemas import DocumentSummaryResponse, VerifyResponse
from .auth import get_current_user


class SummarizeRequest(BaseModel):
    document_id: int

router = APIRouter(prefix="/documents", tags=["documents"])
UPLOAD_DIR = Path(__file__).resolve().parent.parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    case_id: Optional[int] = Form(None),
    db: AsyncSession = Depends(get_session),
    current_user=Depends(get_current_user),
):
    from services import document_service
    
    # If a case_id was provided, validate it. Otherwise allow uploads without case association.
    if case_id is not None:
        result = await db.execute(select(Case).where(Case.id == case_id))
        if result.scalar_one_or_none() is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")
    from uuid import uuid4
    destination = UPLOAD_DIR / f"{case_id}_{uuid4().hex}_{file.filename}"
    await document_service.save_upload_file(file, destination)
    document = await document_service.save_document(file.filename, str(destination), case_id, db)
    return {
        "id": document.id,
        "file_name": document.file_name,
        "sha256_hash": document.sha256_hash,
        "uploaded_at": document.uploaded_at,
    }


@router.post("/summarize", response_model=DocumentSummaryResponse)
async def summarize_document(body: SummarizeRequest, db: AsyncSession = Depends(get_session), current_user=Depends(get_current_user)):
    document_id = body.document_id
    from services import document_service, ai_service
    
    document = await document_service.get_document_by_id(document_id, db)
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    text = document_service.extract_pdf_text(document.file_path)
    summary_data = ai_service.summarize_document(text)
    document.summary = summary_data.get("summary")
    document.key_clauses = summary_data.get("key_clauses")
    document.risk_points = summary_data.get("risk_points")
    db.add(document)
    await db.commit()
    await db.refresh(document)
    return summary_data


@router.post("/verify", response_model=VerifyResponse)
async def verify_document(document_id: int, file: UploadFile = File(...), db: AsyncSession = Depends(get_session), current_user=Depends(get_current_user)):
    from services import document_service, blockchain_service
    
    document = await document_service.get_document_by_id(document_id, db)
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    temp_path = UPLOAD_DIR / f"verify_{document_id}_{file.filename}"
    await document_service.save_upload_file(file, temp_path)
    file_hash = blockchain_service.sha256_hash_file(str(temp_path))
    verified = blockchain_service.verify_hash(document.sha256_hash, file_hash)
    if temp_path.exists():
        temp_path.unlink()
    return {
        "verified": verified,
        "message": "Verified document hash matches stored record." if verified else "Document hash does not match stored record.",
    }

@router.get("")
async def get_documents(case_id: Optional[int] = None, db: AsyncSession = Depends(get_session), current_user=Depends(get_current_user)):
    import os
    query = select(Document)
    if case_id:
        query = query.where(Document.case_id == case_id)
    result = await db.execute(query.order_by(Document.uploaded_at.desc()))
    docs = result.scalars().all()
    out = []
    for d in docs:
        size = 0
        if os.path.exists(d.file_path):
            size = os.path.getsize(d.file_path)
        out.append({
            "id": d.id,
            "filename": d.file_name,
            "size_bytes": size,
            "upload_date": d.uploaded_at.isoformat() if d.uploaded_at else None,
            "case_id": d.case_id,
            "sha256_hash": d.sha256_hash
        })
    return out

@router.delete("/{document_id}")
async def delete_document(document_id: int, db: AsyncSession = Depends(get_session), current_user=Depends(get_current_user)):
    import os
    result = await db.execute(select(Document).where(Document.id == document_id))
    document = result.scalar_one_or_none()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    if os.path.exists(document.file_path):
        os.remove(document.file_path)
    await db.delete(document)
    await db.commit()
    return {"status": "success", "message": "Document deleted"}

@router.get("/{document_id}/download")
async def download_document(document_id: int, db: AsyncSession = Depends(get_session), current_user=Depends(get_current_user)):
    import os
    from fastapi.responses import FileResponse
    result = await db.execute(select(Document).where(Document.id == document_id))
    document = result.scalar_one_or_none()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    if not os.path.exists(document.file_path):
        raise HTTPException(status_code=404, detail="File missing on disk")
    return FileResponse(path=document.file_path, filename=document.file_name)
