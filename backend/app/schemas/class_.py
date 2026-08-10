from pydantic import BaseModel, Field
from typing import Optional, Literal, List
from datetime import datetime

class ClassBase(BaseModel):
    grade: str = Field(..., min_length=1, max_length=50)
    section: Optional[str] = Field(None, max_length=50)
    name: Optional[str] = Field(None, max_length=100)
    status: Literal["ACTIVE", "INACTIVE"] = "ACTIVE"
    teacher_id: Optional[str] = None

class ClassCreate(ClassBase):
    school_id: Optional[str] = Field(None, description="Explicit school target for Super Admin")

class ClassUpdate(BaseModel):
    grade: Optional[str] = Field(None, min_length=1, max_length=50)
    section: Optional[str] = Field(None, max_length=50)
    name: Optional[str] = Field(None, max_length=100)
    status: Optional[Literal["ACTIVE", "INACTIVE"]] = None
    teacher_id: Optional[str] = None
    # NOTE: school_id is deliberately omitted

class ClassResponse(ClassBase):
    id: str
    school_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class PaginatedClassResponse(BaseModel):
    items: List[ClassResponse]
    page: int
    page_size: int
    total: int
    total_pages: int
