"""
routers/model_info.py — GET /model/info

Returns metadata about the loaded model: name, evaluation metrics,
decision threshold, and top-20 feature importances.
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException, status

from ..model import model_service
from ..schemas import ModelInfoResponse

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get(
    "/info",
    response_model=ModelInfoResponse,
    summary="Get model metadata",
    description=(
        "Returns the loaded model's name, evaluation metrics (accuracy, "
        "precision, recall, F1), decision threshold, and the top feature "
        "importances ranked by absolute coefficient magnitude."
    ),
    responses={
        200: {"description": "Model metadata"},
        503: {"description": "Model not yet loaded"},
    },
)
async def model_info() -> ModelInfoResponse:
    """Retrieve metadata and performance metrics of the active model."""
    if not model_service.is_loaded:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Model is not loaded yet.",
        )
    return model_service.get_info()
