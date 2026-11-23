import tempfile
import time
import unittest
from pathlib import Path

from application.use_cases.manage_library import (
    AddToLibraryUseCase,
    GetLibraryUseCase,
    RemoveFromLibraryUseCase,
)
from domain.entities.song import Song
from infrastructure.adapters.memory_cache import MemoryCacheAdapter
from infrastructure.database.sqlite_library import SQLiteLibraryRepository


class TestSongEntity(unittest.TestCase):
    def test_duration_formatted_handles_standard_and_edge_values(self):
        s1 = Song(id="1", title="A", uploader="X", duration=0, url="https://youtu.be/1")
        s2 = Song(id="2", title="B", uploader="X", duration=-10, url="https://youtu.be/2")
        s3 = Song(id="3", title="C", uploader="X", duration=205, url="https://youtu.be/3")
        s4 = Song(id="4", title="D", uploader="X", duration=3661, url="https://youtu.be/4")

        self.assertEqual(s1.duration_formatted, "0:00")
        self.assertEqual(s2.duration_formatted, "0:00")
        self.assertEqual(s3.duration_formatted, "3:25")
        self.assertEqual(s4.duration_formatted, "61:01")


class TestMemoryCacheAdapter(unittest.TestCase):
    def test_set_get_delete_and_ttl_expiration(self):
        cache = MemoryCacheAdapter()
        cache.set("k1", {"ok": True}, ttl_seconds=10)
        self.assertEqual(cache.get("k1"), {"ok": True})

        cache.delete("k1")
        self.assertIsNone(cache.get("k1"))

        cache.set("short", "value", ttl_seconds=0)
        time.sleep(0.02)
        self.assertIsNone(cache.get("short"))


class TestLibraryUseCasesAndSQLite(unittest.TestCase):
    def test_sqlite_library_crud_and_replace(self):
        with tempfile.TemporaryDirectory() as tmp:
            repo = SQLiteLibraryRepository(db_path=Path(tmp) / "lib.db")
            add_uc = AddToLibraryUseCase(repo)
            get_uc = GetLibraryUseCase(repo)
            rm_uc = RemoveFromLibraryUseCase(repo)

            song = Song(
                id="vid1",
                title="Creep",
                uploader="Radiohead",
                duration=236,
                url="https://www.youtube.com/watch?v=vid1",
                genre="Rock",
            )
            add_uc.execute(song)
            self.assertEqual(len(get_uc.execute()), 1)

            # Replacing same id should not duplicate rows
            updated = Song(
                id="vid1",
                title="Creep (Remaster)",
                uploader="Radiohead",
                duration=238,
                url="https://www.youtube.com/watch?v=vid1",
                genre="Rock",
            )
            add_uc.execute(updated)
            songs = get_uc.execute()
            self.assertEqual(len(songs), 1)
            self.assertEqual(songs[0].title, "Creep (Remaster)")

            self.assertTrue(rm_uc.execute("vid1"))
            self.assertFalse(rm_uc.execute("vid1"))
            self.assertEqual(get_uc.execute(), [])


if __name__ == "__main__":
    unittest.main()
