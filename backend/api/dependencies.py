from functools import lru_cache

from application.use_cases.download_song import DownloadSongUseCase
from application.use_cases.manage_library import (
    AddToLibraryUseCase,
    GetLibraryUseCase,
    RemoveFromLibraryUseCase,
)
from application.use_cases.search_songs import SearchSongsUseCase
from config.settings import get_settings
from infrastructure.adapters.ffmpeg_adapter import FFmpegAdapter
from infrastructure.adapters.memory_cache import MemoryCacheAdapter
from infrastructure.adapters.task_store import InMemoryTaskStore
from infrastructure.adapters.ytdlp_adapter import YtDlpAdapter
from infrastructure.database.sqlite_library import SQLiteLibraryRepository


@lru_cache
def get_youtube_repo() -> YtDlpAdapter:
    return YtDlpAdapter()


@lru_cache
def get_cache_repo() -> MemoryCacheAdapter:
    return MemoryCacheAdapter()


@lru_cache
def get_task_store() -> InMemoryTaskStore:
    return InMemoryTaskStore()


@lru_cache
def get_library_repo() -> SQLiteLibraryRepository:
    settings = get_settings()
    return SQLiteLibraryRepository(db_path=settings.LIBRARY_DB_PATH)


def get_search_use_case() -> SearchSongsUseCase:
    settings = get_settings()
    return SearchSongsUseCase(
        youtube_repo=get_youtube_repo(),
        cache_repo=get_cache_repo(),
        cache_ttl=settings.CACHE_TTL_SECONDS,
    )


def get_download_use_case() -> DownloadSongUseCase:
    settings = get_settings()
    return DownloadSongUseCase(
        youtube_repo=get_youtube_repo(),
        download_repo=FFmpegAdapter(ffmpeg_path=settings.FFMPEG_PATH),
        output_dir=settings.DOWNLOADS_DIR,
    )


def get_library_list_use_case() -> GetLibraryUseCase:
    return GetLibraryUseCase(library_repo=get_library_repo())


def get_library_add_use_case() -> AddToLibraryUseCase:
    return AddToLibraryUseCase(library_repo=get_library_repo())


def get_library_remove_use_case() -> RemoveFromLibraryUseCase:
    return RemoveFromLibraryUseCase(library_repo=get_library_repo())
