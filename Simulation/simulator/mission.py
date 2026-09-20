"""Configurable representative mission simulation for the Aeronex prototype."""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from math import exp
from typing import Callable

try:
    from .controller import SimulationController
    from .engine import DegradationScenario, TelemetryRecord
except ImportError:
    # Supports direct execution with: python simulator\mission.py
    from controller import SimulationController
    from engine import DegradationScenario, TelemetryRecord


class TransitionBehavior(str, Enum):
    """Control-target transition options for a mission phase."""

    SMOOTH = "SMOOTH"
    IMMEDIATE = "IMMEDIATE"


@dataclass(frozen=True)
class MissionPhase:
    """One configurable segment of a representative mission profile."""

    name: str
    duration: float
    target_throttle: float
    altitude: float
    ambient_temperature: float
    degradation_scenario: DegradationScenario | None = None
    degradation_severity: float | None = None
    transition_behavior: TransitionBehavior = TransitionBehavior.SMOOTH
    transition_time_constant: float = 3.0


@dataclass(frozen=True)
class MissionProfile:
    """An ordered collection of phases run by a MissionSimulator."""

    name: str
    phases: tuple[MissionPhase, ...]

    def __post_init__(self) -> None:
        if not self.phases:
            raise ValueError(
                "a mission profile must contain at least one phase"
            )

        for phase in self.phases:
            if phase.duration <= 0.0:
                raise ValueError(
                    "mission phase duration must be greater than zero"
                )

            if (
                phase.transition_behavior is TransitionBehavior.SMOOTH
                and phase.transition_time_constant <= 0.0
            ):
                raise ValueError(
                    "smooth transition time constants must be greater than zero"
                )


MissionCallback = Callable[[TelemetryRecord], None]


@dataclass
class MissionSimulator:
    """Execute a mission profile through the existing controller and Digital Twin."""

    profile: MissionProfile

    controller: SimulationController = field(
        default_factory=SimulationController
    )

    current_phase_index: int = field(
        default=0,
        init=False,
    )

    phase_elapsed_time: float = field(
        default=0.0,
        init=False,
    )

    completed_phases: list[str] = field(
        default_factory=list,
        init=False,
    )

    telemetry_records: list[TelemetryRecord] = field(
        default_factory=list,
        init=False,
    )

    health_history: list[str] = field(
        default_factory=list,
        init=False,
    )

    running: bool = field(
        default=False,
        init=False,
    )

    complete: bool = field(
        default=False,
        init=False,
    )

    # -----------------------------------------------------------------------
    # MANUAL UI DEGRADATION OVERRIDE
    # -----------------------------------------------------------------------
    #
    # When enabled, the Simulation UI can override the degradation settings
    # defined by the mission phase.
    #

    manual_degradation_override: bool = field(
        default=False,
        init=False,
    )

    manual_degradation_scenario: DegradationScenario = field(
        default=DegradationScenario.NORMAL,
        init=False,
    )

    manual_degradation_enabled: bool = field(
        default=False,
        init=False,
    )

    manual_degradation_severity: float = field(
        default=0.0,
        init=False,
    )

    # -----------------------------------------------------------------------
    # INITIALIZATION
    # -----------------------------------------------------------------------

    def __post_init__(self) -> None:
        self.reset()

    # -----------------------------------------------------------------------
    # CURRENT PHASE
    # -----------------------------------------------------------------------

    @property
    def current_phase(self) -> MissionPhase:
        """Return the active phase, or raise when the mission is complete."""

        if self.complete:
            raise RuntimeError(
                "the mission is complete"
            )

        return self.profile.phases[
            self.current_phase_index
        ]

    # -----------------------------------------------------------------------
    # START
    # -----------------------------------------------------------------------

    def start(self) -> None:
        """Start or resume mission execution."""

        if not self.complete:
            self.running = True
            self.controller.start()

    # -----------------------------------------------------------------------
    # PAUSE
    # -----------------------------------------------------------------------

    def pause(self) -> None:
        """Pause mission and controller updates."""

        self.running = False
        self.controller.pause()

    # -----------------------------------------------------------------------
    # RESET
    # -----------------------------------------------------------------------

    def reset(self) -> None:
        """Restore the profile to its first phase and reset the controller."""

        self.controller.reset()

        self.current_phase_index = 0
        self.phase_elapsed_time = 0.0

        self.completed_phases.clear()
        self.telemetry_records.clear()
        self.health_history.clear()

        self.running = False
        self.complete = False

        # Reset manual degradation override.
        self.manual_degradation_override = False
        self.manual_degradation_scenario = (
            DegradationScenario.NORMAL
        )
        self.manual_degradation_enabled = False
        self.manual_degradation_severity = 0.0

        # Record the initial cold-start telemetry.
        self._record_mission_telemetry(
            self.profile.phases[0].name,
            0.0,
        )

    # -----------------------------------------------------------------------
    # MANUAL DEGRADATION CONTROL
    # -----------------------------------------------------------------------

    def set_manual_degradation(
        self,
        scenario: DegradationScenario | str,
        *,
        enabled: bool,
        severity: float,
    ) -> None:
        """Apply a temporary degradation override from the Simulation UI."""

        selected_scenario = (
            scenario
            if isinstance(
                scenario,
                DegradationScenario,
            )
            else DegradationScenario(
                str(scenario).upper()
            )
        )

        self.manual_degradation_override = True

        self.manual_degradation_scenario = (
            selected_scenario
        )

        self.manual_degradation_enabled = bool(
            enabled
        )

        max_severity = (
            self.controller
            .engine
            .degradation
            .config
            .max_severity
        )

        self.manual_degradation_severity = max(
            0.0,
            min(
                float(severity),
                max_severity,
            ),
        )

    def clear_manual_degradation(self) -> None:
        """Return degradation control to the mission profile."""

        self.manual_degradation_override = False

        self.manual_degradation_scenario = (
            DegradationScenario.NORMAL
        )

        self.manual_degradation_enabled = False

        self.manual_degradation_severity = 0.0

    def _apply_manual_degradation_override(self) -> None:
        """Apply manual UI degradation settings to the controller."""

        if not self.manual_degradation_override:
            return

        self.controller.set_degradation_scenario(
            self.manual_degradation_scenario,
            enabled=self.manual_degradation_enabled,
            reset_severity=False,
        )

        self.controller.set_degradation_enabled(
            self.manual_degradation_enabled
        )

        self.controller.set_degradation_severity(
            self.manual_degradation_severity
        )

    # -----------------------------------------------------------------------
    # STEP
    # -----------------------------------------------------------------------

    def step(self) -> TelemetryRecord | None:
        """Advance the active phase by one controller timestep."""

        if not self.running or self.complete:
            return None

        phase = self.current_phase

        # ---------------------------------------------------------------
        # 1. Apply normal mission phase controls.
        # ---------------------------------------------------------------

        self._move_controls_toward_phase(
            phase
        )

        # ---------------------------------------------------------------
        # 2. Apply manual UI degradation AFTER
        #    mission phase controls.
        #
        #    This prevents the mission profile from immediately
        #    overwriting the UI-selected degradation.
        # ---------------------------------------------------------------

        if self.manual_degradation_override:
            self._apply_manual_degradation_override()

        # ---------------------------------------------------------------
        # 3. Advance controller / engine.
        # ---------------------------------------------------------------

        telemetry = self.controller.step()

        if telemetry is None:
            return None

        # ---------------------------------------------------------------
        # 4. Update phase timing.
        # ---------------------------------------------------------------

        self.phase_elapsed_time += (
            self.controller.config.fixed_timestep
        )

        # ---------------------------------------------------------------
        # 5. Attach mission context.
        # ---------------------------------------------------------------

        mission_telemetry = (
            self._record_mission_telemetry(
                phase.name,
                self.phase_elapsed_time,
            )
        )

        # ---------------------------------------------------------------
        # 6. Handle phase completion.
        # ---------------------------------------------------------------

        if (
            self.phase_elapsed_time
            >= phase.duration
        ):
            self.completed_phases.append(
                phase.name
            )

            self.current_phase_index += 1

            self.phase_elapsed_time = 0.0

            if (
                self.current_phase_index
                >= len(self.profile.phases)
            ):
                self.complete = True
                self.pause()

        return mission_telemetry

    # -----------------------------------------------------------------------
    # RUN TO COMPLETION
    # -----------------------------------------------------------------------

    def run_to_completion(
        self,
        callback: MissionCallback | None = None,
    ) -> list[TelemetryRecord]:
        """Run the profile until all phases finish."""

        self.start()

        generated_records: list[
            TelemetryRecord
        ] = []

        while (
            self.running
            and not self.complete
        ):
            telemetry = self.step()

            if telemetry is None:
                break

            generated_records.append(
                telemetry
            )

            if callback is not None:
                callback(telemetry)

        return generated_records

    # -----------------------------------------------------------------------
    # SUMMARY
    # -----------------------------------------------------------------------

    def get_summary(
        self,
    ) -> dict[str, object]:
        """Summarize mission telemetry and health observations."""

        if not self.telemetry_records:
            return {
                "total_mission_duration": 0.0,
                "phases_completed": [],
                "telemetry_records": 0,
            }

        records = self.telemetry_records

        health_statuses = list(
            dict.fromkeys(
                self.health_history
            )
        )

        warning_events = (
            self._count_health_entries(
                "WARNING"
            )
        )

        critical_events = (
            self._count_health_entries(
                "CRITICAL"
            )
        )

        return {
            "mission_name": self.profile.name,

            "total_mission_duration": (
                self.controller
                .engine
                .environment
                .mission_elapsed_time
            ),

            "phases_completed": list(
                self.completed_phases
            ),

            "telemetry_records": len(
                records
            ),

            "minimum_rpm": min(
                float(record["rpm"])
                for record in records
            ),

            "maximum_rpm": max(
                float(record["rpm"])
                for record in records
            ),

            "maximum_cht": max(
                float(record["cht"])
                for record in records
            ),

            "maximum_egt": max(
                float(record["egt"])
                for record in records
            ),

            "minimum_oil_pressure": min(
                float(
                    record["oil_pressure"]
                )
                for record in records
            ),

            "maximum_vibration": max(
                float(
                    record["vibration"]
                )
                for record in records
            ),

            "maximum_degradation_severity": max(
                float(
                    record[
                        "degradation_severity"
                    ]
                )
                for record in records
            ),

            "health_statuses_observed":
                health_statuses,

            "warning_events":
                warning_events,

            "critical_events":
                critical_events,

            "final_health_status": (
                self.controller
                .digital_twin
                .health_status
                .value
            ),
        }

    # -----------------------------------------------------------------------
    # PHASE CONTROL TRANSITIONS
    # -----------------------------------------------------------------------

    def _move_controls_toward_phase(
        self,
        phase: MissionPhase,
    ) -> None:
        """Gradually command phase targets through the controller."""

        controls = self.controller.controls

        timestep = (
            self.controller
            .config
            .fixed_timestep
        )

        # Throttle
        self.controller.set_throttle(
            self._transition_value(
                controls.throttle,
                phase.target_throttle,
                phase.transition_behavior,
                phase.transition_time_constant,
                timestep,
            )
        )

        # Altitude
        self.controller.set_altitude(
            self._transition_value(
                controls.altitude,
                phase.altitude,
                phase.transition_behavior,
                phase.transition_time_constant,
                timestep,
            )
        )

        # Ambient temperature
        self.controller.set_ambient_temperature(
            self._transition_value(
                controls.ambient_temperature,
                phase.ambient_temperature,
                phase.transition_behavior,
                phase.transition_time_constant,
                timestep,
            )
        )

        # Mission-profile degradation
        #
        # This remains active when there is NO manual UI override.

        if phase.degradation_scenario is not None:

            scenario_enabled = (
                phase.degradation_scenario
                is not DegradationScenario.NORMAL
            )

            if (
                controls.degradation_scenario
                is not phase.degradation_scenario
                or controls.degradation_enabled
                != scenario_enabled
            ):
                self.controller.set_degradation_scenario(
                    phase.degradation_scenario,
                    enabled=scenario_enabled,
                    reset_severity=False,
                )

        if (
            phase.degradation_scenario
            is DegradationScenario.NORMAL
        ):
            self.controller.set_degradation_severity(
                0.0
            )

        elif phase.degradation_severity is not None:

            self.controller.set_degradation_severity(
                self._transition_value(
                    controls.degradation_severity,
                    phase.degradation_severity,
                    phase.transition_behavior,
                    phase.transition_time_constant,
                    timestep,
                )
            )

    # -----------------------------------------------------------------------
    # TELEMETRY RECORDING
    # -----------------------------------------------------------------------

    def _record_mission_telemetry(
        self,
        phase_name: str,
        phase_elapsed_time: float,
    ) -> TelemetryRecord:
        """Attach mission context to the newest controller telemetry record."""

        telemetry = dict(
            self.controller.last_telemetry
        )

        telemetry.update(
            {
                "mission_phase": phase_name,

                "mission_elapsed_time": (
                    self.controller
                    .engine
                    .environment
                    .mission_elapsed_time
                ),

                "phase_elapsed_time":
                    phase_elapsed_time,
            }
        )

        self.controller.last_telemetry = (
            telemetry
        )

        if (
            self.controller
            .telemetry_recorder
            .records
        ):
            self.controller.telemetry_recorder.records[
                -1
            ] = telemetry

        self.controller.digital_twin.receive_telemetry(
            telemetry,
            self.controller
            .engine
            .get_physical_state(),
        )

        self.telemetry_records.append(
            telemetry
        )

        self.health_history.append(
            self.controller
            .digital_twin
            .health_status
            .value
        )

        return telemetry

    # -----------------------------------------------------------------------
    # HEALTH EVENT COUNTING
    # -----------------------------------------------------------------------

    def _count_health_entries(
        self,
        status: str,
    ) -> int:
        """Count transitions into a health status."""

        previous_status = ""

        event_count = 0

        for observed_status in (
            self.health_history
        ):
            if (
                observed_status == status
                and previous_status != status
            ):
                event_count += 1

            previous_status = (
                observed_status
            )

        return event_count

    # -----------------------------------------------------------------------
    # TRANSITION HELPER
    # -----------------------------------------------------------------------

    @staticmethod
    def _transition_value(
        current: float,
        target: float,
        behavior: TransitionBehavior,
        time_constant: float,
        timestep: float,
    ) -> float:
        """Apply immediate or smooth control transitions."""

        if (
            behavior
            is TransitionBehavior.IMMEDIATE
        ):
            return target

        fraction = (
            1.0
            - exp(
                -timestep
                / time_constant
            )
        )

        return (
            current
            + (
                target - current
            ) * fraction
        )


# ---------------------------------------------------------------------------
# DEFAULT MISSION PROFILE
# ---------------------------------------------------------------------------

def create_default_mission_profile() -> MissionProfile:
    """Create a configurable synthetic mission profile for demonstration."""

    return MissionProfile(
        name="Representative Aeronex Mission",

        phases=(

            MissionPhase(
                "START / IDLE",
                5.0,
                0.0,
                0.0,
                20.0,
            ),

            MissionPhase(
                "TAKEOFF / HIGH LOAD",
                5.0,
                0.85,
                300.0,
                20.0,
            ),

            MissionPhase(
                "CLIMB",
                8.0,
                0.75,
                3_000.0,
                12.0,
            ),

            MissionPhase(
                "CRUISE",
                10.0,
                0.55,
                3_000.0,
                12.0,
            ),

            MissionPhase(
                "HIGH-ALTITUDE CRUISE",
                8.0,
                0.55,
                6_500.0,
                -5.0,
            ),

            MissionPhase(
                "ENVIRONMENT CHANGE",
                5.0,
                0.60,
                6_500.0,
                30.0,
            ),

            MissionPhase(
                "OPTIONAL DEGRADATION EVENT",
                8.0,
                0.60,
                6_500.0,
                30.0,
                degradation_scenario=(
                    DegradationScenario.COOLING_DEGRADATION
                ),
                degradation_severity=0.40,
            ),

            MissionPhase(
                "RETURN / LOWER LOAD",
                8.0,
                0.30,
                1_000.0,
                22.0,
                degradation_scenario=(
                    DegradationScenario.NORMAL
                ),
                degradation_severity=0.0,
            ),

            MissionPhase(
                "MISSION COMPLETE",
                4.0,
                0.0,
                0.0,
                20.0,
                degradation_scenario=(
                    DegradationScenario.NORMAL
                ),
                degradation_severity=0.0,
                transition_behavior=(
                    TransitionBehavior.IMMEDIATE
                ),
            ),
        ),
    )


# ---------------------------------------------------------------------------
# DEMONSTRATION
# ---------------------------------------------------------------------------

def run_demonstration() -> None:
    """Run the default profile and print representative updates."""

    mission = MissionSimulator(
        create_default_mission_profile()
    )

    last_phase = ""
    last_health_status = ""

    def show_selected_record(
        record: TelemetryRecord,
    ) -> None:
        nonlocal last_phase
        nonlocal last_health_status

        phase = str(
            record["mission_phase"]
        )

        health_status = (
            mission
            .controller
            .digital_twin
            .health_status
            .value
        )

        if (
            phase != last_phase
            or health_status
            != last_health_status
        ):

            print(
                f"Phase: {phase}"
            )

            print(
                "Telemetry: "
                f"time={float(record['mission_elapsed_time']):.1f}s, "
                f"throttle={float(record['throttle']):.2f}, "
                f"rpm={float(record['rpm']):.0f}, "
                f"cht={float(record['cht']):.1f}, "
                f"egt={float(record['egt']):.1f}, "
                f"oil_pressure={float(record['oil_pressure']):.2f}, "
                f"altitude={float(record['altitude']):.0f}, "
                f"ambient={float(record['ambient_temperature']):.1f}"
            )

            print(
                "Digital Twin: "
                f"health={health_status}, "
                f"mode={record['operating_mode']}, "
                f"degradation={record['degradation_scenario']}, "
                f"severity={float(record['degradation_severity']):.2f}"
            )

            last_phase = phase
            last_health_status = (
                health_status
            )

    print(
        "AERONEX MISSION SIMULATION"
    )

    print(
        "--------------------------"
    )

    mission.run_to_completion(
        show_selected_record
    )

    print(
        "Mission summary:"
    )

    print(
        mission.get_summary()
    )


# ---------------------------------------------------------------------------
# DIRECT EXECUTION
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    run_demonstration()