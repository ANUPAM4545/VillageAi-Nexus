import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

async def get_auth_token(email: str) -> str:
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        response = await ac.post("/api/v1/auth/login", json={
            "email": email,
            "password": "password123"
        })
        return response.cookies.get("access_token")

@pytest.fixture
async def tokens():
    return {
        "super_admin": await get_auth_token("super_admin@example.com"),
        "schoola_admin": await get_auth_token("schoola_admin@example.com"),
        "schoola_teacher": await get_auth_token("schoola_teacher@example.com"),
        "schoola_student": await get_auth_token("schoola_student@example.com"),
        "schoolb_admin": await get_auth_token("schoolb_admin@example.com"),
        "schoolb_student": await get_auth_token("schoolb_student@example.com"),
    }

@pytest.fixture
async def test_data(tokens):
    # Fetch schools and existing students to get IDs
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test", cookies={"access_token": tokens["super_admin"]}
    ) as ac:
        schools = (await ac.get("/api/v1/schools/")).json()
        school_a_id = next(s["id"] for s in schools if s["name"] == "School A")
        school_b_id = next(s["id"] for s in schools if s["name"] == "School B")
        
        res = await ac.get(f"/api/v1/students/?school_id={school_a_id}")
        school_a_students = res.json()["items"]
        student_a_alice = next(s for s in school_a_students if s["student_id"] == "STU-A-001")
        
        res_b = await ac.get(f"/api/v1/students/?school_id={school_b_id}")
        school_b_students = res_b.json()["items"]
        student_b_charlie = next(s for s in school_b_students if s["student_id"] == "STU-B-001")
        
        return {
            "school_a_id": school_a_id,
            "school_b_id": school_b_id,
            "student_a_alice_id": student_a_alice["id"],
            "student_b_charlie_id": student_b_charlie["id"]
        }

import uuid

@pytest.mark.asyncio
async def test_create_student_rbac(tokens, test_data):
    # 1. School Admin can create in their own school
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test", cookies={"access_token": tokens["schoola_admin"]}
    ) as ac:
        unique_id = str(uuid.uuid4())[:8]
        res = await ac.post("/api/v1/students/", json={
            "student_id": f"NEW-STU-{unique_id}",
            "name": "New Student",
            "grade": "10",
            "status": "ACTIVE"
        })
        print(f"CREATE RESPONSE: {res.status_code} - {res.json()}")
        assert res.status_code == 201
        assert res.json()["school_id"] == test_data["school_a_id"]

    # 2. Teacher cannot create student
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test", cookies={"access_token": tokens["schoola_teacher"]}
    ) as ac:
        res = await ac.post("/api/v1/students/", json={
            "student_id": "TEACH-STU",
            "name": "Hack",
            "grade": "10",
            "status": "ACTIVE"
        })
        assert res.status_code == 403

    # 3. Super Admin must provide explicit target school ID
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test", cookies={"access_token": tokens["super_admin"]}
    ) as ac:
        # Missing school_id in query parameter
        res_fail = await ac.post("/api/v1/students/", json={
            "student_id": "SUPER-FAIL",
            "name": "Fail",
            "grade": "10",
            "status": "ACTIVE"
        })
        assert res_fail.status_code == 400
        
        # Valid school_id
        unique_id2 = str(uuid.uuid4())[:8]
        res_pass = await ac.post(f"/api/v1/students/?school_id={test_data['school_b_id']}", json={
            "student_id": f"SUPER-PASS-{unique_id2}",
            "name": "Pass",
            "grade": "10",
            "status": "ACTIVE"
        })
        assert res_pass.status_code == 201
        assert res_pass.json()["school_id"] == test_data["school_b_id"]

@pytest.mark.asyncio
async def test_update_student_tenant_isolation(tokens, test_data):
    # School A Admin tries to update School B student
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test", cookies={"access_token": tokens["schoola_admin"]}
    ) as ac:
        res = await ac.patch(f"/api/v1/students/{test_data['student_b_charlie_id']}", json={
            "name": "Hacked Name"
        })
        assert res.status_code == 404 # Isolated, can't find cross-tenant

@pytest.mark.asyncio
async def test_student_self_access(tokens, test_data):
    # Student A (Alice) can access Alice
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test", cookies={"access_token": tokens["schoola_student"]}
    ) as ac:
        res = await ac.get(f"/api/v1/students/{test_data['student_a_alice_id']}")
        assert res.status_code == 200
        
        # Student A cannot access Student B (Charlie - different school)
        res_cross = await ac.get(f"/api/v1/students/{test_data['student_b_charlie_id']}")
        print(f"CROSS RESPONSE: {res_cross.status_code} - {res_cross.json()}")
        assert res_cross.status_code == 404
        
        # Student A cannot list students
        res_list = await ac.get("/api/v1/students/")
        assert res_list.status_code == 403

@pytest.mark.asyncio
async def test_list_and_filter_students(tokens, test_data):
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test", cookies={"access_token": tokens["schoola_admin"]}
    ) as ac:
        # Search filter
        res = await ac.get("/api/v1/students/?search=Alice")
        assert res.status_code == 200
        data = res.json()
        assert len(data["items"]) == 1
        assert data["items"][0]["name"] == "Alice Student"
        assert data["total"] == 1
        
        # Grade filter
        res_grade = await ac.get("/api/v1/students/?grade=10")
        assert res_grade.status_code == 200
        assert len(res_grade.json()["items"]) >= 2
        
        # Check pagination bounds
        res_page = await ac.get("/api/v1/students/?page=1&page_size=1")
        assert res_page.status_code == 200
        assert len(res_page.json()["items"]) == 1
        assert res_page.json()["total"] >= 2
