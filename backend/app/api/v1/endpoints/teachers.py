from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
from sqlalchemy.exc import IntegrityError
import math

from app.db.session import get_db
from app.models.user import User
from app.models.teacher import Teacher
from app.models.enums import Role
from app.schemas.teacher import TeacherCreate, TeacherUpdate, TeacherResponse, PaginatedTeacherResponse
from app.repositories.teacher import TeacherRepository
from app.api.deps import get_current_user, require_roles, get_current_school, verify_school_access

router = APIRouter()

@router.post("/", response_model=TeacherResponse, status_code=status.HTTP_201_CREATED)
async def create_teacher(
    teacher_in: TeacherCreate,
    authorized_school_id: str = Depends(get_current_school),
    current_user: User = Depends(require_roles([Role.SUPER_ADMIN, Role.SCHOOL_ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    teacher_repo = TeacherRepository(db, authorized_school_id)
    
    if teacher_in.user_id:
        stmt = select(User).where(User.id == teacher_in.user_id)
        result = await db.execute(stmt)
        user = result.scalars().first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        if user.role != Role.TEACHER:
            raise HTTPException(status_code=400, detail="Linked user must have TEACHER role")
        if user.school_id != authorized_school_id:
            raise HTTPException(status_code=400, detail="Linked user must belong to the same school")
    
    try:
        return await teacher_repo.create(teacher_in)
    except IntegrityError as e:
        await db.rollback()
        err_msg = str(e)
        if "uq_school_teacher_id" in err_msg:
            raise HTTPException(status_code=400, detail="Teacher ID already exists in this school")
        if "ix_teacher_user_id" in err_msg:
            raise HTTPException(status_code=400, detail="This user is already linked to another teacher")
        raise HTTPException(status_code=400, detail=f"Database constraint violation: {err_msg}")

@router.get("/", response_model=PaginatedTeacherResponse)
async def list_teachers(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    teacher_status: Optional[str] = Query(None, alias="status"),
    authorized_school_id: str = Depends(get_current_school),
    current_user: User = Depends(require_roles([Role.SUPER_ADMIN, Role.SCHOOL_ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    teacher_repo = TeacherRepository(db, authorized_school_id)
    items, total = await teacher_repo.list_teachers(
        page=page,
        page_size=page_size,
        search=search,
        status=teacher_status
    )
    
    total_pages = math.ceil(total / page_size) if total > 0 else 0
    return PaginatedTeacherResponse(
        items=items,
        page=page,
        page_size=page_size,
        total=total,
        total_pages=total_pages
    )

@router.get("/{teacher_id}", response_model=TeacherResponse)
async def get_teacher(
    teacher_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(Teacher).where(Teacher.id == teacher_id)
    result = await db.execute(stmt)
    teacher = result.scalars().first()
    
    if not teacher:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Teacher not found")
        
    if current_user.role != Role.SUPER_ADMIN.value and current_user.school_id != teacher.school_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Teacher not found")
    
    if current_user.role == Role.TEACHER.value:
        if teacher.user_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to other teacher profiles")
            
    return teacher

@router.patch("/{teacher_id}", response_model=TeacherResponse)
async def update_teacher(
    teacher_id: str,
    teacher_in: TeacherUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([Role.SUPER_ADMIN, Role.SCHOOL_ADMIN]))
):
    stmt = select(Teacher).where(Teacher.id == teacher_id)
    result = await db.execute(stmt)
    teacher = result.scalars().first()
    
    if not teacher:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Teacher not found")
        
    await verify_school_access(teacher.school_id, current_user)
    
    teacher_repo = TeacherRepository(db, teacher.school_id)
    return await teacher_repo.update(teacher, teacher_in)
