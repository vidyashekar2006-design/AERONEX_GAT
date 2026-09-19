import React from 'react';
import {
  Compass,
  CheckCircle2,
  ShieldCheck,
  Flag,
  ArrowRight,
} from 'lucide-react';
import { AeronexSnapshot } from '../../services/websocket';

interface MissionPanelProps {
  snapshot: AeronexSnapshot | null;
}

const MISSION_PHASES = [
  'IDLE',
  'START',
  'TAKEOFF',
  'CLIMB',
  'CRUISE',
  'HIGH ALTITUDE',
  'RETURN',
  'COMPLETE',
];

export const MissionPanel: React.FC<MissionPanelProps> = ({
  snapshot,
}) => {
  const mission = snapshot?.mission;
  const analysis = snapshot?.analysis;

  // ─────────────────────────────────────────────
  // CURRENT MISSION PHASE
  // ─────────────────────────────────────────────

  const currentPhase =
    typeof mission?.phase === 'string'
      ? mission.phase.toUpperCase()
      : 'NOT AVAILABLE';

  // Backend currently returns null for progress.
  // Do not invent a progress value.
  const missionProgress =
    typeof mission?.progress === 'number'
      ? Math.max(0, Math.min(100, mission.progress))
      : null;

  // ─────────────────────────────────────────────
  // LIVE MISSION ML ANALYSIS
  // ─────────────────────────────────────────────

  const missionProbability =
    typeof analysis?.mission?.completion_probability === 'number'
      ? analysis.mission.completion_probability
      : null;

  const missionReliability =
    typeof analysis?.mission?.reliability === 'number'
      ? analysis.mission.reliability
      : null;

  const risk =
    typeof analysis?.mission?.risk === 'string'
      ? analysis.mission.risk.toUpperCase()
      : null;

  const decision =
    typeof analysis?.mission?.decision === 'string'
      ? analysis.mission.decision
      : null;

  const confidence =
    typeof analysis?.mission?.confidence === 'number'
      ? analysis.mission.confidence
      : null;

  // ─────────────────────────────────────────────
  // PHASE TRACKING
  // ─────────────────────────────────────────────

  const phaseIndex = MISSION_PHASES.findIndex(
    phase =>
      phase === currentPhase ||
      currentPhase.includes(phase)
  );

  const getPhaseStatus = (index: number) => {
    if (phaseIndex === -1) {
      return 'upcoming';
    }

    if (index < phaseIndex) {
      return 'completed';
    }

    if (index === phaseIndex) {
      return 'current';
    }

    return 'upcoming';
  };

  // ─────────────────────────────────────────────
  // FORMATTERS
  // ─────────────────────────────────────────────

  const formatProbability = (value: number | null) => {
    if (value === null) {
      return 'N/A';
    }

    return `${(value * 100).toFixed(1)}%`;
  };

  // ─────────────────────────────────────────────
  // RISK COLOR
  // ─────────────────────────────────────────────

  const reliabilityColor =
    risk === 'CRITICAL' || risk === 'HIGH'
      ? 'text-red-400'
      : risk === 'MEDIUM'
        ? 'text-amber-400'
        : risk === 'LOW'
          ? 'text-emerald-400'
          : 'text-slate-300';

  return (
    <div className="bg-[#0d1527] border border-slate-800 rounded-lg p-3.5 shadow-sm">

      {/* ─────────────────────────────────────────
          HEADER
      ───────────────────────────────────────── */}

      <div className="flex flex-wrap items-center justify-between pb-2.5 mb-3 border-b border-slate-800 gap-2">

        <div className="flex items-center gap-2">

          <Compass className="w-4 h-4 text-cyan-400" />

          <h3 className="font-mono text-xs font-bold tracking-wider text-slate-200 uppercase">
            MISSION PROFILE & HEALTH ENVELOPE
          </h3>

        </div>

        <div className="flex items-center gap-2 font-mono text-[10px]">

          <span className="text-slate-400">
            DATA SOURCE:
          </span>

          <span
            className={`px-1.5 py-0.5 rounded border ${
              snapshot
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30'
                : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}
          >
            {snapshot ? 'LIVE BACKEND' : 'WAITING'}
          </span>

        </div>

      </div>


      {/* ─────────────────────────────────────────
          PRIMARY MISSION INFORMATION
      ───────────────────────────────────────── */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">

        {/* MISSION DETAILS */}

        <div className="bg-[#0a101d] p-3 rounded border border-slate-800/90 font-mono">

          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
            DESIGNATED MISSION
          </span>

          <h4 className="text-sm font-bold text-white mt-0.5 tracking-tight font-sans">
            LONG-DURATION ISR
          </h4>

          <div className="mt-2.5 grid grid-cols-2 gap-2 text-xs border-t border-slate-800/80 pt-2">

            <div>

              <span className="text-[10px] text-slate-400 block">
                CURRENT PHASE
              </span>

              <span className="font-bold text-cyan-300">
                {currentPhase}
              </span>

            </div>

            <div>

              <span className="text-[10px] text-slate-400 block">
                ALTITUDE
              </span>

              <span className="font-bold text-slate-200">
                {typeof snapshot?.environment?.altitude === 'number'
                  ? `${snapshot.environment.altitude.toFixed(0)} m`
                  : 'N/A'}
              </span>

            </div>

          </div>

        </div>


        {/* ─────────────────────────────────────────
            MISSION METER
        ───────────────────────────────────────── */}

        <div className="md:col-span-2 bg-[#0a101d] p-3 rounded border border-slate-800/90 flex flex-col justify-between font-mono">

          <div className="flex items-center justify-between mb-2">

            <span className="text-[10px] uppercase tracking-wider text-cyan-400 font-bold flex items-center gap-1.5">

              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />

              AERONEX SIGNATURE // MISSION METER

            </span>

            <span className="text-[9px] text-slate-400">
              LIVE MISSION STATE
            </span>

          </div>


          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* MISSION PROGRESS */}

            <div className="bg-slate-900/60 p-2.5 rounded border border-slate-800">

              <div className="flex items-center justify-between text-xs mb-1.5">

                <span className="text-slate-400 font-medium">
                  MISSION PROGRESS
                </span>

                <span className="font-bold text-white text-sm">
                  {missionProgress !== null
                    ? `${missionProgress.toFixed(0)}%`
                    : 'N/A'}
                </span>

              </div>


              <div className="w-full h-3 bg-slate-950 rounded-sm overflow-hidden p-0.5 border border-slate-800">

                {missionProgress !== null && (
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 via-cyan-500 to-cyan-400 rounded-xs transition-all duration-500"
                    style={{
                      width: `${missionProgress}%`,
                    }}
                  />
                )}

              </div>


              <div className="flex justify-between text-[9px] text-slate-400 mt-1">

                <span>
                  START
                </span>

                <span className="text-cyan-400 font-bold">
                  {currentPhase}
                </span>

                <span>
                  COMPLETE
                </span>

              </div>


              {missionProgress === null && (
                <div className="text-[9px] text-slate-500 mt-1.5">
                  Progress unavailable from backend.
                </div>
              )}

            </div>


            {/* MISSION RELIABILITY */}

            <div className="bg-slate-900/60 p-2.5 rounded border border-slate-800 flex flex-col justify-between">

              <div className="flex items-center justify-between text-xs mb-1">

                <span className="text-slate-400 font-medium">
                  MISSION RELIABILITY
                </span>

                <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  LIVE ML
                </span>

              </div>


              <div className="my-auto py-1">

                <div
                  className={`text-sm font-bold tracking-tight ${reliabilityColor}`}
                >
                  {decision ??
                    (risk
                      ? `${risk} RISK`
                      : 'ANALYSIS UNAVAILABLE')}
                </div>


                <p className="text-[10px] text-slate-400 mt-0.5 font-sans leading-tight">

                  Completion probability:{' '}

                  <span className="text-slate-300 font-semibold">
                    {formatProbability(
                      missionProbability
                    )}
                  </span>

                  <br />

                  Reliability:{' '}

                  <span className="text-slate-300 font-semibold">
                    {formatProbability(
                      missionReliability
                    )}
                  </span>

                  <br />

                  Risk:{' '}

                  <span className={`font-semibold ${reliabilityColor}`}>
                    {risk ?? 'N/A'}
                  </span>

                </p>

              </div>


              <div className="text-[9px] text-slate-400 border-t border-slate-800/80 pt-1 flex justify-between">

                <span>
                  {confidence !== null
                    ? `CONFIDENCE: ${(confidence * 100).toFixed(1)}%`
                    : 'CONFIDENCE: N/A'}
                </span>

                <span className="text-slate-400 font-sans">
                  ML ANALYSIS
                </span>

              </div>

            </div>

          </div>

        </div>

      </div>


      {/* ─────────────────────────────────────────
          MISSION TIMELINE
      ───────────────────────────────────────── */}

      <div className="bg-[#0a101d] p-3 rounded border border-slate-800/90 font-mono">

        <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-2.5 flex items-center justify-between">

          <span>
            MISSION FLIGHT PROFILE TIMELINE
          </span>

          <span
            className={
              snapshot
                ? 'text-emerald-400'
                : 'text-slate-500'
            }
          >
            {snapshot
              ? 'LIVE PHASE TRACKING'
              : 'WAITING FOR BACKEND'}
          </span>

        </div>


        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">

          {MISSION_PHASES.map((phase, idx) => {

            const status = getPhaseStatus(idx);

            const isCompleted =
              status === 'completed';

            const isCurrent =
              status === 'current';

            return (
              <div
                key={phase}
                className={`p-2 rounded border text-xs relative transition-all ${
                  isCompleted
                    ? 'bg-emerald-950/15 border-emerald-500/30 text-emerald-300'
                    : isCurrent
                      ? 'bg-blue-950/30 border-cyan-500/50 text-cyan-300 shadow-sm'
                      : 'bg-slate-900/40 border-slate-800 text-slate-400'
                }`}
              >

                <div className="flex items-center justify-between text-[10px] mb-1">

                  <span className="text-slate-400">
                    {String(idx + 1).padStart(2, '0')}
                  </span>

                  {isCompleted && (
                    <CheckCircle2
                      className="w-3 h-3 text-emerald-400"
                      aria-label="Completed"
                    />
                  )}

                  {isCurrent && (
                    <span
                      className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"
                      title="Active current phase"
                      aria-label="Active current phase"
                    />
                  )}

                  {!isCompleted && !isCurrent && (
                    <Flag
                      className="w-3 h-3 text-slate-600"
                      aria-label="Upcoming"
                    />
                  )}

                </div>


                <div
                  className={`font-bold font-mono text-[11px] uppercase tracking-wide truncate ${
                    isCurrent
                      ? 'text-white'
                      : ''
                  }`}
                >
                  {phase}
                </div>


                {isCurrent && (
                  <div className="flex items-center gap-1 text-[8px] text-cyan-400 mt-1">

                    ACTIVE

                    <ArrowRight className="w-2.5 h-2.5" />

                  </div>
                )}

              </div>
            );

          })}

        </div>

      </div>


      {/* ─────────────────────────────────────────
          LIVE STATUS FOOTER
      ───────────────────────────────────────── */}

      <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[9px] font-mono text-slate-400">

        <span className="flex items-center gap-1">

          <ShieldCheck className="w-3 h-3 text-cyan-400" />

          MISSION MONITOR

        </span>

        <span
          className={
            snapshot
              ? 'text-emerald-400'
              : 'text-amber-400'
          }
        >
          {snapshot
            ? 'LIVE'
            : 'WAITING FOR BACKEND'}
        </span>

      </div>

    </div>
  );
};