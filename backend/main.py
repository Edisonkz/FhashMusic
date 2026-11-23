from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.v1.download import router as download_router
from api.v1.library import router as library_router
from api.v1.search import router as search_router
from config.logging import setup_logging
from config.settings import get_settings


def create_app() -> FastAPI:
    settings = get_settings()
    setup_logging(debug=settings.DEBUG)

    application = FastAPI(
        title=settings.APP_NAME,
        version="2.0.0",
        description="API REST con Clean Architecture para FhashMusic.",
        docs_url="/docs",
        redoc_url="/redoc",
    )

    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    api_prefix = f"/api/{settings.API_VERSION}"
    application.include_router(search_router, prefix=api_prefix)
    application.include_router(download_router, prefix=api_prefix)
    application.include_router(library_router, prefix=api_prefix)

    @application.get("/health", tags=["Health"])
    def health_check() -> dict:
        return {"status": "ok", "service": settings.APP_NAME, "version": "2.0.0"}

    return application


app = create_app()
