import logging
from typing import List

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from fastapi.responses import RedirectResponse

from api.dependencies import get_download_use_case, get_task_store, get_youtube_repo
from application.schemas.download import DownloadRequest, DownloadResponse
from application.use_cases.download_song import DownloadSongUseCase
from domain.entities.download_task import DownloadFormat, DownloadStatus, DownloadTask
from domain.exceptions import DownloadError
from infrastructure.adapters.task_store import InMemoryTaskStore
from infrastructure.adapters.ytdlp_adapter import YtDlpAdapter

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/download", tags=["Download"])


def _run_download_background(
    song_id: str,
    fmt: DownloadFormat,
    use_case: DownloadSongUseCase,
    store: InMemoryTaskStore,
) -> None:
    try:
        use_case.execute(song_id=song_id, format=fmt, on_update=store.save)
    except DownloadError as exc:
        logger.warning("Descarga fallida para %s: %s", song_id, exc)


@router.get("/", response_model=List[DownloadResponse])
def list_downloads(store: InMemoryTaskStore = Depends(get_task_store)) -> List[DownloadResponse]:
    return [DownloadResponse.from_entity(t) for t in store.list_all()]


@router.post("/", response_model=DownloadResponse, status_code=202)
def start_download(
    payload: DownloadRequest,
    background_tasks: BackgroundTasks,
    use_case: DownloadSongUseCase = Depends(get_download_use_case),
    store: InMemoryTaskStore = Depends(get_task_store),
) -> DownloadResponse:
    fmt = DownloadFormat(payload.format)
    initial_task = DownloadTask(
        song_id=payload.song_id,
        format=fmt,
        status=DownloadStatus.PENDING,
        progress=5,
    )
    store.save(initial_task)
    background_tasks.add_task(_run_download_background, payload.song_id, fmt, use_case, store)
    return DownloadResponse.from_entity(initial_task)


@router.get("/stream/{song_id}")
def stream_audio(
    song_id: str,
    youtube_repo: YtDlpAdapter = Depends(get_youtube_repo),
) -> RedirectResponse:
    try:
        stream_url = youtube_repo.get_download_url(song_id, format="mp3")
        return RedirectResponse(url=stream_url, status_code=307)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"No se pudo obtener el stream de audio: {exc}") from exc


@router.get("/{task_id}", response_model=DownloadResponse)
def get_download_status(
    task_id: str,
    store: InMemoryTaskStore = Depends(get_task_store),
) -> DownloadResponse:
    task = store.get(task_id)
    if task is None:
        raise HTTPException(status_code=404, detail=f"Tarea '{task_id}' no encontrada")
    return DownloadResponse.from_entity(task)
