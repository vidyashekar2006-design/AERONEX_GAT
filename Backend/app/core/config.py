from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime settings. Environment variables (or .env) override these defaults."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    database_url: str = "sqlite:///./aeronex.db"
    host: str = "0.0.0.0"
    port: int = 8000
    telemetry_history_max_limit: int = 1000


@lru_cache
def get_settings() -> Settings:
    return Settings()
