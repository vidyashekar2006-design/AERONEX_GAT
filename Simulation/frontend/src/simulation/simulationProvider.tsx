/**
 * Aeronex Digital Twin - Simulation Provider Layer
 * Provides clean React context abstraction.
 * Currently backed by MockSimulationProvider; can be swapped seamlessly
 * with Python WebSocket / FastAPI connection in future integration phases.
 */

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { MockEngineSimulator, MISSION_PHASES } from './mockSimulation';
import {
  DegradationScenario,
  EventLogEntry,
  HealthReport,
  MissionPhaseDef,
  MissionSummaryStats,
  SimulationControlsState,
  SimulationState,
  TelemetryData,
  TelemetryHistoryPoint,
} from './types';

interface SimulationContextValue {
  // Telemetry & Health
  telemetry: TelemetryData;
  health: HealthReport;
  history: TelemetryHistoryPoint[];

  // Simulation execution status
  simulationState: SimulationState;
  connectionMode: 'MOCK_ENGINE' | 'PYTHON_WEBSOCKET';

  // Mission State
  currentPhase: MissionPhaseDef;
  currentPhaseIndex: number;
  allPhases: MissionPhaseDef[];
  missionSummary: MissionSummaryStats;

  // Events
  eventLog: EventLogEntry[];
  clearEventLog: () => void;

  // Controls
  controls: SimulationControlsState;
  updateControls: (partial: Partial<SimulationControlsState>) => void;
  startSimulation: () => void;
  pauseSimulation: () => void;
  resetSimulation: () => void;
  jumpToPhase: (phaseIndex: number) => void;
}

const defaultControls: SimulationControlsState = {
  throttle: 65,
  altitude: 4500,
  ambient_temperature: 15,
  degradation_scenario: 'NORMAL',
  degradation_severity: 0,
  degradation_enabled: false,
  auto_progress_mission: true,
  sim_speed: 1,
};

const initialTelemetry: TelemetryData = {
  timestamp: Date.now(),
  throttle: 65,
  operating_mode: 'CRUISE',
  rpm: 4950,
  cht: 112.5,
  egt: 785.0,
  oil_temperature: 92.0,
  oil_pressure: 4.2,
  fuel_flow: 21.5,
  vibration: 1.65,
  engine_load: 65,
  available_performance: 98,
  altitude: 4500,
  ambient_temperature: 15,
  mission_elapsed_time: 0,
  degradation_scenario: 'NORMAL',
  degradation_enabled: false,
  degradation_severity: 0,
};

const initialHealth: HealthReport = {
  status: 'NORMAL',
  health_index: 96,
  operating_mode: 'CRUISE',
  degradation_summary: 'NONE',
  active_warnings: [],
  active_criticals: [],
};

const initialSummary: MissionSummaryStats = {
  missionDuration: 0,
  phasesCompleted: 0,
  minRpm: 1500,
  maxRpm: 4950,
  maxCht: 112.5,
  maxEgt: 785.0,
  minOilPressure: 4.2,
  maxVibration: 1.65,
  maxDegradationSeverity: 0,
  warningEvents: 0,
  criticalEvents: 0,
  finalHealth: 96,
  finalStatus: 'NORMAL',
};

const SimulationContext = createContext<SimulationContextValue | null>(null);

export const SimulationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const connectionMode: 'MOCK_ENGINE' | 'PYTHON_WEBSOCKET' = 'PYTHON_WEBSOCKET'; // Change to 'MOCK_ENGINE' for local simulation
  const socketRef = useRef<WebSocket | null>(null);
  const [simulationState, setSimulationState] = useState<SimulationState>('RUNNING');
  const [controls, setControls] = useState<SimulationControlsState>(defaultControls);
  const [telemetry, setTelemetry] = useState<TelemetryData>(initialTelemetry);
  const [health, setHealth] = useState<HealthReport>(initialHealth);
  const [history, setHistory] = useState<TelemetryHistoryPoint[]>([]);
  const [eventLog, setEventLog] = useState<EventLogEntry[]>([]);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState<number>(0);
  const [missionSummary, setMissionSummary] = useState<MissionSummaryStats>(initialSummary);

  const simulatorRef = useRef<MockEngineSimulator>(new MockEngineSimulator());
  const controlsRef = useRef<SimulationControlsState>(controls);
  controlsRef.current = controls;

  const simStateRef = useRef<SimulationState>(simulationState);
  simStateRef.current = simulationState;

  const sendPythonCommand = (message: object) => {
  if (socketRef.current?.readyState === WebSocket.OPEN) {
    socketRef.current.send(JSON.stringify(message));
  } else {
    console.warn("⚠️ Python WebSocket is not connected");
  }
};

  const addTelemetryToHistory = (currentTelemetry: TelemetryData) => {
  const minutes = Math.floor(currentTelemetry.mission_elapsed_time / 60);
  const seconds = Math.floor(currentTelemetry.mission_elapsed_time % 60);

  const timeStr =
    `${minutes.toString().padStart(2, '0')}:` +
    `${seconds.toString().padStart(2, '0')}`;

  setHistory((prev) => {
    const point: TelemetryHistoryPoint = {
      time: timeStr,
      met: currentTelemetry.mission_elapsed_time,
      rpm: currentTelemetry.rpm,
      throttle: currentTelemetry.throttle,
      cht: currentTelemetry.cht,
      egt: currentTelemetry.egt,
      oil_temperature: currentTelemetry.oil_temperature,
      oil_pressure: currentTelemetry.oil_pressure,
      vibration: currentTelemetry.vibration,
      fuel_flow: currentTelemetry.fuel_flow,
      altitude: currentTelemetry.altitude,
    };

    const next = [...prev, point];

    return next.length > 40
      ? next.slice(next.length - 40)
      : next;
  });
};
  
  const connectToPython = () => {
  const socket = new WebSocket(
    "ws://localhost:8000/ws/simulation"
  );

  socketRef.current = socket;

  socket.onopen = () => {
    console.log("🟢 Connected to Aeronex Python backend");
  };

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);

    console.log("📡 PYTHON TELEMETRY:", JSON.stringify(data, null, 2));
    
    if (typeof data.mission?.current_phase_index === 'number') {
  setCurrentPhaseIndex(data.mission.current_phase_index);
}
    const pythonTelemetry = data.latest_telemetry;
    if(!pythonTelemetry) return;
    // Python → React telemetry mapping
  const mappedTelemetry: TelemetryData = {
    timestamp: pythonTelemetry.timestamp,
    throttle: pythonTelemetry.throttle * 100,
    operating_mode:
      pythonTelemetry.operating_mode,
    rpm: pythonTelemetry.rpm,
    cht: pythonTelemetry.cht,
    egt: pythonTelemetry.egt,
    oil_temperature: pythonTelemetry.oil_temperature,
    oil_pressure: pythonTelemetry.oil_pressure,
    fuel_flow: pythonTelemetry.fuel_flow,
    vibration: pythonTelemetry.vibration,
    engine_load: pythonTelemetry.engine_load,
    available_performance:
      pythonTelemetry.available_performance * 100,
    altitude: pythonTelemetry.altitude,
    ambient_temperature: pythonTelemetry.ambient_temperature,
    mission_elapsed_time:
      pythonTelemetry.mission_elapsed_time,
    degradation_scenario:
      pythonTelemetry.degradation_scenario,
    degradation_enabled:
      pythonTelemetry.degradation_enabled,
    degradation_severity:
      pythonTelemetry.degradation_severity,
  };

  setTelemetry(mappedTelemetry);
  setSimulationState(
  data.running ? 'RUNNING' : 'PAUSED'
);

setControls({
  throttle: mappedTelemetry.throttle,
  altitude: mappedTelemetry.altitude,
  ambient_temperature: mappedTelemetry.ambient_temperature,

  degradation_scenario:
    data.controls?.degradation_scenario ??
    mappedTelemetry.degradation_scenario,

  degradation_severity:
    data.controls?.degradation_severity ??
    mappedTelemetry.degradation_severity,

  degradation_enabled:
    data.controls?.degradation_enabled ??
    mappedTelemetry.degradation_enabled,

  auto_progress_mission: true,
  sim_speed: 1,
});

addTelemetryToHistory(mappedTelemetry);

  // Digital Twin health
  const twin = data.digital_twin;

  if (twin) {
    setHealth({
      status: twin.health_status,
      health_index:
        twin.health_status === 'NORMAL'
          ? 100
          : twin.health_status === 'WARNING'
            ? 70
            : 30,
      operating_mode:
        twin.operating_mode,
      degradation_summary:
        twin.degradation.enabled
          ? `${twin.degradation.scenario} — severity ${(
              twin.degradation.severity * 100
            ).toFixed(0)}%`
          : 'NONE',
      active_warnings:
        twin.health_status === 'WARNING'
          ? ['Engine health warning detected']
          : [],
      active_criticals:
        twin.health_status === 'CRITICAL'
          ? ['Critical engine health condition detected']
          : [],
    });
  }
  if (twin) {
  setMissionSummary((prev) => ({
    ...prev,
    missionDuration:
      mappedTelemetry.mission_elapsed_time,
    minRpm: Math.min(
      prev.minRpm,
      mappedTelemetry.rpm
    ),
    maxRpm: Math.max(
      prev.maxRpm,
      mappedTelemetry.rpm
    ),
    maxCht: Math.max(
      prev.maxCht,
      mappedTelemetry.cht
    ),
    maxEgt: Math.max(
      prev.maxEgt,
      mappedTelemetry.egt
    ),
    minOilPressure: Math.min(
      prev.minOilPressure,
      mappedTelemetry.oil_pressure
    ),
    maxVibration: Math.max(
      prev.maxVibration,
      mappedTelemetry.vibration
    ),
    maxDegradationSeverity:
      mappedTelemetry.degradation_enabled
        ? Math.max(
            prev.maxDegradationSeverity,
            mappedTelemetry.degradation_severity
          )
        : prev.maxDegradationSeverity,
    finalStatus: twin.health_status,
  }));
}
  };

  socket.onerror = (error) => {
    console.error("🔴 WebSocket error:", error);
  };

  socket.onclose = () => {
    console.log("🟡 Disconnected from Aeronex backend");
  };
};

useEffect(() => {
  connectToPython();

  return () => {
    socketRef.current?.close();
  };
}, []);

  // Add event helper
  const addEvent = useCallback((event: Omit<EventLogEntry, 'id'>) => {
    const newEntry: EventLogEntry = {
      ...event,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    };
    setEventLog((prev) => [newEntry, ...prev].slice(0, 100)); // keep last 100 entries

    // Update mission summary event counts
    setMissionSummary((prev) => ({
      ...prev,
      warningEvents: event.level === 'WARNING' ? prev.warningEvents + 1 : prev.warningEvents,
      criticalEvents: event.level === 'CRITICAL' ? prev.criticalEvents + 1 : prev.criticalEvents,
    }));
  }, []);

  // Update controls
  const updateControls = useCallback(
  (partial: Partial<SimulationControlsState>) => {
    setControls((prev) => ({ ...prev, ...partial }));

    if (partial.throttle !== undefined) {
      sendPythonCommand({
        action: 'set_controls',
        throttle: partial.throttle / 100,
      });
    }
    if (partial.altitude !== undefined) {
      sendPythonCommand({
        action: 'set_controls',
        altitude: partial.altitude,
      });
    }
    if (partial.ambient_temperature !== undefined) {
      sendPythonCommand({
        action: 'set_controls',
        ambient_temperature: partial.ambient_temperature,
      });
    }
    if (partial.degradation_scenario !== undefined) {
      sendPythonCommand({
        action: 'set_controls',
        degradation_scenario: partial.degradation_scenario,
      });
    }
    if (partial.degradation_enabled !== undefined) {
      sendPythonCommand({
        action: 'set_controls',
        degradation_enabled: partial.degradation_enabled,
      });
    }
    if (partial.degradation_severity !== undefined) {
      sendPythonCommand({
        action: 'set_controls',
        degradation_severity: partial.degradation_severity,
      });
    }
  },
  []
);

  const startSimulation = useCallback(() => {
    sendPythonCommand({ action:'start' });
    setSimulationState('RUNNING');
    addEvent({
      timestamp: Date.now(),
      met: telemetry.mission_elapsed_time,
      level: 'INFO',
      message: 'Simulation loop resumed. Real-time telemetry streaming active.',
      source: 'CONTROLLER',
    });
  }, [telemetry.mission_elapsed_time, addEvent]);

  const pauseSimulation = useCallback(() => {
    sendPythonCommand({ action:'pause' });
    setSimulationState('PAUSED');
    addEvent({
      timestamp: Date.now(),
      met: telemetry.mission_elapsed_time,
      level: 'INFO',
      message: 'Simulation loop paused by flight operator.',
      source: 'CONTROLLER',
    });
  }, [telemetry.mission_elapsed_time, addEvent]);

  const resetSimulation = useCallback(() => {
    sendPythonCommand({ action:'reset' });
    setControls(defaultControls);
    setTelemetry(initialTelemetry);
    setHealth(initialHealth);
    setHistory([]);
    setCurrentPhaseIndex(0);
    setMissionSummary(initialSummary);
    setSimulationState('RUNNING');
    addEvent({
      timestamp: Date.now(),
      met: 0,
      level: 'INFO',
      message: 'Aeronex Digital Twin reset to initial cold-start baseline.',
      source: 'ENGINE',
    });
  }, [addEvent]);

  const jumpToPhase = useCallback((phaseIndex: number) => {
  // Python is the source of truth when using the Python WebSocket engine.
  // Do not let the legacy MockEngineSimulator change the mission phase.
  if (connectionMode === 'PYTHON_WEBSOCKET') {
    addEvent({
      timestamp: Date.now(),
      met: telemetry.mission_elapsed_time,
      level: 'INFO',
      message:
        'Manual phase jumping is disabled while the Python mission engine is active.',
      source: 'MISSION',
    });

    return;
  }

  // Legacy mock-simulation behaviour.
  simulatorRef.current.setPhaseIndex(phaseIndex);
  setCurrentPhaseIndex(phaseIndex);

  const target = MISSION_PHASES[phaseIndex];

  if (target) {
    updateControls({
      throttle: target.targetThrottle,
      altitude: target.targetAltitude,
    });

    addEvent({
      timestamp: Date.now(),
      met: simulatorRef.current.getCurrentPhase().nominalDuration,
      level: 'INFO',
      message: `Manual waypoint phase transition to: ${target.name}`,
      source: 'MISSION',
    });
  }
}, [
  connectionMode,
  telemetry.mission_elapsed_time,
  updateControls,
  addEvent,
]);

  const clearEventLog = useCallback(() => {
    setEventLog([]);
  }, []);

  // Initial event log
  useEffect(() => {
    addEvent({
      timestamp: Date.now(),
      met: 0,
      level: 'INFO',
      message: 'Aeronex MALE UAV Aero Piston Digital Twin initialized.',
      source: 'ENGINE',
    });
    addEvent({
      timestamp: Date.now(),
      met: 0,
      level: 'INFO',
      message: 'Telemetric data stream synchronized at 10Hz sampling rate.',
      source: 'CONTROLLER',
    });
  }, [addEvent]);

  // Main simulation loop (running at 10Hz = 100ms interval for smooth rendering)
  useEffect(() => {
    if (connectionMode === 'PYTHON_WEBSOCKET') {
      return;
    }
    let lastTime = performance.now();

    const interval = setInterval(() => {
      const now = performance.now();
      const dt = Math.min(0.25, (now - lastTime) / 1000);
      lastTime = now;

      if (simStateRef.current !== 'RUNNING') return;

      const sim = simulatorRef.current;
      const currentCtrl = controlsRef.current;

      const result = sim.step(dt, currentCtrl, (event) => {
        addEvent(event);
      });

      const currentTelemetry = result.telemetry;
      const currentHealth = result.health;

      setTelemetry(currentTelemetry);
      setHealth(currentHealth);
      setCurrentPhaseIndex(sim.getCurrentPhaseIndex());

      // Append to rolling history (keep last 40 data points for responsive charts)
      const minutes = Math.floor(currentTelemetry.mission_elapsed_time / 60);
      const seconds = currentTelemetry.mission_elapsed_time % 60;
      const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

      setHistory((prev) => {
        const point: TelemetryHistoryPoint = {
          time: timeStr,
          met: currentTelemetry.mission_elapsed_time,
          rpm: currentTelemetry.rpm,
          throttle: currentTelemetry.throttle,
          cht: currentTelemetry.cht,
          egt: currentTelemetry.egt,
          oil_temperature: currentTelemetry.oil_temperature,
          oil_pressure: currentTelemetry.oil_pressure,
          vibration: currentTelemetry.vibration,
          fuel_flow: currentTelemetry.fuel_flow,
          altitude: currentTelemetry.altitude,
        };
        const next = [...prev, point];
        return next.length > 40 ? next.slice(next.length - 40) : next;
      });

      // Update summary stats
      setMissionSummary((prev) => ({
        ...prev,
        missionDuration: currentTelemetry.mission_elapsed_time,
        phasesCompleted: sim.getCurrentPhaseIndex() + 1,
        minRpm: Math.min(prev.minRpm, currentTelemetry.rpm),
        maxRpm: Math.max(prev.maxRpm, currentTelemetry.rpm),
        maxCht: Math.max(prev.maxCht, currentTelemetry.cht),
        maxEgt: Math.max(prev.maxEgt, currentTelemetry.egt),
        minOilPressure: Math.min(prev.minOilPressure, currentTelemetry.oil_pressure),
        maxVibration: Math.max(prev.maxVibration, currentTelemetry.vibration),
        maxDegradationSeverity: currentTelemetry.degradation_enabled 
          ? Math.max(prev.maxDegradationSeverity, currentTelemetry.degradation_severity)
          : prev.maxDegradationSeverity,
        finalHealth: currentHealth.health_index,
        finalStatus: currentHealth.status,
      }));
    }, 100);

    return () => clearInterval(interval);
  }, [addEvent]);

  return (
    <SimulationContext.Provider
      value={{
        telemetry,
        health,
        history,
        simulationState,
        connectionMode: 'PYTHON_WEBSOCKET',
        currentPhase: MISSION_PHASES[currentPhaseIndex] || MISSION_PHASES[0],
        currentPhaseIndex,
        allPhases: MISSION_PHASES,
        missionSummary,
        eventLog,
        clearEventLog,
        controls,
        updateControls,
        startSimulation,
        pauseSimulation,
        resetSimulation,
        jumpToPhase,
      }}
    >
      {children}
    </SimulationContext.Provider>
  );
};

export const useSimulation = (): SimulationContextValue => {
  const context = useContext(SimulationContext);
  if (!context) {
    throw new Error('useSimulation must be used within a SimulationProvider');
  }
  return context;
};
