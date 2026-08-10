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
async def test_create_school_validation_and_rbac():
    token_super = await get_auth_token("super_admin@example.com")
    token_admin = await get_auth_token("schoola_admin@example.com")
    
    # 1. School Admin cannot create schools
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test", cookies={"access_token": token_admin}
    ) as ac:
        res = await ac.post("/api/v1/schools/", json={"name": "New School"})
        assert res.status_code == 403

    # 2. Super Admin can create, but validation applies
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test", cookies={"access_token": token_super}
    ) as ac:
        # Invalid status
        res_invalid_status = await ac.post("/api/v1/schools/", json={
            "name": "Invalid Status School",
            "status": "RANDOM"
        })
        assert res_invalid_status.status_code == 422 # Pydantic validation error

        # Name too long
        res_long = await ac.post("/api/v1/schools/", json={
            "name": "A" * 101
        })
        assert res_long.status_code == 422
        
        # Valid creation
        res_valid = await ac.post("/api/v1/schools/", json={
            "name": "Valid School",
            "status": "ACTIVE"
        })
        assert res_valid.status_code == 201

@pytest.mark.asyncio
async def test_update_school_validation_and_rbac():
    token_super = await get_auth_token("super_admin@example.com")
    token_admin = await get_auth_token("schoola_admin@example.com")
    token_teacher = await get_auth_token("schoola_teacher@example.com")
    
    # Get School A ID
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test", cookies={"access_token": token_super}
    ) as ac:
        schools = (await ac.get("/api/v1/schools/")).json()
        school_a_id = next(s["id"] for s in schools if s["name"] == "School A")
        school_b_id = next(s["id"] for s in schools if s["name"] == "School B")

    # 1. Teacher cannot update school
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test", cookies={"access_token": token_teacher}
    ) as ac:
        res = await ac.patch(f"/api/v1/schools/{school_a_id}", json={"name": "Teacher Hack"})
        assert res.status_code == 403

    # 2. School Admin cannot update School B
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test", cookies={"access_token": token_admin}
    ) as ac:
        res = await ac.patch(f"/api/v1/schools/{school_b_id}", json={"name": "Admin Hack"})
        assert res.status_code == 404
        
        # 3. School Admin can update School A, but with validation
        res_invalid = await ac.patch(f"/api/v1/schools/{school_a_id}", json={"status": "FAKE"})
        assert res_invalid.status_code == 422
        
        res_valid = await ac.patch(f"/api/v1/schools/{school_a_id}", json={"address": "New Address A"})
        assert res_valid.status_code == 200
        assert res_valid.json()["address"] == "New Address A"

@pytest.mark.asyncio
async def test_school_statistics():
    token_super = await get_auth_token("super_admin@example.com")
    token_admin = await get_auth_token("schoola_admin@example.com")
    
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test", cookies={"access_token": token_super}
    ) as ac:
        schools = (await ac.get("/api/v1/schools/")).json()
        school_a_id = next(s["id"] for s in schools if s["name"] == "School A")
        school_b_id = next(s["id"] for s in schools if s["name"] == "School B")
        
        # Super Admin gets stats for School A
        res_super_a = await ac.get(f"/api/v1/schools/{school_a_id}/statistics")
        assert res_super_a.status_code == 200
        assert res_super_a.json() == {
            "school_admin_count": 1,
            "teacher_count": 1,
            "student_count": 1
        }
        
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test", cookies={"access_token": token_admin}
    ) as ac:
        # School A Admin gets stats for School A
        res_admin_a = await ac.get(f"/api/v1/schools/{school_a_id}/statistics")
        assert res_admin_a.status_code == 200
        
        # School A Admin denied stats for School B
        res_admin_b = await ac.get(f"/api/v1/schools/{school_b_id}/statistics")
        assert res_admin_b.status_code == 404
