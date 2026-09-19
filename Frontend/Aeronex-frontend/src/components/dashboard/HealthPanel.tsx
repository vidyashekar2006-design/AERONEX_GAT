import React from 'react';
import {
  HeartPulse,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react';
import { AeronexSnapshot } from '../../services/websocket';

interface HealthPanelProps {
  snapshot: AeronexSnapshot | null;
}

type HealthLevel =
  | 'CRITICAL'
  | 'WARNING'
  | 'NORMAL'
  | 'HEALTHY'
  | 'UNAVAILABLE';

const normalizeHealthStatus = (
  status?: string
): HealthLevel => {
  if (!status) {
    return 'UNAVAILABLE';
  }

  const normalized = status.toUpperCase();

  if (normalized === 'CRITICAL') {
    return 'CRITICAL';
  }

  if (normalized === 'WARNING') {
    return 'WARNING';
  }

  if (
    normalized === 'NORMAL' ||
    normalized === 'HEALTHY'
  ) {
    return normalized as 'NORMAL' | 'HEALTHY';
  }

  return 'UNAVAILABLE';
};

const formatScore = (
  value?: number | null
): string => {
  return typeof value === 'number' &&
    Number.isFinite(value)
    ? `${value.toFixed(1)} / 100`
    : 'N/A';
};

const formatPercentage = (
  value?: number | null
): string => {
  return typeof value === 'number' &&
    Number.isFinite(value)
    ? `${(value * 100).toFixed(1)}%`
    : 'N/A';
};

export const HealthPanel: React.FC<HealthPanelProps> = ({
  snapshot,
}) => {
  const analysis = snapshot?.analysis;

  const healthStatus = normalizeHealthStatus(
    analysis?.engine_health?.status
  );

  const healthScore =
    analysis?.engine_health?.score ?? null;

  const degradation =
    analysis?.degradation?.score ?? null;

  const anomalyDetected =
    analysis?.anomaly?.detected === true;

  const fault =
    typeof analysis?.fault?.predicted === 'string' &&
    analysis.fault.predicted.trim().length > 0
      ? analysis.fault.predicted
      : null;

  const hasLiveAnalysis =
    snapshot !== null &&
    analysis !== undefined;

  const statusColor =
    healthStatus === 'CRITICAL'
      ? 'text-red-400'
      : healthStatus === 'WARNING'
        ? 'text-amber-400'
        : healthStatus === 'NORMAL' ||
            healthStatus === 'HEALTHY'
          ? 'text-emerald-400'
          : 'text-slate-400';

  const statusBg =
    healthStatus === 'CRITICAL'
      ? 'bg-red-950/20 border-red-500/40'
      : healthStatus === 'WARNING'
        ? 'bg-amber-950/20 border-amber-500/40'
        : healthStatus === 'NORMAL' ||
            healthStatus === 'HEALTHY'
          ? 'bg-emerald-950/20 border-emerald-500/30'
          : 'bg-slate-900/40 border-slate-700';

  const statusDot =
    healthStatus === 'CRITICAL'
      ? 'bg-red-400 animate-pulse'
      : healthStatus === 'WARNING'
        ? 'bg-amber-400 animate-pulse'
        : healthStatus === 'NORMAL' ||
            healthStatus === 'HEALTHY'
          ? 'bg-emerald-400'
          : 'bg-slate-500';

  const requiresAttention =
    healthStatus === 'CRITICAL' ||
    healthStatus === 'WARNING' ||
    anomalyDetected ||
    fault !== null;

  return (
    <div className="bg-[#0d1527] border border-slate-800 rounded-lg p-3.5 shadow-sm flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <HeartPulse className="w-4 h-4 text-cyan-400" />

            <h3 className="font-mono text-xs font-bold tracking-wider text-slate-200 uppercase">
              ENGINE HEALTH
            </h3>
          </div>

          <span
            className={`font-mono text-[9px] px-1.5 py-0.5 rounded border ${
              hasLiveAnalysis
                ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            {hasLiveAnalysis
              ? 'LIVE ML'
              : 'WAITING'}
          </span>
        </div>

        {/* Health State */}
        <div
          className={`p-3 rounded-md border flex items-center justify-between mb-3 ${statusBg}`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${statusDot}`}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />
            </div>

            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block leading-none">
                SYSTEM HEALTH STATE
              </span>

              <span
                className={`text-base font-mono font-black tracking-wide ${statusColor}`}
              >
                ● {healthStatus}
              </span>
            </div>
          </div>

          <div className="text-right font-mono text-[10px]">
            {requiresAttention ? (
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                ATTENTION REQ
              </span>
            ) : hasLiveAnalysis ? (
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                MONITORING
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 font-bold">
                NO DATA
              </span>
            )}
          </div>
        </div>

        {/* Diagnostic Grid */}
        <div className="space-y-1.5 font-mono text-xs">

          {/* Health Score */}
          <div className="flex items-center justify-between p-1.5 rounded bg-slate-900/60 border border-slate-800/80">
            <span className="text-slate-400 text-[11px]">
              Health score:
            </span>

            <span className={`font-bold ${statusColor}`}>
              {formatScore(healthScore)}
            </span>
          </div>

          {/* Degradation */}
          <div className="flex items-center justify-between p-1.5 rounded bg-slate-900/60 border border-slate-800/80">
            <span className="text-slate-400 text-[11px]">
              Degradation:
            </span>

            <span className="font-bold text-slate-200">
              {formatPercentage(degradation)}
            </span>
          </div>

          {/* Anomaly */}
          <div className="flex items-center justify-between p-1.5 rounded bg-slate-900/60 border border-slate-800/80">
            <span className="text-slate-400 text-[11px]">
              Anomaly:
            </span>

            <span
              className={`font-bold ${
                anomalyDetected
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {anomalyDetected
                ? 'DETECTED'
                : hasLiveAnalysis
                  ? 'NONE'
                  : 'N/A'}
            </span>
          </div>

          {/* Fault */}
          <div className="flex items-center justify-between p-1.5 rounded bg-slate-900/60 border border-slate-800/80">
            <span className="text-slate-400 text-[11px]">
              Fault:
            </span>

            <span
              className={`font-bold ${
                fault
                  ? 'text-red-400'
                  : 'text-emerald-400'
              }`}
            >
              {fault ??
                (hasLiveAnalysis
                  ? 'NONE'
                  : 'N/A')}
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-400">
        <span className="flex items-center gap-1">
          {anomalyDetected || fault ? (
            <AlertTriangle className="w-3 h-3 text-amber-400" />
          ) : (
            <ShieldCheck className="w-3 h-3 text-cyan-400" />
          )}

          ML HEALTH MONITOR
        </span>

        <span
          className={
            hasLiveAnalysis
              ? 'text-emerald-400 font-sans'
              : 'text-slate-500 font-sans'
          }
        >
          {hasLiveAnalysis
            ? 'LIVE'
            : 'WAITING'}
        </span>
      </div>
    </div>
  );
};