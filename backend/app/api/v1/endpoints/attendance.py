from typing import Any, List, Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.models.user import User
from app.models.enums import Role
from app.repositories.attendance import AttendanceRepository
from app.repositories.student import StudentRepository
from app.schemas.attendance import (
    AttendanceWithStudentResponse,
    AttendanceSummaryResponse,
    StudentAttendanceSummaryResponse,
)

router = APIRouter()

@router.get("", response_model=dict)
async def get_attendance_history(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    student_id: Optional[str] = None,
    class_grade: Optional[str] = None,
    class_section: Optional[str] = None,
    status: Optional[str] = None,
    authorized_school_id: str = Depends(deps.get_current_school),
) -> Any:
    """
    Get paginated attendance history.
    """
    if current_user.role == Role.STUDENT:
        raise HTTPException(status_code=403, detail="Students cannot access global attendance history")

    repo = AttendanceRepository(db)
    items, total, total_pages = await repo.get_attendance_history(
        school_id=authorized_school_id,
        page=page,
        page_size=page_size,
        start_date=start_date,
        end_date=end_date,
        student_id=student_id,
        class_grade=class_grade,
        class_section=class_section,
        status=status
    )
    
    return {
        "items": [AttendanceWithStudentResponse.model_validate(item) for item in items],
        "page": page,
        "page_size": page_size,
        "total": total,
        "total_pages": total_pages
    }

@router.get("/summary", response_model=AttendanceSummaryResponse)
async def get_school_attendance_summary(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    target_date: Optional[date] = None,
    class_grade: Optional[str] = None,
    class_section: Optional[str] = None,
    authorized_school_id: str = Depends(deps.get_current_school),
) -> Any:
    """
    Get school-level attendance summary.
    """
    if current_user.role == Role.STUDENT:
        raise HTTPException(status_code=403, detail="Students cannot access school attendance summary")

    repo = AttendanceRepository(db)
    summary = await repo.get_school_summary(
        school_id=authorized_school_id,
        target_date=target_date,
        class_grade=class_grade,
        class_section=class_section
    )
    
    return summary

@router.get("/student/{student_id}", response_model=StudentAttendanceSummaryResponse)
async def get_student_attendance(
    student_id: str,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    authorized_school_id: str = Depends(deps.get_current_school),
) -> Any:
    """
    Get attendance summary for a specific student.
    """
    student_repo = StudentRepository(db, authorized_school_id)
    student = await student_repo.get_by_id(student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    if current_user.role == Role.STUDENT:
        if student.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="You can only view your own attendance")

    repo = AttendanceRepository(db)
    summary = await repo.get_student_summary(
        school_id=authorized_school_id,
        student_id=student_id
    )
    
    return summary
