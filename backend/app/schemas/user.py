from pydantic import BaseModel, EmailStr
from typing import Optional
from app.models.enums import Role

class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str
    role: Role
    school_id: Optional[str] = None

class UserResponse(UserBase):
    id: str
    role: Role
    is_active: bool
    school_id: Optional[str] = None

    class Config:
        from_attributes = True
