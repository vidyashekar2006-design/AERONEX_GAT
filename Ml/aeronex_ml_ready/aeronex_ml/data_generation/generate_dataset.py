from __future__ import annotations

import argparse
import sys
from pathlib import Path

import numpy as np
import pandas as pd


# ============================================================
# PROJECT PATHS
# ============================================================

# This file is located at:
#
# E:\Aeronex\Ml\aeronex_ml_ready\
#     aeronex_ml\data_generation\generate_dataset.py
#
# parents[5] -> E:\Aeronex

PROJECT_ROOT = Path(__file__).resolve().parents[4]

SIMULATION_ROOT = PROJECT_ROOT / "Simulation"

if str(SIMULATION_ROOT) not in sys.path:
    sys.path.insert(0, str(SIMULATION_ROOT))

from simulator.engine import (
    Engine,
    DegradationScenario,
)


# ============================================================
# RANDOM GENERATOR
# ============================================================

RNG = np.random.default_rng(42)

TIME_STEP = 0.5


# ============================================================
# SCENARIOS
# ============================================================

SCENARIOS = [
    DegradationScenario.NORMAL,
    DegradationScenario.COOLING_DEGRADATION,
    DegradationScenario.LUBRICATION_DEGRADATION,
    DegradationScenario.VIBRATION_INCREASE,
    DegradationScenario.SENSOR_DRIFT,
]


# ============================================================
# REPRESENTATIVE MISSION PROFILE
# ============================================================

def throttle_for_time(sim_time: float) -> float:
    """
    Return the representative throttle command for a
    particular simulation time.

    This follows the broad mission structure used by
    the Aeronex prototype simulator.
    """

    # --------------------------------------------------------
    # START / IDLE
    # --------------------------------------------------------

    if sim_time < 5.0:
        return 0.0

    # --------------------------------------------------------
    # TAKEOFF / HIGH LOAD
    # --------------------------------------------------------

    if sim_time < 10.0:
        return 0.75

    # --------------------------------------------------------
    # CLIMB
    # --------------------------------------------------------

    if sim_time < 18.0:
        return 0.65

    # --------------------------------------------------------
    # CRUISE
    # --------------------------------------------------------

    if sim_time < 28.0:
        return 0.55

    # --------------------------------------------------------
    # HIGH ALTITUDE CRUISE
    # --------------------------------------------------------

    if sim_time < 36.0:
        return 0.50

    # --------------------------------------------------------
    # ENVIRONMENT CHANGE
    # --------------------------------------------------------

    if sim_time < 41.0:
        return 0.50

    # --------------------------------------------------------
    # DEGRADATION EVENT
    # --------------------------------------------------------

    if sim_time < 49.0:
        return 0.60

    # --------------------------------------------------------
    # RETURN / LOWER LOAD
    # --------------------------------------------------------

    if sim_time < 57.0:
        return 0.35

    # --------------------------------------------------------
    # MISSION COMPLETE
    # --------------------------------------------------------

    return 0.0


# ============================================================
# ENVIRONMENT PROFILE
# ============================================================

def environment_for_time(
    sim_time: float,
) -> tuple[float, float]:
    """
    Return representative altitude and ambient temperature.
    """

    # --------------------------------------------------------
    # START / TAKEOFF
    # --------------------------------------------------------

    if sim_time < 10.0:

        altitude = 0.0
        ambient_temperature = 25.0

    # --------------------------------------------------------
    # CLIMB
    # --------------------------------------------------------

    elif sim_time < 18.0:

        progress = (
            sim_time - 10.0
        ) / 8.0

        altitude = (
            3000.0 * progress
        )

        ambient_temperature = (
            20.0
            - 10.0 * progress
        )

    # --------------------------------------------------------
    # CRUISE
    # --------------------------------------------------------

    elif sim_time < 28.0:

        altitude = 3000.0
        ambient_temperature = 10.0

    # --------------------------------------------------------
    # HIGH ALTITUDE CRUISE
    # --------------------------------------------------------

    elif sim_time < 36.0:

        altitude = 7000.0
        ambient_temperature = 0.0

    # --------------------------------------------------------
    # ENVIRONMENT CHANGE
    # --------------------------------------------------------

    elif sim_time < 41.0:

        altitude = 9000.0
        ambient_temperature = -5.0

    # --------------------------------------------------------
    # DEGRADATION EVENT
    # --------------------------------------------------------

    elif sim_time < 49.0:

        altitude = 9000.0
        ambient_temperature = -5.0

    # --------------------------------------------------------
    # RETURN
    # --------------------------------------------------------

    elif sim_time < 57.0:

        altitude = 2500.0
        ambient_temperature = 15.0

    # --------------------------------------------------------
    # MISSION COMPLETE
    # --------------------------------------------------------

    else:

        altitude = 0.0
        ambient_temperature = 25.0

    return (
        altitude,
        ambient_temperature,
    )


# ============================================================
# DEGRADATION SEVERITY
# ============================================================

def severity_for_time(
    scenario: DegradationScenario,
    sim_time: float,
    final_severity: float,
) -> float:
    """
    Gradually introduce degradation.

    NORMAL remains zero.

    Other scenarios gradually increase severity during the
    degradation-event section of the representative mission.
    """

    if scenario is DegradationScenario.NORMAL:
        return 0.0

    degradation_start = 41.0
    degradation_end = 49.0

    if sim_time < degradation_start:
        return 0.0

    if sim_time >= degradation_end:
        return final_severity

    progress = (
        sim_time - degradation_start
    ) / (
        degradation_end - degradation_start
    )

    return float(
        np.clip(
            progress * final_severity,
            0.0,
            final_severity,
        )
    )


# ============================================================
# HEALTH TARGET
# ============================================================

def calculate_health_index(
    telemetry: dict,
) -> float:
    """
    Calculate a representative continuous health target.

    This is an academic/synthetic target for ML experimentation.
    It is not a real-engine health certification metric.
    """

    cht = float(
        telemetry["cht"]
    )

    egt = float(
        telemetry["egt"]
    )

    oil_temperature = float(
        telemetry["oil_temperature"]
    )

    oil_pressure = float(
        telemetry["oil_pressure"]
    )

    vibration = float(
        telemetry["vibration"]
    )

    # --------------------------------------------------------
    # CHT risk
    # --------------------------------------------------------

    cht_score = np.clip(
        (cht - 70.0)
        / (165.0 - 70.0),
        0.0,
        1.0,
    )

    # --------------------------------------------------------
    # EGT risk
    # --------------------------------------------------------

    egt_score = np.clip(
        (egt - 200.0)
        / (600.0 - 200.0),
        0.0,
        1.0,
    )

    # --------------------------------------------------------
    # Oil temperature risk
    # --------------------------------------------------------

    oil_temperature_score = np.clip(
        (oil_temperature - 60.0)
        / (115.0 - 60.0),
        0.0,
        1.0,
    )

    # --------------------------------------------------------
    # Oil pressure risk
    # --------------------------------------------------------

    oil_pressure_score = np.clip(
        (3.0 - oil_pressure)
        / 1.5,
        0.0,
        1.0,
    )

    # --------------------------------------------------------
    # Vibration risk
    # --------------------------------------------------------

    vibration_score = np.clip(
        (vibration - 0.10)
        / (0.75 - 0.10),
        0.0,
        1.0,
    )

    # --------------------------------------------------------
    # Combined representative risk
    # --------------------------------------------------------

    health_risk = (
        0.25 * cht_score
        + 0.25 * egt_score
        + 0.15 * oil_temperature_score
        + 0.20 * oil_pressure_score
        + 0.15 * vibration_score
    )

    return float(
        np.clip(
            1.0 - health_risk,
            0.0,
            1.0,
        )
    )


# ============================================================
# DEGRADATION TARGET
# ============================================================

def calculate_degradation_index(
    telemetry: dict,
    scenario: DegradationScenario,
    severity: float,
) -> float:
    """
    Calculate a representative degradation target.

    Scenario severity is the main degradation signal while
    telemetry abnormalities provide additional context.
    """

    health_index = calculate_health_index(
        telemetry
    )

    telemetry_degradation = (
        1.0 - health_index
    )

    scenario_component = (
        severity
        if scenario is not DegradationScenario.NORMAL
        else 0.0
    )

    return float(
        np.clip(
            0.65 * scenario_component
            + 0.35 * telemetry_degradation,
            0.0,
            1.0,
        )
    )


# ============================================================
# RUL TARGET
# ============================================================

def calculate_rul(
    degradation_index: float,
) -> float:
    """
    Calculate a synthetic representative RUL target.

    IMPORTANT:
    This is an academic target for ML experimentation.
    It is NOT a real engine-life prediction.
    """

    return float(
        max(
            0.5,
            100.0
            * (1.0 - degradation_index),
        )
    )


# ============================================================
# MISSION SUCCESS TARGET
# ============================================================

def calculate_mission_success(
    telemetry: dict,
    health_index: float,
) -> int:
    """
    Calculate a representative mission-success label.

    This is an academic simulation target.
    """

    vibration = float(
        telemetry["vibration"]
    )

    oil_pressure = float(
        telemetry["oil_pressure"]
    )

    cht = float(
        telemetry["cht"]
    )

    return int(
        health_index >= 0.45
        and vibration < 1.20
        and oil_pressure >= 2.0
        and cht < 165.0
    )


# ============================================================
# SINGLE MISSION
# ============================================================

def generate_mission(
    engine_id: str,
    mission_id: str,
    scenario: DegradationScenario,
    final_severity: float,
) -> list[dict]:
    """
    Generate one complete mission using the actual
    Aeronex Engine implementation.
    """

    engine = Engine()

    records: list[dict] = []

    end_time = 61.0

    step_count = int(
        end_time / TIME_STEP
    )

    # --------------------------------------------------------
    # Configure degradation scenario
    # --------------------------------------------------------

    if scenario is DegradationScenario.NORMAL:

        engine.disable_degradation()

    else:

        engine.set_degradation_scenario(
            scenario,
            enabled=True,
            reset_severity=True,
        )

    # --------------------------------------------------------
    # Simulate mission
    # --------------------------------------------------------

    for step in range(
        step_count + 1
    ):

        sim_time = (
            step * TIME_STEP
        )

        # ----------------------------------------------------
        # Controls
        # ----------------------------------------------------

        throttle = throttle_for_time(
            sim_time
        )

        altitude, ambient_temperature = (
            environment_for_time(
                sim_time
            )
        )

        severity = severity_for_time(
            scenario,
            sim_time,
            final_severity,
        )

        engine.set_throttle(
            throttle
        )

        engine.set_environment(
            altitude=altitude,
            ambient_temperature=ambient_temperature,
        )

        # ----------------------------------------------------
        # Advance actual simulator engine
        # ----------------------------------------------------

        if step > 0:

            engine.update(
                TIME_STEP
            )

        # ----------------------------------------------------
        # Set exact degradation severity
        #
        # The live simulator's DegradationState.update()
        # intentionally keeps severity under explicit control.
        # ----------------------------------------------------

        if scenario is DegradationScenario.NORMAL:

            engine.disable_degradation()

        else:

            engine.degradation.severity = float(
                np.clip(
                    severity,
                    0.0,
                    engine.degradation.config.max_severity,
                )
            )

        # ----------------------------------------------------
        # Generate telemetry through actual Engine
        # ----------------------------------------------------

        telemetry = engine.get_telemetry(
            sim_time
        )

        # ----------------------------------------------------
        # Targets
        # ----------------------------------------------------

        health_index = calculate_health_index(
            telemetry
        )

        degradation_index = (
            calculate_degradation_index(
                telemetry,
                scenario,
                severity,
            )
        )

        rul_hours = calculate_rul(
            degradation_index
        )

        mission_success = (
            calculate_mission_success(
                telemetry,
                health_index,
            )
        )

        # ----------------------------------------------------
        # Ground truth anomaly/fault
        # ----------------------------------------------------

        if (
            scenario is DegradationScenario.NORMAL
            or severity < 0.05
        ):

            fault_type = "normal"
            anomaly = 0

        elif scenario is DegradationScenario.COOLING_DEGRADATION:

            fault_type = "cooling"
            anomaly = 1

        elif scenario is DegradationScenario.LUBRICATION_DEGRADATION:

            fault_type = "lubrication"
            anomaly = 1

        elif scenario is DegradationScenario.VIBRATION_INCREASE:

            fault_type = "vibration"
            anomaly = 1

        elif scenario is DegradationScenario.SENSOR_DRIFT:

            fault_type = "sensor_drift"
            anomaly = 1

        else:

            fault_type = "unknown"
            anomaly = 1

        # ----------------------------------------------------
        # Store dataset row
        # ----------------------------------------------------

        records.append(
            {
                "timestamp": pd.Timestamp.now(
                    tz="UTC"
                ),

                "engine_id": engine_id,

                "mission_id": mission_id,

                "sim_time": sim_time,

                "operating_mode": telemetry[
                    "operating_mode"
                ],

                "scenario": scenario.value,

                "severity": severity,

                "rpm": float(
                    telemetry["rpm"]
                ),

                "cht": float(
                    telemetry["cht"]
                ),

                "egt": float(
                    telemetry["egt"]
                ),

                "oil_temperature": float(
                    telemetry["oil_temperature"]
                ),

                "oil_pressure": float(
                    telemetry["oil_pressure"]
                ),

                "fuel_flow": float(
                    telemetry["fuel_flow"]
                ),

                "vibration": float(
                    telemetry["vibration"]
                ),

                "throttle": float(
                    telemetry["throttle"]
                ),

                "altitude": float(
                    telemetry["altitude"]
                ),

                "ambient_temperature": float(
                    telemetry[
                        "ambient_temperature"
                    ]
                ),

                "fault_type": fault_type,

                "anomaly": anomaly,

                "health_index": health_index,

                "degradation_index": (
                    degradation_index
                ),

                "rul_hours": rul_hours,

                "mission_success": (
                    mission_success
                ),
            }
        )

    return records


# ============================================================
# DATASET GENERATOR
# ============================================================

def generate_dataset(
    output: Path,
    engines_per_scenario: int = 30,
) -> None:
    """
    Generate the complete Aeronex ML v2 dataset.
    """

    rows: list[dict] = []

    for scenario in SCENARIOS:

        print(
            f"Generating scenario: "
            f"{scenario.value}"
        )

        for engine_number in range(
            engines_per_scenario
        ):

            engine_id = (
                f"{scenario.value}"
                f"_ENGINE_"
                f"{engine_number:03d}"
            )

            mission_id = (
                f"{scenario.value}"
                f"_MISSION_"
                f"{engine_number:03d}"
            )

            # ------------------------------------------------
            # NORMAL = zero degradation
            # Other scenarios receive a random final severity.
            # ------------------------------------------------

            if scenario is DegradationScenario.NORMAL:

                final_severity = 0.0

            else:

                final_severity = float(
                    RNG.uniform(
                        0.20,
                        1.0,
                    )
                )

            mission_rows = generate_mission(
                engine_id=engine_id,
                mission_id=mission_id,
                scenario=scenario,
                final_severity=final_severity,
            )

            rows.extend(
                mission_rows
            )

    # --------------------------------------------------------
    # DataFrame
    # --------------------------------------------------------

    df = pd.DataFrame(
        rows
    )

    # --------------------------------------------------------
    # Output directory
    # --------------------------------------------------------

    output.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    # --------------------------------------------------------
    # Save
    # --------------------------------------------------------

    df.to_csv(
        output,
        index=False,
    )

    # ========================================================
    # SUMMARY
    # ========================================================

    print()
    print(
        "=" * 60
    )

    print(
        "AERONEX ML V2 DATASET"
    )

    print(
        "=" * 60
    )

    print(
        f"Generated rows: "
        f"{len(df):,}"
    )

    print(
        f"Engines: "
        f"{df['engine_id'].nunique():,}"
    )

    print(
        f"Missions: "
        f"{df['mission_id'].nunique():,}"
    )

    print()

    # --------------------------------------------------------
    # Scenario distribution
    # --------------------------------------------------------

    print(
        "Scenario distribution:"
    )

    print(
        df[
            "scenario"
        ].value_counts()
    )

    print()

    # --------------------------------------------------------
    # Operating mode distribution
    # --------------------------------------------------------

    print(
        "Operating-mode distribution:"
    )

    print(
        df[
            "operating_mode"
        ].value_counts()
    )

    print()

    # --------------------------------------------------------
    # Fault distribution
    # --------------------------------------------------------

    print(
        "Fault distribution:"
    )

    print(
        df[
            "fault_type"
        ].value_counts()
    )

    print()

    # --------------------------------------------------------
    # NORMAL telemetry statistics
    # --------------------------------------------------------

    print(
        "NORMAL telemetry statistics:"
    )

    normal = df[
        df["scenario"] == "NORMAL"
    ]

    print(
        normal[
            [
                "rpm",
                "cht",
                "egt",
                "oil_temperature",
                "oil_pressure",
                "fuel_flow",
                "vibration",
                "throttle",
                "altitude",
                "ambient_temperature",
            ]
        ].describe().round(3)
    )

    print()

    # --------------------------------------------------------
    # Output
    # --------------------------------------------------------

    print(
        f"Saved to:\n{output}"
    )

    print(
        "=" * 60
    )


# ============================================================
# COMMAND-LINE INTERFACE
# ============================================================

def main() -> None:
    """
    Command-line entry point.
    """

    parser = argparse.ArgumentParser(
        description=(
            "Generate Aeronex ML telemetry "
            "using the actual simulator engine."
        )
    )

    parser.add_argument(
        "--output",
        default=(
            "data/generated/"
            "aeronex_ml_v2.csv"
        ),
    )

    parser.add_argument(
        "--engines-per-scenario",
        type=int,
        default=30,
    )

    args = parser.parse_args()

    if args.engines_per_scenario <= 0:

        raise ValueError(
            "--engines-per-scenario "
            "must be greater than zero"
        )

    generate_dataset(
        output=Path(
            args.output
        ),
        engines_per_scenario=(
            args.engines_per_scenario
        ),
    )


# ============================================================
# ENTRY POINT
# ============================================================

if __name__ == "__main__":
    main()