from typing import Dict, List

from fastapi import APIRouter, Depends, HTTPException

from api.dependencies import (
    get_library_add_use_case,
    get_library_list_use_case,
    get_library_remove_use_case,
)
from application.schemas.search import SongDTO
from application.use_cases.manage_library import (
    AddToLibraryUseCase,
    GetLibraryUseCase,
    RemoveFromLibraryUseCase,
)

router = APIRouter(prefix="/library", tags=["Library"])


@router.get("/", response_model=List[SongDTO])
def list_library(use_case: GetLibraryUseCase = Depends(get_library_list_use_case)) -> List[SongDTO]:
    return [SongDTO.from_entity(song) for song in use_case.execute()]


@router.post("/", response_model=SongDTO, status_code=201)
def add_to_library(
    payload: SongDTO,
    use_case: AddToLibraryUseCase = Depends(get_library_add_use_case),
) -> SongDTO:
    saved = use_case.execute(payload.to_entity())
    return SongDTO.from_entity(saved)


@router.delete("/{song_id}")
def remove_from_library(
    song_id: str,
    use_case: RemoveFromLibraryUseCase = Depends(get_library_remove_use_case),
) -> Dict[str, str]:
    removed = use_case.execute(song_id)
    if not removed:
        raise HTTPException(status_code=404, detail=f"Canción '{song_id}' no encontrada en la biblioteca")
    return {"status": "deleted", "song_id": song_id}
