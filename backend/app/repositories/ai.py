from typing import List, Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from app.models.ai import Conversation, Message, MessageRole

class AIRepository:
    @staticmethod
    async def create_conversation(db: AsyncSession, student_id: str, school_id: str, title: Optional[str] = None) -> Conversation:
        conversation = Conversation(
            student_id=student_id,
            school_id=school_id,
            title=title
        )
        db.add(conversation)
        await db.commit()
        # Return conversation with messages eager loaded to prevent MissingGreenlet during serialization
        return await AIRepository.get_student_conversation(db, conversation.id, student_id, school_id)

    @staticmethod
    async def get_student_conversations(db: AsyncSession, student_id: str, school_id: str, skip: int = 0, limit: int = 100) -> Tuple[List[Conversation], int]:
        query = select(Conversation).options(
            selectinload(Conversation.messages)
        ).where(
            Conversation.student_id == student_id,
            Conversation.school_id == school_id
        ).order_by(Conversation.updated_at.desc())
        
        result = await db.execute(query.offset(skip).limit(limit))
        conversations = list(result.scalars().all())
        
        count_query = select(func.count()).select_from(Conversation).where(
            Conversation.student_id == student_id,
            Conversation.school_id == school_id
        )
        total_result = await db.execute(count_query)
        total = total_result.scalar() or 0
        
        return conversations, total

    @staticmethod
    async def get_student_conversation(db: AsyncSession, conversation_id: str, student_id: str, school_id: str) -> Optional[Conversation]:
        query = select(Conversation).options(
            selectinload(Conversation.messages)
        ).where(
            Conversation.id == conversation_id,
            Conversation.student_id == student_id,
            Conversation.school_id == school_id
        ).execution_options(populate_existing=True)
        result = await db.execute(query)
        conversation = result.scalars().first()
        if conversation and conversation.messages:
            conversation.messages = sorted(conversation.messages, key=lambda m: m.created_at)
        return conversation

    @staticmethod
    async def delete_student_conversation(db: AsyncSession, conversation_id: str, student_id: str, school_id: str) -> bool:
        conversation = await AIRepository.get_student_conversation(db, conversation_id, student_id, school_id)
        if not conversation:
            return False
        await db.delete(conversation)
        await db.commit()
        return True

    @staticmethod
    async def add_message(db: AsyncSession, conversation_id: str, role: MessageRole, content: str) -> Message:
        message = Message(
            conversation_id=conversation_id,
            role=role,
            content=content
        )
        db.add(message)
        await db.commit()
        await db.refresh(message)
        
        # Also update conversation updated_at
        conv_query = select(Conversation).where(Conversation.id == conversation_id)
        conv_result = await db.execute(conv_query)
        conv = conv_result.scalars().first()
        if conv:
            from datetime import datetime
            conv.updated_at = datetime.utcnow()
        return await AIRepository.get_student_conversation(db, conversation_id, conv.student_id, conv.school_id)

