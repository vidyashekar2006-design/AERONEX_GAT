/**
 * Aeronex Digital Twin - Simulation Provider
 *
 * The Python Simulation Backend is the single source of truth.
 *
 * Flow:
 * React Simulation UI
 *        ↓ WebSocket commands
 * Python Simulation Backend
 *        ↓
 * MissionSimulator
 *        ↓
 * Engine / Controller
 *        ↓
 * Real telemetry
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from 'react';

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


// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------

interface SimulationContextValue {
  telemetry: TelemetryData;
  health: HealthReport;
  history: TelemetryHistoryPoint[];

  simulationState: SimulationState;
  connectionMode: 'PYTHON_WEBSOCKET';

  currentPhase: MissionPhaseDef;
  currentPhaseIndex: number;
  allPhases: MissionPhaseDef[];
  missionSummary: MissionSummaryStats;

  eventLog: EventLogEntry[];
  clearEventLog: () => void;

  controls: SimulationControlsState;
  updateControls: (
    partial: Partial<SimulationControlsState>
  ) => void;

  startSimulation: () => void;
  pauseSimulation: () => void;
  resetSimulation: () => void;

  jumpToPhase: (phaseIndex: number) => void;
}


// ---------------------------------------------------------------------------
// MISSION PHASES
//
// These names match the Python default mission profile.
// The Python backend remains authoritative for the actual phase.
// ---------------------------------------------------------------------------


const MISSION_PHASES: MissionPhaseDef[] = [
  {
    id: 1,
    name: 'START / IDLE',
    shortCode: 'START',
    description: 'Engine start and idle stabilization.',
    targetThrottle: 0,
    targetAltitude: 0,
    nominalDuration: 5,
  },
  {
    id: 2,
    name: 'TAKEOFF / HIGH LOAD',
    shortCode: 'TAKEOFF',
    description: 'High-load takeoff phase.',
    targetThrottle: 85,
    targetAltitude: 300,
    nominalDuration: 5,
  },
  {
    id: 3,
    name: 'CLIMB',
    shortCode: 'CLIMB',
    description: 'Climb to mission operating altitude.',
    targetThrottle: 75,
    targetAltitude: 3000,
    nominalDuration: 8,
  },
  {
    id: 4,
    name: 'CRUISE',
    shortCode: 'CRUISE',
    description: 'Stable cruise operation.',
    targetThrottle: 55,
    targetAltitude: 3000,
    nominalDuration: 10,
  },
  {
    id: 5,
    name: 'HIGH-ALTITUDE CRUISE',
    shortCode: 'HIGH ALT',
    description: 'High-altitude cruise segment.',
    targetThrottle: 55,
    targetAltitude: 6500,
    nominalDuration: 8,
  },
  {
    id: 6,
    name: 'ENVIRONMENT CHANGE',
    shortCode: 'ENV CHANGE',
    description: 'Mission environment conditions change.',
    targetThrottle: 60,
    targetAltitude: 6500,
    nominalDuration: 5,
  },
  {
    id: 7,
    name: 'OPTIONAL DEGRADATION EVENT',
    shortCode: 'DEGRADATION',
    description: 'Representative degradation event.',
    targetThrottle: 60,
    targetAltitude: 6500,
    nominalDuration: 8,
  },
  {
    id: 8,
    name: 'RETURN / LOWER LOAD',
    shortCode: 'RETURN',
    description: 'Return segment with reduced engine load.',
    targetThrottle: 30,
    targetAltitude: 1000,
    nominalDuration: 8,
  },
  {
    id: 9,
    name: 'MISSION COMPLETE',
    shortCode: 'COMPLETE',
    description: 'Mission completion and engine shutdown.',
    targetThrottle: 0,
    targetAltitude: 0,
    nominalDuration: 4,
  },
];

// ---------------------------------------------------------------------------
// DEFAULT CONTROLS
// ---------------------------------------------------------------------------

const defaultControls: SimulationControlsState = {
  throttle: 0,
  altitude: 0,
  ambient_temperature: 20,
  degradation_scenario: 'NORMAL',
  degradation_severity: 0,
  degradation_enabled: false,

  auto_progress_mission: true,
  sim_speed: 1,
};


// ---------------------------------------------------------------------------
// EMPTY / COLD-START TELEMETRY
//
// IMPORTANT:
// These are NOT fake engine readings.
// They represent "no mission telemetry yet".
// ---------------------------------------------------------------------------

const initialTelemetry: TelemetryData = {
  timestamp: 0,

  throttle: 0,
  operating_mode: 'IDLE',

  rpm: 0,
  cht: 0,
  egt: 0,

  oil_temperature: 0,
  oil_pressure: 0,

  fuel_flow: 0,
  vibration: 0,

  engine_load: 0,
  available_performance: 0,

  altitude: 0,
  ambient_temperature: 20,

  mission_elapsed_time: 0,

  degradation_scenario: 'NORMAL',
  degradation_enabled: false,
  degradation_severity: 0,
};


// ---------------------------------------------------------------------------
// INITIAL HEALTH
// ---------------------------------------------------------------------------

const initialHealth: HealthReport = {
  status: 'NORMAL',
  health_index: 0,
  operating_mode: 'IDLE',

  degradation_summary: 'NO TELEMETRY',

  active_warnings: [],
  active_criticals: [],
};


// ---------------------------------------------------------------------------
// INITIAL SUMMARY
// ---------------------------------------------------------------------------

const initialSummary: MissionSummaryStats = {
  missionDuration: 0,
  phasesCompleted: 0,

  minRpm: 0,
  maxRpm: 0,

  maxCht: 0,
  maxEgt: 0,

  minOilPressure: 0,
  maxVibration: 0,

  maxDegradationSeverity: 0,

  warningEvents: 0,
  criticalEvents: 0,

  finalHealth: 0,
  finalStatus: 'NORMAL',
};


// ---------------------------------------------------------------------------
// CONTEXT
// ---------------------------------------------------------------------------

const SimulationContext =
  createContext<SimulationContextValue | null>(null);


// ---------------------------------------------------------------------------
// PROVIDER
// ---------------------------------------------------------------------------

export const SimulationProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {

  const socketRef = useRef<WebSocket | null>(null);

  const [simulationState, setSimulationState] =
    useState<SimulationState>('PAUSED');

  const [controls, setControls] =
    useState<SimulationControlsState>(
      defaultControls
    );

  const [telemetry, setTelemetry] =
    useState<TelemetryData>(
      initialTelemetry
    );

  const [health, setHealth] =
    useState<HealthReport>(
      initialHealth
    );

  const [history, setHistory] =
    useState<TelemetryHistoryPoint[]>([]);

  const [eventLog, setEventLog] =
    useState<EventLogEntry[]>([]);

  const [currentPhaseIndex, setCurrentPhaseIndex] =
    useState<number>(0);

  const [missionSummary, setMissionSummary] =
    useState<MissionSummaryStats>(
      initialSummary
    );


  // -------------------------------------------------------------------------
  // EVENT LOGGER
  // -------------------------------------------------------------------------

  const addEvent = useCallback(
    (
      event: Omit<EventLogEntry, 'id'>
    ) => {

      const newEntry: EventLogEntry = {
        ...event,
        id:
          `${Date.now()}-` +
          `${Math.random()
            .toString(36)
            .slice(2, 8)}`,
      };

      setEventLog(
        prev =>
          [newEntry, ...prev].slice(0, 100)
      );

      setMissionSummary(prev => ({
        ...prev,

        warningEvents:
          event.level === 'WARNING'
            ? prev.warningEvents + 1
            : prev.warningEvents,

        criticalEvents:
          event.level === 'CRITICAL'
            ? prev.criticalEvents + 1
            : prev.criticalEvents,
      }));
    },
    []
  );


  // -------------------------------------------------------------------------
  // SEND COMMAND TO PYTHON
  // -------------------------------------------------------------------------

  const sendPythonCommand = useCallback(
    (message: object) => {

      if (
        socketRef.current?.readyState ===
        WebSocket.OPEN
      ) {

        socketRef.current.send(
          JSON.stringify(message)
        );

        return true;
      }

      console.warn(
        '⚠️ Simulation WebSocket is not connected'
      );

      return false;
    },
    []
  );


  // -------------------------------------------------------------------------
  // TELEMETRY HISTORY
  // -------------------------------------------------------------------------

  const addTelemetryToHistory = useCallback(
    (
      currentTelemetry: TelemetryData
    ) => {

      const minutes =
        Math.floor(
          currentTelemetry
            .mission_elapsed_time / 60
        );

      const seconds =
        Math.floor(
          currentTelemetry
            .mission_elapsed_time % 60
        );

      const timeStr =
        `${minutes
          .toString()
          .padStart(2, '0')}:` +
        `${seconds
          .toString()
          .padStart(2, '0')}`;

      const point: TelemetryHistoryPoint = {
        time: timeStr,

        met:
          currentTelemetry
            .mission_elapsed_time,

        rpm:
          currentTelemetry.rpm,

        throttle:
          currentTelemetry.throttle,

        cht:
          currentTelemetry.cht,

        egt:
          currentTelemetry.egt,

        oil_temperature:
          currentTelemetry.oil_temperature,

        oil_pressure:
          currentTelemetry.oil_pressure,

        vibration:
          currentTelemetry.vibration,

        fuel_flow:
          currentTelemetry.fuel_flow,

        altitude:
          currentTelemetry.altitude,
      };

      setHistory(prev => {

        const next = [
          ...prev,
          point,
        ];

        return next.length > 40
          ? next.slice(next.length - 40)
          : next;
      });
    },
    []
  );


  // -------------------------------------------------------------------------
  // PYTHON WEBSOCKET
  // -------------------------------------------------------------------------

  const connectToPython = useCallback(() => {

    const socket =
      new WebSocket(
         import.meta.env.VITE_SIMULATION_WS_URL ||
        'ws://localhost:8000/ws/simulation'
        )

    socketRef.current = socket;


    socket.onopen = () => {

      console.log(
        '🟢 Connected to Simulation Backend'
      );
    };


    socket.onmessage = event => {

      try {

        const data =
          JSON.parse(event.data);


        console.log(
          '📡 SIMULATION STATUS:',
          data
        );


        // ---------------------------------------------------------------
        // MISSION STATE
        // ---------------------------------------------------------------

        if (
          typeof
            data.mission
              ?.current_phase_index ===
          'number'
        ) {

          setCurrentPhaseIndex(
            data.mission
              .current_phase_index
          );
        }


        // ---------------------------------------------------------------
        // RUNNING / PAUSED / COMPLETE
        // ---------------------------------------------------------------

        if (data.complete) {

          setSimulationState(
            'PAUSED'
          );

        } else if (data.running) {

          setSimulationState(
            'RUNNING'
          );

        } else {

          setSimulationState(
            'PAUSED'
          );
        }


        // ---------------------------------------------------------------
        // CONTROLS
        // ---------------------------------------------------------------

        if (data.controls) {

          setControls({
            throttle:
              Number(
                data.controls
                  .throttle ?? 0
              ) * 100,

            altitude:
              Number(
                data.controls
                  .altitude ?? 0
              ),

            ambient_temperature:
              Number(
                data.controls
                  .ambient_temperature ?? 20
              ),

            degradation_scenario:
              data.controls
                .degradation_scenario ??
              'NORMAL',

            degradation_severity:
              Number(
                data.controls
                  .degradation_severity ?? 0
              ),

            degradation_enabled:
              Boolean(
                data.controls
                  .degradation_enabled
              ),

            auto_progress_mission:
              true,

            sim_speed: 1,
          });
        }


        // ---------------------------------------------------------------
        // NO TELEMETRY YET
        // ---------------------------------------------------------------

        const pythonTelemetry =
          data.latest_telemetry;

        if (!pythonTelemetry) {

          return;
        }


        // ---------------------------------------------------------------
        // PYTHON → REACT TELEMETRY
        // ---------------------------------------------------------------

        const mappedTelemetry:
          TelemetryData = {

          timestamp:
            Number(
              pythonTelemetry
                .timestamp ?? 0
            ),

          throttle:
            Number(
              pythonTelemetry
                .throttle ?? 0
            ) * 100,

          operating_mode:
            pythonTelemetry
              .operating_mode ??
            'IDLE',

          rpm:
            Number(
              pythonTelemetry
                .rpm ?? 0
            ),

          cht:
            Number(
              pythonTelemetry
                .cht ?? 0
            ),

          egt:
            Number(
              pythonTelemetry
                .egt ?? 0
            ),

          oil_temperature:
            Number(
              pythonTelemetry
                .oil_temperature ?? 0
            ),

          oil_pressure:
            Number(
              pythonTelemetry
                .oil_pressure ?? 0
            ),

          fuel_flow:
            Number(
              pythonTelemetry
                .fuel_flow ?? 0
            ),

          vibration:
            Number(
              pythonTelemetry
                .vibration ?? 0
            ),

          engine_load:
            Number(
              pythonTelemetry
                .engine_load ?? 0
            ),

          available_performance:
            Number(
              pythonTelemetry
                .available_performance ?? 0
            ) * 100,

          altitude:
            Number(
              pythonTelemetry
                .altitude ?? 0
            ),

          ambient_temperature:
            Number(
              pythonTelemetry
                .ambient_temperature ?? 20
            ),

          mission_elapsed_time:
            Number(
              pythonTelemetry
                .mission_elapsed_time ?? 0
            ),

          degradation_scenario:
            pythonTelemetry
              .degradation_scenario ??
            'NORMAL',

          degradation_enabled:
            Boolean(
              pythonTelemetry
                .degradation_enabled
            ),

          degradation_severity:
            Number(
              pythonTelemetry
                .degradation_severity ?? 0
            ),
        };


        setTelemetry(
          mappedTelemetry
        );


        addTelemetryToHistory(
          mappedTelemetry
        );


        // ---------------------------------------------------------------
        // HEALTH
        //
        // The Simulation Backend currently gives us the health status.
        // We therefore do NOT depend on a nested `digital_twin.degradation`
        // object.
        // ---------------------------------------------------------------

        const healthStatus =
          data.digital_twin
            ?.health_status ??
          'NORMAL';

        const healthIndex =
          healthStatus === 'NORMAL'
            ? 100
            : healthStatus === 'WARNING'
              ? 70
              : healthStatus === 'CRITICAL'
                ? 30
                : 0;


        let degradationSummary =
          'NONE';

        if (
          mappedTelemetry
            .degradation_enabled
        ) {

          degradationSummary =
            `${mappedTelemetry
              .degradation_scenario}` +
            ` — severity ` +
            `${(
              mappedTelemetry
                .degradation_severity *
              100
            ).toFixed(0)}%`;
        }


        setHealth({

          status:
            healthStatus,

          health_index:
            healthIndex,

          operating_mode:
            mappedTelemetry
              .operating_mode,

          degradation_summary:
            degradationSummary,

          active_warnings:
            healthStatus === 'WARNING'
              ? [
                  'Engine health warning detected',
                ]
              : [],

          active_criticals:
            healthStatus === 'CRITICAL'
              ? [
                  'Critical engine health condition detected',
                ]
              : [],
        });


        // ---------------------------------------------------------------
        // MISSION SUMMARY
        // ---------------------------------------------------------------

        setMissionSummary(prev => {

          const currentRpm =
            mappedTelemetry.rpm;

          const currentCht =
            mappedTelemetry.cht;

          const currentEgt =
            mappedTelemetry.egt;

          const currentOilPressure =
            mappedTelemetry.oil_pressure;

          const currentVibration =
            mappedTelemetry.vibration;


          const isFirstRealSample =
            prev.maxRpm === 0 &&
            prev.maxCht === 0 &&
            prev.maxEgt === 0;


          return {

            ...prev,

            missionDuration:
              mappedTelemetry
                .mission_elapsed_time,

            phasesCompleted:
              Number(
                data.mission
                  ?.completed_phases
                  ?.length ?? 0
              ),

            minRpm:
              isFirstRealSample
                ? currentRpm
                : Math.min(
                    prev.minRpm,
                    currentRpm
                  ),

            maxRpm:
              Math.max(
                prev.maxRpm,
                currentRpm
              ),

            maxCht:
              Math.max(
                prev.maxCht,
                currentCht
              ),

            maxEgt:
              Math.max(
                prev.maxEgt,
                currentEgt
              ),

            minOilPressure:
              isFirstRealSample
                ? currentOilPressure
                : Math.min(
                    prev.minOilPressure,
                    currentOilPressure
                  ),

            maxVibration:
              Math.max(
                prev.maxVibration,
                currentVibration
              ),

            maxDegradationSeverity:
              mappedTelemetry
                .degradation_enabled
                ? Math.max(
                    prev.maxDegradationSeverity,
                    mappedTelemetry
                      .degradation_severity
                  )
                : prev.maxDegradationSeverity,

            finalHealth:
              healthIndex,

            finalStatus:
              healthStatus,
          };
        });


      } catch (error) {

        console.error(
          '❌ Failed to process simulation WebSocket message:',
          error
        );
      }
    };


    socket.onerror = error => {

      console.error(
        '🔴 Simulation WebSocket error:',
        error
      );
    };


    socket.onclose = () => {

      console.log(
        '🟡 Simulation Backend disconnected'
      );
    };

  }, [
    addTelemetryToHistory,
  ]);


  // -------------------------------------------------------------------------
  // CONNECT ON MOUNT
  // -------------------------------------------------------------------------

  useEffect(() => {

    connectToPython();

    return () => {

      socketRef.current?.close();

      socketRef.current = null;
    };

  }, [connectToPython]);


  // -------------------------------------------------------------------------
  // CONTROLS
  //
  // IMPORTANT:
  // The current Python mission profile is authoritative.
  // Manual control commands are therefore not sent to Python yet.
  // -------------------------------------------------------------------------

  const updateControls = useCallback(
  (
    partial:
      Partial<SimulationControlsState>
  ) => {

    // Update the local UI state immediately.
    setControls(prev => ({
      ...prev,
      ...partial,
    }));

    // Send degradation controls to the Python Simulation Backend.
    const hasDegradationChange =
      partial.degradation_scenario !== undefined ||
      partial.degradation_enabled !== undefined ||
      partial.degradation_severity !== undefined;

    if (hasDegradationChange) {

      const nextControls = {
        ...controls,
        ...partial,
      };

      sendPythonCommand({
        action: 'set_controls',

        degradation_scenario:
          nextControls.degradation_scenario,

        degradation_enabled:
          nextControls.degradation_enabled,

        degradation_severity:
          nextControls.degradation_severity,
      });
    }

    console.log(
      'Simulation control update:',
      partial
    );
  },
  [
    controls,
    sendPythonCommand,
  ]
);

  // -------------------------------------------------------------------------
  // START
  // -------------------------------------------------------------------------

  const startSimulation = useCallback(
    () => {

      const sent =
        sendPythonCommand({
          action: 'start',
        });

      if (!sent) {
        return;
      }

      setSimulationState(
        'RUNNING'
      );

      addEvent({

        timestamp:
          Date.now(),

        met:
          telemetry
            .mission_elapsed_time,

        level: 'INFO',

        message:
          'Mission start command sent to Python Simulation Backend.',

        source: 'CONTROLLER',
      });

    },
    [
      sendPythonCommand,
      telemetry.mission_elapsed_time,
      addEvent,
    ]
  );


  // -------------------------------------------------------------------------
  // PAUSE
  // -------------------------------------------------------------------------

  const pauseSimulation = useCallback(
    () => {

      const sent =
        sendPythonCommand({
          action: 'pause',
        });

      if (!sent) {
        return;
      }

      setSimulationState(
        'PAUSED'
      );

      addEvent({

        timestamp:
          Date.now(),

        met:
          telemetry
            .mission_elapsed_time,

        level: 'INFO',

        message:
          'Mission paused by operator.',

        source: 'CONTROLLER',
      });

    },
    [
      sendPythonCommand,
      telemetry.mission_elapsed_time,
      addEvent,
    ]
  );


  // -------------------------------------------------------------------------
  // RESET
  // -------------------------------------------------------------------------

  const resetSimulation = useCallback(
    () => {

      const sent =
        sendPythonCommand({
          action: 'reset',
        });

      if (!sent) {
        return;
      }

      setControls(
        defaultControls
      );

      setTelemetry(
        initialTelemetry
      );

      setHealth(
        initialHealth
      );

      setHistory([]);

      setCurrentPhaseIndex(0);

      setMissionSummary(
        initialSummary
      );

      setSimulationState(
        'PAUSED'
      );

      addEvent({

        timestamp:
          Date.now(),

        met: 0,

        level: 'INFO',

        message:
          'Simulation reset. Mission is waiting for START.',

        source: 'ENGINE',
      });

    },
    [
      sendPythonCommand,
      addEvent,
    ]
  );


  // -------------------------------------------------------------------------
  // PHASE JUMP
  //
  // Disabled because Python mission profile is authoritative.
  // -------------------------------------------------------------------------

  const jumpToPhase = useCallback(
    (phaseIndex: number) => {

      console.log(
        'Manual phase jumping is disabled.',
        phaseIndex
      );

      addEvent({

        timestamp:
          Date.now(),

        met:
          telemetry
            .mission_elapsed_time,

        level: 'INFO',

        message:
          'Manual phase jumping is disabled while the Python mission engine is active.',

        source: 'MISSION',
      });

    },
    [
      telemetry.mission_elapsed_time,
      addEvent,
    ]
  );


  // -------------------------------------------------------------------------
  // CLEAR EVENT LOG
  // -------------------------------------------------------------------------

  const clearEventLog =
    useCallback(() => {

      setEventLog([]);

    }, []);


  // -------------------------------------------------------------------------
  // INITIAL EVENT
  // -------------------------------------------------------------------------

  useEffect(() => {

    addEvent({

      timestamp:
        Date.now(),

      met: 0,

      level: 'INFO',

      message:
        'Aeronex Simulation interface initialized. Waiting for mission start.',

      source: 'ENGINE',
    });

  }, [addEvent]);


  // -------------------------------------------------------------------------
  // CURRENT PHASE
  // -------------------------------------------------------------------------

  const currentPhase =
    MISSION_PHASES[
      Math.min(
        currentPhaseIndex,
        MISSION_PHASES.length - 1
      )
    ] ||
    MISSION_PHASES[0];


  // -------------------------------------------------------------------------
  // PROVIDER
  // -------------------------------------------------------------------------

  return (
    <SimulationContext.Provider
      value={{

        telemetry,

        health,

        history,

        simulationState,

        connectionMode:
          'PYTHON_WEBSOCKET',

        currentPhase,

        currentPhaseIndex,

        allPhases:
          MISSION_PHASES,

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


// ---------------------------------------------------------------------------
// HOOK
// ---------------------------------------------------------------------------

export const useSimulation =
  (): SimulationContextValue => {

    const context =
      useContext(
        SimulationContext
      );

    if (!context) {

      throw new Error(
        'useSimulation must be used within a SimulationProvider'
      );
    }

    return context;
  };