from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional, List, Dict
from app.models.school import School
from app.models.user import User
from app.models.enums import Role
from app.schemas.school import SchoolCreate, SchoolUpdate, SchoolStatistics

class SchoolRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, school_id: str) -> Optional[School]:
        stmt = select(School).where(School.id == school_id)
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def get_all(self) -> List[School]:
        stmt = select(School)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def create(self, school_in: SchoolCreate) -> School:
        db_school = School(
            name=school_in.name,
            address=school_in.address,
            contact_email=school_in.contact_email,
            status=school_in.status
        )
        self.session.add(db_school)
        await self.session.commit()
        await self.session.refresh(db_school)
        return db_school
        
    async def update(self, db_school: School, school_in: SchoolUpdate) -> School:
        update_data = school_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_school, field, value)
            
        self.session.add(db_school)
        await self.session.commit()
        await self.session.refresh(db_school)
        return db_school

    async def get_statistics(self, school_id: str) -> SchoolStatistics:
        stmt = select(User.role, func.count(User.id)).where(User.school_id == school_id).group_by(User.role)
        result = await self.session.execute(stmt)
        counts = dict(result.all())
        
        return SchoolStatistics(
            school_admin_count=counts.get(Role.SCHOOL_ADMIN, 0),
            teacher_count=counts.get(Role.TEACHER, 0),
            student_count=counts.get(Role.STUDENT, 0)
        )
