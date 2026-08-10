from __future__ import annotations
from typing import Optional

from sqlalchemy import Column, String, DateTime, ForeignKey, UniqueConstraint, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime, timezone
import uuid
from app.db.base import Base

class Teacher(Base):
    __tablename__ = "teachers"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    teacher_id: Mapped[str] = mapped_column(String, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[str] = mapped_column(String, nullable=False)
    phone: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    status: Mapped[str] = mapped_column(String, default="ACTIVE")
    
    school_id: Mapped[str] = mapped_column(
        String, 
        ForeignKey("schools.id", ondelete="RESTRICT"), 
        nullable=False
    )
    
    user_id: Mapped[Optional[str]] = mapped_column(
        String, 
        ForeignKey("users.id", ondelete="SET NULL"), 
        nullable=True,
        unique=True
    )
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    school = relationship("School")
    user = relationship("User")

    __table_args__ = (
        UniqueConstraint("school_id", "teacher_id", name="uq_school_teacher_id"),
        Index("ix_teacher_school_id", "school_id"),
        Index("ix_teacher_teacher_id", "teacher_id"),
        Index("ix_teacher_user_id", "user_id"),
        Index("ix_teacher_email", "email"),
        Index("ix_teacher_status", "status"),
    )
