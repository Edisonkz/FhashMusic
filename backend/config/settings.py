import os
import shutil
from functools import lru_cache
from pathlib import Path
from typing import List

from pydantic import BaseModel, Field

BASE_DIR = Path(__file__).resolve().parent.parent


def _resolve_ffmpeg() -> str:
    local_bin = BASE_DIR / "lib" / "ffmpeg" / "bin" / "ffmpeg.exe"
    if local_bin.exists():
        return str(local_bin)
    return shutil.which("ffmpeg") or "ffmpeg"


class Settings(BaseModel):
    APP_NAME: str = os.getenv("APP_NAME", "FhashMusic API")
    API_VERSION: str = os.getenv("API_VERSION", "v1")
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"

    CACHE_TTL_SECONDS: int = int(os.getenv("CACHE_TTL_SECONDS", "300"))
    FFMPEG_PATH: str = os.getenv("FFMPEG_PATH") or _resolve_ffmpeg()
    DOWNLOADS_DIR: Path = Path(os.getenv("DOWNLOADS_DIR", str(BASE_DIR.parent / "downloads")))
    LIBRARY_DB_PATH: Path = Path(os.getenv("LIBRARY_DB_PATH", str(BASE_DIR / "data" / "library.db")))

    ALLOWED_ORIGINS: List[str] = Field(
        default_factory=lambda: [
            origin.strip()
            for origin in os.getenv(
                "ALLOWED_ORIGINS",
                "http://localhost:4200,http://127.0.0.1:4200,http://localhost:8000",
            ).split(",")
            if origin.strip()
        ]
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
