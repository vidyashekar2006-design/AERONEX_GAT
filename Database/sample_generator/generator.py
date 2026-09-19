"""Deterministic development generator; intentionally not an engine simulator."""
from datetime import datetime, timezone
from uuid import UUID
from app.core.enums import DegradationScenario, OperatingMode
from app.schemas.telemetry import TelemetryInput


class TemporaryTelemetryGenerator:
    def __init__(self, engine_id: UUID, mission_run_id: UUID | None = None, seed: int = 0):
        self.engine_id, self.mission_run_id, self.seed, self.sequence = engine_id, mission_run_id, seed, 0

    def next(self) -> TelemetryInput:
        """Return reproducible, labelled sample data at the caller's chosen cadence."""
        n = self.sequence; self.sequence += 1
        return TelemetryInput(timestamp=datetime.now(timezone.utc), sim_time=n / 2, rpm=3000 + (n + self.seed) % 30, cht=145.0, egt=680.0, oil_temperature=92.0, oil_pressure=3.4, fuel_flow=4.8, vibration=0.18, throttle=0.55, altitude=3000.0, ambient_temperature=12.0, operating_mode=OperatingMode.CRUISE, degradation_scenario=DegradationScenario.NORMAL, degradation_enabled=False, degradation_severity=0.0, packet_id=f"sample-{self.seed}-{n}", sequence_number=n, source="SAMPLE_GENERATOR")
