from fastapi import APIRouter, Depends, HTTPException, Query

from api.dependencies import get_search_use_case
from application.schemas.search import SearchResponse, SongDTO
from application.use_cases.search_songs import SearchSongsUseCase
from domain.exceptions import SongNotFoundError

router = APIRouter(prefix="/search", tags=["Search"])


@router.get("/", response_model=SearchResponse)
def search_songs(
    q: str = Query(..., min_length=1, description="Nombre de la canción, artista o URL de YouTube"),
    limit: int = Query(10, ge=1, le=20),
    use_case: SearchSongsUseCase = Depends(get_search_use_case),
) -> SearchResponse:
    try:
        songs, cached = use_case.execute(query=q, max_results=limit)
        return SearchResponse(
            results=[SongDTO.from_entity(song) for song in songs],
            total=len(songs),
            query=q,
            cached=cached,
        )
    except SongNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Error al consultar el proveedor: {exc}") from exc
