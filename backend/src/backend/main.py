"""
main.py — FastAPI application entry point.

Startup sequence (via lifespan):
  1. ModelService.load() → reads model_data.joblib into memory.
  2. App begins serving requests.

Shutdown sequence:
  1. ModelService.unload() → releases model from memory.

Endpoints registered:
  GET  /health      — liveness probe
  GET  /model/info  — model metadata and metrics
  POST /predict     — return-probability inference
  GET  /docs        — Swagger UI  (auto-generated)
  GET  /redoc       — ReDoc UI    (auto-generated)
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .model import model_service
from .routers import model_info_router, predict_router
from .schemas import HealthResponse

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Lifespan — model load / unload
# ---------------------------------------------------------------------------


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Load the model on startup; unload on shutdown."""
    logger.info("Starting up — loading model...")
    model_service.load()
    logger.info("Startup complete. App is ready.")
    yield
    logger.info("Shutting down — unloading model...")
    model_service.unload()
    logger.info("Shutdown complete.")


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

app = FastAPI(
    lifespan=lifespan,
    title="Product Return Predictor API",
    description=(
        "A machine-learning API that predicts whether a product order is likely "
        "to be returned, based on product attributes, seller data, and order details."
    ),
    version="1.0.0",
    contact={
        "name": "Abhishek",
        "email": "abhishekraveendran1403@gmail.com",
    },
    license_info={"name": "MIT"},
)


# ---------------------------------------------------------------------------
# Middleware
# ---------------------------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------

app.include_router(predict_router, prefix="/predict", tags=["Prediction"])
app.include_router(model_info_router, prefix="/model", tags=["Model"])


# ---------------------------------------------------------------------------
# Core routes
# ---------------------------------------------------------------------------


@app.get(
    "/health",
    response_model=HealthResponse,
    tags=["Health"],
    summary="Liveness check",
    description="Returns the application status and whether the model is currently loaded.",
)
async def health() -> HealthResponse:
    return HealthResponse(status="ok", model_loaded=model_service.is_loaded)
