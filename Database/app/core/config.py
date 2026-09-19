from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Database settings read solely from environment variables."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    database_url: str = "postgresql+asyncpg://aeronex:aeronex@localhost:5432/aeronex"
    sqlite_database_url: str = "sqlite+aiosqlite:///./aeronex.db"
    use_sqlite: bool = False
    test_database_url: str | None = None

    @property
    def active_database_url(self) -> str:
        return self.sqlite_database_url if self.use_sqlite else self.database_url


@lru_cache
def get_settings() -> Settings:
    return Settings()
