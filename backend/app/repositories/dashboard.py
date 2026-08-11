from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, desc
from typing import Dict, Any, List
from datetime import date

from app.models.student import Student
from app.models.teacher import Teacher
from app.models.class_ import Class
from app.models.school import School
from app.models.attendance import Attendance
from app.models.enums import AttendanceStatus
from app.schemas.dashboard import (
    SchoolAdminDashboardResponse,
    SuperAdminDashboardResponse,
    TeacherDashboardResponse,
    StudentDashboardResponse,
    AttendanceSummary,
    AssignedClassInfo,
    RecentAttendance
)

class DashboardRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_school_admin_metrics(self, school_id: str) -> SchoolAdminDashboardResponse:
        # Count total students in school
        stmt_students = select(func.count(Student.id)).where(Student.school_id == school_id)
        students_total = (await self.db.execute(stmt_students)).scalar() or 0
        
        # Count total teachers in school
        stmt_teachers = select(func.count(Teacher.id)).where(Teacher.school_id == school_id)
        teachers_total = (await self.db.execute(stmt_teachers)).scalar() or 0
        
        # Count total classes in school
        stmt_classes = select(func.count(Class.id)).where(Class.school_id == school_id)
        classes_total = (await self.db.execute(stmt_classes)).scalar() or 0

        # Count attendance today
        target_date = date.today()
        stmt_att = select(
            Attendance.status,
            func.count(Attendance.id)
        ).where(
            Attendance.school_id == school_id,
            Attendance.attendance_date == target_date
        ).group_by(Attendance.status)
        
        att_results = (await self.db.execute(stmt_att)).all()
        
        present = 0
        absent = 0
        for status, count in att_results:
            if status == AttendanceStatus.PRESENT.value:
                present = count
            elif status == AttendanceStatus.ABSENT.value:
                absent = count
                
        marked = present + absent
        not_marked = max(0, students_total - marked)
        
        percentage = 0.0
        if marked > 0:
            percentage = (present / marked) * 100.0

        return SchoolAdminDashboardResponse(
            students_total=students_total,
            teachers_total=teachers_total,
            classes_total=classes_total,
            attendance=AttendanceSummary(
                present=present,
                absent=absent,
                not_marked=not_marked,
                percentage=percentage
            )
        )

    async def get_super_admin_metrics(self) -> SuperAdminDashboardResponse:
        schools_total = (await self.db.execute(select(func.count(School.id)))).scalar() or 0
        students_total = (await self.db.execute(select(func.count(Student.id)))).scalar() or 0
        teachers_total = (await self.db.execute(select(func.count(Teacher.id)))).scalar() or 0
        classes_total = (await self.db.execute(select(func.count(Class.id)))).scalar() or 0
        
        return SuperAdminDashboardResponse(
            schools_total=schools_total,
            students_total=students_total,
            teachers_total=teachers_total,
            classes_total=classes_total
        )

    async def get_teacher_metrics(self, teacher_id: str, school_id: str) -> TeacherDashboardResponse:
        # Get classes assigned to this teacher
        stmt_classes = select(Class).where(
            Class.teacher_id == teacher_id,
            Class.school_id == school_id
        )
        classes = (await self.db.execute(stmt_classes)).scalars().all()
        
        target_date = date.today()
        
        assigned_classes_info = []
        for cls in classes:
            # How many students in this class?
            stmt_students = select(func.count(Student.id)).where(
                Student.school_id == school_id,
                Student.grade == cls.grade,
                Student.section == cls.section
            )
            class_students_total = (await self.db.execute(stmt_students)).scalar() or 0
            
            # Check attendance marked for this class today
            # We can see if any student in this grade/section has an attendance record today
            # A more robust query: count attendance for students in this grade/section
            stmt_att = select(
                Attendance.status,
                func.count(Attendance.id)
            ).join(Student, Student.id == Attendance.student_id).where(
                Attendance.school_id == school_id,
                Attendance.attendance_date == target_date,
                Student.grade == cls.grade,
                Student.section == cls.section
            ).group_by(Attendance.status)
            
            att_results = (await self.db.execute(stmt_att)).all()
            
            present = 0
            absent = 0
            for status, count in att_results:
                if status == AttendanceStatus.PRESENT.value:
                    present = count
                elif status == AttendanceStatus.ABSENT.value:
                    absent = count
            
            marked = present + absent
            attendance_marked = marked > 0
            attendance_percentage = None
            if attendance_marked:
                attendance_percentage = (present / marked) * 100.0
                
            assigned_classes_info.append(AssignedClassInfo(
                class_id=str(cls.id),
                grade=str(cls.grade),
                section=str(cls.section) if cls.section else None,
                name=str(cls.name) if cls.name else None,
                students_total=class_students_total,
                attendance_marked=attendance_marked,
                attendance_percentage=attendance_percentage
            ))
            
        return TeacherDashboardResponse(
            assigned_classes=assigned_classes_info
        )

    async def get_student_metrics(self, student_user_id: str, school_id: str) -> StudentDashboardResponse:
        # 1. Fetch the student profile
        stmt = select(Student).where(
            Student.user_id == student_user_id,
            Student.school_id == school_id
        )
        student = (await self.db.execute(stmt)).scalars().first()
        
        if not student:
            # Fallback if student profile not created yet
            return StudentDashboardResponse(
                attendance_percentage=0.0,
                present_days=0,
                absent_days=0,
                total_days=0
            )
            
        # 2. Get attendance aggregate records
        stmt_att = select(
            Attendance.status,
            func.count(Attendance.id)
        ).where(
            Attendance.student_id == student.id
        ).group_by(Attendance.status)
        
        att_results = (await self.db.execute(stmt_att)).all()
        
        present = 0
        absent = 0
        for status, count in att_results:
            if status == AttendanceStatus.PRESENT.value:
                present = count
            elif status == AttendanceStatus.ABSENT.value:
                absent = count
                
        total = present + absent
        percentage = 0.0
        if total > 0:
            percentage = (present / total) * 100.0
            
        # 2b. Get Recent Attendance (max 5)
        stmt_recent_att = select(Attendance).where(
            Attendance.student_id == student.id
        ).order_by(desc(Attendance.attendance_date)).limit(5)
        
        recent_att_records = (await self.db.execute(stmt_recent_att)).scalars().all()
        recent_attendance = [
            RecentAttendance(date=r.attendance_date.isoformat(), status=str(r.status))
            for r in recent_att_records
        ]
            
        # 3. Get School Name
        school_name = None
        stmt_school = select(School).where(School.id == school_id)
        school = (await self.db.execute(stmt_school)).scalars().first()
        if school:
            school_name = school.name
            
        # 4. Get Class and Teacher
        class_id = None
        class_name = None
        teacher_name = None
        stmt_cls = select(Class).where(
            Class.school_id == school_id,
            Class.grade == student.grade,
            Class.section == student.section
        )
        cls = (await self.db.execute(stmt_cls)).scalars().first()
        if cls:
            class_id = cls.id
            class_name = cls.name
            if cls.teacher_id:
                stmt_teacher = select(Teacher).where(Teacher.id == cls.teacher_id)
                teacher = (await self.db.execute(stmt_teacher)).scalars().first()
                if teacher:
                    teacher_name = teacher.name
            
        return StudentDashboardResponse(
            student_id=str(student.id),
            student_display_id=str(student.student_id),
            student_name=str(student.name),
            student_status=str(student.status),
            school_name=str(school_name) if school_name else None,
            class_id=str(class_id) if class_id else None,
            class_name=str(class_name) if class_name else None,
            class_grade=str(student.grade),
            class_section=str(student.section) if student.section else None,
            teacher_name=str(teacher_name) if teacher_name else None,
            attendance_percentage=percentage,
            present_days=present,
            absent_days=absent,
            total_days=total,
            recent_attendance=recent_attendance
        )
