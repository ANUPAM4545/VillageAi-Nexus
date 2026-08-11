from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Any

from app.db.session import get_db
from app.models.user import User
from app.models.teacher import Teacher
from app.models.enums import Role
from app.api.deps import get_current_user, get_current_school, require_roles
from app.repositories.dashboard import DashboardRepository
from sqlalchemy import select

router = APIRouter()

@router.get("/", response_model=Any)
async def get_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    # For global stats, school_id might be None, but get_current_school is required for non-super-admins
):
    """
    Get dashboard metrics based on the current user's role.
    """
    dashboard_repo = DashboardRepository(db)
    
    if current_user.role == Role.SUPER_ADMIN:
        return await dashboard_repo.get_super_admin_metrics()
        
    elif current_user.role == Role.SCHOOL_ADMIN:
        if not current_user.school_id:
            raise HTTPException(status_code=400, detail="User not assigned to a school")
        return await dashboard_repo.get_school_admin_metrics(str(current_user.school_id))
        
    elif current_user.role == Role.TEACHER:
        if not current_user.school_id:
            raise HTTPException(status_code=400, detail="User not assigned to a school")
            
        # Get Teacher ID from User
        stmt = select(Teacher).where(Teacher.user_id == current_user.id)
        teacher = (await db.execute(stmt)).scalars().first()
        if not teacher:
            raise HTTPException(status_code=400, detail="Teacher profile not found")
            
        return await dashboard_repo.get_teacher_metrics(str(teacher.id), str(current_user.school_id))
        
    elif current_user.role == Role.STUDENT:
        if not current_user.school_id:
            raise HTTPException(status_code=400, detail="User not assigned to a school")
        return await dashboard_repo.get_student_metrics(str(current_user.id), str(current_user.school_id))
        
    raise HTTPException(status_code=403, detail="Role not supported for dashboard")

@router.get("/schools/{school_id}", response_model=Any)
async def get_school_dashboard(
    school_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles([Role.SUPER_ADMIN]))
):
    """
    Get dashboard metrics for a specific school (Super Admin only).
    """
    # Verify the school exists (basic validation)
    from app.models.school import School
    school = (await db.execute(select(School).where(School.id == school_id))).scalars().first()
    if not school:
        raise HTTPException(status_code=404, detail="School not found")
        
    dashboard_repo = DashboardRepository(db)
    return await dashboard_repo.get_school_admin_metrics(school_id)
