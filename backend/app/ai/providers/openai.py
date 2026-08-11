from typing import List, Dict
import httpx
import json
from ..base import AIProvider, AIProviderError, AIRateLimitError, AITimeoutError
from app.core.config import settings

class OpenAIProvider(AIProvider):
    def __init__(self):
        self.api_key = getattr(settings, "AI_API_KEY", "")
        self.model = getattr(settings, "AI_MODEL", "gpt-4o-mini")
        self.base_url = "https://api.openai.com/v1/chat/completions"

    async def generate_response(self, messages: List[Dict[str, str]]) -> str:
        if not self.api_key:
            raise AIProviderError("AI configuration missing")

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": self.model,
            "messages": messages,
            "max_tokens": 1000
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(self.base_url, headers=headers, json=payload)
                
                if response.status_code == 429:
                    raise AIRateLimitError("Rate limit exceeded")
                
                if response.status_code != 200:
                    raise AIProviderError(f"Provider returned {response.status_code}")

                data = response.json()
                return data["choices"][0]["message"]["content"]
                
        except httpx.TimeoutException:
            raise AITimeoutError("The AI assistant timed out while thinking.")
        except httpx.RequestError:
            raise AIProviderError("Failed to connect to AI provider.")
        except (KeyError, IndexError, json.JSONDecodeError):
            raise AIProviderError("Invalid response from AI provider.")

    async def stream_response(self, messages: List[Dict[str, str]]):
        if not self.api_key:
            raise AIProviderError("AI configuration missing")

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": self.model,
            "messages": messages,
            "max_tokens": 1000,
            "stream": True
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                async with client.stream("POST", self.base_url, headers=headers, json=payload) as response:
                    if response.status_code == 429:
                        raise AIRateLimitError("Rate limit exceeded")
                    if response.status_code != 200:
                        raise AIProviderError(f"Provider returned {response.status_code}")
                    
                    async for line in response.aiter_lines():
                        line = line.strip()
                        if line.startswith("data: "):
                            data_str = line[6:]
                            if data_str == "[DONE]":
                                break
                            try:
                                data = json.loads(data_str)
                                chunk = data.get("choices", [{}])[0].get("delta", {}).get("content", "")
                                if chunk:
                                    yield chunk
                            except (json.JSONDecodeError, KeyError, IndexError):
                                pass
        except httpx.TimeoutException:
            raise AITimeoutError("The AI assistant timed out while thinking.")
        except httpx.RequestError:
            raise AIProviderError("Failed to connect to AI provider.")
