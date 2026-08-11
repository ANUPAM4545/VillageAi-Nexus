import pytest
from httpx import AsyncClient, ASGITransport
from typing import Dict, Any, cast
from app.models.ai import Conversation, Message, MessageRole
from app.main import app
import uuid
import asyncio

# In tests, we need to bypass dependency and ensure get_ai_provider uses FakeAIProvider.
from app.services.ai import get_ai_provider
from app.ai.providers.fake import FakeAIProvider
from app.db.session import AsyncSessionLocal

@pytest.fixture
def fake_ai_provider(monkeypatch):
    monkeypatch.setattr("app.services.ai.get_ai_provider", lambda: FakeAIProvider())

async def get_auth_token(email: str) -> str:
    async with AsyncClient(
        transport=ASGITransport(app=cast(Any, app)), base_url="http://test"
    ) as ac:
        response = await ac.post("/api/v1/auth/login", json={
            "email": email,
            "password": "password123"
        })
        return response.cookies.get("access_token") or ""

@pytest.mark.asyncio
async def test_ai_requires_student_role():
    token_teacher = await get_auth_token("schoola_teacher@example.com")
    async with AsyncClient(transport=ASGITransport(app=cast(Any, app)), base_url="http://test", cookies={"access_token": token_teacher}) as ac:
        response = await ac.post("/api/v1/ai/conversations", json={"title": "Test"})
        assert response.status_code == 403

@pytest.mark.asyncio
async def test_student_can_create_conversation(fake_ai_provider):
    token_student = await get_auth_token("schoola_student@example.com")
    async with AsyncClient(transport=ASGITransport(app=cast(Any, app)), base_url="http://test", cookies={"access_token": token_student}) as ac:
        response = await ac.post("/api/v1/ai/conversations", json={"title": "Test AI"})
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Test AI"
        assert "id" in data
        assert "student_id" in data
        assert "school_id" in data

@pytest.mark.asyncio
async def test_ai_chat_flow(fake_ai_provider):
    token_student = await get_auth_token("schoola_student@example.com")
    async with AsyncClient(transport=ASGITransport(app=cast(Any, app)), base_url="http://test", cookies={"access_token": token_student}) as ac:
        res1 = await ac.post("/api/v1/ai/conversations", json={})
        conv_id = res1.json()["id"]

        res2 = await ac.post(f"/api/v1/ai/conversations/{conv_id}/messages", json={"content": "Explain photosynthesis"})
        assert res2.status_code == 200
        data = res2.json()
        
        assert data["title"] == "Explain photosynthesis"
        messages = data["messages"]
        assert len(messages) == 2
        assert messages[0]["role"] == "USER"
        assert messages[0]["content"] == "Explain photosynthesis"
        assert messages[1]["role"] == "ASSISTANT"
        assert messages[1]["content"] == "This is a deterministic fake response."

@pytest.mark.asyncio
async def test_tenant_isolation_cross_student(fake_ai_provider):
    token_student = await get_auth_token("schoola_student@example.com")
    # Manually create a conversation for another student
    conv_id = str(uuid.uuid4())
    fake_conv = Conversation(
        id=conv_id,
        student_id=str(uuid.uuid4()),
        school_id=str(uuid.uuid4()),
        title="Secret"
    )
    async with AsyncSessionLocal() as db:
        db.add(fake_conv)
        await db.commit()

    async with AsyncClient(transport=ASGITransport(app=cast(Any, app)), base_url="http://test", cookies={"access_token": token_student}) as ac:
        response = await ac.get(f"/api/v1/ai/conversations/{conv_id}")
        assert response.status_code == 404

@pytest.mark.asyncio
async def test_fake_provider_timeout_simulation(fake_ai_provider):
    token_student = await get_auth_token("schoola_student@example.com")
    async with AsyncClient(transport=ASGITransport(app=cast(Any, app)), base_url="http://test", cookies={"access_token": token_student}) as ac:
        res1 = await ac.post("/api/v1/ai/conversations", json={})
        conv_id = res1.json()["id"]

        res2 = await ac.post(f"/api/v1/ai/conversations/{conv_id}/messages", json={"content": "simulate timeout"})
        assert res2.status_code == 504
        assert "timeout" in res2.json()["detail"].lower()

        res3 = await ac.get(f"/api/v1/ai/conversations/{conv_id}")
        data = res3.json()
        assert len(data["messages"]) == 1
        assert data["messages"][0]["content"] == "simulate timeout"

@pytest.mark.asyncio
async def test_fake_provider_rate_limit(fake_ai_provider):
    token_student = await get_auth_token("schoola_student@example.com")
    async with AsyncClient(transport=ASGITransport(app=cast(Any, app)), base_url="http://test", cookies={"access_token": token_student}) as ac:
        res1 = await ac.post("/api/v1/ai/conversations", json={})
        conv_id = res1.json()["id"]

        res2 = await ac.post(f"/api/v1/ai/conversations/{conv_id}/messages", json={"content": "simulate rate limit"})
        assert res2.status_code == 429

@pytest.mark.asyncio
async def test_message_validation():
    token_student = await get_auth_token("schoola_student@example.com")
    async with AsyncClient(transport=ASGITransport(app=cast(Any, app)), base_url="http://test", cookies={"access_token": token_student}) as ac:
        res1 = await ac.post("/api/v1/ai/conversations", json={})
        conv_id = res1.json()["id"]

        res_empty = await ac.post(f"/api/v1/ai/conversations/{conv_id}/messages", json={"content": "   "})
        assert res_empty.status_code == 422

        res_large = await ac.post(f"/api/v1/ai/conversations/{conv_id}/messages", json={"content": "a" * 2001})
        assert res_large.status_code == 422

@pytest.mark.asyncio
async def test_ai_streaming_flow(fake_ai_provider):
    token_student = await get_auth_token("schoola_student@example.com")
    async with AsyncClient(transport=ASGITransport(app=cast(Any, app)), base_url="http://test", cookies={"access_token": token_student}) as ac:
        res1 = await ac.post("/api/v1/ai/conversations", json={})
        conv_id = res1.json()["id"]

        # Call stream endpoint
        async with ac.stream("POST", f"/api/v1/ai/conversations/{conv_id}/messages/stream", json={"content": "Explain streaming"}) as response:
            assert response.status_code == 200
            
            chunks = []
            async for chunk in response.aiter_text():
                chunks.append(chunk)
            
            joined_chunks = "".join(chunks)
            assert "event: message_start" in joined_chunks
            assert "event: chunk" in joined_chunks
            assert "event: message_complete" in joined_chunks
            
            # Make sure it actually saved
            res_get = await ac.get(f"/api/v1/ai/conversations/{conv_id}")
            data = res_get.json()
            assert len(data["messages"]) == 2
            assert data["messages"][0]["role"] == "USER"
            assert data["messages"][0]["content"] == "Explain streaming"
            assert data["messages"][1]["role"] == "ASSISTANT"
            # It should have accumulated the fake response chunks (e.g. 10 * fake_text)
            assert "deterministic fake response" in data["messages"][1]["content"]
