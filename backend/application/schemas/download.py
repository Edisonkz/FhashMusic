from typing import Literal, Optional

from pydantic import BaseModel, Field

from domain.entities.download_task import DownloadTask


class DownloadRequest(BaseModel):
    song_id: str = Field(..., min_length=1, description="ID del video en YouTube")
    format: Literal["mp3", "mp4"] = "mp3"


class DownloadResponse(BaseModel):
    song_id: str
    format: Literal["mp3", "mp4"]
    status: str
    progress: int = Field(default=0, ge=0, le=100)
    output_path: str = ""
    error_message: str = ""
    title: Optional[str] = None
    uploader: Optional[str] = None
    thumbnail: Optional[str] = None

    @classmethod
    def from_entity(cls, task: DownloadTask) -> "DownloadResponse":
        return cls(
            song_id=task.song_id,
            format=task.format.value,
            status=task.status.value,
            progress=task.progress,
            output_path=task.output_path,
            error_message=task.error_message,
            title=task.title,
            uploader=task.uploader,
            thumbnail=task.thumbnail,
        )
