from fastapi import APIRouter
from app.api.v1.endpoints import health, auth, rbac_test, schools, students, teachers, classes, attendance, dashboard

api_router = APIRouter()

api_router.include_router(health.router, tags=["health"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(rbac_test.router, prefix="/rbac", tags=["rbac_test"])
api_router.include_router(schools.router, prefix="/schools", tags=["schools"])
api_router.include_router(students.router, prefix="/students", tags=["students"])
api_router.include_router(teachers.router, prefix="/teachers", tags=["teachers"])
api_router.include_router(classes.router, prefix="/classes", tags=["classes"])
api_router.include_router(attendance.router, prefix="/attendance", tags=["attendance"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
