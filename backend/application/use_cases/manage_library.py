from typing import List

from domain.entities.song import Song
from domain.repositories.library_repository import ILibraryRepository


class GetLibraryUseCase:
    def __init__(self, library_repo: ILibraryRepository):
        self._library = library_repo

    def execute(self) -> List[Song]:
        return self._library.list_songs()


class AddToLibraryUseCase:
    def __init__(self, library_repo: ILibraryRepository):
        self._library = library_repo

    def execute(self, song: Song) -> Song:
        return self._library.add_song(song)


class RemoveFromLibraryUseCase:
    def __init__(self, library_repo: ILibraryRepository):
        self._library = library_repo

    def execute(self, song_id: str) -> bool:
        return self._library.remove_song(song_id)
