from __future__ import annotations
from typing import Optional

from sqlalchemy import Column, String, Boolean, Enum as SQLEnum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base
from app.models.enums import Role
import uuid

class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String, nullable=False)
    role: Mapped[Role] = mapped_column(SQLEnum(Role), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    
    # ForeignKey using RESTRICT, explicitly preventing silent deletion
    school_id: Mapped[Optional[str]] = mapped_column(
        String, 
        ForeignKey("schools.id", ondelete="RESTRICT"), 
        nullable=True
    )

    school = relationship("School", back_populates="users")
