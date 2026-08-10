from __future__ import annotations
from typing import Optional

from sqlalchemy import Column, String, DateTime, ForeignKey, UniqueConstraint, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime, timezone
import uuid
from app.db.base import Base

class Class(Base):
    __tablename__ = "classes"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    grade: Mapped[str] = mapped_column(String, nullable=False)
    section: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    name: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    status: Mapped[str] = mapped_column(String, default="ACTIVE")
    
    school_id: Mapped[str] = mapped_column(
        String, 
        ForeignKey("schools.id", ondelete="RESTRICT"), 
        nullable=False
    )
    
    teacher_id: Mapped[Optional[str]] = mapped_column(
        String, 
        ForeignKey("teachers.id", ondelete="SET NULL"), 
        nullable=True
    )
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    school = relationship("School")
    teacher = relationship("Teacher")

    __table_args__ = (
        UniqueConstraint("school_id", "grade", "section", name="uq_school_grade_section"),
        Index("ix_class_school_id", "school_id"),
        Index("ix_class_grade", "grade"),
        Index("ix_class_section", "section"),
        Index("ix_class_teacher_id", "teacher_id"),
        Index("ix_class_status", "status"),
    )
