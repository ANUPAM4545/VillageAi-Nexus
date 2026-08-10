from typing import Optional
from app.repositories.user import UserRepository
from app.models.user import User
from app.core.security import verify_password
from app.core.exceptions import AppException

class AuthService:
    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo

    async def authenticate(self, email: str, password: str) -> Optional[User]:
        user = await self.user_repo.get_by_email(email)
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        return user
    
    def verify_active(self, user: User) -> None:
        if not user.is_active:
            raise AppException(code="INACTIVE_USER", message="User is inactive", status_code=400)
