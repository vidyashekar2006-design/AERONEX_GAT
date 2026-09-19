from fastapi import APIRouter

router = APIRouter(tags=["ERC"])


@router.get("/api/reports")
def report_catalog():
    """Report interface placeholder; generation is intentionally not fabricated."""
    return {"reports": [], "status": "NOT_AVAILABLE", "supported_types": ["MISSION", "ENGINE_HEALTH", "ANALYSIS", "TELEMETRY_LOG"]}


@router.get("/api/configuration")
def dashboard_configuration():
    """Safe, read-only dashboard metadata; no host/server secrets are exposed."""
    return {"engine": {"scope": "AERO_PISTON_ENGINE"}, "telemetry": {"expected_interval_seconds": 0.5},
            "system": {"websocket_path": "/ws/simulation"}, "control": {"status": "SIMULATOR_MANAGED"}}
