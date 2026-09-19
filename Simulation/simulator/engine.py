"""Simplified, configurable virtual engine dynamics for the Aeronex prototype.

This module is an academic software model. Its representative values and
relationships are not specifications for any real engine, aircraft, or UAV.
"""

from dataclasses import dataclass, field
from enum import Enum
from math import exp


class OperatingMode(str, Enum):
    """Throttle-based operating modes for the representative simulation."""

    IDLE = "IDLE"
    CRUISE = "CRUISE"
    HIGH_LOAD = "HIGH_LOAD"


TelemetryValue = float | str | bool
TelemetryRecord = dict[str, TelemetryValue]


@dataclass
class EngineConfig:
    """Tunable, representative parameters for the simplified simulation."""

    min_throttle: float = 0.0
    max_throttle: float = 1.0
    idle_throttle_max: float = 0.20
    cruise_throttle_max: float = 0.65

    altitude_performance_loss_per_meter: float = 0.000025
    minimum_available_performance: float = 0.70
    reference_ambient_temperature: float = 20.0
    ambient_cht_effect: float = 0.35
    ambient_egt_effect: float = 0.25
    ambient_oil_temperature_effect: float = 0.30

    idle_rpm: float = 800.0
    max_rpm: float = 3_000.0
    rpm_time_constant: float = 1.5

    idle_fuel_flow: float = 1.0
    max_fuel_flow: float = 22.0
    fuel_flow_time_constant: float = 1.8

    idle_cht: float = 70.0
    max_cht: float = 190.0
    cht_time_constant: float = 25.0

    idle_egt: float = 200.0
    max_egt: float = 650.0
    egt_time_constant: float = 12.0

    idle_oil_temperature: float = 60.0
    max_oil_temperature: float = 110.0
    oil_temperature_time_constant: float = 45.0

    min_oil_pressure: float = 3.0
    max_oil_pressure: float = 6.0
    absolute_min_oil_pressure: float = 0.0
    oil_pressure_time_constant: float = 2.0

    idle_vibration: float = 0.10
    max_vibration: float = 0.65
    vibration_time_constant: float = 3.0

    throttle_load_weight: float = 0.5
    rpm_load_weight: float = 0.5


@dataclass
class Environment:
    """Representative environment inputs applied to the simulated engine."""

    altitude: float = 0.0
    ambient_temperature: float = 20.0
    mission_elapsed_time: float = 0.0


class DegradationScenario(str, Enum):
    """Controlled degradation scenarios for repeatable prototype testing."""

    NORMAL = "NORMAL"
    COOLING_DEGRADATION = "COOLING_DEGRADATION"
    LUBRICATION_DEGRADATION = "LUBRICATION_DEGRADATION"
    VIBRATION_INCREASE = "VIBRATION_INCREASE"
    SENSOR_DRIFT = "SENSOR_DRIFT"


@dataclass
class DegradationConfig:
    """Tunable severity growth and telemetry effects for degradation scenarios."""

    severity_rate_per_second: float = 0.04
    max_severity: float = 1.0

    cooling_cht_increase: float = 60.0
    cooling_egt_increase: float = 45.0
    lubrication_oil_temperature_increase: float = 30.0
    lubrication_oil_pressure_reduction: float = 3.0
    vibration_increase: float = 0.35

    sensor_drift_rpm_increase: float = 150.0
    sensor_drift_cht_increase: float = 20.0
    sensor_drift_egt_increase: float = 25.0
    sensor_drift_oil_temperature_increase: float = 10.0
    sensor_drift_oil_pressure_reduction: float = 0.50
    sensor_drift_vibration_increase: float = 0.08


@dataclass
class DegradationState:
    """Track the selected controlled scenario and its gradual severity."""

    scenario: DegradationScenario = DegradationScenario.NORMAL
    enabled: bool = False
    severity: float = 0.0
    config: DegradationConfig = field(default_factory=DegradationConfig, repr=False)

    def configure(
        self,
        scenario: DegradationScenario,
        enabled: bool = True,
        reset_severity: bool = True,
    ) -> None:
        """Select a scenario and optionally restart its severity progression."""
        self.scenario = scenario
        self.enabled = enabled and scenario is not DegradationScenario.NORMAL
        if reset_severity:
            self.severity = 0.0

    def disable(self) -> None:
        """Disable controlled degradation and restore the normal scenario."""
        self.scenario = DegradationScenario.NORMAL
        self.enabled = False
        self.severity = 0.0

    def update(self, dt: float) -> None:
    #"""Keep severity under manual control during interactive simulation."""
     if dt < 0.0:
        raise ValueError("dt must be non-negative")

    # Severity is controlled explicitly by the simulation controller/UI.
    # It does not increase automatically with simulation time.
     self.severity = max(
        0.0,
        min(self.severity, self.config.max_severity),
     )


@dataclass
class Engine:
    """Store and update the current state of the virtual engine simulation."""

    # State defaults establish a configurable prototype starting condition only.
    throttle: float = 0.0
    rpm: float = 800.0
    cht: float = 70.0
    egt: float = 200.0
    oil_temperature: float = 60.0
    oil_pressure: float = 4.0
    fuel_flow: float = 1.0
    vibration: float = 0.10
    engine_load: float = 0.0
    available_performance: float = 1.0
    config: EngineConfig = field(default_factory=EngineConfig, repr=False)
    environment: Environment = field(default_factory=Environment, repr=False)
    degradation: DegradationState = field(
        default_factory=DegradationState, repr=False
    )
    operating_mode: OperatingMode = field(default=OperatingMode.IDLE, init=False)

    def __post_init__(self) -> None:
        """Synchronize the operating mode with the initial throttle setting."""
        self.set_throttle(self.throttle)

    def set_throttle(self, value: float) -> None:
        """Set the throttle command, clamping it to configured bounds."""
        self.throttle = self._clamp(
            float(value), self.config.min_throttle, self.config.max_throttle
        )
        self._update_operating_mode()

    def set_environment(
        self,
        *,
        altitude: float | None = None,
        ambient_temperature: float | None = None,
    ) -> None:
        """Update representative environment inputs without changing mission time."""
        if altitude is not None:
            self.environment.altitude = max(0.0, float(altitude))
        if ambient_temperature is not None:
            self.environment.ambient_temperature = float(ambient_temperature)

    def set_degradation_scenario(
        self,
        scenario: DegradationScenario,
        *,
        enabled: bool = True,
        reset_severity: bool = True,
    ) -> None:
        """Configure a controlled scenario for repeatable degradation testing."""
        self.degradation.configure(scenario, enabled, reset_severity)

    def disable_degradation(self) -> None:
        """Disable the active controlled degradation scenario."""
        self.degradation.disable()

    def update(self, dt: float) -> None:
        """Advance the deterministic engine-state model by ``dt`` seconds."""
        if dt < 0.0:
            raise ValueError("dt must be non-negative")
        if dt == 0.0:
            return

        self._update_operating_mode()
        self.environment.mission_elapsed_time += dt
        self.degradation.update(dt)
        self.available_performance = self._available_performance()
        target_rpm = self._interpolate(
            self.config.idle_rpm,
            self.config.max_rpm,
            self.throttle * self.available_performance,
        )
        self.rpm = self._approach(
            self.rpm, target_rpm, self.config.rpm_time_constant, dt
        )
        self.rpm = self._clamp(self.rpm, self.config.idle_rpm, self.config.max_rpm)

        rpm_fraction = self._normalized_rpm()
        self.engine_load = self._clamp(
            self.config.throttle_load_weight * self.throttle
            + self.config.rpm_load_weight * rpm_fraction,
            0.0,
            1.0,
        )
        ambient_temperature_delta = (
            self.environment.ambient_temperature
            - self.config.reference_ambient_temperature
        )
        cooling_severity = self._scenario_severity(
            DegradationScenario.COOLING_DEGRADATION
        )
        lubrication_severity = self._scenario_severity(
            DegradationScenario.LUBRICATION_DEGRADATION
        )
        vibration_severity = self._scenario_severity(
            DegradationScenario.VIBRATION_INCREASE
        )

        # Each quantity smoothly approaches an equilibrium value based on load.
        self.fuel_flow = self._approach(
            self.fuel_flow,
            self._interpolate(
                self.config.idle_fuel_flow,
                self.config.max_fuel_flow,
                self.engine_load,
            ),
            self.config.fuel_flow_time_constant,
            dt,
        )
        self.fuel_flow = max(0.0, self.fuel_flow)

        self.cht = self._approach(
            self.cht,
            self._interpolate(
                self.config.idle_cht, self.config.max_cht, self.engine_load
            )
            + ambient_temperature_delta * self.config.ambient_cht_effect
            + cooling_severity * self.degradation.config.cooling_cht_increase,
            self.config.cht_time_constant,
            dt,
        )
        self.egt = self._approach(
            self.egt,
            self._interpolate(
                self.config.idle_egt, self.config.max_egt, self.engine_load
            )
            + ambient_temperature_delta * self.config.ambient_egt_effect
            + cooling_severity * self.degradation.config.cooling_egt_increase,
            self.config.egt_time_constant,
            dt,
        )
        self.oil_temperature = self._approach(
            self.oil_temperature,
            self._interpolate(
                self.config.idle_oil_temperature,
                self.config.max_oil_temperature,
                self.engine_load,
            )
            + ambient_temperature_delta * self.config.ambient_oil_temperature_effect
            + lubrication_severity
            * self.degradation.config.lubrication_oil_temperature_increase,
            self.config.oil_temperature_time_constant,
            dt,
        )

        self.oil_pressure = self._approach(
            self.oil_pressure,
            self._interpolate(
                self.config.min_oil_pressure,
                self.config.max_oil_pressure,
                rpm_fraction,
            )
            - lubrication_severity
            * self.degradation.config.lubrication_oil_pressure_reduction,
            self.config.oil_pressure_time_constant,
            dt,
        )
        self.oil_pressure = self._clamp(
            self.oil_pressure,
            self.config.absolute_min_oil_pressure,
            self.config.max_oil_pressure,
        )

        self.vibration = self._approach(
            self.vibration,
            self._interpolate(
                self.config.idle_vibration,
                self.config.max_vibration,
                self.engine_load,
            )
            + vibration_severity * self.degradation.config.vibration_increase,
            self.config.vibration_time_constant,
            dt,
        )
        self.vibration = max(0.0, self.vibration)

    def get_physical_state(self) -> TelemetryRecord:
        """Return the unmodified simulated engine state, without sensor drift."""
        self._update_operating_mode()
        return {
            "throttle": self.throttle,
            "operating_mode": self.operating_mode.value,
            "rpm": self.rpm,
            "cht": self.cht,
            "egt": self.egt,
            "oil_temperature": self.oil_temperature,
            "oil_pressure": self.oil_pressure,
            "fuel_flow": self.fuel_flow,
            "vibration": self.vibration,
            "engine_load": self.engine_load,
            "available_performance": self.available_performance,
        }

    def get_telemetry(self, timestamp: float) -> TelemetryRecord:
        """Return a structured snapshot of the state at a simulation timestamp."""
        self._update_operating_mode()
        sensor_values = self.get_physical_state()
        sensor_drift_severity = self._scenario_severity(
            DegradationScenario.SENSOR_DRIFT
        )
        if sensor_drift_severity > 0.0:
            sensor_values["rpm"] = float(sensor_values["rpm"]) + (
                sensor_drift_severity
                * self.degradation.config.sensor_drift_rpm_increase
            )
            sensor_values["cht"] = float(sensor_values["cht"]) + (
                sensor_drift_severity
                * self.degradation.config.sensor_drift_cht_increase
            )
            sensor_values["egt"] = float(sensor_values["egt"]) + (
                sensor_drift_severity
                * self.degradation.config.sensor_drift_egt_increase
            )
            sensor_values["oil_temperature"] = float(
                sensor_values["oil_temperature"]
            ) + (
                sensor_drift_severity
                * self.degradation.config.sensor_drift_oil_temperature_increase
            )
            sensor_values["oil_pressure"] = max(
                0.0,
                float(sensor_values["oil_pressure"])
                - sensor_drift_severity
                * self.degradation.config.sensor_drift_oil_pressure_reduction,
            )
            sensor_values["vibration"] = float(sensor_values["vibration"]) + (
                sensor_drift_severity
                * self.degradation.config.sensor_drift_vibration_increase
            )
        return {
            "timestamp": float(timestamp),
            **sensor_values,
            "altitude": self.environment.altitude,
            "ambient_temperature": self.environment.ambient_temperature,
            "mission_elapsed_time": self.environment.mission_elapsed_time,
            "degradation_scenario": self.degradation.scenario.value,
            "degradation_enabled": self.degradation.enabled,
            "degradation_severity": self.degradation.severity,
        }

    def format_state(self, simulation_time: float | None = None) -> str:
        """Return the current engine state in a readable multi-line format."""
        self._update_operating_mode()
        lines = ["AERONEX ENGINE SIMULATOR", "-------------------------", ""]
        if simulation_time is not None:
            lines.append(f"Time: {simulation_time:.1f} s")

        lines.extend(
            (
                f"Throttle: {self.throttle:.2f}",
                f"Operating Mode: {self.operating_mode.value}",
                f"RPM: {self.rpm:.0f}",
                f"CHT: {self.cht:.1f} deg C",
                f"EGT: {self.egt:.1f} deg C",
                f"Oil Temperature: {self.oil_temperature:.1f} deg C",
                f"Oil Pressure: {self.oil_pressure:.2f} bar",
                f"Fuel Flow: {self.fuel_flow:.2f} L/h",
                f"Vibration: {self.vibration:.2f}",
            )
        )
        return "\n".join(lines)

    def _update_operating_mode(self) -> None:
        """Set the throttle-based operating mode using configured thresholds."""
        if not (
            self.config.min_throttle
            <= self.config.idle_throttle_max
            <= self.config.cruise_throttle_max
            <= self.config.max_throttle
        ):
            raise ValueError("operating mode thresholds must be ordered by throttle")

        if self.throttle <= self.config.idle_throttle_max:
            self.operating_mode = OperatingMode.IDLE
        elif self.throttle <= self.config.cruise_throttle_max:
            self.operating_mode = OperatingMode.CRUISE
        else:
            self.operating_mode = OperatingMode.HIGH_LOAD

    def _normalized_rpm(self) -> float:
        """Return RPM as a fraction of the configured simulated RPM range."""
        rpm_range = self.config.max_rpm - self.config.idle_rpm
        if rpm_range <= 0.0:
            raise ValueError("max_rpm must be greater than idle_rpm")
        return self._clamp((self.rpm - self.config.idle_rpm) / rpm_range, 0.0, 1.0)

    def _available_performance(self) -> float:
        """Estimate available simulated performance from the current altitude."""
        performance_loss = (
            self.environment.altitude
            * self.config.altitude_performance_loss_per_meter
        )
        return self._clamp(
            1.0 - performance_loss,
            self.config.minimum_available_performance,
            1.0,
        )

    def _scenario_severity(self, scenario: DegradationScenario) -> float:
        """Return severity only when the requested controlled scenario is active."""
        if self.degradation.enabled and self.degradation.scenario is scenario:
            return self.degradation.severity
        return 0.0

    @staticmethod
    def _approach(current: float, target: float, time_constant: float, dt: float) -> float:
        """Apply a first-order response toward a target value."""
        if time_constant <= 0.0:
            raise ValueError("time constants must be greater than zero")
        response_fraction = 1.0 - exp(-dt / time_constant)
        return current + (target - current) * response_fraction

    @staticmethod
    def _interpolate(minimum: float, maximum: float, fraction: float) -> float:
        """Linearly interpolate between two representative simulation values."""
        return minimum + (maximum - minimum) * fraction

    @staticmethod
    def _clamp(value: float, minimum: float, maximum: float) -> float:
        """Keep a value within inclusive configured bounds."""
        return max(minimum, min(value, maximum))


@dataclass
class TelemetryRecorder:
    """Collect ordered engine telemetry snapshots during a simulation run."""

    records: list[TelemetryRecord] = field(default_factory=list)

    def record(self, engine: Engine, timestamp: float) -> TelemetryRecord:
        """Capture and retain one engine state using simulation time only."""
        telemetry = engine.get_telemetry(timestamp)
        self.records.append(telemetry)
        return telemetry


class HealthStatus(str, Enum):
    """Rule-based health labels for the prototype Digital Twin."""

    NORMAL = "NORMAL"
    WARNING = "WARNING"
    CRITICAL = "CRITICAL"


@dataclass
class HealthConfig:
    """Representative threshold rules used by the non-AI health summary."""

    warning_cht: float = 125.0
    critical_cht: float = 165.0
    warning_egt: float = 450.0
    critical_egt: float = 600.0
    warning_oil_temperature: float = 90.0
    critical_oil_temperature: float = 115.0
    warning_oil_pressure: float = 2.8
    critical_oil_pressure: float = 1.5
    warning_vibration: float = 0.50
    critical_vibration: float = 0.75


@dataclass
class DigitalTwin:
    """Maintain a separate in-memory view of simulator and telemetry state."""

    health_config: HealthConfig = field(default_factory=HealthConfig, repr=False)
    latest_physical_state: TelemetryRecord = field(default_factory=dict)
    latest_sensor_telemetry: TelemetryRecord = field(default_factory=dict)
    environment_state: TelemetryRecord = field(default_factory=dict)
    degradation_state: TelemetryRecord = field(default_factory=dict)
    operating_mode: str = OperatingMode.IDLE.value
    health_status: HealthStatus = HealthStatus.NORMAL

    def receive_telemetry(
        self,
        telemetry: TelemetryRecord,
        physical_state: TelemetryRecord | None = None,
    ) -> None:
        """Ingest one telemetry record and optionally its simulator state snapshot."""
        self.latest_sensor_telemetry = dict(telemetry)
        if physical_state is not None:
            self.latest_physical_state = dict(physical_state)

        self.operating_mode = str(telemetry["operating_mode"])
        self.environment_state = {
            "altitude": telemetry["altitude"],
            "ambient_temperature": telemetry["ambient_temperature"],
            "mission_elapsed_time": telemetry["mission_elapsed_time"],
        }
        self.degradation_state = {
            "scenario": telemetry["degradation_scenario"],
            "enabled": telemetry["degradation_enabled"],
            "severity": telemetry["degradation_severity"],
        }
        self.health_status = self._evaluate_health(telemetry)

    def get_health_summary(self) -> dict[str, TelemetryValue | TelemetryRecord]:
        """Expose the current Digital Twin health and contextual state summary."""
        return {
            "health_status": self.health_status.value,
            "operating_mode": self.operating_mode,
            "environment": dict(self.environment_state),
            "degradation": dict(self.degradation_state),
            "latest_timestamp": self.latest_sensor_telemetry.get("timestamp", 0.0),
        }

    def _evaluate_health(self, telemetry: TelemetryRecord) -> HealthStatus:
        """Classify telemetry using ordered critical then warning thresholds."""
        cht = float(telemetry["cht"])
        egt = float(telemetry["egt"])
        oil_temperature = float(telemetry["oil_temperature"])
        oil_pressure = float(telemetry["oil_pressure"])
        vibration = float(telemetry["vibration"])

        if (
            cht >= self.health_config.critical_cht
            or egt >= self.health_config.critical_egt
            or oil_temperature >= self.health_config.critical_oil_temperature
            or oil_pressure <= self.health_config.critical_oil_pressure
            or vibration >= self.health_config.critical_vibration
        ):
            return HealthStatus.CRITICAL

        if (
            cht >= self.health_config.warning_cht
            or egt >= self.health_config.warning_egt
            or oil_temperature >= self.health_config.warning_oil_temperature
            or oil_pressure <= self.health_config.warning_oil_pressure
            or vibration >= self.health_config.warning_vibration
        ):
            return HealthStatus.WARNING

        return HealthStatus.NORMAL


def run_demonstration() -> None:
    """Run environment and degradation changes through the simulator and Twin."""
    engine = Engine()
    recorder = TelemetryRecorder()
    digital_twin = DigitalTwin()
    time_step = 0.5
    end_time = 40.0
    initial_record = recorder.record(engine, 0.0)
    digital_twin.receive_telemetry(initial_record, engine.get_physical_state())
    twin_history = [digital_twin.get_health_summary()]

    step_count = int(end_time / time_step)
    for step in range(1, step_count + 1):
        simulation_time = step * time_step

        if simulation_time == 15.0:
            engine.set_environment(altitude=3_500.0, ambient_temperature=32.0)
        if simulation_time == 20.0:
            engine.set_degradation_scenario(
                DegradationScenario.COOLING_DEGRADATION
            )

        if simulation_time < 5.0:
            engine.set_throttle(0.0)
        elif simulation_time < 15.0:
            engine.set_throttle(0.75 * (simulation_time - 5.0) / 10.0)
        elif simulation_time < 25.0:
            engine.set_throttle(0.75)
        elif simulation_time < 35.0:
            engine.set_throttle(0.75 * (35.0 - simulation_time) / 10.0)
        else:
            engine.set_throttle(0.0)

        engine.update(time_step)
        telemetry = recorder.record(engine, simulation_time)
        digital_twin.receive_telemetry(telemetry, engine.get_physical_state())
        twin_history.append(digital_twin.get_health_summary())

    first_cruise_index = next(
        index
        for index, record in enumerate(recorder.records)
        if record["operating_mode"] == OperatingMode.CRUISE.value
    )
    first_high_load_index = next(
        index
        for index, record in enumerate(recorder.records)
        if record["operating_mode"] == OperatingMode.HIGH_LOAD.value
    )
    changed_environment_index = next(
        index
        for index, record in enumerate(recorder.records)
        if float(record["altitude"]) > 0.0
        and record["operating_mode"] == OperatingMode.HIGH_LOAD.value
    )
    active_degradation_index = next(
        index
        for index, record in enumerate(recorder.records)
        if float(record["degradation_severity"]) >= 0.40
    )
    sample_indices = (
        ("IDLE (initial)", 0),
        ("CRUISE", first_cruise_index),
        ("HIGH_LOAD", first_high_load_index),
        ("HIGH_LOAD with changed environment", changed_environment_index),
        ("COOLING_DEGRADATION active", active_degradation_index),
        ("IDLE (returned)", len(recorder.records) - 1),
    )
    print("AERONEX ENGINE TELEMETRY")
    print("-------------------------")
    print(f"Collected records: {len(recorder.records)}")
    print("Telemetry and Digital Twin snapshots:")
    for label, index in sample_indices:
        print(f"{label} telemetry: {recorder.records[index]}")
        print(f"{label} Digital Twin: {twin_history[index]}")


if __name__ == "__main__":
    run_demonstration()
