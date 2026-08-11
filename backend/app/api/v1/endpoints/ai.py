from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Any
from app.api.deps import get_db, get_current_user, require_roles
from app.models.user import User
from app.models.enums import Role
from app.schemas.ai import ConversationCreate, ConversationResponse, ConversationListResponse, MessageCreate, MessageResponse
from app.services.ai import AIService
from app.repositories.ai import AIRepository
from sqlalchemy import select
from app.models.student import Student

router = APIRouter()

async def get_current_student_info(db: AsyncSession, current_user: User) -> Student:
    """Helper to resolve the authenticated Student."""
    if current_user.role != Role.STUDENT:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    query = select(Student).where(Student.user_id == current_user.id)
    result = await db.execute(query)
    student = result.scalars().first()
    
    if not student:
        raise HTTPException(status_code=403, detail="Student profile not found")
        
    return student

@router.post("/conversations", response_model=ConversationResponse, dependencies=[Depends(require_roles([Role.STUDENT]))])
async def create_conversation(
    conv_in: ConversationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    student = await get_current_student_info(db, current_user)
    conversation = await AIService.create_conversation(db, student.id, student.school_id, conv_in.title)
    return conversation

@router.get("/conversations", response_model=ConversationListResponse, dependencies=[Depends(require_roles([Role.STUDENT]))])
async def get_conversations(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    student = await get_current_student_info(db, current_user)
    conversations, total = await AIRepository.get_student_conversations(db, student.id, student.school_id, skip, limit)
    return {"items": conversations, "total": total}

@router.get("/conversations/{id}", response_model=ConversationResponse, dependencies=[Depends(require_roles([Role.STUDENT]))])
async def get_conversation(
    id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    student = await get_current_student_info(db, current_user)
    conversation = await AIRepository.get_student_conversation(db, id, student.id, student.school_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conversation

@router.delete("/conversations/{id}", dependencies=[Depends(require_roles([Role.STUDENT]))])
async def delete_conversation(
    id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    student = await get_current_student_info(db, current_user)
    success = await AIRepository.delete_student_conversation(db, id, student.id, student.school_id)
    if not success:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return {"message": "Conversation deleted successfully"}

@router.post("/conversations/{id}/messages", response_model=ConversationResponse, dependencies=[Depends(require_roles([Role.STUDENT]))])
async def send_message(
    id: str,
    msg_in: MessageCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    student = await get_current_student_info(db, current_user)
    conversation, _ = await AIService.send_message(db, id, student.id, student.school_id, msg_in.content)
    return conversation

@router.post("/conversations/{id}/messages/stream", dependencies=[Depends(require_roles([Role.STUDENT]))])
async def stream_message(
    id: str,
    msg_in: MessageCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    student = await get_current_student_info(db, current_user)
    return StreamingResponse(
        AIService.stream_message(db, id, student.id, student.school_id, msg_in.content),
        media_type="text/event-stream"
    )
