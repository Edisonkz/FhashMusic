from abc import ABC, abstractmethod
from typing import List

from domain.entities.song import Song


class ILibraryRepository(ABC):
    """Contrato para persistencia de la biblioteca musical local."""

    @abstractmethod
    def list_songs(self) -> List[Song]:
        ...

    @abstractmethod
    def add_song(self, song: Song) -> Song:
        ...

    @abstractmethod
    def remove_song(self, song_id: str) -> bool:
        ...
