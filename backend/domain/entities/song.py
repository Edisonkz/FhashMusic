from dataclasses import dataclass
from typing import Optional


@dataclass
class Song:
    """
    Entidad central del dominio. Representa una canción descubierta o guardada.
    Sin dependencias de FastAPI, yt-dlp ni bases de datos.
    """

    id: str
    title: str
    uploader: str
    duration: int
    url: str
    thumbnail: Optional[str] = None
    genre: Optional[str] = None

    @property
    def duration_formatted(self) -> str:
        safe_duration = max(0, int(self.duration or 0))
        minutes = safe_duration // 60
        seconds = safe_duration % 60
        return f"{minutes}:{seconds:02d}"
