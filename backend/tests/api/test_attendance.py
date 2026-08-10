import pytest
import uuid
from httpx import AsyncClient, ASGITransport
from datetime import date
from sqlalchemy import select
from app.main import app
from app.db.session import AsyncSessionLocal
from app.models.teacher import Teacher
from app.models.student import Student
from app.models.class_ import Class

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
async def test_attendance_workflow():
    token_super = await get_auth_token("super_admin@example.com")
    token_teacher = await get_auth_token("schoola_teacher@example.com")
    token_student = await get_auth_token("schoola_student@example.com")
    
    async with AsyncSessionLocal() as db:
        # Get school A ID from teacher
        stmt = select(Teacher).where(Teacher.email == "schoola_teacher@example.com")
        res = await db.execute(stmt)
        teacher = res.scalars().first()
        school_id = teacher.school_id
        
        # Create Class for this teacher
        grade = str(uuid.uuid4())[:8]
        section = str(uuid.uuid4())[:8]
        new_class = Class(
            grade=grade,
            section=section,
            school_id=school_id,
            teacher_id=teacher.id
        )
        db.add(new_class)
        await db.commit()
        await db.refresh(new_class)
        
        # Create Student for this class
        # Wait, schoola_student is already in db, let's just make a new one for clean test
        new_student = Student(
            student_id=f"ST-{grade}-{section}-1",
            name=f"Student {grade}{section}",
            grade=grade,
            section=section,
            school_id=school_id
        )
        db.add(new_student)
        await db.commit()
        await db.refresh(new_student)
        
        
    target_date = date.today().isoformat()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test", cookies={"access_token": token_teacher}) as ac:
        # 1. Successful mark
        response = await ac.post(f"/api/v1/classes/{new_class.id}/attendance", json={
            "date": target_date,
            "records": [{"student_id": new_student.id, "status": "PRESENT"}]
        })
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["status"] == "PRESENT"
        
        # 2. Upsert to ABSENT
        response = await ac.post(f"/api/v1/classes/{new_class.id}/attendance", json={
            "date": target_date,
            "records": [{"student_id": new_student.id, "status": "ABSENT"}]
        })
        assert response.status_code == 200
        assert response.json()[0]["status"] == "ABSENT"
        
        # 3. Create another class NOT assigned to this teacher
        async with AsyncSessionLocal() as db2:
            grade_y = str(uuid.uuid4())[:8]
            section_y = str(uuid.uuid4())[:8]
            other_class = Class(
                grade=grade_y,
                section=section_y,
                school_id=school_id
            )
            db2.add(other_class)
            await db2.commit()
            await db2.refresh(other_class)
            
        # Try to mark attendance for other class
        response = await ac.post(f"/api/v1/classes/{other_class.id}/attendance", json={
            "date": target_date,
            "records": []
        })
        assert response.status_code == 403
        
        # 4. Malicious student
        async with AsyncSessionLocal() as db3:
            other_student = Student(
                student_id=f"ST-{grade_y}-{section_y}-1",
                name=f"Student {grade_y}{section_y}",
                grade=grade_y,
                section=section_y,
                school_id=school_id
            )
            db3.add(other_student)
            await db3.commit()
            
        response = await ac.post(f"/api/v1/classes/{new_class.id}/attendance", json={
            "date": target_date,
            "records": [{"student_id": other_student.id, "status": "PRESENT"}]
        })
        assert response.status_code == 400
        assert "does not belong" in response.text
        
        # Clean up to avoid breaking test_classes
        async with AsyncSessionLocal() as db_cleanup:
            # Re-fetch because it's a new session
            stmt = select(Class).where(Class.id == new_class.id)
            res = await db_cleanup.execute(stmt)
            c = res.scalars().first()
            if c:
                await db_cleanup.delete(c)
                await db_cleanup.commit()

@pytest.mark.asyncio
async def test_student_self_access():
    token_student = await get_auth_token("schoola_student@example.com")
    
    async with AsyncSessionLocal() as db:
        stmt = select(User).where(User.email == "schoola_student@example.com")
        res = await db.execute(stmt)
        user = res.scalars().first()
        
        stmt = select(Student).where(Student.user_id == user.id)
        res = await db.execute(stmt)
        student = res.scalars().first()
        student_id = student.id
        
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test", cookies={"access_token": token_student}) as ac:
        # Success
        response = await ac.get(f"/api/v1/attendance/student/{student_id}")
        assert response.status_code == 200
        
        # Failure
        response = await ac.get(f"/api/v1/attendance/student/some-other-id")
        assert response.status_code == 404
from app.models.user import User
