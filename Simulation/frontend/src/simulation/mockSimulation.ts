/**
 * Aeronex Digital Twin - Physics & Telemetry Mock Simulation Engine
 * Simulates Rotax-style aero piston engines used in MALE UAVs.
 */

import {
  DegradationScenario,
  EventLogEntry,
  HealthReport,
  HealthStatus,
  MissionPhaseDef,
  OperatingMode,
  SimulationControlsState,
  TelemetryData,
} from './types';

export const MISSION_PHASES: MissionPhaseDef[] = [
  {
    id: 1,
    name: 'START / IDLE',
    shortCode: 'IDLE',
    description: 'Pre-flight ignition, oil warmup, and idle stabilization check.',
    targetAltitude: 0,
    targetThrottle: 20,
    nominalDuration: 30,
  },
  {
    id: 2,
    name: 'TAKEOFF / HIGH LOAD',
    shortCode: 'TAKEOFF',
    description: 'Full-power runway acceleration and initial obstacle clearance climb.',
    targetAltitude: 350,
    targetThrottle: 98,
    nominalDuration: 40,
  },
  {
    id: 3,
    name: 'CLIMB',
    shortCode: 'CLIMB',
    description: 'En-route continuous climb to operational loiter altitude.',
    targetAltitude: 4500,
    targetThrottle: 82,
    nominalDuration: 60,
  },
  {
    id: 4,
    name: 'CRUISE',
    shortCode: 'CRUISE',
    description: 'Medium-altitude endurance cruise and mission area loitering.',
    targetAltitude: 5500,
    targetThrottle: 65,
    nominalDuration: 75,
  },
  {
    id: 5,
    name: 'HIGH-ALTITUDE CRUISE',
    shortCode: 'HI-CRUISE',
    description: 'UAV ceiling cruise (10,000m+) testing turbocharging and cooling margins.',
    targetAltitude: 10500,
    targetThrottle: 78,
    nominalDuration: 80,
  },
  {
    id: 6,
    name: 'ENVIRONMENT CHANGE',
    shortCode: 'ENV-SHIFT',
    description: 'Sub-zero stratospheric temperature transition and crosswinds.',
    targetAltitude: 11000,
    targetThrottle: 72,
    nominalDuration: 60,
  },
  {
    id: 7,
    name: 'OPTIONAL DEGRADATION EVENT',
    shortCode: 'FAULT-TEST',
    description: 'Subsystem stress injection for digital twin predictive fault assessment.',
    targetAltitude: 9500,
    targetThrottle: 70,
    nominalDuration: 70,
  },
  {
    id: 8,
    name: 'RETURN / LOWER LOAD',
    shortCode: 'DESCENT',
    description: 'Controlled base descent, throttle pullback, and thermal stabilization.',
    targetAltitude: 800,
    targetThrottle: 32,
    nominalDuration: 65,
  },
  {
    id: 9,
    name: 'MISSION COMPLETE',
    shortCode: 'COMPLETE',
    description: 'Safe landing, shutdown, and full mission telemetry archive.',
    targetAltitude: 0,
    targetThrottle: 5,
    nominalDuration: 30,
  },
];

export class MockEngineSimulator {
  // Current dynamic state
  private rpm = 1550;
  private cht = 98;
  private egt = 710;
  private oil_temperature = 78;
  private oil_pressure = 2.8;
  private fuel_flow = 7.2;
  private vibration = 1.1;
  private engine_load = 22;
  private available_performance = 98;
  private altitude = 0;
  private ambient_temperature = 22;
  private mission_elapsed_time = 0;
  private currentPhaseIndex = 0;
  private phaseElapsedTime = 0;

  // Sensor drift state
  private driftOffset = 0;

  // Track thresholds for event logging
  private lastWarningState = false;
  private lastCriticalState = false;
  private lastPhaseLogged = -1;
  private lastDegradationLogged: string | null = null;

  constructor() {
    this.reset();
  }

  public reset(): void {
    this.rpm = 1520;
    this.cht = 96.5;
    this.egt = 705.0;
    this.oil_temperature = 75.0;
    this.oil_pressure = 2.85;
    this.fuel_flow = 6.8;
    this.vibration = 1.15;
    this.engine_load = 20.0;
    this.available_performance = 99.0;
    this.altitude = 0;
    this.ambient_temperature = 22.0;
    this.mission_elapsed_time = 0;
    this.currentPhaseIndex = 0;
    this.phaseElapsedTime = 0;
    this.driftOffset = 0;
    this.lastWarningState = false;
    this.lastCriticalState = false;
    this.lastPhaseLogged = -1;
    this.lastDegradationLogged = null;
  }

  public getCurrentPhase(): MissionPhaseDef {
    return MISSION_PHASES[this.currentPhaseIndex] || MISSION_PHASES[0];
  }

  public getCurrentPhaseIndex(): number {
    return this.currentPhaseIndex;
  }

  public setPhaseIndex(index: number): void {
    if (index >= 0 && index < MISSION_PHASES.length) {
      this.currentPhaseIndex = index;
      this.phaseElapsedTime = 0;
    }
  }

  /**
   * Run one simulation step
   * @param dt delta time in seconds
   * @param controls user control console state
   * @param eventCallback callback to push log events
   */
  public step(
    dt: number,
    controls: SimulationControlsState,
    eventCallback: (entry: Omit<EventLogEntry, 'id'>) => void
  ): { telemetry: TelemetryData; health: HealthReport } {
    const effectiveDt = dt * (controls.sim_speed || 1);
    this.mission_elapsed_time += effectiveDt;
    this.phaseElapsedTime += effectiveDt;

    // Handle mission auto-progression if enabled
    const activePhase = MISSION_PHASES[this.currentPhaseIndex];
    if (this.currentPhaseIndex !== this.lastPhaseLogged) {
      this.lastPhaseLogged = this.currentPhaseIndex;
      eventCallback({
        timestamp: Date.now(),
        met: Math.floor(this.mission_elapsed_time),
        level: 'INFO',
        message: `Entered Mission Phase ${activePhase.id}/9: ${activePhase.name}`,
        source: 'MISSION',
      });
    }

    let targetThrottle = controls.throttle;
    let targetAltitude = controls.altitude;

    if (controls.auto_progress_mission) {
      targetThrottle = activePhase.targetThrottle;
      targetAltitude = activePhase.targetAltitude;

      // Advance phase when duration elapsed
      if (this.phaseElapsedTime >= activePhase.nominalDuration) {
        if (this.currentPhaseIndex < MISSION_PHASES.length - 1) {
          this.currentPhaseIndex += 1;
          this.phaseElapsedTime = 0;
        } else if (this.currentPhaseIndex === MISSION_PHASES.length - 1) {
          // Mission completed
          eventCallback({
            timestamp: Date.now(),
            met: Math.floor(this.mission_elapsed_time),
            level: 'SUCCESS',
            message: 'All UAV mission phases completed successfully. Engine safe for debrief.',
            source: 'MISSION',
          });
        }
      }
    }

    // Altitude dynamics (smooth climb/descent)
    const altSmoothing = Math.min(1, effectiveDt * 0.8);
    this.altitude += (targetAltitude - this.altitude) * altSmoothing;

    // Ambient temperature: if high altitude, follows standard atmospheric lapse unless manually overridden
    const lapseTemp = 20 - (this.altitude / 1000) * 6.5;
    const targetAmbient = controls.ambient_temperature;
    this.ambient_temperature += (targetAmbient - this.ambient_temperature) * Math.min(1, effectiveDt * 0.5);

    // Altitude density effect on performance (turbocharged aero piston maintains performance up to critical altitude ~6000m)
    const altitudeLossFactor = this.altitude > 6000 
      ? Math.max(0.55, 1.0 - ((this.altitude - 6000) / 15000) * 0.45) 
      : 1.0;

    // Throttle response & Engine Load
    const targetLoad = targetThrottle;
    this.engine_load += (targetLoad - this.engine_load) * Math.min(1, effectiveDt * 1.8);

    // RPM model (Rotax 914: idle ~1500, max ~5800 RPM)
    const minRpm = 1400;
    const maxRpm = 5800;
    const targetRpm = minRpm + (maxRpm - minRpm) * (this.engine_load / 100);
    // RPM adjusts smoothly
    this.rpm += (targetRpm - this.rpm) * Math.min(1, effectiveDt * 2.2);

    // Fuel Flow (L/h): scales with RPM, load, and ambient density
    const targetFuelFlow = 5.5 + (this.engine_load / 100) * 28.0 * (this.rpm / 5800);
    this.fuel_flow += (targetFuelFlow - this.fuel_flow) * Math.min(1, effectiveDt * 1.5);

    // Degradation multipliers
    const degEnabled = controls.degradation_enabled;
    const degScenario = controls.degradation_scenario;
    const degSev = controls.degradation_severity;

    // Log degradation toggles
    const degKey = `${degEnabled ? degScenario : 'OFF'}-${degSev.toFixed(2)}`;
    if (this.lastDegradationLogged !== degKey) {
      this.lastDegradationLogged = degKey;
      if (degEnabled && degScenario !== 'NORMAL') {
        eventCallback({
          timestamp: Date.now(),
          met: Math.floor(this.mission_elapsed_time),
          level: 'WARNING',
          message: `Injected Fault Scenario: ${degScenario.replace('_', ' ')} at ${(degSev * 100).toFixed(0)}% severity`,
          source: 'CONTROLLER',
        });
      } else if (!degEnabled) {
        eventCallback({
          timestamp: Date.now(),
          met: Math.floor(this.mission_elapsed_time),
          level: 'INFO',
          message: 'Degradation disabled. Engine reverting to baseline nominal margins.',
          source: 'CONTROLLER',
        });
      }
    }

    // Cooling degradation additions
    let coolingPenalty = 0;
    if (degEnabled && degScenario === 'COOLING_DEGRADATION') {
      coolingPenalty = degSev * 55; // +55°C max on CHT
    }

    // Lubrication degradation additions
    let lubePenalty = 0;
    let lubePressDrop = 0;
    if (degEnabled && degScenario === 'LUBRICATION_DEGRADATION') {
      lubePenalty = degSev * 45; // +45°C oil temp
      lubePressDrop = degSev * 2.2; // -2.2 bar oil pressure
    }

    // Vibration degradation
    let vibPenalty = 0;
    if (degEnabled && degScenario === 'VIBRATION_INCREASE') {
      vibPenalty = degSev * 6.5; // up to +6.5 mm/s
    }

    // Sensor drift calculation
    if (degEnabled && degScenario === 'SENSOR_DRIFT') {
      this.driftOffset = Math.sin(this.mission_elapsed_time * 0.8) * degSev * 18;
    } else {
      this.driftOffset = 0;
    }

    // Thermal model: CHT (Cylinder Head Temp)
    // Base nominal: 85°C to 125°C based on load, ambient, and cooling airflow (RPM)
    const baseCht = 80 + (this.engine_load / 100) * 45 + (this.ambient_temperature - 15) * 0.25;
    const targetCht = baseCht + coolingPenalty + this.driftOffset * 0.4;
    // CHT has thermal inertia (slow response)
    this.cht += (targetCht - this.cht) * Math.min(1, effectiveDt * 0.45);

    // Thermal model: EGT (Exhaust Gas Temp)
    // Base nominal: 680°C to 840°C based on throttle & fuel-air mixture
    const baseEgt = 680 + (this.engine_load / 100) * 165 + (coolingPenalty * 0.8);
    const targetEgt = baseEgt + this.driftOffset * 2.5;
    // EGT reacts faster than CHT
    this.egt += (targetEgt - this.egt) * Math.min(1, effectiveDt * 1.2);

    // Lubrication model: Oil Temperature
    // Base nominal: 70°C to 105°C
    const baseOilTemp = 72 + (this.engine_load / 100) * 32 + lubePenalty;
    this.oil_temperature += (baseOilTemp - this.oil_temperature) * Math.min(1, effectiveDt * 0.35);

    // Lubrication model: Oil Pressure (bar)
    // Increases with RPM, normal range 2.8 - 4.8 bar
    const baseOilPressure = 2.4 + (this.rpm / 5800) * 2.6 - lubePressDrop;
    const targetOilPressure = Math.max(0.6, baseOilPressure - (this.oil_temperature > 115 ? 0.4 : 0));
    this.oil_pressure += (targetOilPressure - this.oil_pressure) * Math.min(1, effectiveDt * 1.5);

    // Mechanical Vibration (mm/s RMS)
    // Increases slightly with RPM and load (nominal 1.0 - 2.4 mm/s) + vibration penalty
    const baseVib = 1.0 + (this.rpm / 5800) * 1.2 + (this.engine_load / 100) * 0.4;
    const microJitter = (Math.random() - 0.5) * 0.15;
    const targetVibration = Math.max(0.4, baseVib + vibPenalty + microJitter);
    this.vibration += (targetVibration - this.vibration) * Math.min(1, effectiveDt * 1.8);

    // Available performance
    let perf = 100 * altitudeLossFactor;
    if (degEnabled) {
      perf -= degSev * 28;
    }
    this.available_performance = Math.max(35, Math.min(100, perf));

    // Operating mode derivation
    let opMode: OperatingMode = 'CRUISE';
    if (this.engine_load < 25 && this.altitude < 100) {
      opMode = this.mission_elapsed_time < 5 ? 'OFF' : 'IDLE';
    } else if (this.engine_load > 90) {
      opMode = 'TAKEOFF';
    } else if (this.altitude > 8000) {
      opMode = 'HIGH_ALTITUDE_CRUISE';
    } else if (targetThrottle > 75) {
      opMode = 'CLIMB';
    } else if (targetThrottle < 40 && this.altitude > 500) {
      opMode = 'DESCENT';
    } else {
      opMode = 'CRUISE';
    }

    // Health Evaluation
    const health = this.evaluateHealth(degEnabled, degScenario, degSev);

    // Check for state change events (Warning / Critical)
    if (health.status === 'WARNING' && !this.lastWarningState && !this.lastCriticalState) {
      this.lastWarningState = true;
      eventCallback({
        timestamp: Date.now(),
        met: Math.floor(this.mission_elapsed_time),
        level: 'WARNING',
        message: `ENGINE WARNING: ${health.active_warnings[0] || 'Operational envelope margin degraded'}`,
        source: 'HEALTH_SYSTEM',
      });
    } else if (health.status === 'CRITICAL' && !this.lastCriticalState) {
      this.lastCriticalState = true;
      eventCallback({
        timestamp: Date.now(),
        met: Math.floor(this.mission_elapsed_time),
        level: 'CRITICAL',
        message: `CRITICAL ALERT: ${health.active_criticals[0] || 'Subsystem threshold exceeded! Mission abort recommended'}`,
        source: 'HEALTH_SYSTEM',
      });
    } else if (health.status === 'NORMAL') {
      if (this.lastWarningState || this.lastCriticalState) {
        eventCallback({
          timestamp: Date.now(),
          met: Math.floor(this.mission_elapsed_time),
          level: 'SUCCESS',
          message: 'Telemetry returned to nominal operational envelope. Health Index restored.',
          source: 'HEALTH_SYSTEM',
        });
      }
      this.lastWarningState = false;
      this.lastCriticalState = false;
    }

    const telemetry: TelemetryData = {
      timestamp: Date.now(),
      throttle: Math.round(targetThrottle),
      operating_mode: opMode,
      rpm: Math.round(this.rpm),
      cht: Number(this.cht.toFixed(1)),
      egt: Number(this.egt.toFixed(1)),
      oil_temperature: Number(this.oil_temperature.toFixed(1)),
      oil_pressure: Number(this.oil_pressure.toFixed(2)),
      fuel_flow: Number(this.fuel_flow.toFixed(1)),
      vibration: Number(this.vibration.toFixed(2)),
      engine_load: Math.round(this.engine_load),
      available_performance: Math.round(this.available_performance),
      altitude: Math.round(this.altitude),
      ambient_temperature: Math.round(this.ambient_temperature),
      mission_elapsed_time: Math.floor(this.mission_elapsed_time),
      degradation_scenario: degScenario,
      degradation_enabled: degEnabled,
      degradation_severity: degSev,
    };

    return { telemetry, health };
  }

  private evaluateHealth(
    degEnabled: boolean,
    degScenario: DegradationScenario,
    degSev: number
  ): HealthReport {
    const active_warnings: string[] = [];
    const active_criticals: string[] = [];

    // CHT checks (normal < 135, warn 135-150, crit > 150)
    if (this.cht > 150) {
      active_criticals.push(`CHT excessive: ${this.cht.toFixed(0)}°C (Limit: 150°C)`);
    } else if (this.cht > 135) {
      active_warnings.push(`CHT approaching threshold: ${this.cht.toFixed(0)}°C`);
    }

    // EGT checks (normal < 860, warn 860-900, crit > 900)
    if (this.egt > 900) {
      active_criticals.push(`EGT thermal limit breach: ${this.egt.toFixed(0)}°C (Limit: 900°C)`);
    } else if (this.egt > 860) {
      active_warnings.push(`EGT elevated: ${this.egt.toFixed(0)}°C`);
    }

    // Oil Temp checks (normal < 115, warn 115-130, crit > 130)
    if (this.oil_temperature > 130) {
      active_criticals.push(`Oil overheating: ${this.oil_temperature.toFixed(0)}°C (Limit: 130°C)`);
    } else if (this.oil_temperature > 115) {
      active_warnings.push(`Oil temperature high: ${this.oil_temperature.toFixed(0)}°C`);
    }

    // Oil Pressure checks (normal 2.5 - 5.5, warn < 2.2, crit < 1.6)
    if (this.oil_pressure < 1.6 && this.rpm > 2000) {
      active_criticals.push(`Low oil pressure: ${this.oil_pressure.toFixed(2)} bar (Loss of lube)`);
    } else if (this.oil_pressure < 2.3 && this.rpm > 2000) {
      active_warnings.push(`Oil pressure marginal: ${this.oil_pressure.toFixed(2)} bar`);
    }

    // Vibration checks (normal < 3.2, warn 3.2-5.5, crit > 5.5)
    if (this.vibration > 5.5) {
      active_criticals.push(`Excessive airframe/engine vibration: ${this.vibration.toFixed(2)} mm/s`);
    } else if (this.vibration > 3.2) {
      active_warnings.push(`Vibration anomaly detected: ${this.vibration.toFixed(2)} mm/s`);
    }

    // Status classification
    let status: HealthStatus = 'NORMAL';
    if (active_criticals.length > 0) {
      status = 'CRITICAL';
    } else if (active_warnings.length > 0) {
      status = 'WARNING';
    }

    // Calculate composite Health Index (0-100)
    let healthIndex = 98;
    if (status === 'CRITICAL') {
      healthIndex = Math.max(30, 60 - active_criticals.length * 12);
    } else if (status === 'WARNING') {
      healthIndex = Math.max(65, 88 - active_warnings.length * 8);
    } else if (degEnabled && degScenario !== 'NORMAL') {
      healthIndex = Math.max(82, 98 - degSev * 16);
    }

    let degradationSummary = 'NONE';
    if (degEnabled && degScenario !== 'NORMAL') {
      degradationSummary = `${degScenario.replace('_', ' ')} (${(degSev * 100).toFixed(0)}%)`;
    }

    return {
      status,
      health_index: Math.round(healthIndex),
      operating_mode: this.cht > 140 ? 'CRUISE' : 'CRUISE',
      degradation_summary: degradationSummary,
      active_warnings,
      active_criticals,
    };
  }
}
