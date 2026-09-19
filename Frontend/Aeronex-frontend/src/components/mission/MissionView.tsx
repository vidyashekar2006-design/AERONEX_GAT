import React from 'react';
import {
  Compass,
  Clock,
  MapPin,
  Gauge,
  ShieldCheck,
} from 'lucide-react';
import { AeronexSnapshot } from '../../services/websocket';

interface MissionViewProps {
  snapshot: AeronexSnapshot | null;
}

export const MissionView: React.FC<MissionViewProps> = ({
  snapshot,
}) => {
  const mission = snapshot?.mission;
  const analysis = snapshot?.analysis;

  // ─────────────────────────────────────────────
  // MISSION STATE
  // ─────────────────────────────────────────────

  const phase =
    typeof mission?.phase === 'string'
      ? mission.phase
      : 'N/A';

  const progress =
    typeof mission?.progress === 'number'
      ? Math.max(0, Math.min(100, mission.progress))
      : null;

  // ─────────────────────────────────────────────
  // LIVE ENGINE / ENVIRONMENT DATA
  // ─────────────────────────────────────────────

  const operatingMode =
    typeof snapshot?.engine?.operating_mode === 'string'
      ? snapshot.engine.operating_mode
      : 'N/A';

  const altitude =
    typeof snapshot?.environment?.altitude === 'number'
      ? snapshot.environment.altitude
      : null;

  const fuelFlow =
    typeof snapshot?.telemetry?.fuel_flow === 'number'
      ? snapshot.telemetry.fuel_flow
      : null;

  // ─────────────────────────────────────────────
  // LIVE ML MISSION ANALYSIS
  // ─────────────────────────────────────────────

  const missionProbability =
    typeof analysis?.mission?.completion_probability === 'number'
      ? analysis.mission.completion_probability
      : null;

  const missionReliability =
    typeof analysis?.mission?.reliability === 'number'
      ? analysis.mission.reliability
      : null;

  const missionRisk =
    typeof analysis?.mission?.risk === 'string'
      ? analysis.mission.risk
      : 'N/A';

  const missionDecision =
    typeof analysis?.mission?.decision === 'string'
      ? analysis.mission.decision
      : 'N/A';

  // ─────────────────────────────────────────────
  // FORMATTERS
  // ─────────────────────────────────────────────

  const formatProbability = (value: number | null) =>
    value === null
      ? 'N/A'
      : `${(value * 100).toFixed(1)}%`;

  // ─────────────────────────────────────────────
  // RISK COLOR
  // ─────────────────────────────────────────────

  const riskColor =
    missionRisk === 'HIGH' ||
    missionRisk === 'CRITICAL'
      ? 'text-red-400'
      : missionRisk === 'MEDIUM'
        ? 'text-amber-400'
        : missionRisk === 'LOW'
          ? 'text-emerald-400'
          : 'text-slate-400';

  return (
    <div className="space-y-4 font-mono select-none">

      {/* ─────────────────────────────────────────
          HEADER
      ───────────────────────────────────────── */}

      <div className="bg-[#0d1527] border border-slate-800 rounded-lg p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-sm">

        <div className="flex items-center gap-3">

          <div className="p-2 rounded bg-cyan-950/60 border border-cyan-500/40 text-cyan-400">
            <Compass className="w-5 h-5" />
          </div>

          <div>

            <div className="flex items-center gap-2 flex-wrap">

              <h2 className="text-base font-bold text-white tracking-wide">
                MISSION PROFILE & FLIGHT MONITOR
              </h2>

              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                LIVE MISSION
              </span>

            </div>

            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Live flight state, engine operating conditions, and mission
              reliability assessment
            </p>

          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">

          <span className="text-slate-400">
            MISSION STATE:
          </span>

          <span className="font-bold text-cyan-300">
            {phase}
          </span>

        </div>

      </div>

      {/* ─────────────────────────────────────────
          MISSION METER
      ───────────────────────────────────────── */}

      <div className="bg-[#0d1527] border border-slate-800 rounded-lg p-4 shadow-sm">

        <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">

          <div className="flex items-center gap-2">

            <span className="w-2 h-2 rounded-full bg-cyan-400" />

            <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
              AERONEX // LIVE MISSION METER
            </h3>

          </div>

          <span className="text-[10px] text-slate-400">
            BACKEND ANALYSIS
          </span>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* MISSION PROGRESS */}

          <div className="bg-[#0a101d] p-3.5 rounded border border-slate-800">

            <div className="flex items-center justify-between mb-2 text-xs">

              <span className="text-slate-400 font-medium">
                MISSION PROGRESS
              </span>

              <span className="text-xl font-bold text-white">
                {progress !== null
                  ? `${progress.toFixed(0)}%`
                  : 'N/A'}
              </span>

            </div>

            <div className="w-full h-3.5 bg-slate-950 rounded-sm overflow-hidden p-0.5 border border-slate-800 my-2">

              {progress !== null && (
                <div
                  className="h-full bg-gradient-to-r from-blue-600 via-cyan-500 to-cyan-400 rounded-xs transition-all duration-500"
                  style={{
                    width: `${progress}%`,
                  }}
                />
              )}

            </div>

            <div className="flex justify-between text-[10px] text-slate-400 mt-1">

              <span>
                MISSION START
              </span>

              <span className="text-cyan-400 font-bold">
                CURRENT: {phase}
              </span>

              <span>
                MISSION END
              </span>

            </div>

            {progress === null && (
              <p className="text-[9px] text-slate-500 mt-2">
                Progress unavailable from backend mission state.
              </p>
            )}

          </div>

          {/* MISSION RELIABILITY */}

          <div className="bg-[#0a101d] p-3.5 rounded border border-slate-800">

            <div className="flex items-center justify-between mb-2 text-xs">

              <span className="text-slate-400 font-medium">
                MISSION RELIABILITY
              </span>

              <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                LIVE ML
              </span>

            </div>

            <div className="my-auto py-1">

              <div
                className={`text-lg font-black tracking-tight ${riskColor}`}
              >
                {missionDecision}
              </div>

              <p className="text-[11px] font-sans text-slate-400 mt-1 leading-snug">

                Completion probability:{' '}

                <strong className="text-slate-300">
                  {formatProbability(missionProbability)}
                </strong>

                <br />

                Reliability:{' '}

                <strong className="text-slate-300">
                  {formatProbability(missionReliability)}
                </strong>

                <br />

                Risk level:{' '}

                <strong className={riskColor}>
                  {missionRisk}
                </strong>

              </p>

            </div>

          </div>

        </div>

      </div>

      {/* ─────────────────────────────────────────
          LIVE FLIGHT CONDITIONS
      ───────────────────────────────────────── */}

      <div className="bg-[#0d1527] border border-slate-800 rounded-lg p-4 shadow-sm">

        <div className="flex items-center gap-2 pb-2 mb-3 border-b border-slate-800">

          <Gauge className="w-4 h-4 text-cyan-400" />

          <h3 className="text-xs font-bold text-slate-200 uppercase">
            LIVE FLIGHT CONDITIONS
          </h3>

        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

          {/* OPERATING MODE */}

          <div className="bg-[#0a101d] p-3 rounded border border-slate-800">

            <div className="text-[10px] text-slate-500">
              OPERATING MODE
            </div>

            <div className="text-lg font-bold text-cyan-300 mt-1">
              {operatingMode}
            </div>

          </div>

          {/* ALTITUDE */}

          <div className="bg-[#0a101d] p-3 rounded border border-slate-800">

            <div className="text-[10px] text-slate-500">
              ALTITUDE
            </div>

            <div className="text-lg font-bold text-white mt-1">

              {altitude !== null
                ? `${altitude.toFixed(0)} m`
                : 'N/A'}

            </div>

          </div>

          {/* FUEL FLOW */}

          <div className="bg-[#0a101d] p-3 rounded border border-slate-800">

            <div className="text-[10px] text-slate-500">
              FUEL FLOW
            </div>

            <div className="text-lg font-bold text-white mt-1">

              {fuelFlow !== null
                ? `${fuelFlow.toFixed(1)} L/h`
                : 'N/A'}

            </div>

          </div>

        </div>

      </div>

      {/* ─────────────────────────────────────────
          CURRENT MISSION STATUS
      ───────────────────────────────────────── */}

      <div className="bg-[#0d1527] border border-slate-800 rounded-lg p-4 shadow-sm">

        <div className="flex items-center gap-2 pb-2 mb-3 border-b border-slate-800">

          <MapPin className="w-4 h-4 text-cyan-400" />

          <h3 className="text-xs font-bold text-slate-200 uppercase">
            CURRENT MISSION STATUS
          </h3>

        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">

          {/* CURRENT PHASE */}

          <div>

            <div className="text-[10px] text-slate-500">
              CURRENT PHASE
            </div>

            <div className="text-xl font-bold text-white mt-1">
              {phase}
            </div>

          </div>

          {/* MISSION RISK */}

          <div className="flex items-center gap-2 text-xs">

            <ShieldCheck className="w-4 h-4 text-cyan-400" />

            <span className="text-slate-400">
              MISSION RISK:
            </span>

            <span className={`font-bold ${riskColor}`}>
              {missionRisk}
            </span>

          </div>

          {/* LAST UPDATE */}

          <div className="flex items-center gap-2 text-xs text-slate-400">

            <Clock className="w-4 h-4 text-cyan-400" />

            <span>
              LAST UPDATE:{' '}

              {snapshot?.timestamp
                ? new Date(
                    snapshot.timestamp
                  ).toLocaleTimeString()
                : 'N/A'}
            </span>

          </div>

        </div>

      </div>

    </div>
  );
};