from typing import List

import yt_dlp

from domain.entities.song import Song
from domain.repositories.youtube_repository import IYoutubeRepository


class YtDlpAdapter(IYoutubeRepository):
    """Implementación concreta de IYoutubeRepository usando yt-dlp."""

    def search(self, query: str, max_results: int = 5) -> List[Song]:
        is_url = query.startswith(("http://", "https://"))
        opts = {
            "quiet": True,
            "no_warnings": True,
            "skip_download": True,
            "extract_flat": not is_url,
            "default_search": f"ytsearch{max_results}",
        }
        with yt_dlp.YoutubeDL(opts) as ydl:
            info = ydl.extract_info(query, download=False)
            if not info:
                return []
            entries = info.get("entries", [info]) if isinstance(info, dict) else []
            return [self._to_entity(e) for e in entries if isinstance(e, dict) and e.get("id")]

    def get_download_url(self, song_id: str, format: str = "mp3") -> str:
        url = f"https://www.youtube.com/watch?v={song_id}"
        fmt = "bestaudio/best" if format == "mp3" else "best[ext=mp4]/best"
        opts = {"quiet": True, "no_warnings": True, "skip_download": True, "format": fmt}
        with yt_dlp.YoutubeDL(opts) as ydl:
            info = ydl.extract_info(url, download=False)
            return info["url"]

    @staticmethod
    def _to_entity(entry: dict) -> Song:
        video_id = entry.get("id", "")
        thumbnails = entry.get("thumbnails") or []
        thumb = entry.get("thumbnail") or (thumbnails[-1].get("url") if thumbnails else None)
        if not thumb and video_id:
            thumb = f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg"

        return Song(
            id=video_id,
            title=entry.get("title") or "Sin título",
            uploader=entry.get("uploader") or entry.get("channel") or "YouTube",
            duration=int(entry.get("duration") or 0),
            url=entry.get("webpage_url") or f"https://www.youtube.com/watch?v={video_id}",
            thumbnail=thumb,
        )
