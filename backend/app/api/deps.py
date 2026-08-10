from fastapi import Depends, Request, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from jose import jwt, JWTError
from typing import List, Callable, Optional
from fastapi import Query
from app.core.config import settings
from app.db.session import get_db
from app.models.user import User
from app.models.enums import Role
from app.repositories.user import UserRepository

async def get_token_from_cookie(request: Request) -> str:
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    return token

async def get_current_user(
    db: AsyncSession = Depends(get_db),
    token: str = Depends(get_token_from_cookie)
) -> User:
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=["HS256"]
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    
    user_repo = UserRepository(db)
    user = await user_repo.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Inactive user")
    
    return user

def require_roles(roles: List[Role]) -> Callable:
    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
        return current_user
    return role_checker

async def get_current_school(
    current_user: User = Depends(get_current_user),
    school_id: Optional[str] = Query(None, description="School ID (Required for Super Admin)")
) -> str:
    """
    Core tenant resolver.
    - Super Admins must explicitly provide school_id context.
    - Ordinary users always resolve to their assigned school (ignoring query params).
    """
    if current_user.role == Role.SUPER_ADMIN:
        if not school_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Super Admin must explicitly provide school_id for tenant-aware operations"
            )
        return school_id
    
    if current_user.school_id:
        return current_user.school_id
        
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User has no assigned school")

async def verify_school_access(
    school_id: str,
    current_user: User = Depends(get_current_user)
) -> str:
    """
    For endpoints targeting a specific school resource (e.g. GET /schools/{school_id}).
    Verifies that the user has permission to access this specific school.
    """
    if current_user.role == Role.SUPER_ADMIN:
        return school_id
        
    if current_user.school_id != school_id:
        # Return 404 to avoid exposing that the school exists
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="School not found")
        
    return school_id
