import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_login_success():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        response = await ac.post("/api/v1/auth/login", json={
            "email": "super_admin@example.com",
            "password": "password123"
        })
    assert response.status_code == 200
    assert response.json()["success"] is True
    assert "access_token" in response.cookies

@pytest.mark.asyncio
async def test_login_invalid_credentials():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        response = await ac.post("/api/v1/auth/login", json={
            "email": "super_admin@example.com",
            "password": "wrongpassword"
        })
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_get_me_unauthenticated():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        response = await ac.get("/api/v1/auth/me")
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_get_me_authenticated():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        login_response = await ac.post("/api/v1/auth/login", json={
            "email": "super_admin@example.com",
            "password": "password123"
        })
        token = login_response.cookies.get("access_token")
        
        response = await ac.get("/api/v1/auth/me", cookies={"access_token": token})
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "super_admin@example.com"
    assert "hashed_password" not in data

@pytest.mark.asyncio
async def test_logout():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        login_response = await ac.post("/api/v1/auth/login", json={
            "email": "super_admin@example.com",
            "password": "password123"
        })
        token = login_response.cookies.get("access_token")
        
        logout_response = await ac.post("/api/v1/auth/logout")
        
        # Verify me endpoint fails with cleared cookie
        response = await ac.get("/api/v1/auth/me", cookies=logout_response.cookies)
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_rbac_super_admin_success():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        login_res = await ac.post("/api/v1/auth/login", json={
            "email": "super_admin@example.com",
            "password": "password123"
        })
        token = login_res.cookies.get("access_token")
        response = await ac.get("/api/v1/rbac/super-admin-only", cookies={"access_token": token})
    assert response.status_code == 200

@pytest.mark.asyncio
async def test_rbac_forbidden():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        login_res = await ac.post("/api/v1/auth/login", json={
            "email": "schoola_teacher@example.com",
            "password": "password123"
        })
        token = login_res.cookies.get("access_token")
        response = await ac.get("/api/v1/rbac/super-admin-only", cookies={"access_token": token})
    assert response.status_code == 403
