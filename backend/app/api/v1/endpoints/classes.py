from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
from sqlalchemy.exc import IntegrityError
import math

from app.db.session import get_db
from app.models.user import User
from app.models.class_ import Class
from app.models.teacher import Teacher
from app.models.enums import Role
from app.schemas.class_ import ClassCreate, ClassUpdate, ClassResponse, PaginatedClassResponse
from app.repositories.class_ import ClassRepository
from app.api.deps import get_current_user, require_roles, get_current_school, verify_school_access

router = APIRouter()

@router.post("/", response_model=ClassResponse, status_code=status.HTTP_201_CREATED)
async def create_class(
    class_in: ClassCreate,
    authorized_school_id: str = Depends(get_current_school),
    current_user: User = Depends(require_roles([Role.SUPER_ADMIN, Role.SCHOOL_ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    class_repo = ClassRepository(db, authorized_school_id)
    
    if class_in.teacher_id:
        stmt = select(Teacher).where(Teacher.id == class_in.teacher_id)
        result = await db.execute(stmt)
        teacher = result.scalars().first()
        if not teacher:
            raise HTTPException(status_code=400, detail="Teacher not found")
        if teacher.school_id != authorized_school_id:
            raise HTTPException(status_code=400, detail="Teacher must belong to the same school")
        if teacher.status != "ACTIVE":
            raise HTTPException(status_code=400, detail="Cannot assign an inactive teacher")

    try:
        return await class_repo.create(class_in)
    except IntegrityError as e:
        await db.rollback()
        err_msg = str(e)
        if "uq_school_grade_section" in err_msg:
            raise HTTPException(status_code=400, detail="Class already exists in this school")
        raise HTTPException(status_code=400, detail=f"Database constraint violation: {err_msg}")

@router.get("/", response_model=PaginatedClassResponse)
async def list_classes(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    grade: Optional[str] = None,
    section: Optional[str] = None,
    teacher_id: Optional[str] = None,
    class_status: Optional[str] = Query(None, alias="status"),
    authorized_school_id: str = Depends(get_current_school),
    current_user: User = Depends(require_roles([Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.TEACHER, Role.STUDENT])),
    db: AsyncSession = Depends(get_db)
):
    # Enforce TEACHER rule: can only see assigned classes
    if current_user.role == Role.TEACHER.value:
        # Find the teacher's profile ID
        stmt = select(Teacher).where(Teacher.user_id == current_user.id)
        res = await db.execute(stmt)
        teacher_profile = res.scalars().first()
        if not teacher_profile:
            return PaginatedClassResponse(items=[], page=page, page_size=page_size, total=0, total_pages=0)
        teacher_id = str(teacher_profile.id)

    class_repo = ClassRepository(db, authorized_school_id)
    items, total = await class_repo.list_classes(
        page=page,
        page_size=page_size,
        grade=grade,
        section=section,
        teacher_id=teacher_id,
        status=class_status
    )
    
    total_pages = math.ceil(total / page_size) if total > 0 else 0
    return PaginatedClassResponse(
        items=[ClassResponse.model_validate(item) for item in items],
        page=page,
        page_size=page_size,
        total=total,
        total_pages=total_pages
    )

@router.get("/{class_id}", response_model=ClassResponse)
async def get_class(
    class_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(Class).where(Class.id == class_id)
    result = await db.execute(stmt)
    class_obj = result.scalars().first()
    
    if not class_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class not found")
        
    if current_user.role != Role.SUPER_ADMIN.value and current_user.school_id != class_obj.school_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class not found")
        
    if current_user.role == Role.TEACHER.value:
        t_stmt = select(Teacher).where(Teacher.user_id == current_user.id)
        t_res = await db.execute(t_stmt)
        teacher_profile = t_res.scalars().first()
        if not teacher_profile or class_obj.teacher_id != teacher_profile.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to other classes")

    return class_obj

@router.patch("/{class_id}", response_model=ClassResponse)
async def update_class(
    class_id: str,
    class_in: ClassUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([Role.SUPER_ADMIN, Role.SCHOOL_ADMIN]))
):
    stmt = select(Class).where(Class.id == class_id)
    result = await db.execute(stmt)
    class_obj = result.scalars().first()
    
    if not class_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class not found")
        
    await verify_school_access(str(class_obj.school_id), current_user)
    
    if class_in.teacher_id:
        t_stmt = select(Teacher).where(Teacher.id == class_in.teacher_id)
        t_res = await db.execute(t_stmt)
        teacher = t_res.scalars().first()
        if not teacher:
            raise HTTPException(status_code=400, detail="Teacher not found")
        if teacher.school_id != class_obj.school_id:
            raise HTTPException(status_code=400, detail="Teacher must belong to the same school")
        if teacher.status != "ACTIVE":
            raise HTTPException(status_code=400, detail="Cannot assign an inactive teacher")

    class_repo = ClassRepository(db, str(class_obj.school_id))
    try:
        return await class_repo.update(class_obj, class_in)
    except IntegrityError as e:
        await db.rollback()
        err_msg = str(e)
        if "uq_school_grade_section" in err_msg:
            raise HTTPException(status_code=400, detail="Class already exists in this school")
        raise HTTPException(status_code=400, detail="Database constraint violation")

from app.schemas.attendance import ClassAttendanceRequest, AttendanceWithStudentResponse
from app.repositories.attendance import AttendanceRepository
from app.models.student import Student

@router.post("/{class_id}/attendance", response_model=list[AttendanceWithStudentResponse])
async def mark_class_attendance(
    class_id: str,
    request: ClassAttendanceRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([Role.SUPER_ADMIN, Role.SCHOOL_ADMIN, Role.TEACHER]))
):
    stmt = select(Class).where(Class.id == class_id)
    result = await db.execute(stmt)
    class_obj = result.scalars().first()
    
    if not class_obj:
        raise HTTPException(status_code=404, detail="Class not found")
        
    await verify_school_access(str(class_obj.school_id), current_user)
    
    if current_user.role == Role.TEACHER.value:
        t_stmt = select(Teacher).where(Teacher.user_id == current_user.id)
        t_res = await db.execute(t_stmt)
        teacher_profile = t_res.scalars().first()
        if not teacher_profile or class_obj.teacher_id != teacher_profile.id:
            raise HTTPException(status_code=403, detail="Not authorized to mark attendance for this class")
            
    # Resolve students based on implicit relation (school_id, grade, section)
    s_stmt = select(Student).where(
        Student.school_id == class_obj.school_id,
        Student.grade == class_obj.grade,
        Student.section == class_obj.section
    )
    s_res = await db.execute(s_stmt)
    valid_student_ids = {s.id for s in s_res.scalars().all()}
    
    # Validate submitted students
    for record in request.records:
        if record.student_id not in valid_student_ids:
            raise HTTPException(status_code=400, detail=f"Student {record.student_id} does not belong to this class")
            
    repo = AttendanceRepository(db)
    upserted = await repo.upsert_class_attendance(
        school_id=str(class_obj.school_id),
        target_date=request.date,
        records=request.records,
        marked_by_user_id=str(current_user.id)
    )
    
    return [AttendanceWithStudentResponse.model_validate(u) for u in upserted]
