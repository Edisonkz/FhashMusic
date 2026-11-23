import tempfile
import unittest
from pathlib import Path

from fastapi.testclient import TestClient

from api.dependencies import (
    get_download_use_case,
    get_library_add_use_case,
    get_library_list_use_case,
    get_library_remove_use_case,
    get_search_use_case,
)
from application.use_cases.download_song import DownloadSongUseCase
from application.use_cases.manage_library import (
    AddToLibraryUseCase,
    GetLibraryUseCase,
    RemoveFromLibraryUseCase,
)
from application.use_cases.search_songs import SearchSongsUseCase
from domain.entities.download_task import DownloadFormat
from domain.entities.song import Song
from domain.repositories.download_repository import IDownloadRepository
from domain.repositories.youtube_repository import IYoutubeRepository
from infrastructure.adapters.memory_cache import MemoryCacheAdapter
from infrastructure.database.sqlite_library import SQLiteLibraryRepository
from main import create_app


class MockYoutubeRepo(IYoutubeRepository):
    def search(self, query: str, max_results: int = 5):
        if query == "empty":
            return []
        return [
            Song(
                id="pFptt7Cargc",
                title="Let It Happen",
                uploader="Tame Impala",
                duration=467,
                url="https://www.youtube.com/watch?v=pFptt7Cargc",
                thumbnail="https://i.ytimg.com/vi/pFptt7Cargc/hqdefault.jpg",
            )
        ][:max_results]

    def get_download_url(self, song_id: str, format: str = "mp3") -> str:
        return f"https://cdn.example.com/{song_id}.{format}"


class MockDownloader(IDownloadRepository):
    def download(self, url: str, song_id: str, format: DownloadFormat, output_dir: Path) -> Path:
        out = output_dir / f"{song_id}.{format.value}"
        out.write_bytes(b"ok")
        return out


class TestApiEndpoints(unittest.TestCase):
    def setUp(self):
        self._tmp = tempfile.TemporaryDirectory()
        tmp_path = Path(self._tmp.name)

        self.app = create_app()
        yt_repo = MockYoutubeRepo()
        cache = MemoryCacheAdapter()
        lib_repo = SQLiteLibraryRepository(db_path=tmp_path / "test_library.db")

        self.app.dependency_overrides[get_search_use_case] = lambda: SearchSongsUseCase(yt_repo, cache)
        self.app.dependency_overrides[get_download_use_case] = lambda: DownloadSongUseCase(
            yt_repo, MockDownloader(), tmp_path
        )
        self.app.dependency_overrides[get_library_list_use_case] = lambda: GetLibraryUseCase(lib_repo)
        self.app.dependency_overrides[get_library_add_use_case] = lambda: AddToLibraryUseCase(lib_repo)
        self.app.dependency_overrides[get_library_remove_use_case] = lambda: RemoveFromLibraryUseCase(lib_repo)
        self.client = TestClient(self.app)

    def tearDown(self):
        self._tmp.cleanup()

    def test_health_endpoint(self):
        resp = self.client.get("/health")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json()["status"], "ok")

    def test_search_endpoint_and_cache(self):
        first = self.client.get("/api/v1/search/?q=tame+impala&limit=5")
        self.assertEqual(first.status_code, 200)
        body = first.json()
        self.assertEqual(body["total"], 1)
        self.assertFalse(body["cached"])
        self.assertEqual(body["results"][0]["duration_formatted"], "7:47")

        second = self.client.get("/api/v1/search/?q=tame+impala&limit=5")
        self.assertTrue(second.json()["cached"])

    def test_library_crud_flow(self):
        song_payload = {
            "id": "pFptt7Cargc",
            "title": "Let It Happen",
            "uploader": "Tame Impala",
            "duration": 467,
            "duration_formatted": "7:47",
            "url": "https://www.youtube.com/watch?v=pFptt7Cargc",
            "thumbnail": "https://i.ytimg.com/vi/pFptt7Cargc/hqdefault.jpg",
            "genre": "Indie",
        }

        created = self.client.post("/api/v1/library/", json=song_payload)
        self.assertEqual(created.status_code, 201)

        listed = self.client.get("/api/v1/library/")
        self.assertEqual(listed.status_code, 200)
        self.assertEqual(len(listed.json()), 1)

        deleted = self.client.delete("/api/v1/library/pFptt7Cargc")
        self.assertEqual(deleted.status_code, 200)
        self.assertEqual(self.client.get("/api/v1/library/").json(), [])

    def test_download_endpoint_queues_and_completes(self):
        started = self.client.post("/api/v1/download/", json={"song_id": "pFptt7Cargc", "format": "mp3"})
        self.assertEqual(started.status_code, 202)

        status = self.client.get("/api/v1/download/pFptt7Cargc")
        self.assertEqual(status.status_code, 200)
        self.assertEqual(status.json()["status"], "completed")


if __name__ == "__main__":
    unittest.main()
