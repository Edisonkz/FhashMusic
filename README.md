# FhashMusic v2.0

Plataforma web full-stack para descubrimiento, preescucha, organización de biblioteca musical y gestión de descargas, construida con **Angular (Standalone Components + Signals + OnPush)** y **FastAPI + Clean Architecture**.

---

## Arquitectura

```text
FhashMusic/
├── frontend/FashMusic/          # Angular 21 · Standalone · Signals · Feature-Based
│   └── src/app/
│       ├── core/                # ApiService, PlayerStore, ToastService, Interceptors
│       ├── shared/              # SongCard, AudioPlayer, ToastContainer, Pipes, Directives
│       └── features/            # search, library, download, recognition (lazy-loaded)
│
├── backend/                     # FastAPI · Clean Architecture · Python 3.12
│   ├── domain/                  # Entidades puras, excepciones e interfaces (ABC)
│   ├── application/             # Casos de uso (Search, Download, Library) y DTOs Pydantic
│   ├── infrastructure/          # Adaptadores (yt-dlp, FFmpeg, caché TTL, SQLite)
│   ├── api/                     # Routers REST v1 e Inyección de Dependencias
│   └── tests/                   # Pruebas unitarias y de integración
│
└── architecture_spec.md         # Documento maestro de arquitectura
```

## Características Principales

- **Explorar (`/search`)**: búsqueda con filtros por género, historial reciente, skeleton loaders y fallback automático a catálogo demo cuando la API local no está corriendo.
- **Reproductor global persistente**: dock inferior disponible en todas las rutas con cola (`anterior`/`siguiente`), seek bar interactivo, control de volumen y sincronización con favoritos.
- **Mi Biblioteca (`/library`)**: colección persistida (SQLite en backend + `localStorage` en cliente), métricas de duración acumulada, buscador interno y ordenamiento (`Recientes`, `A–Z`, `Duración`).
- **Descargas (`/download`)**: cola reactiva con progreso por fases (`pending` → `downloading` → `converting` → `completed`), badges en sidebar y extracción MP3 320 kbps / MP4 vía `yt-dlp` + `FFmpeg`.
- **Adivinator (`/recognition`)**: interfaz de reconocimiento acústico con visualizador de ondas en tiempo real (Web Audio API) y carga de clips de audio.

---

## Ejecución Local

### 1. Backend (FastAPI — Puerto `9000`)

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 9000
```

Documentación interactiva Swagger disponible en `http://localhost:9000/docs`.

### 2. Frontend (Angular — Puerto `4200`)

```bash
cd frontend/FashMusic
npm install
npm start
```

Abrir `http://localhost:4200` en el navegador.

---

## Endpoints API v1

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/health` | Estado del servicio |
| `GET` | `/api/v1/search/?q=...&limit=10` | Búsqueda de pistas con caché TTL |
| `POST` | `/api/v1/download/` | Encola descarga MP3/MP4 en segundo plano |
| `GET` | `/api/v1/download/{task_id}` | Consulta progreso/estado de la tarea |
| `GET` | `/api/v1/download/stream/{song_id}` | Redirección al stream de preescucha |
| `GET` | `/api/v1/library/` | Lista canciones guardadas en SQLite |
| `POST` | `/api/v1/library/` | Guarda una canción en la biblioteca |
| `DELETE` | `/api/v1/library/{song_id}` | Elimina una canción de la biblioteca |

---

## Pruebas

**Backend:**
```bash
cd backend
python -m unittest discover -s tests -v
```

**Frontend:**
```bash
cd frontend/FashMusic
npm run build
npx ng test --watch=false
```

---

> **Aviso:** Proyecto desarrollado con fines educativos y de portafolio técnico para demostrar patrones de Clean Architecture, diseño de interfaces reactivas y comunicación REST. Respeta los términos de servicio y derechos de autor de las plataformas de contenido.
