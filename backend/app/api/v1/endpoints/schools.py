from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.db.session import get_db
from app.models.user import User
from app.models.enums import Role
from app.schemas.school import SchoolCreate, SchoolUpdate, SchoolResponse, SchoolStatistics
from app.repositories.school import SchoolRepository
from app.api.deps import get_current_user, require_roles, verify_school_access

router = APIRouter()

@router.post("/", response_model=SchoolResponse, status_code=status.HTTP_201_CREATED)
async def create_school(
    school_in: SchoolCreate,
    current_user: User = Depends(require_roles([Role.SUPER_ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    school_repo = SchoolRepository(db)
    return await school_repo.create(school_in)

@router.get("/", response_model=List[SchoolResponse])
async def list_schools(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    school_repo = SchoolRepository(db)
    if current_user.role == Role.SUPER_ADMIN:
        return await school_repo.get_all()
    else:
        # Ordinary users can only see their own school
        if not current_user.school_id:
            return []
        school = await school_repo.get_by_id(current_user.school_id)
        return [school] if school else []

@router.get("/{school_id}", response_model=SchoolResponse)
async def get_school(
    school_id: str,
    authorized_school_id: str = Depends(verify_school_access),
    db: AsyncSession = Depends(get_db)
):
    school_repo = SchoolRepository(db)
    school = await school_repo.get_by_id(authorized_school_id)
    if not school:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="School not found")
    return school

@router.patch("/{school_id}", response_model=SchoolResponse)
async def update_school(
    school_id: str,
    school_in: SchoolUpdate,
    # First verify they can access the school
    authorized_school_id: str = Depends(verify_school_access),
    # Then verify they have admin privileges
    current_user: User = Depends(require_roles([Role.SUPER_ADMIN, Role.SCHOOL_ADMIN])),
    db: AsyncSession = Depends(get_db)
):
    school_repo = SchoolRepository(db)
    school = await school_repo.get_by_id(authorized_school_id)
    if not school:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="School not found")
        
    return await school_repo.update(school, school_in)

@router.get("/{school_id}/statistics", response_model=SchoolStatistics)
async def get_school_statistics(
    school_id: str,
    authorized_school_id: str = Depends(verify_school_access),
    db: AsyncSession = Depends(get_db)
):
    school_repo = SchoolRepository(db)
    school = await school_repo.get_by_id(authorized_school_id)
    if not school:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="School not found")
        
    return await school_repo.get_statistics(authorized_school_id)
