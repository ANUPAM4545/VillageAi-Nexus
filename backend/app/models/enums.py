from __future__ import annotations
from typing import Optional

import enum

class Role(str, enum.Enum):
    SUPER_ADMIN = "SUPER_ADMIN"
    SCHOOL_ADMIN = "SCHOOL_ADMIN"
    TEACHER = "TEACHER"
    STUDENT = "STUDENT"

class AttendanceStatus(str, enum.Enum):
    PRESENT = "PRESENT"
    ABSENT = "ABSENT"
