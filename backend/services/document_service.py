import pdfplumber
from pathlib import Path
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from models import Document
from utils import sha256_hash_file
import logging

logger = logging.getLogger(__name__)


async def get_document_by_id(document_id: int, db: AsyncSession):
    result = await db.execute(select(Document).where(Document.id == document_id))
    return result.scalar_one_or_none()


async def save_upload_file(file, destination: Path):
    """Save uploaded file to disk (async)"""
    destination.parent.mkdir(parents=True, exist_ok=True)
    content = await _read_upload_file(file)
    with open(destination, "wb") as f:
        f.write(content)


async def _read_upload_file(file):
    """Helper to read uploaded file content"""
    return await file.read()


def extract_pdf_text(file_path: str) -> str:
    """Extract text from PDF"""
    try:
        with pdfplumber.open(file_path) as pdf:
            text = ""
            for page in pdf.pages:
                text += page.extract_text() or ""
            return text
    except Exception as e:
        logger.error(f"Failed to extract PDF text: {e}")
        return ""


async def save_document(filename: str, filepath: str, case_id: int | None, db: AsyncSession):
    """Save document metadata to database"""
    file_hash = sha256_hash_file(filepath)
    
    doc = Document(
        file_name=filename,
        file_path=filepath,
        case_id=case_id,
        sha256_hash=file_hash,
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)
    return doc
