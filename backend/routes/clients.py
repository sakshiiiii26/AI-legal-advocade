from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_session
from models import Client
from schemas import ClientCreate, ClientResponse
from .auth import get_current_user

router = APIRouter(prefix="/clients", tags=["clients"])


@router.get("", response_model=list[ClientResponse])
async def list_clients(db: AsyncSession = Depends(get_session), current_user=Depends(get_current_user)):
    result = await db.execute(select(Client).where(Client.is_active == True).order_by(Client.created_at.desc()))
    return result.scalars().all()


@router.post("", response_model=ClientResponse)
async def create_client(payload: ClientCreate, db: AsyncSession = Depends(get_session), current_user=Depends(get_current_user)):
    client = Client(**payload.dict())
    db.add(client)
    await db.commit()
    await db.refresh(client)
    return client


@router.get("/{client_id}", response_model=ClientResponse)
async def get_client(client_id: int, db: AsyncSession = Depends(get_session), current_user=Depends(get_current_user)):
    result = await db.execute(select(Client).where(Client.id == client_id))
    client = result.scalar_one_or_none()
    if not client:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")
    return client


@router.put("/{client_id}", response_model=ClientResponse)
async def update_client(client_id: int, payload: ClientCreate, db: AsyncSession = Depends(get_session), current_user=Depends(get_current_user)):
    result = await db.execute(select(Client).where(Client.id == client_id))
    client = result.scalar_one_or_none()
    if not client:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")
    for key, value in payload.dict(exclude_unset=True).items():
        setattr(client, key, value)
    await db.commit()
    await db.refresh(client)
    return client

@router.delete("/{client_id}")
async def delete_client(client_id: int, hard: bool = False, db: AsyncSession = Depends(get_session), current_user=Depends(get_current_user)):
    result = await db.execute(select(Client).where(Client.id == client_id))
    client = result.scalar_one_or_none()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
        
    if hard:
        await db.delete(client)
        message = "Client permanently deleted"
    else:
        client.is_active = False
        message = "Client soft deleted"
        
    await db.commit()
    return {"status": "success", "message": message}
