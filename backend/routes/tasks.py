from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_session
from models import Task
from schemas import TaskCreate, TaskResponse
from .auth import get_current_user

router = APIRouter(prefix="/tasks", tags=["tasks"])

@router.get("", response_model=list[TaskResponse])
async def list_tasks(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    case_id: Optional[int] = None,
    db: AsyncSession = Depends(get_session), 
    current_user=Depends(get_current_user)
):
    query = select(Task)
    if status:
        query = query.where(Task.status == status)
    if priority:
        query = query.where(Task.priority == priority)
    if case_id:
        query = query.where(Task.case_id == case_id)
        
    result = await db.execute(query.order_by(Task.due_date.asc().nulls_last()))
    return result.scalars().all()

@router.post("", response_model=TaskResponse)
async def create_task(payload: TaskCreate, db: AsyncSession = Depends(get_session), current_user=Depends(get_current_user)):
    task = Task(**payload.dict())
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return task

@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(task_id: int, db: AsyncSession = Depends(get_session), current_user=Depends(get_current_user)):
    result = await db.execute(select(Task).where(Task.id == task_id))
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return task

@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(task_id: int, payload: TaskCreate, db: AsyncSession = Depends(get_session), current_user=Depends(get_current_user)):
    result = await db.execute(select(Task).where(Task.id == task_id))
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    for key, value in payload.dict(exclude_unset=True).items():
        setattr(task, key, value)
    await db.commit()
    await db.refresh(task)
    return task

@router.delete("/{task_id}")
async def delete_task(task_id: int, db: AsyncSession = Depends(get_session), current_user=Depends(get_current_user)):
    result = await db.execute(select(Task).where(Task.id == task_id))
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    await db.delete(task)
    await db.commit()
    return {"status": "success", "message": "Task deleted"}
