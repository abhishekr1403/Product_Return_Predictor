
from __future__ import annotations

from pathlib import Path
from typing import List

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables or a .env file.
    All values can be overridden at runtime, making the app deployment-ready.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # Path to the saved model joblib file.
    # Defaults to ../../artifacts/model_data.joblib relative to this file.
    MODEL_PATH: Path = (
        Path(__file__).parent.parent.parent.parent / "artifacts" / "model_data.joblib"
    )

    APP_ENV: str = "development"

    # Comma-separated or JSON list of allowed CORS origins.
    ALLOWED_ORIGINS: List[str] = ["*"]

    @field_validator("MODEL_PATH", mode="before")
    @classmethod
    def resolve_model_path(cls, v: str | Path) -> Path:
        return Path(v).resolve()


settings = Settings()
