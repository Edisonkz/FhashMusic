import threading
from typing import Dict, List, Optional

from domain.entities.download_task import DownloadTask


class InMemoryTaskStore:
    """Almacén thread-safe en memoria para el seguimiento de descargas activas."""

    def __init__(self):
        self._tasks: Dict[str, DownloadTask] = {}
        self._lock = threading.Lock()

    def save(self, task: DownloadTask) -> None:
        with self._lock:
            self._tasks[task.song_id] = task

    def get(self, task_id: str) -> Optional[DownloadTask]:
        with self._lock:
            return self._tasks.get(task_id)

    def list_all(self) -> List[DownloadTask]:
        with self._lock:
            return list(self._tasks.values())
