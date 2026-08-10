from sqlalchemy import select, func, or_
from typing import Optional, Tuple
from app.repositories.base import TenantAwareRepository
from app.models.student import Student
from app.schemas.student import StudentCreate, StudentUpdate
import math

class StudentRepository(TenantAwareRepository[Student]):
    def __init__(self, session, school_id: str):
        super().__init__(session, Student, school_id)

    async def get_by_id(self, id: str) -> Optional[Student]:
        stmt = select(Student).where(
            Student.id == id,
            Student.school_id == self.school_id
        )
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def list_students(
        self,
        page: int,
        page_size: int,
        search: Optional[str] = None,
        grade: Optional[str] = None,
        section: Optional[str] = None,
        status: Optional[str] = None
    ) -> Tuple[list[Student], int]:
        stmt = select(Student).where(Student.school_id == self.school_id)

        if search:
            search_filter = or_(
                Student.student_id.ilike(f"%{search}%"),
                Student.name.ilike(f"%{search}%"),
                Student.parent_name.ilike(f"%{search}%")
            )
            stmt = stmt.where(search_filter)
        
        if grade:
            stmt = stmt.where(Student.grade == grade)
        if section:
            stmt = stmt.where(Student.section == section)
        if status:
            stmt = stmt.where(Student.status == status)

        # Total count
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_result = await self.session.execute(count_stmt)
        total = total_result.scalar() or 0

        # Paginated items
        stmt = stmt.offset((page - 1) * page_size).limit(page_size).order_by(Student.name.asc())
        result = await self.session.execute(stmt)
        items = list(result.scalars().all())

        return items, total

    async def create(self, student_in: StudentCreate) -> Student:
        db_student = Student(
            student_id=student_in.student_id,
            name=student_in.name,
            grade=student_in.grade,
            section=student_in.section,
            parent_name=student_in.parent_name,
            parent_phone=student_in.parent_phone,
            status=student_in.status,
            school_id=self.school_id,
            user_id=student_in.user_id
        )
        self.session.add(db_student)
        await self.session.commit()
        await self.session.refresh(db_student)
        return db_student

    async def update(self, db_student: Student, student_in: StudentUpdate) -> Student:
        update_data = student_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_student, field, value)
            
        self.session.add(db_student)
        await self.session.commit()
        await self.session.refresh(db_student)
        return db_student
