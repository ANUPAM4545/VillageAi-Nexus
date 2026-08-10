from sqlalchemy.ext.asyncio import AsyncSession
from typing import TypeVar, Generic, Type

ModelType = TypeVar("ModelType")

class TenantAwareRepository(Generic[ModelType]):
    """
    Base repository for tenant-scoped resources.
    Requires school_id on all operations to prevent cross-tenant leakage.
    """
    def __init__(self, session: AsyncSession, model: Type[ModelType], school_id: str):
        self.session = session
        self.model = model
        self.school_id = school_id
