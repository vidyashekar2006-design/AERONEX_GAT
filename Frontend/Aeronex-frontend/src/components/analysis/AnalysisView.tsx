import React from 'react';
import {
  Cpu,
  AlertCircle,
  Database,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { AeronexSnapshot } from '../../services/websocket';

interface AnalysisViewProps {
  snapshot: AeronexSnapshot | null;
}

export const AnalysisView: React.FC<AnalysisViewProps> = ({
  snapshot,
}) => {
  const analysis = snapshot?.analysis;

  // ─────────────────────────────────────────────
  // LIVE ML ANALYSIS
  // ─────────────────────────────────────────────

  const anomalyDetected =
    analysis?.anomaly?.detected === true;

  const anomalyScore =
    typeof analysis?.anomaly?.score === 'number'
      ? analysis.anomaly.score
      : null;

  const anomalySeverity =
    typeof analysis?.anomaly?.severity === 'string'
      ? analysis.anomaly.severity
      : 'N/A';

  const fault =
    typeof analysis?.fault?.predicted === 'string'
      ? analysis.fault.predicted
      : null;

  const faultProbability =
    typeof analysis?.fault?.probability === 'number'
      ? analysis.fault.probability
      : null;

  const degradation =
    typeof analysis?.degradation?.score === 'number'
      ? analysis.degradation.score
      : null;

  const degradationTrend =
    typeof analysis?.degradation?.trend === 'string'
      ? analysis.degradation.trend
      : 'N/A';

  const rulValue =
    typeof analysis?.rul?.value === 'number'
      ? analysis.rul.value
      : null;

  const rulUnit =
    typeof analysis?.rul?.unit === 'string'
      ? analysis.rul.unit
      : 'hours';

  const maintenanceRecommendation =
    typeof analysis?.maintenance?.action === 'string'
      ? analysis.maintenance.action
      : 'N/A';

  const maintenancePriority =
    typeof analysis?.maintenance?.priority === 'string'
      ? analysis.maintenance.priority
      : 'N/A';

  const missionProbability =
    typeof analysis?.mission?.completion_probability === 'number'
      ? analysis.mission.completion_probability
      : null;

  const missionRisk =
    typeof analysis?.mission?.risk === 'string'
      ? analysis.mission.risk
      : 'N/A';

  const missionDecision =
    typeof analysis?.mission?.decision === 'string'
      ? analysis.mission.decision
      : 'N/A';

  const dataQuality =
    typeof analysis?.data_quality?.status === 'string'
      ? analysis.data_quality.status
      : 'N/A';

  // ─────────────────────────────────────────────
  // FORMATTERS
  // ─────────────────────────────────────────────

  const formatProbability = (value: number | null) =>
    value === null
      ? 'N/A'
      : `${(value * 100).toFixed(1)}%`;

  const formatScore = (value: number | null) =>
    value === null
      ? 'N/A'
      : value.toFixed(4);

  const formatDegradation = (value: number | null) =>
    value === null
      ? 'N/A'
      : `${(value * 100).toFixed(1)}%`;

  return (
    <div className="space-y-4 font-mono select-none">

      {/* HEADER */}
      <div className="bg-[#0d1527] border border-slate-800 rounded-lg p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">

          <div className="p-2 rounded bg-cyan-950/60 border border-cyan-500/40 text-cyan-400">
            <Cpu className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">

              <h2 className="text-base font-bold text-white tracking-wide">
                AI & ENGINEERING ANALYSIS WORKSTATION
              </h2>

              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                LIVE ML PIPELINE
              </span>

            </div>

            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Live anomaly detection, fault prediction, degradation tracking,
              prognostics, and mission reliability
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">
            PIPELINE STATUS:
          </span>

          <span
            className={`px-2 py-0.5 rounded font-bold border ${
              snapshot
                ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                : 'bg-amber-950 text-amber-300 border-amber-500/40'
            }`}
          >
            {snapshot ? '● LIVE' : '● WAITING'}
          </span>
        </div>
      </div>

      {/* MODEL CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

        {/* ANOMALY DETECTION */}
        <div className="bg-[#0d1527] border border-slate-800 rounded-lg p-3.5 flex flex-col justify-between">
          <div>

            <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-200 uppercase">
                ANOMALY DETECTION
              </span>

              <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                LIVE MODEL
              </span>
            </div>

            <div className="mb-2">
              <span className="text-[10px] text-slate-400 block">
                CURRENT STATE:
              </span>

              <span
                className={`text-base font-black ${
                  anomalyDetected
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              >
                {snapshot
                  ? anomalyDetected
                    ? 'ANOMALY DETECTED'
                    : 'NO ANOMALY'
                  : 'WAITING FOR DATA'}
              </span>
            </div>

            <p className="text-[11px] font-sans text-slate-400 leading-relaxed">
              Live ML anomaly analysis based on the telemetry window received
              from the Aeronex backend.
            </p>

          </div>

          <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
            <span>
              ANOMALY SCORE: {formatScore(anomalyScore)}
            </span>

            <span className="text-slate-300">
              {anomalySeverity}
            </span>
          </div>
        </div>

        {/* FAULT ANALYSIS */}
        <div className="bg-[#0d1527] border border-slate-800 rounded-lg p-3.5 flex flex-col justify-between">
          <div>

            <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-200 uppercase">
                FAULT ANALYSIS
              </span>

              <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                LIVE
              </span>
            </div>

            <div className="mb-2">
              <span className="text-[10px] text-slate-400 block">
                DIAGNOSTIC STATUS:
              </span>

              <span
                className={`text-base font-black ${
                  fault
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              >
                {fault || 'NO FAULT IDENTIFIED'}
              </span>
            </div>

            <p className="text-[11px] font-sans text-slate-400 leading-relaxed">
              Live fault prediction output from the connected ML analysis
              pipeline.
            </p>

          </div>

          <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
            <span>
              FAULT PROBABILITY
            </span>

            <span className="text-cyan-300">
              {formatProbability(faultProbability)}
            </span>
          </div>
        </div>

        {/* DEGRADATION */}
        <div className="bg-[#0d1527] border border-slate-800 rounded-lg p-3.5 flex flex-col justify-between">
          <div>

            <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-200 uppercase">
                DEGRADATION STATUS
              </span>

              <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                LIVE
              </span>
            </div>

            <div className="mb-2">
              <span className="text-[10px] text-slate-400 block">
                SEVERITY INDEX:
              </span>

              <span
                className={`text-base font-black ${
                  degradation !== null && degradation > 0.3
                    ? 'text-amber-400'
                    : 'text-slate-200'
                }`}
              >
                {formatDegradation(degradation)}
              </span>
            </div>

            <p className="text-[11px] font-sans text-slate-400 leading-relaxed">
              Live degradation estimate and trend produced from the connected
              telemetry analysis pipeline.
            </p>

          </div>

          <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
            <span>
              TREND
            </span>

            <span className="text-cyan-400">
              {degradationTrend}
            </span>
          </div>
        </div>

        {/* RUL */}
        <div className="bg-[#0d1527] border border-slate-800 rounded-lg p-3.5 flex flex-col justify-between">
          <div>

            <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-200 uppercase">
                REMAINING USEFUL LIFE
              </span>

              <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                LIVE PROGNOSTICS
              </span>
            </div>

            <div className="mb-2">
              <span className="text-[10px] text-slate-400 block">
                CALCULATED RUL:
              </span>

              <span className="text-base font-black text-cyan-300">
                {rulValue !== null
                  ? `${rulValue.toFixed(1)} ${rulUnit.toUpperCase()}`
                  : 'NOT AVAILABLE'}
              </span>
            </div>

            <div className="bg-[#0a101d] p-2 rounded border border-slate-800 text-[11px] font-sans text-slate-400 leading-relaxed">
              {rulValue !== null
                ? 'RUL estimate supplied by the connected predictive model.'
                : 'No RUL estimate is currently available from the backend.'}
            </div>

          </div>

          <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
            <span>
              PROGNOSTICS MODULE
            </span>

            <span className="text-cyan-400">
              {rulValue !== null
                ? 'ACTIVE'
                : 'PENDING'}
            </span>
          </div>
        </div>

        {/* PREDICTIVE MAINTENANCE */}
        <div className="bg-[#0d1527] border border-slate-800 rounded-lg p-3.5 flex flex-col justify-between">
          <div>

            <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-200 uppercase">
                PREDICTIVE MAINTENANCE
              </span>

              <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                LIVE ADVISORY
              </span>
            </div>

            <div className="mb-2">
              <span className="text-[10px] text-slate-400 block">
                CURRENT ADVISORY:
              </span>

              <span className="text-base font-black text-cyan-300">
                {maintenanceRecommendation}
              </span>
            </div>

            <div className="bg-[#0a101d] p-2 rounded border border-slate-800 text-[11px] font-sans text-slate-400 leading-relaxed">
              Maintenance priority:{' '}
              <strong className="text-slate-300">
                {maintenancePriority}
              </strong>
            </div>

          </div>

          <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
            <span>
              RECOMMENDATION
            </span>

            <span className="text-cyan-400">
              {maintenancePriority}
            </span>
          </div>
        </div>

        {/* MISSION RELIABILITY */}
        <div className="bg-[#0d1527] border border-slate-800 rounded-lg p-3.5 flex flex-col justify-between">
          <div>

            <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-200 uppercase">
                MISSION RELIABILITY
              </span>

              <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                LIVE
              </span>
            </div>

            <div className="mb-2">
              <span className="text-[10px] text-slate-400 block">
                OUTCOME PROJECTION:
              </span>

              <span
                className={`text-base font-black ${
                  missionRisk === 'HIGH'
                    ? 'text-red-400'
                    : missionRisk === 'MEDIUM'
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                }`}
              >
                {missionDecision}
              </span>
            </div>

            <p className="text-[11px] font-sans text-slate-400 leading-relaxed">
              Mission completion probability:{' '}
              <strong className="text-slate-300">
                {formatProbability(missionProbability)}
              </strong>
              .
              <br />
              Mission risk:{' '}
              <strong className="text-slate-300">
                {missionRisk}
              </strong>
            </p>

          </div>

          <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
            <span>
              DATA QUALITY
            </span>

            <span className="text-cyan-400">
              {dataQuality}
            </span>
          </div>
        </div>
      </div>

      {/* LIVE ANALYSIS FOOTER */}
      <div className="bg-[#0d1527] border border-slate-800 rounded-lg p-3.5">

        <div className="flex flex-wrap items-center justify-between gap-3 text-[10px]">

          <div className="flex items-center gap-2 text-slate-400">
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span>
              TELEMETRY → ML PIPELINE → ANALYSIS
            </span>
          </div>

          <div className="flex items-center gap-3 text-slate-400">

            <Layers className="w-3.5 h-3.5 text-cyan-400" />

            <span>
              LIVE BACKEND
            </span>

            {snapshot ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
            )}

            <span>
              {snapshot
                ? 'CONNECTED'
                : 'WAITING'}
            </span>

          </div>
        </div>
      </div>

    </div>
  );
};