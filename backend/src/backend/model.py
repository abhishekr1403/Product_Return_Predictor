"""
model.py — ModelService

Responsible for:
  1. Loading model_data.joblib exactly once at application startup.
  2. Preprocessing raw PredictionRequest inputs into the 85-column feature
     matrix the model expects.
  3. Running inference and returning a structured result.

Preprocessing pipeline (mirrors the training notebook):
  a. Impute missing numeric fields using per-feature raw medians stored in
     model_data.joblib['train_medians'].
  b. Compute log_price = log1p(price), then scale the complete 14-column
     numeric block with the saved StandardScaler.
  c. One-hot encode the 5 categorical columns and align the result to the
     saved model_columns list (unseen OHE columns are dropped; missing ones
     are filled with 0).
  d. Assemble the final DataFrame in model_columns order and call predict.
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd

from .config import settings
from .schemas import (
    FeatureImportanceItem,
    ModelInfoResponse,
    PredictionRequest,
    PredictionResponse,
)

logger = logging.getLogger(__name__)


def _confidence_band(prob: float) -> str:
    """Map a probability to a human-readable confidence label."""
    distance = abs(prob - 0.5)
    if distance >= 0.30:
        return "High"
    if distance >= 0.10:
        return "Medium"
    return "Low"


class ModelService:
    """Singleton-style service wrapping the trained scikit-learn model."""

    def __init__(self) -> None:
        self._model: Any = None
        self._scaler: Any = None
        self._model_columns: list[str] = []
        self._numeric_features: list[str] = []
        self._binary_flags: list[str] = []
        self._categorical_features: list[str] = []
        self._train_medians: dict[str, float] = {}
        self._metrics: dict[str, float] = {}
        self._feature_importance: list[dict] = []
        self._threshold: float = 0.5
        self._model_name: str = ""
        self._loaded: bool = False

    # ------------------------------------------------------------------
    # Lifecycle
    # ------------------------------------------------------------------

    def load(self, path: Path | None = None) -> None:
        """Load the joblib artifact into memory.  Called once at app startup."""
        model_path = path or settings.MODEL_PATH
        logger.info("Loading model from %s", model_path)

        data: dict = joblib.load(model_path)

        self._model = data["model"]
        self._scaler = data["scaler"]
        self._model_columns = data["model_columns"]
        self._numeric_features = data["numeric_features"]
        self._binary_flags = data["binary_flags"]
        self._categorical_features = data["categorical_features"]
        self._train_medians = data["train_medians"]
        self._metrics = data["metrics"]
        self._feature_importance = data["feature_importance"]
        self._threshold = data["threshold"]
        self._model_name = data["model_name"]
        self._loaded = True

        logger.info("Model '%s' loaded successfully (threshold=%.2f)", self._model_name, self._threshold)

    def unload(self) -> None:
        """Release model from memory on app shutdown."""
        self._model = None
        self._loaded = False
        logger.info("Model unloaded")

    @property
    def is_loaded(self) -> bool:
        return self._loaded

    # ------------------------------------------------------------------
    # Preprocessing
    # ------------------------------------------------------------------

    def _preprocess(self, request: PredictionRequest) -> pd.DataFrame:
        """
        Convert a PredictionRequest into an 85-column DataFrame ready for
        the Logistic Regression model.
        """
        raw = request.model_dump(mode="json")

        # ---- 1. Numeric block -----------------------------------------
        # log_price replaces price in the feature space.
        import math
        log_price = math.log1p(raw["price"])

        # Omitted numeric fields are imputed with their raw training median,
        # then the complete 14-feature row is transformed with StandardScaler.
        full_numeric_raw: dict[str, float] = {}
        for feat in self._numeric_features:
            if feat == "log_price":
                full_numeric_raw[feat] = log_price
            else:
                val = raw.get(feat)
                full_numeric_raw[feat] = (
                    float(val)
                    if val is not None
                    else float(self._train_medians.get(feat, 0.0))
                )

        # Scale the full 14-column row in one call (matches scaler's fit signature).
        scale_df = pd.DataFrame([full_numeric_raw], columns=self._scaler.feature_names_in_)
        scaled_vals = self._scaler.transform(scale_df)[0]
        numeric_row: dict[str, float] = {
            col: float(val)
            for col, val in zip(self._scaler.feature_names_in_, scaled_vals)
        }

        # ---- 2. Binary flags ------------------------------------------
        binary_row: dict[str, int] = {
            flag: int(raw.get(flag, False)) for flag in self._binary_flags
        }

        # ---- 3. One-hot encoding for categoricals ---------------------
        cat_values = {
            feat: raw.get(feat) for feat in self._categorical_features
        }
        cat_df = pd.DataFrame([cat_values])
        ohe_df = pd.get_dummies(cat_df, columns=self._categorical_features)

        # ---- 4. Assemble and align ------------------------------------
        combined = {**numeric_row, **binary_row}
        for col in ohe_df.columns:
            combined[col] = int(ohe_df[col].iloc[0])

        result_df = pd.DataFrame([combined])

        # Add any missing model columns as 0 (unseen OHE combinations).
        for col in self._model_columns:
            if col not in result_df.columns:
                result_df[col] = 0

        # Drop any extra columns not in model_columns.
        result_df = result_df[self._model_columns]

        return result_df

    # ------------------------------------------------------------------
    # Inference
    # ------------------------------------------------------------------

    def predict(self, request: PredictionRequest) -> PredictionResponse:
        """Run the full preprocessing + inference pipeline."""
        if not self._loaded:
            raise RuntimeError("Model is not loaded. Call load() first.")

        feature_df = self._preprocess(request)

        # predict_proba returns [[p_class0, p_class1]]
        proba = self._model.predict_proba(feature_df)[0]
        return_prob = float(proba[1])
        will_return = return_prob >= self._threshold

        return PredictionResponse(
            will_return=will_return,
            return_probability=round(return_prob, 4),
            confidence=_confidence_band(return_prob),
            threshold_used=self._threshold,
            model_name=self._model_name,
        )

    # ------------------------------------------------------------------
    # Metadata
    # ------------------------------------------------------------------

    def get_info(self) -> ModelInfoResponse:
        """Return model metadata for the /model/info endpoint."""
        if not self._loaded:
            raise RuntimeError("Model is not loaded.")

        return ModelInfoResponse(
            model_name=self._model_name,
            accuracy=round(self._metrics.get("Accuracy", 0.0), 4),
            precision=round(self._metrics.get("Precision", 0.0), 4),
            recall=round(self._metrics.get("Recall", 0.0), 4),
            f1=round(self._metrics.get("F1", 0.0), 4),
            threshold=self._threshold,
            top_features=[
                FeatureImportanceItem(**item) for item in self._feature_importance
            ],
        )


# Module-level singleton — shared across the entire application.
model_service = ModelService()
