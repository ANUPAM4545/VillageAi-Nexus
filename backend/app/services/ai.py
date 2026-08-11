from typing import List, Dict, Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException
from app.models.ai import MessageRole, Conversation
from app.repositories.ai import AIRepository
from app.ai.base import AIProvider, AIProviderError, AIRateLimitError, AITimeoutError
from app.ai.providers.openai import OpenAIProvider
from app.ai.providers.fake import FakeAIProvider
from app.ai.providers.gemini import GeminiProvider
from app.core.config import settings

def get_ai_provider() -> AIProvider:
    # Factory to get the correct provider.
    # In tests we can override this or depend on settings
    provider_name = getattr(settings, "AI_PROVIDER", "openai").lower()
    if provider_name == "fake":
        return FakeAIProvider()
    if provider_name == "gemini":
        return GeminiProvider()
    return OpenAIProvider()

class AIService:
    @staticmethod
    async def create_conversation(db: AsyncSession, student_id: str, school_id: str, title: Optional[str] = None) -> Conversation:
        return await AIRepository.create_conversation(db, student_id, school_id, title)

    @staticmethod
    async def send_message(db: AsyncSession, conversation_id: str, student_id: str, school_id: str, content: str) -> Tuple[Conversation, str]:
        # 1. Verify ownership
        conversation = await AIRepository.get_student_conversation(db, conversation_id, student_id, school_id)
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")

        # 2. Update title if first message
        if not conversation.title:
            new_title = content[:30] + ("..." if len(content) > 30 else "")
            conversation.title = new_title
            await db.commit()

        # 3. Save USER message
        await AIRepository.add_message(db, conversation_id, MessageRole.USER, content)

        # 4. Load context (last 10 messages)
        # Refresh conversation to get messages
        conversation = await AIRepository.get_student_conversation(db, conversation_id, student_id, school_id)
        if not conversation or not conversation.messages:
            raise HTTPException(status_code=500, detail="Failed to load conversation context")

        # Get last 10 messages
        recent_messages = conversation.messages[-10:]
        
        provider_messages = []
        # Add system prompt
        provider_messages.append({
            "role": "system",
            "content": "You are a helpful educational assistant for students. Explain concepts clearly and simply. Do not claim to know private school data."
        })
        for msg in recent_messages:
            provider_messages.append({
                "role": "user" if msg.role == MessageRole.USER else "assistant",
                "content": msg.content
            })

        # 5. Call Provider
        provider = get_ai_provider()
        try:
            assistant_response_content = await provider.generate_response(provider_messages)
        except AITimeoutError:
            raise HTTPException(status_code=504, detail="The AI assistant is temporarily unavailable (timeout). Please try again.")
        except AIRateLimitError:
            raise HTTPException(status_code=429, detail="Rate limit exceeded. Please try again later.")
        except AIProviderError:
            raise HTTPException(status_code=503, detail="The AI assistant is temporarily unavailable. Please try again in a moment.")
        except Exception:
            raise HTTPException(status_code=500, detail="An unexpected error occurred while contacting the AI assistant.")

        # 6. Save ASSISTANT message
        await AIRepository.add_message(db, conversation_id, MessageRole.ASSISTANT, assistant_response_content)

        # Return updated conversation and response content
        conversation = await AIRepository.get_student_conversation(db, conversation_id, student_id, school_id)
        return conversation, assistant_response_content # type: ignore

    @staticmethod
    async def stream_message(db: AsyncSession, conversation_id: str, student_id: str, school_id: str, content: str):
        import json
        import asyncio
        
        # 1. Verify ownership
        conversation = await AIRepository.get_student_conversation(db, conversation_id, student_id, school_id)
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")

        # 2. Update title if first message
        if not conversation.title:
            new_title = content[:30] + ("..." if len(content) > 30 else "")
            conversation.title = new_title
            await db.commit()

        # 3. Save USER message
        await AIRepository.add_message(db, conversation_id, MessageRole.USER, content)

        # 4. Load context
        conversation = await AIRepository.get_student_conversation(db, conversation_id, student_id, school_id)
        if not conversation or not conversation.messages:
            raise HTTPException(status_code=500, detail="Failed to load conversation context")

        recent_messages = conversation.messages[-10:]
        
        provider_messages = []
        provider_messages.append({
            "role": "system",
            "content": "You are a helpful educational assistant for students. Explain concepts clearly and simply. Do not claim to know private school data."
        })
        for msg in recent_messages:
            provider_messages.append({
                "role": "user" if msg.role == MessageRole.USER else "assistant",
                "content": msg.content
            })

        provider = get_ai_provider()
        accumulated_response = ""
        
        yield f"event: message_start\ndata: {json.dumps({'message_id': 'started'})}\n\n"
        
        try:
            async for chunk in provider.stream_response(provider_messages):
                accumulated_response += chunk
                yield f"event: chunk\ndata: {json.dumps({'content': chunk})}\n\n"
                
            yield f"event: message_complete\ndata: {json.dumps({'message_id': 'completed', 'content': accumulated_response})}\n\n"
        except AITimeoutError:
            yield f"event: error\ndata: {json.dumps({'message': 'The AI assistant timed out while generating a response.'})}\n\n"
        except AIRateLimitError:
            yield f"event: error\ndata: {json.dumps({'message': 'Rate limit exceeded. Please try again later.'})}\n\n"
        except AIProviderError:
            yield f"event: error\ndata: {json.dumps({'message': 'The AI assistant is temporarily unavailable.'})}\n\n"
        except asyncio.CancelledError:
            # The client aborted the stream or disconnected
            pass
        except Exception:
            yield f"event: error\ndata: {json.dumps({'message': 'An unexpected error occurred while generating the response.'})}\n\n"
        finally:
            if accumulated_response.strip():
                try:
                    await AIRepository.add_message(db, conversation_id, MessageRole.ASSISTANT, accumulated_response)
                except Exception:
                    # Ignore if DB session is closed upon cancellation
                    pass
