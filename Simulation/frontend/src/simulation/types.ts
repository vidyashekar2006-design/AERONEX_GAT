/**
 * Aeronex MALE UAV Aero Piston Engine Digital Twin - Telemetry Data Types
 * Exact field naming aligned with Python simulator (engine.py, controller.py, mission.py)
 */

export type DegradationScenario =
  | 'NORMAL'
  | 'COOLING_DEGRADATION'
  | 'LUBRICATION_DEGRADATION'
  | 'VIBRATION_INCREASE'
  | 'SENSOR_DRIFT';

export type OperatingMode =
  | 'OFF'
  | 'IDLE'
  | 'TAKEOFF'
  | 'CLIMB'
  | 'CRUISE'
  | 'HIGH_LOAD'
  | 'HIGH_ALTITUDE_CRUISE'
  | 'DESCENT'
  | 'MISSION_COMPLETE';

export type HealthStatus = 'NORMAL' | 'WARNING' | 'CRITICAL';

export interface TelemetryData {
  timestamp: number;
  throttle: number; // 0–100%
  operating_mode: OperatingMode;
  rpm: number; // 0–5800 RPM
  cht: number; // Cylinder Head Temp in °C
  egt: number; // Exhaust Gas Temp in °C
  oil_temperature: number; // Oil Temp in °C
  oil_pressure: number; // Oil Pressure in bar
  fuel_flow: number; // Fuel Flow in L/h
  vibration: number; // RMS Vibration in mm/s
  engine_load: number; // 0–100%
  available_performance: number; // 0–100%
  altitude: number; // 0–15000 m
  ambient_temperature: number; // -60°C to +60°C
  mission_elapsed_time: number; // seconds
  degradation_scenario: DegradationScenario;
  degradation_enabled: boolean;
  degradation_severity: number; // 0–1
}

export interface HealthReport {
  status: HealthStatus;
  health_index: number; // 0–100%
  operating_mode: OperatingMode;
  degradation_summary: string;
  active_warnings: string[];
  active_criticals: string[];
}

export interface MissionPhaseDef {
  id: number;
  name: string;
  shortCode: string;
  description: string;
  targetAltitude: number;
  targetThrottle: number;
  nominalDuration: number; // seconds in auto mode
}

export interface EventLogEntry {
  id: string;
  timestamp: number;
  met: number; // seconds
  level: 'INFO' | 'WARNING' | 'CRITICAL' | 'SUCCESS';
  message: string;
  source: 'ENGINE' | 'CONTROLLER' | 'MISSION' | 'ENVIRONMENT' | 'HEALTH_SYSTEM';
}

export interface MissionSummaryStats {
  missionDuration: number;
  phasesCompleted: number;
  minRpm: number;
  maxRpm: number;
  maxCht: number;
  maxEgt: number;
  minOilPressure: number;
  maxVibration: number;
  maxDegradationSeverity: number;
  warningEvents: number;
  criticalEvents: number;
  finalHealth: number;
  finalStatus: HealthStatus;
}

export interface SimulationControlsState {
  throttle: number; // 0–100
  altitude: number; // 0–15000 m
  ambient_temperature: number; // -60 to +60 °C
  degradation_scenario: DegradationScenario;
  degradation_severity: number; // 0–1
  degradation_enabled: boolean;
  auto_progress_mission: boolean;
  sim_speed: number; // 1x, 2x, 5x
}

export type SimulationState = 'STOPPED' | 'RUNNING' | 'PAUSED';

export interface TelemetryHistoryPoint {
  time: string;
  met: number;
  rpm: number;
  throttle: number;
  cht: number;
  egt: number;
  oil_temperature: number;
  oil_pressure: number;
  vibration: number;
  fuel_flow: number;
  altitude: number;
}
