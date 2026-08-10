from __future__ import annotations
from typing import Optional

from sqlalchemy import Column, String, DateTime, ForeignKey, UniqueConstraint, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime, timezone
import uuid
from app.db.base import Base

class Student(Base):
    __tablename__ = "students"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    student_id: Mapped[str] = mapped_column(String, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    grade: Mapped[str] = mapped_column(String, nullable=False)
    section: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    parent_name: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    parent_phone: Mapped[Optional[str]] = mapped_column(String, nullable=True)
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
        unique=True # Enforce 1-to-1 relationship per instruction
    )
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    school = relationship("School")
    user = relationship("User")

    __table_args__ = (
        UniqueConstraint("school_id", "student_id", name="uq_school_student_id"),
        Index("ix_student_school_id", "school_id"),
        Index("ix_student_student_id", "student_id"),
        Index("ix_student_user_id", "user_id"),
        Index("ix_student_grade", "grade"),
        Index("ix_student_section", "section"),
        Index("ix_student_status", "status"),
    )
