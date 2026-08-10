from pydantic import BaseModel
from typing import Optional
from app.models.enums import Role

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    role: Optional[Role] = None
