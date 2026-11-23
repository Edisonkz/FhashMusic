from abc import ABC, abstractmethod
from typing import List

from domain.entities.song import Song


class IYoutubeRepository(ABC):
    """Contrato para proveedores de búsqueda y extracción de enlaces de audio/video."""

    @abstractmethod
    def search(self, query: str, max_results: int = 5) -> List[Song]:
        """Busca canciones por nombre, artista o URL."""

    @abstractmethod
    def get_download_url(self, song_id: str, format: str = "mp3") -> str:
        """Obtiene la URL directa de stream/descarga para un video dado."""
