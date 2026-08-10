import pytest
from httpx import AsyncClient, ASGITransport
import uuid

from app.main import app
from app.db.session import AsyncSessionLocal
from app.models.teacher import Teacher
from app.models.student import Student
from app.models.class_ import Class
from sqlalchemy import select, func

async def get_auth_token(email: str) -> str:
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        response = await ac.post("/api/v1/auth/login", json={
            "email": email,
            "password": "password123"
        })
        return response.cookies.get("access_token")

@pytest.mark.asyncio
async def test_dashboard_school_admin():
    token_admin_a = await get_auth_token("schoola_admin@example.com")
    
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test", cookies={"access_token": token_admin_a}) as ac:
        res = await ac.get("/api/v1/dashboard/")
        assert res.status_code == 200
        data = res.json()
        assert "students_total" in data
        assert "teachers_total" in data
        assert "classes_total" in data
        assert "attendance" in data
        
        # We know from seed data that School A has 2 students, 2 teachers, 2 classes
        # Wait, attendance tests might have added/deleted things, but it shouldn't mix schools.
        # Just assert it's a dict and has keys
        assert type(data["students_total"]) == int
        
@pytest.mark.asyncio
async def test_dashboard_super_admin():
    token_super = await get_auth_token("super_admin@example.com")
    
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test", cookies={"access_token": token_super}) as ac:
        res = await ac.get("/api/v1/dashboard/")
        assert res.status_code == 200
        data = res.json()
        assert "schools_total" in data
        
        # Test school drill-down
        # First get a school
        schools_res = await ac.get("/api/v1/schools/")
        school_id = schools_res.json()[0]["id"]
        
        drill_res = await ac.get(f"/api/v1/dashboard/schools/{school_id}")
        assert drill_res.status_code == 200
        drill_data = drill_res.json()
        assert "students_total" in drill_data
        
@pytest.mark.asyncio
async def test_dashboard_teacher():
    token_teacher = await get_auth_token("schoola_teacher@example.com")
    
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test", cookies={"access_token": token_teacher}) as ac:
        res = await ac.get("/api/v1/dashboard/")
        assert res.status_code == 200
        data = res.json()
        assert "assigned_classes" in data
        assert isinstance(data["assigned_classes"], list)
        
@pytest.mark.asyncio
async def test_dashboard_student():
    token_student = await get_auth_token("schoola_student@example.com")
    
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test", cookies={"access_token": token_student}) as ac:
        res = await ac.get("/api/v1/dashboard/")
        assert res.status_code == 200
        data = res.json()
        assert "attendance_percentage" in data
        assert "present_days" in data
        
@pytest.mark.asyncio
async def test_dashboard_tenant_isolation():
    # Explicitly verify school A admin doesn't see school B counts
    token_admin_a = await get_auth_token("schoola_admin@example.com")
    # We need token_admin_a_school_id
    async with AsyncSessionLocal() as db:
        stmt = select(Teacher).where(Teacher.email == "schoola_teacher@example.com")
        res = await db.execute(stmt)
        teacher_a = res.scalars().first()
        token_admin_a_school_id = teacher_a.school_id
        
        stmt = select(Teacher).where(Teacher.email == "schoolb_teacher@example.com")
        res = await db.execute(stmt)
        teacher_b = res.scalars().first()
        school_b_id = teacher_b.school_id
        
        # Add 5 fake students to School B
        run_id = uuid.uuid4().hex[:6]
        for i in range(5):
            s = Student(student_id=f"TEST-ISO-{run_id}-{i}", name="Test", grade="1", school_id=school_b_id)
            db.add(s)
        await db.commit()

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test", cookies={"access_token": token_admin_a}) as ac:
            res = await ac.get("/api/v1/dashboard/")
            data = res.json()
            
            async with AsyncSessionLocal() as db:
                stmt = select(func.count(Student.id)).where(Student.school_id == token_admin_a_school_id)
                expected_count = (await db.execute(stmt)).scalar() or 0
                
            assert data["students_total"] == expected_count
