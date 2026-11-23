from abc import ABC, abstractmethod
from typing import Any, Optional


class ICacheRepository(ABC):
    """Contrato para sistemas de caché (memoria, Redis, etc.)."""

    @abstractmethod
    def get(self, key: str) -> Optional[Any]:
        ...

    @abstractmethod
    def set(self, key: str, value: Any, ttl_seconds: int = 300) -> None:
        ...

    @abstractmethod
    def delete(self, key: str) -> None:
        ...
