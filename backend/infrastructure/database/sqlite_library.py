import sqlite3
import threading
from contextlib import contextmanager
from pathlib import Path
from typing import Iterator, List

from domain.entities.song import Song
from domain.repositories.library_repository import ILibraryRepository


class SQLiteLibraryRepository(ILibraryRepository):
    """Persistencia SQLite ligera y thread-safe para la biblioteca local."""

    def __init__(self, db_path: Path):
        self._db_path = db_path
        self._lock = threading.Lock()
        self._db_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_schema()

    @contextmanager
    def _connection(self) -> Iterator[sqlite3.Connection]:
        conn = sqlite3.connect(self._db_path, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
            conn.commit()
        finally:
            conn.close()

    def _init_schema(self) -> None:
        with self._lock, self._connection() as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS library_songs (
                    id TEXT PRIMARY KEY,
                    title TEXT NOT NULL,
                    uploader TEXT NOT NULL,
                    duration INTEGER NOT NULL DEFAULT 0,
                    url TEXT NOT NULL,
                    thumbnail TEXT,
                    genre TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
                """
            )

    def list_songs(self) -> List[Song]:
        with self._lock, self._connection() as conn:
            rows = conn.execute(
                "SELECT id, title, uploader, duration, url, thumbnail, genre "
                "FROM library_songs ORDER BY created_at DESC"
            ).fetchall()
        return [
            Song(
                id=row["id"],
                title=row["title"],
                uploader=row["uploader"],
                duration=row["duration"],
                url=row["url"],
                thumbnail=row["thumbnail"],
                genre=row["genre"],
            )
            for row in rows
        ]

    def add_song(self, song: Song) -> Song:
        with self._lock, self._connection() as conn:
            conn.execute(
                """
                INSERT OR REPLACE INTO library_songs (id, title, uploader, duration, url, thumbnail, genre)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (song.id, song.title, song.uploader, song.duration, song.url, song.thumbnail, song.genre),
            )
        return song

    def remove_song(self, song_id: str) -> bool:
        with self._lock, self._connection() as conn:
            cursor = conn.execute("DELETE FROM library_songs WHERE id = ?", (song_id,))
            return cursor.rowcount > 0
