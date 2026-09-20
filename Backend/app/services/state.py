from datetime import datetime, timezone
from typing import Any

from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.models.alerts import HealthEvent
from app.models.mission import MissionState
from app.models.telemetry import TelemetryRecord
from app.schemas.contracts import unavailable_analysis, unavailable_reliability
from app.schemas.telemetry import TelemetryIn


def serialize_telemetry(record: TelemetryRecord) -> dict[str, Any]:
    return {
        "id": record.id, "timestamp": record.timestamp, "sim_time": record.sim_time,
        "rpm": record.rpm, "cht": record.cht, "egt": record.egt,
        "oil_temperature": record.oil_temperature, "oil_pressure": record.oil_pressure,
        "fuel_flow": record.fuel_flow, "vibration": record.vibration,
        "throttle": record.throttle, "altitude": record.altitude,
        "ambient_temperature": record.ambient_temperature, "operating_mode": record.operating_mode,
        "degradation_scenario": record.degradation_scenario,
        "degradation_enabled": record.degradation_enabled,
        "degradation_severity": record.degradation_severity,
    }


def latest_telemetry(db: Session) -> TelemetryRecord | None:
    return db.scalar(select(TelemetryRecord).order_by(desc(TelemetryRecord.timestamp)).limit(1))


def store_telemetry(db: Session, packet: TelemetryIn) -> TelemetryRecord:
    record = TelemetryRecord(**packet.model_dump(mode="json"))
    # model_dump(mode=json) serializes datetime; use Python form for SQLAlchemy.
    record.timestamp = packet.timestamp
    record.operating_mode = packet.operating_mode.value
    record.degradation_scenario = packet.degradation_scenario.value
    db.add(record)
    db.flush()
    update_mission(db, record)
    db.commit()
    db.refresh(record)
    return record


def update_mission(db: Session, record: TelemetryRecord) -> None:
    current = db.scalar(select(MissionState).order_by(desc(MissionState.updated_at)).limit(1))
    values = {
        "updated_at": record.timestamp,
        "phase": record.operating_mode,
        "elapsed_time": record.sim_time,
        "altitude": record.altitude,
        "throttle": record.throttle,
    }
    if current is None:
        db.add(MissionState(**values))
    else:
        for key, value in values.items():
            setattr(current, key, value)


def health_snapshot(db: Session, timestamp: datetime | None = None) -> dict[str, Any]:
    alerts = list(db.scalars(select(HealthEvent).where(HealthEvent.status == "ACTIVE").order_by(desc(HealthEvent.timestamp)).limit(100)))
    status = "CRITICAL" if any(a.severity == "CRITICAL" for a in alerts) else "WARNING" if alerts else "NORMAL"
    return {"status": status, "alerts": [serialize_alert(a) for a in alerts], "last_update": timestamp}


def serialize_alert(event: HealthEvent) -> dict[str, Any]:
    return {"id": event.id, "timestamp": event.timestamp, "type": event.type,
            "severity": event.severity, "message": event.message, "status": event.status}


def mission_snapshot(db: Session) -> dict[str, Any]:
    state = db.scalar(
        select(MissionState)
        .order_by(desc(MissionState.updated_at))
        .limit(1)
    )

    if state is None:
        return {
            "mission_name": "MALE UAV Engine Reliability Mission",
            "phase": None,
            "phase_index": None,
            "total_phases": 9,
            "progress": None,
            "altitude": None,
            "throttle": None,
            "elapsed_time": None,
            "estimated_end": None,
            "mission_reliability": unavailable_reliability(),
        }

    # Must match the 9-phase Simulation MissionProfile.
    phase_map = {
        "IDLE": 0,
        "START": 0,

        "HIGH_LOAD": 1,
        "TAKEOFF": 1,

        "CLIMB": 2,
        "CRUISE": 3,

        "HIGH-ALTITUDE CRUISE": 4,
        "ENVIRONMENT CHANGE": 5,

        "OPTIONAL DEGRADATION EVENT": 6,

        "RETURN / LOWER LOAD": 7,

        "MISSION COMPLETE": 8,
        "COMPLETE": 8,
    }

    phase_index = phase_map.get(
        str(state.phase).upper()
    )

    total_phases = 9

    progress = (
        ((phase_index + 1) / total_phases) * 100
        if phase_index is not None
        else None
    )

    return {
        "mission_name": state.mission_name,
        "phase": state.phase,
        "phase_index": phase_index,
        "total_phases": total_phases,
        "progress": progress,
        "altitude": state.altitude,
        "throttle": state.throttle,
        "elapsed_time": state.elapsed_time,
        "estimated_end": None,
        "mission_reliability": unavailable_reliability(),
    }

def digital_twin_snapshot(db: Session) -> dict[str, Any]:
    telemetry = latest_telemetry(db)
    if telemetry is None:
        return {"engine": None, "environment": None, "degradation": None,
                "health": {"status": "NOT_AVAILABLE"}}
    return {"engine": {"operating_mode": telemetry.operating_mode, "rpm": telemetry.rpm, "throttle": telemetry.throttle},
            "environment": {"altitude": telemetry.altitude, "ambient_temperature": telemetry.ambient_temperature},
            "degradation": {"scenario": telemetry.degradation_scenario, "enabled": telemetry.degradation_enabled, "severity": telemetry.degradation_severity},
            "health": {"status": health_snapshot(db, telemetry.timestamp)["status"]}}


def unified_snapshot(db: Session, record: TelemetryRecord | None = None, analysis: dict[str, Any] | None = None,) -> dict[str, Any]:
    record = record or latest_telemetry(db)
    if record is None:
        return {"timestamp": datetime.now(timezone.utc), "telemetry": None, "engine": None,
                "environment": None, "degradation": None, "health": {"status": "NOT_AVAILABLE"},
                "mission": mission_snapshot(db), "analysis": unavailable_analysis()}
    health = health_snapshot(db, record.timestamp)
    return {"timestamp": record.timestamp,
            "telemetry": {key: serialize_telemetry(record)[key] for key in ("rpm", "cht", "egt", "oil_temperature", "oil_pressure", "fuel_flow", "vibration")},
            "engine": {"throttle": record.throttle, "operating_mode": record.operating_mode},
            "environment": {"altitude": record.altitude, "ambient_temperature": record.ambient_temperature},
            "degradation": {"scenario": record.degradation_scenario, "enabled": record.degradation_enabled, "severity": record.degradation_severity},
            "health": {"status": health["status"]}, "mission": mission_snapshot(db),
            "analysis": analysis if analysis is not None else unavailable_analysis()}
