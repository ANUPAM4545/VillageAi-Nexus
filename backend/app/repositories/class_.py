from sqlalchemy import select, func, or_
from typing import Optional, Tuple
from app.repositories.base import TenantAwareRepository
from app.models.class_ import Class
from app.models.teacher import Teacher
from app.schemas.class_ import ClassCreate, ClassUpdate

class ClassRepository(TenantAwareRepository[Class]):
    def __init__(self, session, school_id: str):
        super().__init__(session, Class, school_id)

    async def get_by_id(self, id: str) -> Optional[Class]:
        stmt = select(Class).where(
            Class.id == id,
            Class.school_id == self.school_id
        )
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def list_classes(
        self,
        page: int,
        page_size: int,
        grade: Optional[str] = None,
        section: Optional[str] = None,
        teacher_id: Optional[str] = None,
        status: Optional[str] = None
    ) -> Tuple[list[Class], int]:
        stmt = select(Class).where(Class.school_id == self.school_id)

        if grade:
            stmt = stmt.where(Class.grade == grade)
        if section:
            stmt = stmt.where(Class.section == section)
        if teacher_id:
            stmt = stmt.where(Class.teacher_id == teacher_id)
        if status:
            stmt = stmt.where(Class.status == status)

        # Total count
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_result = await self.session.execute(count_stmt)
        total = total_result.scalar() or 0

        # Paginated items
        stmt = stmt.offset((page - 1) * page_size).limit(page_size).order_by(Class.grade.asc(), Class.section.asc())
        result = await self.session.execute(stmt)
        items = list(result.scalars().all())

        return items, total

    async def create(self, class_in: ClassCreate) -> Class:
        db_class = Class(
            grade=class_in.grade,
            section=class_in.section,
            name=class_in.name,
            status=class_in.status,
            school_id=self.school_id,
            teacher_id=class_in.teacher_id
        )
        self.session.add(db_class)
        await self.session.commit()
        await self.session.refresh(db_class)
        return db_class

    async def update(self, db_class: Class, class_in: ClassUpdate) -> Class:
        update_data = class_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_class, field, value)
            
        self.session.add(db_class)
        await self.session.commit()
        await self.session.refresh(db_class)
        return db_class
