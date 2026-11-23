# 📐 FhashMusic v2.0 — Especificación de Arquitectura

> **Documento maestro** para el rediseño completo del proyecto.  
> Todo lo que se implemente debe ser consistente con este documento.  
> Versión: 2.0-alpha | Fecha: Junio 2026

---

## 🧭 Visión General del Sistema

FhashMusic es una plataforma web para descubrimiento, escucha y descarga de música desde YouTube. 
El sistema v2.0 se construye sobre dos pilares independientes y desacoplados:

```
┌──────────────────────────────────────────────────────────────┐
│                        FHASHMUSIC v2.0                       │
│                                                              │
│  ┌───────────────────────┐      ┌────────────────────────┐  │
│  │   FRONTEND             │      │   BACKEND              │  │
│  │   Angular 19           │◄────►│   FastAPI              │  │
│  │   Standalone Components│      │   Clean Architecture   │  │
│  │   Port: 4200           │      │   Port: 9000           │  │
│  └───────────────────────┘      └────────────────────────┘  │
│                                           │                  │
│                                  ┌────────▼────────┐        │
│                                  │  YouTube / yt-dlp │        │
│                                  │  FFmpeg           │        │
│                                  └───────────────────┘        │
└──────────────────────────────────────────────────────────────┘
```

**Comunicación**: REST API + JSON. El frontend nunca toca yt-dlp ni FFmpeg directamente.  
**Autenticación** (fase 2): JWT Bearer Tokens.  
**Base de datos** (fase 2): SQLite (dev) → PostgreSQL (prod).

---

---

# ═══════════════════════════════════════
# PARTE I — BACKEND
# FastAPI + Clean Architecture
# ═══════════════════════════════════════

## 🎯 Principio Central: Clean Architecture

La arquitectura se divide en **tres capas concéntricas**. La regla de dependencia es estricta:
**las capas internas nunca conocen las externas**.

```
┌─────────────────────────────────────────────┐
│              Infrastructure                  │  ← Detalle técnico
│   ┌─────────────────────────────────────┐   │     (yt-dlp, FFmpeg, DB)
│   │           Application               │   │  ← Orquestación
│   │   ┌─────────────────────────────┐   │   │     (casos de uso)
│   │   │          Domain             │   │   │  ← Regla de negocio pura
│   │   │   Entities + Interfaces     │   │   │     (sin dependencias externas)
│   │   └─────────────────────────────┘   │   │
│   └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

**Beneficio práctico**: Si mañana yt-dlp deja de funcionar y hay que usar la YouTube Data API oficial, 
solo se toca `infrastructure/adapters/ytdlp_adapter.py`. El dominio y los casos de uso no cambian.

---

## 📁 Estructura de Carpetas — Backend

```
backend/
│
├── main.py                          # Entry point — solo crea la app y registra routers
├── config/
│   ├── __init__.py
│   ├── settings.py                  # Pydantic BaseSettings (carga .env)
│   └── logging.py                   # Configuración de logs estructurados
│
├── domain/                          # ← CAPA 1: Reglas de negocio puras
│   ├── __init__.py
│   ├── entities/                    # Objetos de negocio (sin lógica de framework)
│   │   ├── __init__.py
│   │   ├── song.py                  # dataclass Song
│   │   ├── search_result.py         # dataclass SearchResult
│   │   └── download_task.py         # dataclass DownloadTask
│   ├── repositories/                # Contratos (interfaces ABC) — NO implementaciones
│   │   ├── __init__.py
│   │   ├── youtube_repository.py    # IYoutubeRepository (abstract)
│   │   ├── cache_repository.py      # ICacheRepository (abstract)
│   │   └── download_repository.py   # IDownloadRepository (abstract)
│   └── exceptions.py                # Excepciones de dominio tipadas
│
├── application/                     # ← CAPA 2: Casos de uso (orquestación)
│   ├── __init__.py
│   ├── use_cases/
│   │   ├── __init__.py
│   │   ├── search_songs.py          # SearchSongsUseCase
│   │   ├── download_song.py         # DownloadSongUseCase
│   │   └── manage_library.py        # GetLibraryUseCase, AddToLibraryUseCase
│   └── schemas/                     # Pydantic DTOs para request/response de la API
│       ├── __init__.py
│       ├── search.py                # SearchRequest, SearchResponse, SongDTO
│       └── download.py              # DownloadRequest, DownloadResponse
│
├── infrastructure/                  # ← CAPA 3: Implementaciones concretas
│   ├── __init__.py
│   ├── adapters/
│   │   ├── __init__.py
│   │   ├── ytdlp_adapter.py         # Implementa IYoutubeRepository usando yt-dlp
│   │   ├── ffmpeg_adapter.py        # Implementa IDownloadRepository usando FFmpeg
│   │   └── memory_cache.py          # Implementa ICacheRepository (en memoria, thread-safe)
│   └── database/
│       ├── __init__.py
│       ├── models.py                # SQLAlchemy ORM models (Fase 2)
│       └── session.py               # DB session factory
│
├── api/                             # ← Capa de presentación (HTTP)
│   ├── __init__.py
│   ├── v1/
│   │   ├── __init__.py
│   │   ├── search.py                # Router: GET /api/v1/search
│   │   ├── download.py              # Router: POST /api/v1/download
│   │   ├── library.py               # Router: GET/POST/DELETE /api/v1/library
│   │   └── auth.py                  # Router: POST /api/v1/auth/login (Fase 2)
│   └── dependencies.py             # Dependency Injection — fábrica de casos de uso
│
└── tests/
    ├── unit/
    │   ├── test_search_use_case.py
    │   └── test_download_use_case.py
    └── integration/
        └── test_search_endpoint.py
```

---

## 🟣 CAPA 1: Domain

### `domain/entities/song.py`

```python
from dataclasses import dataclass, field
from typing import Optional

@dataclass
class Song:
    """
    Entidad central del dominio. Representa una canción encontrada en YouTube.
    No tiene ninguna dependencia de FastAPI, yt-dlp ni ningún framework.
    """
    id: str                          # YouTube video ID (ej: "kJQP7kiw9Fk")
    title: str                       # Título del video
    uploader: str                    # Canal/artista
    duration: int                    # Duración en segundos
    url: str                         # URL completa de YouTube
    thumbnail: Optional[str] = None  # URL de la miniatura

    @property
    def duration_formatted(self) -> str:
        """Convierte duración a formato mm:ss"""
        minutes = self.duration // 60
        seconds = self.duration % 60
        return f"{minutes}:{seconds:02d}"
```

### `domain/entities/download_task.py`

```python
from dataclasses import dataclass
from enum import Enum

class DownloadStatus(Enum):
    PENDING = "pending"
    DOWNLOADING = "downloading"
    CONVERTING = "converting"
    COMPLETED = "completed"
    FAILED = "failed"

class DownloadFormat(Enum):
    MP3 = "mp3"
    MP4 = "mp4"

@dataclass
class DownloadTask:
    song_id: str
    format: DownloadFormat
    status: DownloadStatus = DownloadStatus.PENDING
    output_path: str = ""
    error_message: str = ""
```

### `domain/repositories/youtube_repository.py`

```python
from abc import ABC, abstractmethod
from typing import List
from domain.entities.song import Song

class IYoutubeRepository(ABC):
    """
    Contrato/Interfaz para cualquier fuente de búsqueda de música.
    La implementación concreta (yt-dlp, YouTube API, Spotify, etc.) 
    va en infrastructure/adapters/.
    """

    @abstractmethod
    def search(self, query: str, max_results: int = 5) -> List[Song]:
        """Busca canciones por nombre/artista/URL y retorna una lista de Song."""
        ...

    @abstractmethod
    def get_download_url(self, song_id: str, format: str) -> str:
        """Obtiene la URL de descarga directa para un video dado."""
        ...
```

### `domain/repositories/cache_repository.py`

```python
from abc import ABC, abstractmethod
from typing import Optional, Any

class ICacheRepository(ABC):
    """
    Contrato para cualquier implementación de caché.
    Puede ser memoria, Redis, Memcached, etc.
    """

    @abstractmethod
    def get(self, key: str) -> Optional[Any]:
        ...

    @abstractmethod
    def set(self, key: str, value: Any, ttl_seconds: int = 300) -> None:
        ...

    @abstractmethod
    def delete(self, key: str) -> None:
        ...
```

### `domain/exceptions.py`

```python
class FhashMusicError(Exception):
    """Base exception del dominio."""
    pass

class SongNotFoundError(FhashMusicError):
    """Se lanza cuando una búsqueda no retorna resultados."""
    def __init__(self, query: str):
        super().__init__(f"No se encontraron canciones para: '{query}'")

class DownloadError(FhashMusicError):
    """Se lanza cuando falla la descarga o conversión."""
    pass

class CacheError(FhashMusicError):
    """Se lanza cuando falla el sistema de caché."""
    pass
```

---

## 🔵 CAPA 2: Application (Casos de Uso)

### `application/use_cases/search_songs.py`

```python
from typing import List
from domain.entities.song import Song
from domain.repositories.youtube_repository import IYoutubeRepository
from domain.repositories.cache_repository import ICacheRepository
from domain.exceptions import SongNotFoundError

class SearchSongsUseCase:
    """
    Caso de uso: Buscar canciones.
    
    Orquesta: caché → búsqueda en YouTube → almacenar en caché.
    Solo conoce las INTERFACES (IYoutubeRepository, ICacheRepository),
    no las implementaciones concretas.
    """

    def __init__(
        self, 
        youtube_repo: IYoutubeRepository,
        cache_repo: ICacheRepository,
        cache_ttl: int = 300
    ):
        self._youtube = youtube_repo
        self._cache = cache_repo
        self._cache_ttl = cache_ttl

    def execute(self, query: str, max_results: int = 5) -> List[Song]:
        cache_key = f"search:{query}:{max_results}"
        
        # 1. Intentar retornar desde caché
        cached = self._cache.get(cache_key)
        if cached:
            return cached

        # 2. Buscar en YouTube
        results = self._youtube.search(query, max_results)
        
        if not results:
            raise SongNotFoundError(query)
        
        # 3. Guardar en caché
        self._cache.set(cache_key, results, self._cache_ttl)
        
        return results
```

### `application/use_cases/download_song.py`

```python
from domain.repositories.youtube_repository import IYoutubeRepository
from domain.repositories.download_repository import IDownloadRepository
from domain.entities.download_task import DownloadTask, DownloadFormat, DownloadStatus
from domain.exceptions import DownloadError
from pathlib import Path

class DownloadSongUseCase:
    """
    Caso de uso: Descargar una canción en MP3 o MP4.
    Coordina obtener la URL de descarga y procesarla con FFmpeg.
    """

    def __init__(
        self,
        youtube_repo: IYoutubeRepository,
        download_repo: IDownloadRepository,
        output_dir: Path
    ):
        self._youtube = youtube_repo
        self._downloader = download_repo
        self._output_dir = output_dir

    def execute(self, song_id: str, format: DownloadFormat) -> DownloadTask:
        task = DownloadTask(song_id=song_id, format=format)
        
        try:
            task.status = DownloadStatus.DOWNLOADING
            download_url = self._youtube.get_download_url(song_id, format.value)
            
            task.status = DownloadStatus.CONVERTING
            output_path = self._downloader.download(
                url=download_url,
                song_id=song_id,
                format=format,
                output_dir=self._output_dir
            )
            
            task.status = DownloadStatus.COMPLETED
            task.output_path = str(output_path)
            
        except Exception as e:
            task.status = DownloadStatus.FAILED
            task.error_message = str(e)
            raise DownloadError(f"Fallo descarga de {song_id}: {e}")
        
        return task
```

### `application/schemas/search.py`

```python
from pydantic import BaseModel, Field
from typing import List, Optional

class SongDTO(BaseModel):
    """Data Transfer Object para una canción (lo que sale por la API)."""
    id: str
    title: str
    uploader: str
    duration: int
    duration_formatted: str
    url: str
    thumbnail: Optional[str] = None

class SearchResponse(BaseModel):
    results: List[SongDTO]
    total: int
    query: str
    cached: bool = False
```

---

## 🟡 CAPA 3: Infrastructure (Implementaciones)

### `infrastructure/adapters/ytdlp_adapter.py`

```python
import yt_dlp
from typing import List
from domain.entities.song import Song
from domain.repositories.youtube_repository import IYoutubeRepository

class YtDlpAdapter(IYoutubeRepository):
    """
    Implementación concreta de IYoutubeRepository usando yt-dlp.
    Si mañana cambia la librería, SOLO SE CAMBIA ESTE ARCHIVO.
    """

    def search(self, query: str, max_results: int = 5) -> List[Song]:
        opts = {
            'quiet': True,
            'skip_download': True,
            'default_search': f'ytsearch{max_results}',
        }
        with yt_dlp.YoutubeDL(opts) as ydl:
            info = ydl.extract_info(query, download=False)
            entries = info.get('entries', [])
            return [self._to_entity(e) for e in entries if e]

    def get_download_url(self, song_id: str, format: str) -> str:
        url = f"https://www.youtube.com/watch?v={song_id}"
        opts = {'quiet': True, 'skip_download': True, 'format': 'bestaudio/best'}
        with yt_dlp.YoutubeDL(opts) as ydl:
            info = ydl.extract_info(url, download=False)
            return info['url']

    def _to_entity(self, entry: dict) -> Song:
        """Mapea un dict de yt-dlp a la entidad Song del dominio."""
        return Song(
            id=entry.get('id', ''),
            title=entry.get('title', 'Sin título'),
            uploader=entry.get('uploader', 'Desconocido'),
            duration=entry.get('duration', 0),
            url=f"https://www.youtube.com/watch?v={entry.get('id')}",
            thumbnail=entry.get('thumbnail'),
        )
```

### `infrastructure/adapters/memory_cache.py`

```python
import time
import threading
from typing import Optional, Any
from domain.repositories.cache_repository import ICacheRepository

class MemoryCacheAdapter(ICacheRepository):
    """
    Caché en memoria thread-safe con TTL.
    Para producción, reemplazar con RedisCacheAdapter.
    """

    def __init__(self):
        self._store: dict = {}
        self._lock = threading.Lock()

    def get(self, key: str) -> Optional[Any]:
        with self._lock:
            entry = self._store.get(key)
            if entry is None:
                return None
            value, expires_at = entry
            if time.time() > expires_at:
                del self._store[key]
                return None
            return value

    def set(self, key: str, value: Any, ttl_seconds: int = 300) -> None:
        with self._lock:
            self._store[key] = (value, time.time() + ttl_seconds)

    def delete(self, key: str) -> None:
        with self._lock:
            self._store.pop(key, None)
```

---

## 🔴 API Layer + Dependency Injection

### `api/dependencies.py`

```python
from functools import lru_cache
from config.settings import get_settings
from infrastructure.adapters.ytdlp_adapter import YtDlpAdapter
from infrastructure.adapters.memory_cache import MemoryCacheAdapter
from infrastructure.adapters.ffmpeg_adapter import FFmpegAdapter
from application.use_cases.search_songs import SearchSongsUseCase
from application.use_cases.download_song import DownloadSongUseCase

# Singletons — se instancian una sola vez en el ciclo de vida de la app
@lru_cache
def get_youtube_repo() -> YtDlpAdapter:
    return YtDlpAdapter()

@lru_cache
def get_cache_repo() -> MemoryCacheAdapter:
    return MemoryCacheAdapter()

def get_search_use_case() -> SearchSongsUseCase:
    settings = get_settings()
    return SearchSongsUseCase(
        youtube_repo=get_youtube_repo(),
        cache_repo=get_cache_repo(),
        cache_ttl=settings.CACHE_TTL_SECONDS
    )

def get_download_use_case() -> DownloadSongUseCase:
    settings = get_settings()
    return DownloadSongUseCase(
        youtube_repo=get_youtube_repo(),
        download_repo=FFmpegAdapter(ffmpeg_path=settings.FFMPEG_PATH),
        output_dir=settings.DOWNLOADS_DIR
    )
```

### `api/v1/search.py`

```python
from fastapi import APIRouter, Depends, Query, HTTPException
from application.use_cases.search_songs import SearchSongsUseCase
from application.schemas.search import SearchResponse, SongDTO
from domain.exceptions import SongNotFoundError
from api.dependencies import get_search_use_case

router = APIRouter(prefix="/search", tags=["Search"])

@router.get("/", response_model=SearchResponse)
def search_songs(
    q: str = Query(..., min_length=1, description="Nombre de la canción o URL de YouTube"),
    limit: int = Query(5, ge=1, le=20),
    use_case: SearchSongsUseCase = Depends(get_search_use_case)
):
    try:
        songs = use_case.execute(query=q, max_results=limit)
        return SearchResponse(
            results=[SongDTO(**{**vars(s), 'duration_formatted': s.duration_formatted}) for s in songs],
            total=len(songs),
            query=q
        )
    except SongNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
```

### `config/settings.py`

```python
from pydantic_settings import BaseSettings
from pathlib import Path
from functools import lru_cache

class Settings(BaseSettings):
    # App
    APP_NAME: str = "FhashMusic API"
    API_VERSION: str = "v1"
    DEBUG: bool = False

    # Cache
    CACHE_TTL_SECONDS: int = 300

    # FFmpeg — ruta dinámica, sin hardcodear usuario
    FFMPEG_PATH: Path = Path(__file__).parent.parent / "lib" / "ffmpeg" / "bin" / "ffmpeg.exe"

    # Descargas
    DOWNLOADS_DIR: Path = Path(__file__).parent.parent.parent / "downloads"

    # CORS
    ALLOWED_ORIGINS: list[str] = ["http://localhost:4200", "http://localhost:8000"]

    class Config:
        env_file = ".env"

@lru_cache
def get_settings() -> Settings:
    return Settings()
```

---

## 📡 Tabla de Endpoints API v1

| Método | Endpoint | Descripción | Status |
|--------|----------|-------------|--------|
| `GET` | `/api/v1/search/?q=Despacito` | Buscar canciones | Fase 1 |
| `POST` | `/api/v1/download/` | Iniciar descarga MP3/MP4 | Fase 1 |
| `GET` | `/api/v1/download/{task_id}` | Estado de descarga | Fase 1 |
| `GET` | `/api/v1/library/` | Listar canciones descargadas | Fase 2 |
| `DELETE` | `/api/v1/library/{song_id}` | Eliminar de biblioteca | Fase 2 |
| `POST` | `/api/v1/recognition/` | Reconocer canción desde audio | Fase 2 |
| `POST` | `/api/v1/auth/login` | Login con JWT | Fase 2 |

---

---

# ═══════════════════════════════════════
# PARTE II — FRONTEND
# Angular 19 + Standalone Components
# ═══════════════════════════════════════

## 🎯 Principio Central: Feature-Based Architecture

Cada feature (search, download, library, recognition) es un módulo **autocontenido** con sus propias páginas, componentes, servicios y rutas. `core/` solo tiene singletons globales. `shared/` solo tiene piezas reutilizables entre features.

### ¿Por qué Angular y no Vanilla JS?

| Criterio | Vanilla JS actual | Angular 19 |
|----------|-----------------|------------|
| Componentes reutilizables | Copiar/pegar HTML | `@Component` declarativo |
| Estado reactivo | Variables globales | Signals (`signal()`, `computed()`) |
| Routing | `<a href>` manual | `RouterOutlet` + lazy loading |
| HTTP + tipado | `fetch()` sin tipos | `HttpClient` con genéricos |
| Mantenibilidad a escala | Difícil | Alta |

---

## 📁 Estructura de Carpetas — Frontend
CORRECION SE VA A USAR CSSS NO SCSS
```
src/
├── main.ts                          # Bootstrap de la app
├── styles.scss                      # Estilos globales + variables CSS
│
└── app/
    ├── app.component.ts             # Root standalone component (shell)
    ├── app.component.html           # <router-outlet> principal
    ├── app.config.ts                # Providers: router, HttpClient, etc.
    ├── app.routes.ts                # Rutas raíz con loadComponent() — SIN NgModule
    │
    ├── core/                        # Singleton — se inicializa UNA SOLA VEZ
    │   ├── guards/
    │   │   └── auth.guard.ts        # Protege rutas que requieren login
    │   ├── interceptors/
    │   │   ├── auth.interceptor.ts  # Agrega Bearer Token a requests
    │   │   └── error.interceptor.ts # Manejo global de errores HTTP
    │   └── services/
    │       ├── api.service.ts       # Base HTTP wrapper (URL base, headers)
    │       └── auth.service.ts      # Estado de autenticación (Fase 2)
    │
    ├── shared/                      # Reutilizable en CUALQUIER feature
    │   ├── components/
    │   │   ├── song-card/
    │   │   │   ├── song-card.component.ts
    │   │   │   ├── song-card.component.html
    │   │   │   └── song-card.component.scss
    │   │   ├── audio-player/        # Player de preescucha
    │   │   │   ├── audio-player.component.ts
    │   │   │   ├── audio-player.component.html
    │   │   │   └── audio-player.component.scss
    │   │   └── loading-spinner/
    │   │       └── loading-spinner.component.ts
    │   ├── pipes/
    │   │   └── duration.pipe.ts     # Convierte segundos → "mm:ss"
    │   └── directives/
    │       └── highlight-on-hover.directive.ts
    │
    └── features/
        │
        ├── search/                  # Feature: Búsqueda de canciones
        │   ├── pages/
        │   │   └── search-page/
        │   │       ├── search-page.component.ts   # El router carga este
        │   │       ├── search-page.component.html
        │   │       └── search-page.component.scss
        │   ├── components/
        │   │   ├── search-bar/
        │   │   │   ├── search-bar.component.ts
        │   │   │   ├── search-bar.component.html
        │   │   │   └── search-bar.component.scss
        │   │   └── result-gallery/
        │   │       ├── result-gallery.component.ts
        │   │       ├── result-gallery.component.html
        │   │       └── result-gallery.component.scss
        │   ├── services/
        │   │   └── search.service.ts
        │   ├── models/
        │   │   └── search-result.model.ts
        │   └── search.routes.ts
        │
        ├── download/                # Feature: Descarga de canciones
        │   ├── pages/
        │   │   └── download-page/
        │   ├── components/
        │   │   └── progress-bar/
        │   ├── services/
        │   │   └── download.service.ts
        │   ├── models/
        │   │   └── download-task.model.ts
        │   └── download.routes.ts
        │
        ├── library/                 # Feature: Biblioteca de canciones
        │   ├── pages/
        │   │   └── library-page/
        │   ├── components/
        │   │   ├── song-list/
        │   │   └── filter-panel/
        │   ├── services/
        │   │   └── library.service.ts
        │   └── library.routes.ts
        │
        └── recognition/             # Feature: Adivinator / Reconocimiento
            ├── pages/
            │   └── recognition-page/
            ├── components/
            │   ├── recorder/        # Graba audio desde el micrófono
            │   └── result-display/  # Muestra la canción reconocida
            ├── services/
            │   └── recognition.service.ts
            └── recognition.routes.ts
```

---

## 🔑 Conceptos Clave: Standalone Components (Angular 19)

### Ya NO se usa `NgModule`. Todo componente se declara con `standalone: true` (default en v19).

```typescript
// ❌ Angular clásico (pre-v14)
@NgModule({
  declarations: [SearchPageComponent],
  imports: [CommonModule, HttpClientModule],
})
export class SearchModule {}

// ✅ Angular 19 — Standalone (esto es lo que usamos)
@Component({
  selector: 'app-search-page',
  standalone: true,                    // default en v19, se puede omitir
  imports: [SearchBarComponent, ResultGalleryComponent, DurationPipe],
  templateUrl: './search-page.component.html',
})
export class SearchPageComponent {}
```

---

## 🗺️ Routing — Sin NgModule, con Lazy Loading

### `app/app.routes.ts`

```typescript
import { Routes } from '@angular/router';

export const APP_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'search',
    pathMatch: 'full'
  },
  {
    path: 'search',
    loadComponent: () =>
      import('./features/search/pages/search-page/search-page.component')
        .then(m => m.SearchPageComponent),
    title: 'FhashMusic — Buscar canciones'
  },
  {
    path: 'library',
    loadComponent: () =>
      import('./features/library/pages/library-page/library-page.component')
        .then(m => m.LibraryPageComponent),
    title: 'FhashMusic — Mi Biblioteca'
  },
  {
    path: 'recognition',
    loadComponent: () =>
      import('./features/recognition/pages/recognition-page/recognition-page.component')
        .then(m => m.RecognitionPageComponent),
    title: 'FhashMusic — Adivinator'
  },
  {
    path: '**',
    redirectTo: 'search'
  }
];
```

> **¿Cómo funciona `loadComponent()`?**  
> Angular carga el componente de forma lazy (solo cuando el usuario navega a esa ruta).  
> El bundle inicial es más pequeño. No necesita RouterModule en ningún módulo porque NO hay módulos.

### `app/app.config.ts`

```typescript
import { ApplicationConfig } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { APP_ROUTES } from './app.routes';
import { errorInterceptor } from './core/interceptors/error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(APP_ROUTES, withComponentInputBinding()),
    provideHttpClient(withInterceptors([errorInterceptor])),
  ]
};
```

---

## 🧩 Contratos de Componentes Clave

### `shared/components/song-card/song-card.component.ts`

```typescript
import { Component, input, output } from '@angular/core';
import { SearchResult } from '../../models/...';
import { DurationPipe } from '../../pipes/duration.pipe';

@Component({
  selector: 'app-song-card',
  standalone: true,
  imports: [DurationPipe],
  templateUrl: './song-card.component.html',
  styleUrl: './song-card.component.scss'
})
export class SongCardComponent {
  // Signals API (Angular 17+) — reemplaza @Input()/@Output()
  song = input.required<SearchResult>();    // @Input requerido
  onDownload = output<{ id: string, format: 'mp3' | 'mp4' }>();
  onPreview = output<string>();             // emite song.url
  onAddToLibrary = output<string>();        // emite song.id

  download(format: 'mp3' | 'mp4') {
    this.onDownload.emit({ id: this.song().id, format });
  }
}
```

### `features/search/services/search.service.ts`

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SearchResponse } from '../models/search-result.model';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SearchService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/v1/search`;

  search(query: string, limit: number = 5): Observable<SearchResponse> {
    const params = new HttpParams()
      .set('q', query)
      .set('limit', limit);
    return this.http.get<SearchResponse>(this.baseUrl, { params });
  }
}
```

### `features/search/models/search-result.model.ts`

```typescript
// Espeja los DTOs del backend
export interface SongResult {
  id: string;
  title: string;
  uploader: string;
  duration: number;
  duration_formatted: string;
  url: string;
  thumbnail: string | null;
}

export interface SearchResponse {
  results: SongResult[];
  total: number;
  query: string;
  cached: boolean;
}
```

---

## 📡 Estado Reactivo con Signals

### `features/search/pages/search-page/search-page.component.ts`

```typescript
import { Component, signal, computed, inject } from '@angular/core';
import { SearchService } from '../../services/search.service';
import { SongResult } from '../../models/search-result.model';
import { SearchBarComponent } from '../../components/search-bar/search-bar.component';
import { ResultGalleryComponent } from '../../components/result-gallery/result-gallery.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-search-page',
  standalone: true,
  imports: [SearchBarComponent, ResultGalleryComponent, LoadingSpinnerComponent],
  templateUrl: './search-page.component.html',
})
export class SearchPageComponent {
  private searchService = inject(SearchService);

  // Estado reactivo con Signals
  results = signal<SongResult[]>([]);
  isLoading = signal(false);
  error = signal<string | null>(null);
  hasResults = computed(() => this.results().length > 0);

  onSearch(query: string) {
    this.isLoading.set(true);
    this.error.set(null);

    this.searchService.search(query).subscribe({
      next: (response) => {
        this.results.set(response.results);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set('Error al buscar canciones. Intenta de nuevo.');
        this.isLoading.set(false);
      }
    });
  }
}
```

---

## 🎨 Design System

### `styles.scss` — Variables globales

```scss
:root {
  // Paleta de colores (herencia del diseño actual)
  --color-primary: #a18aff;
  --color-primary-dark: #7c5cbf;
  --color-bg: #1a1d3a;
  --color-surface: #251a47;
  --color-surface-2: #2d225a;
  --color-text: #e3e3fa;
  --color-text-muted: #bdbdf7;

  // Tipografía
  --font-body: 'Poppins', sans-serif;

  // Espaciado
  --spacing-xs: 0.4rem;
  --spacing-sm: 0.8rem;
  --spacing-md: 1.2rem;
  --spacing-lg: 2rem;

  // Border radius
  --radius-sm: 8px;
  --radius-md: 16px;
  --radius-pill: 999px;

  // Sombras
  --shadow-card: 0 2px 12px rgba(0, 0, 0, 0.2);
  --shadow-hover: 0 6px 24px rgba(161, 138, 255, 0.2);
}
```

---

---

# ═══════════════════════════════════════
# PARTE III — PLAN DE IMPLEMENTACIÓN
# ═══════════════════════════════════════

## Fases de desarrollo

### Fase 1 — Core funcional (Backend + Frontend básico)

```
Backend:
  ✅ config/settings.py con BaseSettings
  ✅ domain/entities (Song, DownloadTask)
  ✅ domain/repositories (interfaces)
  ✅ domain/exceptions
  ✅ infrastructure/adapters/ytdlp_adapter.py
  ✅ infrastructure/adapters/memory_cache.py
  ✅ infrastructure/adapters/ffmpeg_adapter.py
  ✅ application/use_cases/search_songs.py
  ✅ application/use_cases/download_song.py
  ✅ api/v1/search.py
  ✅ api/v1/download.py
  ✅ api/dependencies.py
  ✅ main.py

Frontend:
  ✅ app.config.ts + app.routes.ts
  ✅ shared/pipes/duration.pipe.ts
  ✅ shared/components/song-card
  ✅ features/search/** (completo)
  ✅ features/download/** (progreso de descarga)
  ✅ core/services/api.service.ts
```

### Fase 2 — Biblioteca + Reconocimiento

```
Backend:
  ☐ infrastructure/database/models.py (SQLAlchemy)
  ☐ application/use_cases/manage_library.py
  ☐ api/v1/library.py
  ☐ api/v1/recognition.py

Frontend:
  ☐ features/library/**
  ☐ features/recognition/**
  ☐ shared/components/audio-player
```

### Fase 3 — Autenticación + Deploy

```
Backend:
  ☐ api/v1/auth.py (JWT)
  ☐ core/guards/auth.guard.ts
  ☐ Docker + docker-compose

Frontend:
  ☐ features/auth/
  ☐ core/interceptors/auth.interceptor.ts
```

---

## 📋 Reglas del Proyecto

1. **Sin NgModules** — Solo Standalone Components
2. **Sin lógica en componentes de presentación** — la lógica va en servicios
3. **Sin `any` en TypeScript** — todo debe tener tipo
4. **Sin `fetch()` directo en componentes** — siempre pasar por un Service
5. **Sin rutas hardcodeadas** — usar `environment.apiUrl`
6. **Una responsabilidad por archivo** — en backend Y frontend
7. **Toda entidad del backend tiene su model en frontend** que espeja el DTO
