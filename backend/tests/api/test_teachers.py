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

@pytest.mark.asyncio
async def test_teacher_crud_and_rbac():
    token_super = await get_auth_token("super_admin@example.com")
    token_admin_a = await get_auth_token("schoola_admin@example.com")
    token_teacher_a = await get_auth_token("schoola_teacher@example.com")
    token_student_a = await get_auth_token("schoola_student@example.com")

    import uuid
    run_id = uuid.uuid4().hex[:4]
    
    # Super Admin can create teacher
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test", cookies={"access_token": token_super}) as ac:
        # Need School A's ID
        schools = (await ac.get("/api/v1/schools/")).json()
        school_a_id = next(s["id"] for s in schools if s["name"] == "School A")
        school_b_id = next(s["id"] for s in schools if s["name"] == "School B")

        res = await ac.post(f"/api/v1/teachers/?school_id={school_a_id}", json={
            "teacher_id": f"TCH-A-{run_id}",
            "name": "Super Created Teacher",
            "email": f"super.teacher.{run_id}@schoola.com",
            "phone": "999-999-9999",
            "status": "ACTIVE"
        })
        assert res.status_code == 201, res.text

        # School Admin A can create teacher
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test", cookies={"access_token": token_admin_a}) as ac:
            res = await ac.post("/api/v1/teachers/", json={
                "teacher_id": f"TCH-A-{run_id}-B",
                "name": "Admin Created Teacher",
                "email": f"admin.teacher.{run_id}@schoola.com"
            })
            assert res.status_code == 201
            tch_a_4_id = res.json()["id"]
    
            # List teachers
            res_list = await ac.get("/api/v1/teachers/")
            assert res_list.status_code == 200
            assert res_list.json()["total"] >= 4
    
            # Update teacher
            res_update = await ac.patch(f"/api/v1/teachers/{tch_a_4_id}", json={
                "name": "Updated Admin Teacher"
            })
            assert res_update.status_code == 200
            assert res_update.json()["name"] == "Updated Admin Teacher"
    
    # Teacher A cannot create or update
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test", cookies={"access_token": token_teacher_a}) as ac:
        res = await ac.post("/api/v1/teachers/", json={
            "teacher_id": "TCH-A-005",
            "name": "Teacher Created Teacher",
            "email": "teacher.teacher@schoola.com"
        })
        assert res.status_code == 403

        res_update = await ac.patch(f"/api/v1/teachers/{tch_a_4_id}", json={
            "name": "Teacher Updated Teacher"
        })
        assert res_update.status_code == 403

        # Teacher A cannot list teachers
        res_list = await ac.get("/api/v1/teachers/")
        assert res_list.status_code == 403

@pytest.mark.asyncio
async def test_teacher_tenant_isolation():
    token_admin_a = await get_auth_token("schoola_admin@example.com")
    token_teacher_b = await get_auth_token("schoolb_teacher@example.com")
    
    # Need to get a Teacher B ID
    token_super = await get_auth_token("super_admin@example.com")
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test", cookies={"access_token": token_super}) as ac:
        schools = (await ac.get("/api/v1/schools/")).json()
        school_b_id = next(s["id"] for s in schools if s["name"] == "School B")
        res_list_b = await ac.get(f"/api/v1/teachers/?school_id={school_b_id}")
        tch_b_1_id = res_list_b.json()["items"][0]["id"]

    # School A Admin cannot view Teacher B
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test", cookies={"access_token": token_admin_a}) as ac:
        res = await ac.get(f"/api/v1/teachers/{tch_b_1_id}")
        assert res.status_code == 404

    # Teacher B can view own profile
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test", cookies={"access_token": token_teacher_b}) as ac:
        # First, need to find Teacher B's profile ID based on user link
        # The seed maps schoolb_teacher@example.com to TCH-B-001
        res = await ac.get(f"/api/v1/teachers/{tch_b_1_id}")
        assert res.status_code == 200
        
        # But Teacher B cannot view another Teacher B profile
        res_list_b_as_super = await ac.get(f"/api/v1/teachers/?school_id={school_b_id}", cookies={"access_token": token_super})
        tch_b_2_id = res_list_b_as_super.json()["items"][1]["id"]
        
        res_other = await ac.get(f"/api/v1/teachers/{tch_b_2_id}")
        assert res_other.status_code == 403

@pytest.mark.asyncio
async def test_teacher_validation():
    token_admin_a = await get_auth_token("schoola_admin@example.com")
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test", cookies={"access_token": token_admin_a}) as ac:
        # Invalid status
        res = await ac.post("/api/v1/teachers/", json={
            "teacher_id": "TCH-A-006",
            "name": "Invalid Status",
            "email": "invalid@schoola.com",
            "status": "RANDOM"
        })
        assert res.status_code == 422
        
        # Duplicate Teacher ID
        res = await ac.post("/api/v1/teachers/", json={
            "teacher_id": "TCH-A-001",
            "name": "Duplicate ID",
            "email": "duplicate@schoola.com"
        })
        assert res.status_code == 400
        assert "already exists" in res.json()["detail"] or "constraint violation" in res.json()["detail"].lower()
