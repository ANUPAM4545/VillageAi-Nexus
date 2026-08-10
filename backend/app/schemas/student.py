from pydantic import BaseModel, Field
from typing import Optional, Literal, List
from datetime import datetime

class StudentBase(BaseModel):
    student_id: str = Field(..., min_length=1, max_length=50)
    name: str = Field(..., min_length=1, max_length=100)
    grade: str = Field(..., min_length=1, max_length=50)
    section: Optional[str] = Field(None, max_length=50)
    parent_name: Optional[str] = Field(None, max_length=100)
    parent_phone: Optional[str] = Field(None, max_length=50)
    status: Literal["ACTIVE", "INACTIVE"] = "ACTIVE"

class StudentCreate(StudentBase):
    school_id: Optional[str] = Field(None, description="Explicit school target for Super Admin")
    user_id: Optional[str] = Field(None, description="Optional link to authentication user")

class StudentUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    grade: Optional[str] = Field(None, min_length=1, max_length=50)
    section: Optional[str] = Field(None, max_length=50)
    parent_name: Optional[str] = Field(None, max_length=100)
    parent_phone: Optional[str] = Field(None, max_length=50)
    status: Optional[Literal["ACTIVE", "INACTIVE"]] = None
    # NOTE: school_id and user_id are deliberately omitted to prevent unauthorized updates via PATCH

class StudentResponse(StudentBase):
    id: str
    school_id: str
    user_id: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class PaginatedStudentResponse(BaseModel):
    items: List[StudentResponse]
    page: int
    page_size: int
    total: int
    total_pages: int
