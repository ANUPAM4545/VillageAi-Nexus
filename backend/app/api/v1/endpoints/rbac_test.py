from fastapi import APIRouter, Depends
from app.api.deps import require_roles, get_current_school
from app.models.enums import Role
from app.models.user import User

router = APIRouter()

@router.get("/super-admin-only")
async def super_admin_only(current_user: User = Depends(require_roles([Role.SUPER_ADMIN]))):
    return {"success": True}

@router.get("/teachers-only")
async def teachers_only(current_user: User = Depends(require_roles([Role.TEACHER]))):
    return {"success": True}

@router.get("/tenant-aware")
async def tenant_aware_test(
    resolved_school_id: str = Depends(get_current_school)
):
    return {"resolved_school_id": resolved_school_id}
