from typing import Optional, List, Dict
from pydantic import BaseModel, ConfigDict
from datetime import date, datetime
from app.models.enums import AttendanceStatus

class AttendanceBase(BaseModel):
    attendance_date: date
    status: AttendanceStatus

class AttendanceCreate(AttendanceBase):
    student_id: str
    school_id: str
    marked_by: str

class AttendanceUpdate(BaseModel):
    status: AttendanceStatus

class AttendanceResponse(AttendanceBase):
    id: str
    student_id: str
    school_id: str
    marked_by: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class AttendanceStudentInfo(BaseModel):
    id: str
    student_id: str
    name: str
    grade: str
    section: Optional[str]

    model_config = ConfigDict(from_attributes=True)

class AttendanceWithStudentResponse(AttendanceResponse):
    student: AttendanceStudentInfo

    model_config = ConfigDict(from_attributes=True)

class StudentAttendanceRecord(BaseModel):
    student_id: str
    status: AttendanceStatus

class ClassAttendanceRequest(BaseModel):
    date: date
    records: List[StudentAttendanceRecord]

class AttendanceSummaryResponse(BaseModel):
    total_students: int
    present: int
    absent: int
    attendance_percentage: float

class StudentAttendanceSummaryResponse(BaseModel):
    present: int
    absent: int
    total_marked: int
    attendance_percentage: float
