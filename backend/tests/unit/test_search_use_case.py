import unittest
from typing import List

from application.use_cases.search_songs import SearchSongsUseCase
from domain.entities.song import Song
from domain.exceptions import SongNotFoundError
from domain.repositories.youtube_repository import IYoutubeRepository
from infrastructure.adapters.memory_cache import MemoryCacheAdapter


class FakeYoutubeRepository(IYoutubeRepository):
    def __init__(self, songs: List[Song]):
        self._songs = songs
        self.calls = 0

    def search(self, query: str, max_results: int = 5) -> List[Song]:
        self.calls += 1
        return self._songs[:max_results]

    def get_download_url(self, song_id: str, format: str = "mp3") -> str:
        return f"https://example.com/audio/{song_id}.{format}"


class TestSearchSongsUseCase(unittest.TestCase):
    def test_search_caches_results(self):
        sample = [
            Song(
                id="abc123",
                title="Let It Happen",
                uploader="Tame Impala",
                duration=467,
                url="https://www.youtube.com/watch?v=abc123",
            )
        ]
        yt_repo = FakeYoutubeRepository(sample)
        cache = MemoryCacheAdapter()
        use_case = SearchSongsUseCase(youtube_repo=yt_repo, cache_repo=cache, cache_ttl=60)

        results_1, cached_1 = use_case.execute("tame impala", max_results=5)
        results_2, cached_2 = use_case.execute("Tame Impala", max_results=5)

        self.assertEqual(len(results_1), 1)
        self.assertFalse(cached_1)
        self.assertTrue(cached_2)
        self.assertEqual(results_1[0].duration_formatted, "7:47")
        self.assertEqual(yt_repo.calls, 1)

    def test_search_raises_when_empty(self):
        yt_repo = FakeYoutubeRepository([])
        cache = MemoryCacheAdapter()
        use_case = SearchSongsUseCase(youtube_repo=yt_repo, cache_repo=cache)

        with self.assertRaises(SongNotFoundError):
            use_case.execute("cancion_inexistente")


if __name__ == "__main__":
    unittest.main()
