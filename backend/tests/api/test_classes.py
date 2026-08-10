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
async def test_class_crud_and_rbac():
    token_super = await get_auth_token("super_admin@example.com")
    token_admin_a = await get_auth_token("schoola_admin@example.com")
    token_teacher_a = await get_auth_token("schoola_teacher@example.com")

    import uuid
    run_id = uuid.uuid4().hex[:4]
    
    # School Admin A can create class
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test", cookies={"access_token": token_admin_a}) as ac:
        res = await ac.post("/api/v1/classes/", json={
            "grade": f"11-{run_id}",
            "section": f"A-{run_id}",
            "name": f"11th Grade A {run_id}"
        })
        assert res.status_code == 201, res.text
        cls_a_id = res.json()["id"]

        # List classes
        res_list = await ac.get("/api/v1/classes/")
        assert res_list.status_code == 200
        assert res_list.json()["total"] >= 3 # seed has 2, we just created 1

        # Update class
        res_update = await ac.patch(f"/api/v1/classes/{cls_a_id}", json={
            "name": "11th Grade A Updated"
        })
        assert res_update.status_code == 200
        assert res_update.json()["name"] == "11th Grade A Updated"

    # Teacher A cannot create or update
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test", cookies={"access_token": token_teacher_a}) as ac:
        res = await ac.post("/api/v1/classes/", json={
            "grade": "12",
            "section": "A",
            "name": "12th Grade A"
        })
        assert res.status_code == 403

        res_update = await ac.patch(f"/api/v1/classes/{cls_a_id}", json={
            "name": "Teacher Update Attempt"
        })
        assert res_update.status_code == 403

@pytest.mark.asyncio
async def test_class_tenant_isolation_and_assignment():
    token_admin_a = await get_auth_token("schoola_admin@example.com")
    token_super = await get_auth_token("super_admin@example.com")
    
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test", cookies={"access_token": token_super}) as ac:
        schools = (await ac.get("/api/v1/schools/")).json()
        school_b_id = next(s["id"] for s in schools if s["name"] == "School B")
        
        res_list_tch_b = await ac.get(f"/api/v1/teachers/?school_id={school_b_id}")
        tch_b_id = res_list_tch_b.json()["items"][0]["id"]
        
        res_list_cls_b = await ac.get(f"/api/v1/classes/?school_id={school_b_id}")
        cls_b_id = res_list_cls_b.json()["items"][0]["id"]
        
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test", cookies={"access_token": token_admin_a}) as ac:
        # School A Admin cannot view Class B
        res = await ac.get(f"/api/v1/classes/{cls_b_id}")
        assert res.status_code == 404
        
        # Cross-school assignment attempt
        # Create a class in School A and try to assign Teacher B
        res_create = await ac.post("/api/v1/classes/", json={
            "grade": "8",
            "section": "A",
            "teacher_id": tch_b_id
        })
        # Should be rejected
        assert res_create.status_code == 400
        assert "Teacher must belong to the same school" in res_create.json()["detail"]

@pytest.mark.asyncio
async def test_teacher_class_visibility():
    token_teacher_a = await get_auth_token("schoola_teacher@example.com")
    token_admin_a = await get_auth_token("schoola_admin@example.com")
    
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test", cookies={"access_token": token_admin_a}) as ac:
        classes = (await ac.get("/api/v1/classes/")).json()["items"]
        # Find a class assigned to TCH-A-001 (which is schoola_teacher@example.com)
        # The seed script creates "10th Grade Section A" assigned to TCH-A-001
        cls_assigned_id = next(c["id"] for c in classes if c["grade"] == "10" and c["section"] == "A")
        cls_unassigned_id = next(c["id"] for c in classes if c["grade"] == "10" and c["section"] == "B")
        
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test", cookies={"access_token": token_teacher_a}) as ac:
        # Should see only assigned classes in list
        res_list = await ac.get("/api/v1/classes/")
        assert res_list.status_code == 200
        assert len(res_list.json()["items"]) == 1
        assert res_list.json()["items"][0]["id"] == cls_assigned_id
        
        # Can view assigned class
        res_get = await ac.get(f"/api/v1/classes/{cls_assigned_id}")
        assert res_get.status_code == 200
        
        # Cannot view unassigned class
        res_get_unassigned = await ac.get(f"/api/v1/classes/{cls_unassigned_id}")
        assert res_get_unassigned.status_code == 403
