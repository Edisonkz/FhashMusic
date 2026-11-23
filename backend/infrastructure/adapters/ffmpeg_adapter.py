from pathlib import Path

import yt_dlp

from domain.entities.download_task import DownloadFormat
from domain.repositories.download_repository import IDownloadRepository


class FFmpegAdapter(IDownloadRepository):
    """Implementación concreta de IDownloadRepository usando yt-dlp + FFmpeg."""

    def __init__(self, ffmpeg_path: str = "ffmpeg"):
        self._ffmpeg_path = ffmpeg_path

    def download(
        self,
        url: str,
        song_id: str,
        format: DownloadFormat,
        output_dir: Path,
    ) -> Path:
        output_dir.mkdir(parents=True, exist_ok=True)
        out_template = str(output_dir / f"{song_id}.%(ext)s")
        target_url = f"https://www.youtube.com/watch?v={song_id}" if song_id else url

        if format == DownloadFormat.MP3:
            opts = {
                "format": "bestaudio/best",
                "outtmpl": out_template,
                "quiet": True,
                "no_warnings": True,
                "writethumbnail": True,
                "ffmpeg_location": self._ffmpeg_path,
                "postprocessors": [
                    {
                        "key": "FFmpegExtractAudio",
                        "preferredcodec": "mp3",
                        "preferredquality": "320",
                    },
                    {"key": "FFmpegThumbnailsConvertor", "format": "jpg"},
                    {"key": "FFmpegMetadata"},
                    {"key": "EmbedThumbnail"},
                ],
            }
            expected_ext = "mp3"
        else:
            opts = {
                "format": "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",
                "merge_output_format": "mp4",
                "outtmpl": out_template,
                "quiet": True,
                "no_warnings": True,
                "ffmpeg_location": self._ffmpeg_path,
            }
            expected_ext = "mp4"

        with yt_dlp.YoutubeDL(opts) as ydl:
            ydl.download([target_url])

        return output_dir / f"{song_id}.{expected_ext}"
