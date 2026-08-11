from typing import List, Dict
import asyncio
from ..base import AIProvider, AIProviderError

class FakeAIProvider(AIProvider):
    async def generate_response(self, messages: List[Dict[str, str]]) -> str:
        # Check for special instructions to simulate failures
        if not messages:
            return "Fake response"
            
        last_message = messages[-1].get("content", "").lower()
        
        if "simulate timeout" in last_message:
            from ..base import AITimeoutError
            raise AITimeoutError("Simulated timeout")
            
        if "simulate rate limit" in last_message:
            from ..base import AIRateLimitError
            raise AIRateLimitError("Simulated rate limit")
            
        if "simulate error" in last_message:
            raise AIProviderError("Simulated provider error")

        return "This is a deterministic fake response."

    async def stream_response(self, messages: List[Dict[str, str]]):
        if not messages:
            yield "Fake response"
            return
            
        last_message = messages[-1].get("content", "").lower()
        
        if "simulate timeout" in last_message:
            from ..base import AITimeoutError
            await asyncio.sleep(0.5)
            raise AITimeoutError("Simulated timeout")
            
        if "simulate rate limit" in last_message:
            from ..base import AIRateLimitError
            raise AIRateLimitError("Simulated rate limit")
            
        if "simulate error" in last_message:
            raise AIProviderError("Simulated provider error")

        fake_text = "This is a deterministic fake response. "
        # Generate enough text to see the stream
        long_fake_text = fake_text * 10 
        
        # Split into chunks of 10 characters
        chunk_size = 10
        for i in range(0, len(long_fake_text), chunk_size):
            chunk = long_fake_text[i:i+chunk_size]
            yield chunk
            await asyncio.sleep(0.05)
