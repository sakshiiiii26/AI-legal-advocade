from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field

class TokenData(BaseModel):
    username: Optional[str] = None

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    role: Optional[str] = "lawyer"

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr
    role: str
    created_at: datetime

    class Config:
        from_attributes = True

class ClientCreate(BaseModel):
    name: str
    email: EmailStr
    company: Optional[str] = None
    phone: Optional[str] = None
    notes: Optional[str] = None

class ClientResponse(ClientCreate):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class CaseCreate(BaseModel):
    title: str
    description: str
    status: Optional[str] = "Active"
    risk_level: Optional[str] = "Medium"
    outcome: Optional[str] = None
    strategy: Optional[str] = None
    summary: Optional[str] = None
    case_number: Optional[str] = None
    client_id: Optional[int] = None
    owner_id: Optional[int] = None

class CaseResponse(CaseCreate):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    status: Optional[str] = "Open"
    priority: Optional[str] = "Medium"
    case_id: Optional[int] = None
    assigned_to: Optional[int] = None

class TaskResponse(TaskCreate):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class NoteCreate(BaseModel):
    text: str

class NoteResponse(NoteCreate):
    id: int
    case_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class StatusUpdate(BaseModel):
    status: str

class ChatRequest(BaseModel):
    query: str = Field(..., alias="message")
    case_id: Optional[int] = None
    
    class Config:
        populate_by_name = True


class ChatResponse(BaseModel):
    answer: str
    strategy: Optional[List[str]] = None
    risks: Optional[List[str]] = None
    references: Optional[List[dict]] = None

class AnalyzeCaseRequest(BaseModel):
    title: str
    description: str
    case_id: Optional[int] = None

class AnalyzeCaseResponse(BaseModel):
    summary: str
    similar_cases: List[dict]
    strategies: str
    risk_analysis: str
    predicted_outcome: str

class DraftRequest(BaseModel):
    type: str
    tone: Optional[str] = "Formal"
    recipient: Optional[str] = None
    sender: Optional[str] = None
    demands: Optional[List[str]] = None
    court: Optional[str] = None
    petitioner: Optional[str] = None
    respondent: Optional[str] = None
    relief_sought: Optional[str] = None
    original_notice_summary: Optional[str] = None
    response_points: Optional[List[str]] = None
    facts: Optional[List[str]] = None
    case_details: Optional[str] = None

class DraftResponse(BaseModel):
    draft_text: str

class DocumentSummaryResponse(BaseModel):
    summary: str
    key_clauses: str
    risk_points: str

class AnalyticsResponse(BaseModel):
    total_cases: int
    open_cases: int
    high_risk_cases: int
    closed_cases: int
    success_rate: float
    avg_duration_days: int
    cases_by_status: dict
    cases_by_outcome: dict
    cases_over_time: List[dict]
    recent_documents: List[dict]

class VerifyResponse(BaseModel):
    verified: bool
    message: str
