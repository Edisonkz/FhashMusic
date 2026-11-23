import tempfile
import unittest
from pathlib import Path

from application.use_cases.download_song import DownloadSongUseCase
from domain.entities.download_task import DownloadFormat, DownloadStatus
from domain.entities.song import Song
from domain.exceptions import DownloadError
from domain.repositories.download_repository import IDownloadRepository
from domain.repositories.youtube_repository import IYoutubeRepository


class StubYoutubeRepo(IYoutubeRepository):
    def search(self, query: str, max_results: int = 5):
        return [Song(id="id1", title="Test", uploader="Artist", duration=120, url="https://youtu.be/id1")]

    def get_download_url(self, song_id: str, format: str = "mp3") -> str:
        return f"https://cdn.example.com/{song_id}.{format}"


class StubDownloadRepo(IDownloadRepository):
    def __init__(self, should_fail: bool = False):
        self.should_fail = should_fail

    def download(self, url: str, song_id: str, format: DownloadFormat, output_dir: Path) -> Path:
        if self.should_fail:
            raise RuntimeError("FFmpeg error simulado")
        target = output_dir / f"{song_id}.{format.value}"
        target.write_bytes(b"fake-audio-bytes")
        return target


class TestDownloadSongUseCase(unittest.TestCase):
    def test_download_completes_successfully(self):
        with tempfile.TemporaryDirectory() as tmp:
            use_case = DownloadSongUseCase(
                youtube_repo=StubYoutubeRepo(),
                download_repo=StubDownloadRepo(should_fail=False),
                output_dir=Path(tmp),
            )
            statuses = []
            task = use_case.execute("song_1", DownloadFormat.MP3, on_update=lambda t: statuses.append(t.status))

            self.assertEqual(task.status, DownloadStatus.COMPLETED)
            self.assertEqual(task.progress, 100)
            self.assertTrue(Path(task.output_path).exists())
            self.assertIn(DownloadStatus.CONVERTING, statuses)

    def test_download_raises_domain_error_on_failure(self):
        with tempfile.TemporaryDirectory() as tmp:
            use_case = DownloadSongUseCase(
                youtube_repo=StubYoutubeRepo(),
                download_repo=StubDownloadRepo(should_fail=True),
                output_dir=Path(tmp),
            )
            with self.assertRaises(DownloadError):
                use_case.execute("song_err", DownloadFormat.MP4)


if __name__ == "__main__":
    unittest.main()
