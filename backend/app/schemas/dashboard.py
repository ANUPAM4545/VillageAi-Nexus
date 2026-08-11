from pydantic import BaseModel
from typing import Optional, List

class AttendanceSummary(BaseModel):
    present: int
    absent: int
    not_marked: int
    percentage: float

class SchoolAdminDashboardResponse(BaseModel):
    students_total: int
    teachers_total: int
    classes_total: int
    attendance: AttendanceSummary

class SuperAdminDashboardResponse(BaseModel):
    schools_total: int
    students_total: int
    teachers_total: int
    classes_total: int

class AssignedClassInfo(BaseModel):
    class_id: str
    grade: str
    section: Optional[str] = None
    name: Optional[str] = None
    students_total: int
    attendance_marked: bool
    attendance_percentage: Optional[float] = None

class TeacherDashboardResponse(BaseModel):
    assigned_classes: List[AssignedClassInfo]

class RecentAttendance(BaseModel):
    date: str
    status: str

class StudentDashboardResponse(BaseModel):
    # Personal Identity
    student_id: Optional[str] = None
    student_display_id: Optional[str] = None
    student_name: Optional[str] = None
    student_status: Optional[str] = None
    
    # Class & Teacher
    class_id: Optional[str] = None
    class_name: Optional[str] = None
    class_grade: Optional[str] = None
    class_section: Optional[str] = None
    teacher_name: Optional[str] = None
    school_name: Optional[str] = None
    
    # Attendance Metrics
    attendance_percentage: float
    present_days: int
    absent_days: int
    total_days: int = 0
    
    # Recent Attendance
    recent_attendance: List[RecentAttendance] = []
