from abc import ABC, abstractmethod
from pathlib import Path

from domain.entities.download_task import DownloadFormat


class IDownloadRepository(ABC):
    """Contrato para motores de descarga/conversión (yt-dlp + FFmpeg)."""

    @abstractmethod
    def download(
        self,
        url: str,
        song_id: str,
        format: DownloadFormat,
        output_dir: Path,
    ) -> Path:
        """Descarga y convierte el medio en output_dir y retorna la ruta resultante."""
