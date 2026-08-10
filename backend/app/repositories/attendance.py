from typing import List, Optional, Tuple
from sqlalchemy import select, and_, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from datetime import date

from app.models.attendance import Attendance
from app.models.student import Student
from app.models.enums import AttendanceStatus
from app.schemas.attendance import StudentAttendanceRecord

class AttendanceRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_attendance_history(
        self,
        school_id: str,
        page: int = 1,
        page_size: int = 20,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        student_id: Optional[str] = None,
        class_grade: Optional[str] = None,
        class_section: Optional[str] = None,
        status: Optional[str] = None
    ) -> Tuple[List[Attendance], int, int]:
        
        query = select(Attendance).join(Student).options(selectinload(Attendance.student))
        query = query.where(Attendance.school_id == school_id)
        
        if start_date:
            query = query.where(Attendance.attendance_date >= start_date)
        if end_date:
            query = query.where(Attendance.attendance_date <= end_date)
        if student_id:
            query = query.where(Attendance.student_id == student_id)
        if status:
            query = query.where(Attendance.status == status)
            
        if class_grade:
            query = query.where(Student.grade == class_grade)
        if class_section:
            query = query.where(Student.section == class_section)
            
        # Count total
        count_query = select(func.count()).select_from(query.subquery())
        total = await self.session.scalar(count_query) or 0
        
        # Pagination
        query = query.order_by(Attendance.attendance_date.desc(), Student.name.asc())
        query = query.offset((page - 1) * page_size).limit(page_size)
        
        result = await self.session.execute(query)
        items = list(result.scalars().all())
        
        total_pages = (total + page_size - 1) // page_size
        return items, total, total_pages

    async def upsert_class_attendance(
        self,
        school_id: str,
        target_date: date,
        records: List[StudentAttendanceRecord],
        marked_by_user_id: str
    ) -> List[Attendance]:
        
        student_ids = [r.student_id for r in records]
        
        # Get existing attendance for these students on this date
        query = select(Attendance).where(
            and_(
                Attendance.school_id == school_id,
                Attendance.attendance_date == target_date,
                Attendance.student_id.in_(student_ids)
            )
        ).options(selectinload(Attendance.student))
        
        result = await self.session.execute(query)
        existing_records = {att.student_id: att for att in result.scalars().all()}
        
        upserted = []
        for record in records:
            if record.student_id in existing_records:
                # Update existing
                existing = existing_records[record.student_id]
                existing.status = record.status.value
                existing.marked_by = marked_by_user_id
                upserted.append(existing)
            else:
                # Create new
                new_att = Attendance(
                    school_id=school_id,
                    student_id=record.student_id,
                    attendance_date=target_date,
                    status=record.status.value,
                    marked_by=marked_by_user_id
                )
                self.session.add(new_att)
                upserted.append(new_att)
                
        await self.session.commit()
        
        # Reload to get relationships (student)
        for att in upserted:
            await self.session.refresh(att, ["student"])
            
        return upserted

    async def get_student_summary(self, school_id: str, student_id: str) -> dict:
        query = select(
            Attendance.status,
            func.count(Attendance.id)
        ).where(
            and_(
                Attendance.school_id == school_id,
                Attendance.student_id == student_id
            )
        ).group_by(Attendance.status)
        
        result = await self.session.execute(query)
        counts = dict(result.all())
        
        present = counts.get(AttendanceStatus.PRESENT.value, 0)
        absent = counts.get(AttendanceStatus.ABSENT.value, 0)
        total = present + absent
        
        percentage = (present / total * 100) if total > 0 else 0.0
        
        return {
            "present": present,
            "absent": absent,
            "total_marked": total,
            "attendance_percentage": round(percentage, 1)
        }

    async def get_school_summary(
        self, 
        school_id: str, 
        target_date: Optional[date] = None,
        class_grade: Optional[str] = None,
        class_section: Optional[str] = None
    ) -> dict:
        
        query = select(
            Attendance.status,
            func.count(Attendance.id)
        ).join(Student).where(
            Attendance.school_id == school_id
        )
        
        if target_date:
            query = query.where(Attendance.attendance_date == target_date)
            
        if class_grade:
            query = query.where(Student.grade == class_grade)
        if class_section:
            query = query.where(Student.section == class_section)
            
        query = query.group_by(Attendance.status)
        result = await self.session.execute(query)
        counts = dict(result.all())
        
        present = counts.get(AttendanceStatus.PRESENT.value, 0)
        absent = counts.get(AttendanceStatus.ABSENT.value, 0)
        total = present + absent
        
        percentage = (present / total * 100) if total > 0 else 0.0
        
        return {
            "total_students": total,  # For the given query scope, this is total marked
            "present": present,
            "absent": absent,
            "attendance_percentage": round(percentage, 1)
        }
