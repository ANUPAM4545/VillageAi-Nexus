from pydantic import BaseModel, Field, constr
from datetime import datetime
from typing import List, Optional
from app.models.ai import MessageRole

class MessageCreate(BaseModel):
    content: constr(strip_whitespace=True, min_length=1, max_length=2000) # type: ignore

class MessageResponse(BaseModel):
    id: str
    role: MessageRole
    content: str
    created_at: datetime

    class Config:
        from_attributes = True

class ConversationCreate(BaseModel):
    title: Optional[str] = None

class ConversationResponse(BaseModel):
    id: str
    student_id: str
    school_id: str
    title: Optional[str]
    created_at: datetime
    updated_at: datetime
    messages: Optional[List[MessageResponse]] = []

    class Config:
        from_attributes = True

class ConversationListResponse(BaseModel):
    items: List[ConversationResponse]
    total: int
