"""Interactive control layer for the representative Aeronex simulation."""

from __future__ import annotations

from dataclasses import dataclass, field
from shlex import split as split_command
from sys import argv
from typing import Callable

try:
    from .engine import (
        DegradationScenario,
        DigitalTwin,
        Engine,
        TelemetryRecord,
        TelemetryRecorder,
    )
except ImportError:
    # Supports direct execution with: python simulator\controller.py
    from engine import (
        DegradationScenario,
        DigitalTwin,
        Engine,
        TelemetryRecord,
        TelemetryRecorder,
    )


@dataclass
class ControllerConfig:
    """Configurable prototype bounds and timing for simulation control."""

    fixed_timestep: float = 0.5
    minimum_altitude: float = 0.0
    maximum_altitude: float = 15_000.0
    minimum_ambient_temperature: float = -60.0
    maximum_ambient_temperature: float = 60.0


@dataclass
class SimulationControls:
    """The current commands applied to the engine at each simulation step."""

    throttle: float = 0.0
    altitude: float = 0.0
    ambient_temperature: float = 20.0
    degradation_scenario: DegradationScenario = DegradationScenario.NORMAL
    degradation_enabled: bool = False
    degradation_severity: float = 0.0


StepCallback = Callable[[TelemetryRecord], None]


@dataclass
class SimulationController:
    """Coordinate controls, engine updates, telemetry recording, and the Twin."""

    config: ControllerConfig = field(default_factory=ControllerConfig)
    engine: Engine = field(init=False)
    digital_twin: DigitalTwin = field(init=False)
    telemetry_recorder: TelemetryRecorder = field(init=False)
    controls: SimulationControls = field(init=False)
    running: bool = field(default=False, init=False)
    last_telemetry: TelemetryRecord = field(default_factory=dict, init=False)

    def __post_init__(self) -> None:
        if self.config.fixed_timestep <= 0.0:
            raise ValueError("fixed_timestep must be greater than zero")
        if self.config.minimum_altitude > self.config.maximum_altitude:
            raise ValueError("altitude control bounds must be ordered")
        if (
            self.config.minimum_ambient_temperature
            > self.config.maximum_ambient_temperature
        ):
            raise ValueError("ambient temperature control bounds must be ordered")
        self.reset()

    def start(self) -> None:
        """Allow the fixed-timestep simulation loop to advance."""
        self.running = True

    def pause(self) -> None:
        """Pause updates while retaining the current engine and Twin state."""
        self.running = False

    def reset(self) -> TelemetryRecord:
        """Restore the initial engine, controls, telemetry history, and Twin state."""
        self.engine = Engine()
        self.digital_twin = DigitalTwin()
        self.telemetry_recorder = TelemetryRecorder()
        self.controls = SimulationControls(
            throttle=self.engine.throttle,
            altitude=self.engine.environment.altitude,
            ambient_temperature=self.engine.environment.ambient_temperature,
        )
        self.running = False
        self.last_telemetry = self.telemetry_recorder.record(self.engine, 0.0)
        self.digital_twin.receive_telemetry(
            self.last_telemetry, self.engine.get_physical_state()
        )
        return self.last_telemetry

    def set_throttle(self, value: float) -> float:
        """Clamp and store a throttle command for subsequent simulation steps."""
        self.controls.throttle = self._clamp(
            float(value),
            self.engine.config.min_throttle,
            self.engine.config.max_throttle,
        )
        return self.controls.throttle

    def set_altitude(self, value: float) -> float:
        """Clamp and store a representative altitude command."""
        self.controls.altitude = self._clamp(
            float(value),
            self.config.minimum_altitude,
            self.config.maximum_altitude,
        )
        return self.controls.altitude

    def set_ambient_temperature(self, value: float) -> float:
        """Clamp and store a representative ambient-temperature command."""
        self.controls.ambient_temperature = self._clamp(
            float(value),
            self.config.minimum_ambient_temperature,
            self.config.maximum_ambient_temperature,
        )
        return self.controls.ambient_temperature

    def set_degradation_scenario(
        self,
        scenario: DegradationScenario | str,
        *,
        enabled: bool = True,
        reset_severity: bool = True,
    ) -> DegradationScenario:
        """Select a controlled degradation scenario for following steps."""
        selected_scenario = self._parse_scenario(scenario)
        self.controls.degradation_scenario = selected_scenario
        self.controls.degradation_enabled = (
            enabled and selected_scenario is not DegradationScenario.NORMAL
        )
        if reset_severity:
            self.controls.degradation_severity = 0.0
        return selected_scenario

    def set_degradation_severity(self, value: float) -> float:
        """Clamp and store a direct severity setting for the active scenario."""
        self.controls.degradation_severity = self._clamp(
            float(value), 0.0, self.engine.degradation.config.max_severity
        )
        return self.controls.degradation_severity

    def set_degradation_enabled(self, enabled: bool) -> bool:
     """Enable or disable degradation processing."""
     self.controls.degradation_enabled = bool(enabled)

     if not self.controls.degradation_enabled:
        self.controls.degradation_severity = 0.0

     return self.controls.degradation_enabled

    def step(self) -> TelemetryRecord | None:
        """Apply controls and advance one configured fixed-timestep simulation step."""
        if not self.running:
            return None

        self._apply_controls()
        self.engine.update(self.config.fixed_timestep)
        self.last_telemetry = self.telemetry_recorder.record(
            self.engine, self.engine.environment.mission_elapsed_time
        )
        self.digital_twin.receive_telemetry(
            self.last_telemetry, self.engine.get_physical_state()
        )
        self._synchronize_controls_from_engine()
        return self.last_telemetry

    def run_steps(
        self,
        step_count: int,
        callback: StepCallback | None = None,
    ) -> list[TelemetryRecord]:
        """Run up to ``step_count`` fixed updates while the controller is started."""
        if step_count < 0:
            raise ValueError("step_count must be non-negative")

        records: list[TelemetryRecord] = []
        for _ in range(step_count):
            telemetry = self.step()
            if telemetry is None:
                break
            records.append(telemetry)
            if callback is not None:
                callback(telemetry)
        return records

    def run_continuous(
        self,
        callback: StepCallback | None = None,
        max_steps: int | None = None,
    ) -> list[TelemetryRecord]:
        """Run fixed updates until paused or an optional step limit is reached."""
        if max_steps is not None and max_steps < 0:
            raise ValueError("max_steps must be non-negative")

        records: list[TelemetryRecord] = []
        while self.running and (max_steps is None or len(records) < max_steps):
            telemetry = self.step()
            if telemetry is None:
                break
            records.append(telemetry)
            if callback is not None:
                callback(telemetry)
        return records

    def get_status(self) -> dict[str, object]:
        """Return a compact, UI-ready snapshot without exposing mutable internals."""
        return {
            "running": self.running,
            "timestamp": self.engine.environment.mission_elapsed_time,
            "controls": {
                "throttle": self.controls.throttle,
                "altitude": self.controls.altitude,
                "ambient_temperature": self.controls.ambient_temperature,
                "degradation_scenario": self.controls.degradation_scenario.value,
                "degradation_enabled": self.controls.degradation_enabled,
                "degradation_severity": self.controls.degradation_severity,
            },
            "digital_twin": self.digital_twin.get_health_summary(),
            "latest_telemetry": dict(self.last_telemetry),
        }

    def _apply_controls(self) -> None:
        """Push controller commands into the existing Engine model before each step."""
        self.engine.set_throttle(self.controls.throttle)
        self.engine.set_environment(
            altitude=self.controls.altitude,
            ambient_temperature=self.controls.ambient_temperature,
        )
        self.engine.degradation.configure(
            self.controls.degradation_scenario,
            self.controls.degradation_enabled,
            reset_severity=False,
        )
        self.engine.degradation.severity = self.controls.degradation_severity

    def _synchronize_controls_from_engine(self) -> None:
        """Retain gradual severity changes produced by the Engine update."""
        self.controls.degradation_severity = self.engine.degradation.severity

    @staticmethod
    def _parse_scenario(scenario: DegradationScenario | str) -> DegradationScenario:
        """Accept a scenario enum or its user-facing name."""
        if isinstance(scenario, DegradationScenario):
            return scenario
        try:
            return DegradationScenario(str(scenario).upper())
        except ValueError as error:
            valid = ", ".join(item.value for item in DegradationScenario)
            raise ValueError(f"unknown degradation scenario; choose: {valid}") from error

    @staticmethod
    def _clamp(value: float, minimum: float, maximum: float) -> float:
        """Keep a numeric control value within configured inclusive bounds."""
        return max(minimum, min(value, maximum))


def run_scripted_demonstration() -> None:
    """Show controller changes flowing through telemetry and the Digital Twin."""
    controller = SimulationController()

    def show(label: str) -> None:
        telemetry = controller.last_telemetry
        summary = controller.digital_twin.get_health_summary()
        print(f"{label} telemetry: {telemetry}")
        print(f"{label} Digital Twin: {summary}")

    print("AERONEX INTERACTIVE SIMULATION CONTROLLER")
    print("----------------------------------------")
    show("Initial idle")

    controller.start()
    controller.run_steps(10)
    controller.set_throttle(0.75)
    controller.run_steps(20)
    show("High throttle")

    controller.set_altitude(3_500.0)
    controller.set_ambient_temperature(32.0)
    controller.run_steps(10)
    show("Changed environment")

    controller.set_degradation_scenario(DegradationScenario.COOLING_DEGRADATION)
    controller.set_degradation_severity(0.40)
    controller.run_steps(30)
    show("Cooling degradation")

    controller.pause()
    controller.reset()
    show("After reset")


def run_interactive_terminal() -> None:
    """Provide a terminal control shell for manual fixed-step simulation runs."""
    controller = SimulationController()
    print("AERONEX INTERACTIVE CONTROLS")
    print("Commands: start, pause, reset, step [count], throttle <0..1>")
    print("          altitude <value>, temperature <value>, degradation <name>")
    print("          severity <0..1>, enable, disable, status, quit")

    while True:
        try:
            parts = split_command(input("aeronex> "))
        except (EOFError, KeyboardInterrupt):
            print("\nInteractive session ended.")
            return

        if not parts:
            continue

        command, *arguments = parts
        command = command.lower()
        try:
            if command == "start":
                controller.start()
                print("Simulation started.")
            elif command == "pause":
                controller.pause()
                print("Simulation paused.")
            elif command == "reset":
                controller.reset()
                print("Simulation reset.")
            elif command == "step":
                count = int(arguments[0]) if arguments else 1
                records = controller.run_steps(count)
                if records:
                    print(records[-1])
                else:
                    print("Start the simulation before stepping.")
            elif command == "throttle":
                print(f"Throttle: {controller.set_throttle(float(arguments[0])):.2f}")
            elif command == "altitude":
                print(f"Altitude: {controller.set_altitude(float(arguments[0])):.1f}")
            elif command == "temperature":
                temperature = controller.set_ambient_temperature(float(arguments[0]))
                print(f"Ambient temperature: {temperature:.1f}")
            elif command == "degradation":
                scenario = controller.set_degradation_scenario(arguments[0])
                print(f"Degradation scenario: {scenario.value}")
            elif command == "severity":
                severity = controller.set_degradation_severity(float(arguments[0]))
                print(f"Degradation severity: {severity:.2f}")
            elif command == "enable":
                print(f"Degradation enabled: {controller.set_degradation_enabled(True)}")
            elif command == "disable":
                print(f"Degradation enabled: {controller.set_degradation_enabled(False)}")
            elif command == "status":
                print(controller.get_status())
            elif command in {"quit", "exit"}:
                return
            else:
                print("Unknown command. Use status, step, or quit.")
        except (IndexError, ValueError) as error:
            print(f"Invalid command: {error}")


if __name__ == "__main__":
    if "--interactive" in argv:
        run_interactive_terminal()
    else:
        run_scripted_demonstration()
