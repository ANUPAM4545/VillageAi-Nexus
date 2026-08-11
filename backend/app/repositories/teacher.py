from sqlalchemy import select, func, or_
from typing import Optional, Tuple
from app.repositories.base import TenantAwareRepository
from app.models.teacher import Teacher
from app.schemas.teacher import TeacherCreate, TeacherUpdate
import math

class TeacherRepository(TenantAwareRepository[Teacher]):
    def __init__(self, session, school_id: Optional[str]):
        super().__init__(session, Teacher, school_id)

    async def get_by_id(self, id: str) -> Optional[Teacher]:
        stmt = select(Teacher).where(Teacher.id == id)
        if self.school_id:
            stmt = stmt.where(Teacher.school_id == self.school_id)
        
        result = await self.session.execute(stmt)
        return result.scalars().first()
        
    async def get_by_user_id(self, user_id: str) -> Optional[Teacher]:
        stmt = select(Teacher).where(Teacher.user_id == user_id)
        if self.school_id:
            stmt = stmt.where(Teacher.school_id == self.school_id)
            
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def list_teachers(
        self,
        page: int,
        page_size: int,
        search: Optional[str] = None,
        status: Optional[str] = None
    ) -> Tuple[list[Teacher], int]:
        stmt = select(Teacher)
        if self.school_id:
            stmt = stmt.where(Teacher.school_id == self.school_id)

        if search:
            search_filter = or_(
                Teacher.teacher_id.ilike(f"%{search}%"),
                Teacher.name.ilike(f"%{search}%"),
                Teacher.email.ilike(f"%{search}%"),
                Teacher.phone.ilike(f"%{search}%")
            )
            stmt = stmt.where(search_filter)
        
        if status:
            stmt = stmt.where(Teacher.status == status)

        # Total count
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_result = await self.session.execute(count_stmt)
        total = total_result.scalar() or 0

        # Paginated items
        stmt = stmt.offset((page - 1) * page_size).limit(page_size).order_by(Teacher.name.asc())
        result = await self.session.execute(stmt)
        items = list(result.scalars().all())

        return items, total

    async def create(self, teacher_in: TeacherCreate) -> Teacher:
        db_teacher = Teacher(
            teacher_id=teacher_in.teacher_id,
            name=teacher_in.name,
            email=teacher_in.email,
            phone=teacher_in.phone,
            status=teacher_in.status,
            school_id=self.school_id,
            user_id=teacher_in.user_id
        )
        self.session.add(db_teacher)
        await self.session.commit()
        await self.session.refresh(db_teacher)
        return db_teacher

    async def update(self, db_teacher: Teacher, teacher_in: TeacherUpdate) -> Teacher:
        update_data = teacher_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_teacher, field, value)
            
        self.session.add(db_teacher)
        await self.session.commit()
        await self.session.refresh(db_teacher)
        return db_teacher
