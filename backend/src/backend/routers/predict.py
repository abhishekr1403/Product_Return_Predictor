"""
routers/predict.py — POST /predict

Accepts a PredictionRequest, delegates to ModelService, and returns a
PredictionResponse.  All validation errors are handled automatically by
FastAPI/Pydantic (422).  Runtime model errors return 500 with a detail message.
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException, status

from ..model import model_service
from ..schemas import PredictionRequest, PredictionResponse

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post(
    "",
    response_model=PredictionResponse,
    summary="Predict product return",
    description=(
        "Submit order and product details to get a prediction on whether the "
        "item will be returned.  Optional numeric fields are filled with "
        "training-time medians when omitted."
    ),
    responses={
        200: {"description": "Prediction result"},
        422: {"description": "Validation error — invalid field values"},
        500: {"description": "Internal server error during inference"},
    },
)
async def predict(request: PredictionRequest) -> PredictionResponse:
    """Run the return-prediction model against the submitted order details."""
    try:
        result = model_service.predict(request)
        logger.info(
            "Prediction complete | will_return=%s | prob=%.4f | confidence=%s",
            result.will_return,
            result.return_probability,
            result.confidence,
        )
        return result
    except RuntimeError as exc:
        logger.error("Model runtime error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc),
        ) from exc
    except Exception as exc:
        logger.exception("Unexpected error during prediction")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred during prediction.",
        ) from exc
