from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
import database
Base = database.Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(128), unique=True, index=True, nullable=False)
    email = Column(String(256), unique=True, nullable=False)
    hashed_password = Column(String(256), nullable=False)
    role = Column(String(64), default="lawyer", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    cases = relationship("Case", back_populates="owner")
    tasks = relationship("Task", back_populates="assignee")

class Client(Base):
    __tablename__ = "clients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(256), nullable=False)
    email = Column(String(256), nullable=False)
    company = Column(String(256), nullable=True)
    phone = Column(String(64), nullable=True)
    notes = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    cases = relationship("Case", back_populates="client")

class Case(Base):
    __tablename__ = "cases"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(512), nullable=False)
    description = Column(Text, nullable=False)
    status = Column(String(64), default="Active", nullable=False)
    risk_level = Column(String(64), default="Medium", nullable=False)
    outcome = Column(String(256), nullable=True)
    strategy = Column(Text, nullable=True)
    summary = Column(Text, nullable=True)
    case_number = Column(String(128), unique=True, nullable=True)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    client = relationship("Client", back_populates="cases")
    owner = relationship("User", back_populates="cases")
    documents = relationship("Document", back_populates="case")
    tasks = relationship("Task", back_populates="case")

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=True)
    file_name = Column(String(512), nullable=False)
    file_path = Column(String(1024), nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    sha256_hash = Column(String(128), nullable=False)
    summary = Column(Text, nullable=True)
    key_clauses = Column(Text, nullable=True)
    risk_points = Column(Text, nullable=True)

    case = relationship("Case", back_populates="documents")

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(512), nullable=False)
    description = Column(Text, nullable=True)
    due_date = Column(DateTime, nullable=True)
    status = Column(String(64), default="Open", nullable=False)
    priority = Column(String(64), default="Medium", nullable=False)
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=True)
    assigned_to = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    case = relationship("Case", back_populates="tasks")
    assignee = relationship("User", back_populates="tasks")

class Note(Base):
    __tablename__ = "notes"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=False)
    text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    case = relationship("Case", backref="notes")
