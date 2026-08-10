from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Literal
from datetime import datetime

class SchoolBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    address: Optional[str] = Field(None, max_length=255)
    contact_email: Optional[EmailStr] = None
    status: Literal["ACTIVE", "INACTIVE"] = "ACTIVE"

class SchoolCreate(SchoolBase):
    pass

class SchoolUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    address: Optional[str] = Field(None, max_length=255)
    contact_email: Optional[EmailStr] = None
    status: Optional[Literal["ACTIVE", "INACTIVE"]] = None

class SchoolResponse(SchoolBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class SchoolStatistics(BaseModel):
    school_admin_count: int
    teacher_count: int
    student_count: int
