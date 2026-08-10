from __future__ import annotations
from typing import Optional

from sqlalchemy import Column, String, Date, DateTime, ForeignKey, UniqueConstraint, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime, timezone, date
import uuid
from app.db.base import Base

class Attendance(Base):
    __tablename__ = "attendance"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    
    student_id: Mapped[str] = mapped_column(
        String, 
        ForeignKey("students.id", ondelete="RESTRICT"), 
        nullable=False
    )
    
    school_id: Mapped[str] = mapped_column(
        String, 
        ForeignKey("schools.id", ondelete="RESTRICT"), 
        nullable=False
    )
    
    attendance_date: Mapped[date] = mapped_column(Date, nullable=False)
    
    status: Mapped[str] = mapped_column(String, nullable=False)
    
    marked_by: Mapped[str] = mapped_column(
        String, 
        ForeignKey("users.id", ondelete="RESTRICT"), 
        nullable=False
    )
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    student = relationship("Student")
    school = relationship("School")
    marker = relationship("User")

    __table_args__ = (
        UniqueConstraint("student_id", "attendance_date", name="uq_student_attendance_date"),
        Index("ix_attendance_school_id", "school_id"),
        Index("ix_attendance_student_id", "student_id"),
        Index("ix_attendance_date", "attendance_date"),
        Index("ix_attendance_status", "status"),
        Index("ix_attendance_marked_by", "marked_by"),
        Index("ix_attendance_school_date", "school_id", "attendance_date"),
    )
