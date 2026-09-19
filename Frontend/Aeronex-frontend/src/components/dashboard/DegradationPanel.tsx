import React from 'react';
import {
  AlertTriangle,
  ShieldCheck,
  ThermometerSnowflake,
  Flame,
} from 'lucide-react';
import { AeronexSnapshot } from '../../services/websocket';

interface DegradationPanelProps {
  snapshot: AeronexSnapshot | null;
}

const formatNumber = (
  value: number | null | undefined,
  decimals = 1
): string => {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value)
  ) {
    return 'N/A';
  }

  return value.toFixed(decimals);
};

const formatPercentage = (
  value: number | null | undefined
): string => {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value)
  ) {
    return 'N/A';
  }

  return `${(value * 100).toFixed(1)}%`;
};

const formatScenario = (
  scenario: string | null
): string => {
  if (!scenario) {
    return 'NOT AVAILABLE';
  }

  if (scenario === 'NORMAL') {
    return 'NORMAL';
  }

  return scenario.replaceAll('_', ' ');
};

export const DegradationPanel: React.FC<
  DegradationPanelProps
> = ({ snapshot }) => {
  const degradation = snapshot?.degradation;
  const analysis = snapshot?.analysis;

  const enabled =
    degradation?.enabled === true;

  const scenario =
    typeof degradation?.scenario === 'string'
      ? degradation.scenario
      : null;

  const severity =
    typeof degradation?.severity === 'number' &&
    Number.isFinite(degradation.severity)
      ? degradation.severity
      : null;

  /*
   * Simulator degradation severity.
   *
   * The simulator may report severity either as:
   * 0–1 or 0–100.
   */
  const displaySeverity =
    severity !== null
      ? severity <= 1
        ? severity * 100
        : severity
      : null;

  /*
   * ML-derived degradation score.
   *
   * This is separate from the simulator scenario/severity.
   */
  const mlDegradation =
    typeof analysis?.degradation?.score === 'number' &&
    Number.isFinite(
      analysis.degradation.score
    )
      ? analysis.degradation.score
      : null;

  const scenarioLabel =
    formatScenario(scenario);

  const statusLabel = enabled
    ? 'ACTIVE'
    : scenario === 'NORMAL'
      ? 'NORMAL'
      : scenario
        ? 'INACTIVE'
        : 'NOT AVAILABLE';

  const statusColor = enabled
    ? 'text-amber-400'
    : scenario === 'NORMAL'
      ? 'text-emerald-400'
      : scenario
        ? 'text-slate-300'
        : 'text-slate-500';

  const statusBg = enabled
    ? 'bg-amber-950/25 border-amber-500/40'
    : scenario === 'NORMAL'
      ? 'bg-emerald-950/15 border-emerald-500/25'
      : 'bg-slate-900/60 border-slate-800';

  const healthStatus =
    typeof analysis?.engine_health?.status === 'string'
      ? analysis.engine_health.status
      : 'NOT AVAILABLE';

  const healthScore =
    typeof analysis?.engine_health?.score === 'number' &&
    Number.isFinite(
      analysis.engine_health.score
    )
      ? analysis.engine_health.score
      : null;

  const relatedTelemetry =
    snapshot?.telemetry;

  const hasLiveData =
    snapshot !== null;

  const hasLiveAnalysis =
    analysis !== undefined;

  return (
    <div className="bg-[#0d1527] border border-slate-800 rounded-lg p-3.5 shadow-sm font-mono flex flex-col justify-between">
      <div>

        {/* Header */}
        <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-800">
          <div className="flex items-center gap-2">
            {enabled ? (
              <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
            ) : (
              <ThermometerSnowflake className="w-4 h-4 text-cyan-400" />
            )}

            <h3 className="font-mono text-xs font-bold tracking-wider text-slate-200 uppercase">
              DEGRADATION STATUS
            </h3>
          </div>

          <span
            className={`text-[9px] px-1.5 py-0.5 rounded border ${
              hasLiveData
                ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            {hasLiveData
              ? 'LIVE BACKEND'
              : 'WAITING'}
          </span>
        </div>

        {/* Degradation Metrics */}
        <div className="space-y-1.5 text-xs mb-3">

          {/* Simulator Scenario */}
          <div className="flex items-center justify-between p-1.5 rounded bg-slate-900/60 border border-slate-800/80">
            <span className="text-slate-400 text-[11px]">
              Scenario:
            </span>

            <span
              className={`font-bold ${statusColor}`}
            >
              {scenarioLabel}
            </span>
          </div>

          {/* Simulator Status */}
          <div className="flex items-center justify-between p-1.5 rounded bg-slate-900/60 border border-slate-800/80">
            <span className="text-slate-400 text-[11px]">
              Status:
            </span>

            <span
              className={`font-bold ${statusColor}`}
            >
              {statusLabel}
            </span>
          </div>

          {/* Simulator Severity */}
          <div className="flex items-center justify-between p-1.5 rounded bg-slate-900/60 border border-slate-800/80">
            <span className="text-slate-400 text-[11px]">
              Severity:
            </span>

            <span
              className={`font-bold ${
                displaySeverity !== null &&
                displaySeverity >= 50
                  ? 'text-amber-400'
                  : displaySeverity !== null
                    ? 'text-slate-200'
                    : 'text-slate-500'
              }`}
            >
              {displaySeverity !== null
                ? `${displaySeverity.toFixed(1)}%`
                : 'N/A'}
            </span>
          </div>

          {/* ML Degradation */}
          <div className="flex items-center justify-between p-1.5 rounded bg-slate-900/60 border border-slate-800/80">
            <span className="text-slate-400 text-[11px]">
              ML degradation:
            </span>

            <span
              className={`font-bold ${
                mlDegradation !== null
                  ? 'text-cyan-300'
                  : 'text-slate-500'
              }`}
            >
              {formatPercentage(mlDegradation)}
            </span>
          </div>

        </div>

        {/* Live System State */}
        <div
          className={`p-2.5 rounded border transition-all ${statusBg}`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold tracking-wider uppercase text-slate-300">
              LIVE SYSTEM STATE
            </span>

            <div className="flex items-center gap-1.5">
              {enabled ? (
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              ) : (
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              )}

              <span
                className={`text-[11px] font-bold ${statusColor}`}
              >
                {enabled
                  ? 'DEGRADATION ACTIVE'
                  : scenario
                    ? 'NOMINAL'
                    : 'WAITING FOR DATA'}
              </span>
            </div>
          </div>

          <div className="text-[11px] font-sans text-slate-400 leading-snug">
            {enabled
              ? 'The simulator is reporting an active degradation scenario. Telemetry is being processed by the Aeronex backend and evaluated by the ML pipeline.'
              : scenario
                ? 'No active degradation scenario is currently reported by the simulator. The Aeronex backend continues monitoring incoming telemetry.'
                : 'Waiting for simulator telemetry and degradation state from the Aeronex backend.'}
          </div>
        </div>

        {/* Related Live Telemetry */}
        <div className="mt-3 grid grid-cols-2 gap-1.5 text-[10px]">

          {/* CHT */}
          <div className="p-1.5 rounded bg-slate-900/60 border border-slate-800/80">
            <span className="text-slate-500 block">
              CHT
            </span>

            <span className="text-slate-200 font-bold">
              {relatedTelemetry
                ? `${formatNumber(
                    relatedTelemetry.cht
                  )} °C`
                : 'N/A'}
            </span>
          </div>

          {/* Oil Temperature */}
          <div className="p-1.5 rounded bg-slate-900/60 border border-slate-800/80">
            <span className="text-slate-500 block">
              OIL TEMP
            </span>

            <span className="text-slate-200 font-bold">
              {relatedTelemetry
                ? `${formatNumber(
                    relatedTelemetry.oil_temperature
                  )} °C`
                : 'N/A'}
            </span>
          </div>

          {/* Vibration */}
          <div className="p-1.5 rounded bg-slate-900/60 border border-slate-800/80">
            <span className="text-slate-500 block">
              VIBRATION
            </span>

            <span className="text-slate-200 font-bold">
              {relatedTelemetry
                ? formatNumber(
                    relatedTelemetry.vibration,
                    2
                  )
                : 'N/A'}
            </span>
          </div>

          {/* ML Health */}
          <div className="p-1.5 rounded bg-slate-900/60 border border-slate-800/80">
            <span className="text-slate-500 block">
              HEALTH
            </span>

            <span className="text-slate-200 font-bold">
              {hasLiveAnalysis
                ? healthStatus
                : 'N/A'}

              {healthScore !== null && (
                <span className="text-cyan-300 ml-1">
                  ({healthScore.toFixed(1)})
                </span>
              )}
            </span>
          </div>

        </div>
      </div>

      {/* Footer */}
      <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-400">
        <span
          className={`font-semibold ${
            enabled
              ? 'text-amber-400/90'
              : hasLiveData
                ? 'text-emerald-400/90'
                : 'text-slate-500'
          }`}
        >
          SIMULATOR STATE
        </span>

        <span
          className={
            hasLiveData
              ? 'text-emerald-400 font-sans'
              : 'text-slate-500 font-sans'
          }
        >
          {hasLiveData
            ? 'LIVE'
            : 'WAITING'}
        </span>
      </div>
    </div>
  );
};