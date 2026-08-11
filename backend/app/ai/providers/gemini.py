from typing import List, Dict
import httpx
import json
from ..base import AIProvider, AIProviderError, AIRateLimitError, AITimeoutError
from app.core.config import settings

class GeminiProvider(AIProvider):
    def __init__(self):
        self.api_key = getattr(settings, "AI_API_KEY", "")
        self.model = getattr(settings, "AI_MODEL", "gemini-flash-latest")
        # Standard endpoint for SSE streaming
        self.base_url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:streamGenerateContent"
        
        # We also need a non-streaming endpoint for generate_response
        self.generate_url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent"

    def _prepare_payload(self, messages: List[Dict[str, str]]) -> dict:
        contents = []
        system_instruction = None

        for msg in messages:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            
            if role == "system":
                system_instruction = {"parts": [{"text": content}]}
            elif role == "user":
                contents.append({"role": "user", "parts": [{"text": content}]})
            elif role == "assistant":
                contents.append({"role": "model", "parts": [{"text": content}]})
                
        payload = {"contents": contents}
        if system_instruction:
            payload["systemInstruction"] = system_instruction
            
        return payload

    async def generate_response(self, messages: List[Dict[str, str]]) -> str:
        if not self.api_key:
            raise AIProviderError("AI configuration missing")

        payload = self._prepare_payload(messages)
        headers = {"Content-Type": "application/json"}
        url = f"{self.generate_url}?key={self.api_key}"

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(url, headers=headers, json=payload)
                
                if response.status_code == 429:
                    raise AIRateLimitError("Rate limit exceeded")
                
                if response.status_code != 200:
                    raise AIProviderError(f"Provider returned {response.status_code}: {response.text}")

                data = response.json()
                try:
                    return data["candidates"][0]["content"]["parts"][0]["text"]
                except (KeyError, IndexError):
                    raise AIProviderError("Invalid response format from Gemini API.")
                
        except httpx.TimeoutException:
            raise AITimeoutError("The AI assistant timed out while thinking.")
        except httpx.RequestError:
            raise AIProviderError("Failed to connect to AI provider.")

    async def stream_response(self, messages: List[Dict[str, str]]):
        if not self.api_key:
            raise AIProviderError("AI configuration missing")

        payload = self._prepare_payload(messages)
        headers = {"Content-Type": "application/json"}
        # alt=sse tells Gemini API to return Server-Sent Events
        url = f"{self.base_url}?alt=sse&key={self.api_key}"

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                async with client.stream("POST", url, headers=headers, json=payload) as response:
                    if response.status_code == 429:
                        raise AIRateLimitError("Rate limit exceeded")
                    if response.status_code != 200:
                        err = await response.aread()
                        raise AIProviderError(f"Provider returned {response.status_code}: {err.decode('utf-8')}")
                    
                    async for line in response.aiter_lines():
                        line = line.strip()
                        if line.startswith("data: "):
                            data_str = line[6:]
                            if not data_str:
                                continue
                                
                            try:
                                data = json.loads(data_str)
                                candidates = data.get("candidates", [])
                                if candidates:
                                    parts = candidates[0].get("content", {}).get("parts", [])
                                    for part in parts:
                                        chunk = part.get("text", "")
                                        if chunk:
                                            yield chunk
                            except json.JSONDecodeError:
                                pass
        except httpx.TimeoutException:
            raise AITimeoutError("The AI assistant timed out while thinking.")
        except httpx.RequestError:
            raise AIProviderError("Failed to connect to AI provider.")
