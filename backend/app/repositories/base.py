from sqlalchemy.ext.asyncio import AsyncSession
from typing import TypeVar, Generic, Type, Optional

ModelType = TypeVar("ModelType")

class TenantAwareRepository(Generic[ModelType]):
    """
    Base repository for tenant-scoped resources.
    Requires school_id on all operations to prevent cross-tenant leakage, except for global operations (None).
    """
    def __init__(self, session: AsyncSession, model: Type[ModelType], school_id: Optional[str]):
        self.session = session
        self.model = model
        self.school_id = school_id
