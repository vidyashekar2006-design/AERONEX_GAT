from app.core.config import get_settings
from app.db.session import build_session_factory

engine, AsyncSessionLocal = build_session_factory(get_settings().active_database_url)
