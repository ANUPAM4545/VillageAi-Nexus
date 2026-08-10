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

class StudentDashboardResponse(BaseModel):
    attendance_percentage: float
    present_days: int
    absent_days: int
    class_name: Optional[str] = None
    class_grade: Optional[str] = None
    class_section: Optional[str] = None
