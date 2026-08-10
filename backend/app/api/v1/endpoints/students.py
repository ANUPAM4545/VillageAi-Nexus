from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
from sqlalchemy.exc import IntegrityError
import math

from app.db.session import get_db
from app.models.user import User
from app.models.student import Student
from app.models.enums import Role
from app.schemas.student import StudentCreate, StudentUpdate, StudentResponse, PaginatedStudentResponse
from app.repositories.student import StudentRepository
from app.api.deps import get_current_user, require_roles, get_current_school, verify_school_access

router = APIRouter()

@router.post("/", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
async def create_student(
    student_in: StudentCreate,
    authorized_school_id: str = Depends(get_current_school),
    current_user: User = Depends(require_roles([Role.SUPER_ADMIN, Role.SCHOOL_ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    # For SUPER_ADMIN, they might provide school_id via the query parameter to get_current_school
    student_repo = StudentRepository(db, authorized_school_id)
    
    if student_in.user_id:
        # Verify the user exists, belongs to the same school, and is a STUDENT
        stmt = select(User).where(User.id == student_in.user_id)
        result = await db.execute(stmt)
        user = result.scalars().first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        if user.role != Role.STUDENT:
            raise HTTPException(status_code=400, detail="Linked user must have STUDENT role")
        if user.school_id != authorized_school_id:
            raise HTTPException(status_code=400, detail="Linked user must belong to the same school")
    
    try:
        return await student_repo.create(student_in)
    except IntegrityError as e:
        await db.rollback()
        if "uq_school_student_id" in str(e):
            raise HTTPException(status_code=400, detail="Student ID already exists in this school")
        if "ix_student_user_id" in str(e):
            raise HTTPException(status_code=400, detail="This user is already linked to another student")
        raise HTTPException(status_code=400, detail="Database constraint violation")

@router.get("/", response_model=PaginatedStudentResponse)
async def list_students(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    grade: Optional[str] = None,
    section: Optional[str] = None,
    student_status: Optional[str] = Query(None, alias="status"),
    authorized_school_id: str = Depends(get_current_school),
    current_user: User = Depends(require_roles([Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.TEACHER])),
    db: AsyncSession = Depends(get_db)
):
    student_repo = StudentRepository(db, authorized_school_id)
    items, total = await student_repo.list_students(
        page=page,
        page_size=page_size,
        search=search,
        grade=grade,
        section=section,
        status=student_status
    )
    
    total_pages = math.ceil(total / page_size) if total > 0 else 0
    return PaginatedStudentResponse(
        items=items,
        page=page,
        page_size=page_size,
        total=total,
        total_pages=total_pages
    )

@router.get("/{student_id}", response_model=StudentResponse)
async def get_student(
    student_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Resolve student without tenant filter first to find their school
    stmt = select(Student).where(Student.id == student_id)
    result = await db.execute(stmt)
    student = result.scalars().first()
    
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
        
    if current_user.role != Role.SUPER_ADMIN.value and current_user.school_id != student.school_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
    
    # Additional verification for STUDENT self-access
    if current_user.role == Role.STUDENT.value:
        if student.user_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
            
    return student

@router.patch("/{student_id}", response_model=StudentResponse)
async def update_student(
    student_id: str,
    student_in: StudentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([Role.SUPER_ADMIN, Role.SCHOOL_ADMIN]))
):
    stmt = select(Student).where(Student.id == student_id)
    result = await db.execute(stmt)
    student = result.scalars().first()
    
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
        
    await verify_school_access(student.school_id, current_user)
    
    student_repo = StudentRepository(db, student.school_id)
    return await student_repo.update(student, student_in)
