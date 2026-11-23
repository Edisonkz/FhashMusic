from typing import List, Tuple

from domain.entities.song import Song
from domain.exceptions import SongNotFoundError
from domain.repositories.cache_repository import ICacheRepository
from domain.repositories.youtube_repository import IYoutubeRepository


class SearchSongsUseCase:
    """
    Caso de uso: Buscar canciones.
    Orquesta caché -> repositorio de búsqueda -> almacenamiento en caché.
    """

    def __init__(
        self,
        youtube_repo: IYoutubeRepository,
        cache_repo: ICacheRepository,
        cache_ttl: int = 300,
    ):
        self._youtube = youtube_repo
        self._cache = cache_repo
        self._cache_ttl = cache_ttl

    def execute(self, query: str, max_results: int = 5) -> Tuple[List[Song], bool]:
        normalized = query.strip()
        cache_key = f"search:{normalized.lower()}:{max_results}"

        cached = self._cache.get(cache_key)
        if cached is not None:
            return cached, True

        results = self._youtube.search(normalized, max_results=max_results)
        if not results:
            raise SongNotFoundError(normalized)

        self._cache.set(cache_key, results, self._cache_ttl)
        return results, False
