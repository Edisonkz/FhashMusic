from pathlib import Path
from typing import Callable, Optional

from domain.entities.download_task import DownloadFormat, DownloadStatus, DownloadTask
from domain.exceptions import DownloadError
from domain.repositories.download_repository import IDownloadRepository
from domain.repositories.youtube_repository import IYoutubeRepository


class DownloadSongUseCase:
    """
    Caso de uso: Descargar y convertir una canción en MP3 o MP4.
    """

    def __init__(
        self,
        youtube_repo: IYoutubeRepository,
        download_repo: IDownloadRepository,
        output_dir: Path,
    ):
        self._youtube = youtube_repo
        self._downloader = download_repo
        self._output_dir = output_dir

    def execute(
        self,
        song_id: str,
        format: DownloadFormat,
        on_update: Optional[Callable[[DownloadTask], None]] = None,
    ) -> DownloadTask:
        task = DownloadTask(song_id=song_id, format=format, status=DownloadStatus.PENDING, progress=5)
        if on_update:
            on_update(task)

        try:
            task.status = DownloadStatus.DOWNLOADING
            task.progress = 30
            if on_update:
                on_update(task)

            download_url = self._youtube.get_download_url(song_id, format.value)

            task.status = DownloadStatus.CONVERTING
            task.progress = 75
            if on_update:
                on_update(task)

            output_path = self._downloader.download(
                url=download_url,
                song_id=song_id,
                format=format,
                output_dir=self._output_dir,
            )

            task.status = DownloadStatus.COMPLETED
            task.progress = 100
            task.output_path = str(output_path)
            if on_update:
                on_update(task)
            return task

        except Exception as exc:
            task.status = DownloadStatus.FAILED
            task.error_message = str(exc)
            if on_update:
                on_update(task)
            raise DownloadError(f"Fallo descarga de {song_id}: {exc}") from exc
