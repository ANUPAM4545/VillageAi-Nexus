from abc import ABC, abstractmethod
from typing import List, Dict

class AIProviderError(Exception):
    pass

class AIRateLimitError(AIProviderError):
    pass

class AITimeoutError(AIProviderError):
    pass

class AIProvider(ABC):
    @abstractmethod
    async def generate_response(self, messages: List[Dict[str, str]]) -> str:
        """
        Generate a response given a list of messages.
        Messages follow the format: [{"role": "user", "content": "..."}]
        """
        pass

    @abstractmethod
    async def stream_response(self, messages: List[Dict[str, str]]):
        """
        Generate a streaming response given a list of messages.
        Yields string chunks as they are generated.
        """
        pass
