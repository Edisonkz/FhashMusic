from dataclasses import dataclass
from enum import Enum
from typing import Optional


class DownloadStatus(str, Enum):
    PENDING = "pending"
    DOWNLOADING = "downloading"
    CONVERTING = "converting"
    COMPLETED = "completed"
    FAILED = "failed"


class DownloadFormat(str, Enum):
    MP3 = "mp3"
    MP4 = "mp4"


@dataclass
class DownloadTask:
    song_id: str
    format: DownloadFormat
    status: DownloadStatus = DownloadStatus.PENDING
    progress: int = 0
    output_path: str = ""
    error_message: str = ""
    title: Optional[str] = None
    uploader: Optional[str] = None
    thumbnail: Optional[str] = None
