from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api.routes import alerts, analysis, degradation, digital_twin, erc, health, mission, system, telemetry
from app.api.websocket import router as websocket_router
from app.db import Base, engine
import app.models  # noqa: F401 -- imports model metadata before create_all


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title="AERONEX Backend", version="0.1.0", lifespan=lifespan)
app.include_router(system.router)
app.include_router(telemetry.router)
app.include_router(digital_twin.router)
app.include_router(health.router)
app.include_router(alerts.router)
app.include_router(degradation.router)
app.include_router(mission.router)
app.include_router(analysis.router)
app.include_router(erc.router)
app.include_router(websocket_router)
