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
async def test_super_admin_school_access():
    token = await get_auth_token("super_admin@example.com")
    
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test", cookies={"access_token": token}
    ) as ac:
        # Super admin can list all schools
        res = await ac.get("/api/v1/schools/")
        assert res.status_code == 200
        schools = res.json()
        assert len(schools) >= 2
        
        school_a_id = next(s["id"] for s in schools if s["name"] == "School A")
        school_b_id = next(s["id"] for s in schools if s["name"] == "School B")
        
        # Super admin can get specific schools
        res_a = await ac.get(f"/api/v1/schools/{school_a_id}")
        assert res_a.status_code == 200
        
        res_b = await ac.get(f"/api/v1/schools/{school_b_id}")
        assert res_b.status_code == 200

@pytest.mark.asyncio
async def test_school_a_admin_isolation():
    token_super = await get_auth_token("super_admin@example.com")
    token_admin = await get_auth_token("schoola_admin@example.com")
    
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test", cookies={"access_token": token_super}
    ) as ac:
        schools = (await ac.get("/api/v1/schools/")).json()
        school_a_id = next(s["id"] for s in schools if s["name"] == "School A")
        school_b_id = next(s["id"] for s in schools if s["name"] == "School B")
        
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test", cookies={"access_token": token_admin}
    ) as ac:
        # Can list schools but only gets School A
        res = await ac.get("/api/v1/schools/")
        assert res.status_code == 200
        assert len(res.json()) == 1
        assert res.json()[0]["id"] == school_a_id
        
        # Can access School A
        res_a = await ac.get(f"/api/v1/schools/{school_a_id}")
        assert res_a.status_code == 200
        
        # Cannot access School B
        res_b = await ac.get(f"/api/v1/schools/{school_b_id}")
        assert res_b.status_code == 404 # 404 to avoid information disclosure
        
        # Can patch School A
        patch_a = await ac.patch(f"/api/v1/schools/{school_a_id}", json={"address": "New Address"})
        assert patch_a.status_code == 200
        
        # Cannot patch School B
        patch_b = await ac.patch(f"/api/v1/schools/{school_b_id}", json={"address": "New Address"})
        assert patch_b.status_code == 404

@pytest.mark.asyncio
async def test_id_tampering_ignored():
    token_super = await get_auth_token("super_admin@example.com")
    token_teacher = await get_auth_token("schoola_teacher@example.com")
    
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test", cookies={"access_token": token_super}
    ) as ac:
        schools = (await ac.get("/api/v1/schools/")).json()
        school_a_id = next(s["id"] for s in schools if s["name"] == "School A")
        school_b_id = next(s["id"] for s in schools if s["name"] == "School B")

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test", cookies={"access_token": token_teacher}
    ) as ac:
        # Teacher from School A passes School B's ID to a tenant-aware endpoint
        # Backend should completely ignore it and resolve to School A
        res = await ac.get(f"/api/v1/rbac/tenant-aware?school_id={school_b_id}")
        assert res.status_code == 200
        # Should resolve to School A, not B
        assert res.json()["resolved_school_id"] == school_a_id
        assert res.json()["resolved_school_id"] != school_b_id

@pytest.mark.asyncio
async def test_super_admin_tenant_aware_requires_param():
    token_super = await get_auth_token("super_admin@example.com")
    
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test", cookies={"access_token": token_super}
    ) as ac:
        schools = (await ac.get("/api/v1/schools/")).json()
        school_b_id = next(s["id"] for s in schools if s["name"] == "School B")
        
        # Missing school_id should 400
        res = await ac.get(f"/api/v1/rbac/tenant-aware")
        assert res.status_code == 400
        
        # With school_id works
        res_valid = await ac.get(f"/api/v1/rbac/tenant-aware?school_id={school_b_id}")
        assert res_valid.status_code == 200
        assert res_valid.json()["resolved_school_id"] == school_b_id
