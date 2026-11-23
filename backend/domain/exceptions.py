class FhashMusicError(Exception):
    """Excepción base del dominio."""


class SongNotFoundError(FhashMusicError):
    """Se lanza cuando una búsqueda o consulta no retorna resultados."""

    def __init__(self, query: str):
        super().__init__(f"No se encontraron canciones para: '{query}'")


class DownloadError(FhashMusicError):
    """Se lanza cuando falla la descarga o conversión de audio/video."""


class TaskNotFoundError(FhashMusicError):
    """Se lanza cuando no existe una tarea de descarga solicitada."""

    def __init__(self, task_id: str):
        super().__init__(f"No se encontró la tarea de descarga: '{task_id}'")


class CacheError(FhashMusicError):
    """Se lanza cuando falla el sistema de caché."""
