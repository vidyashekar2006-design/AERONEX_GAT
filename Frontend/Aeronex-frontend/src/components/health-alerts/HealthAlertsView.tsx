import React, { useMemo, useState } from 'react';
import {
  HeartPulse,
  Bell,
  ShieldCheck,
  AlertTriangle,
  Info,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { AeronexSnapshot } from '../../services/websocket';
import { EventAlert } from '../../types';

interface HealthAlertsViewProps {
  snapshot: AeronexSnapshot | null;
}

export const HealthAlertsView: React.FC<HealthAlertsViewProps> = ({
  snapshot,
}) => {
  const [filterLevel, setFilterLevel] = useState<string>('ALL');

  // ─────────────────────────────────────────────
  // LIVE ENGINE HEALTH
  // ─────────────────────────────────────────────

  const healthStatus =
    typeof snapshot?.analysis?.engine_health?.status === 'string'
      ? snapshot.analysis.engine_health.status
      : 'NOT AVAILABLE';

  const healthScore =
    typeof snapshot?.analysis?.engine_health?.score === 'number'
      ? snapshot.analysis.engine_health.score
      : null;

  // ─────────────────────────────────────────────
  // LIVE TELEMETRY
  // ─────────────────────────────────────────────

  const cht = snapshot?.telemetry?.cht ?? null;
  const egt = snapshot?.telemetry?.egt ?? null;
  const oilTemperature =
    snapshot?.telemetry?.oil_temperature ?? null;
  const oilPressure =
    snapshot?.telemetry?.oil_pressure ?? null;
  const vibration =
    snapshot?.telemetry?.vibration ?? null;

  // ─────────────────────────────────────────────
  // LIVE ML ANALYSIS
  // ─────────────────────────────────────────────

  const anomalyDetected =
    snapshot?.analysis?.anomaly?.detected === true;

  const anomalySeverity =
    typeof snapshot?.analysis?.anomaly?.severity === 'string'
      ? snapshot.analysis.anomaly.severity
      : null;

  const fault =
    typeof snapshot?.analysis?.fault?.predicted === 'string'
      ? snapshot.analysis.fault.predicted
      : null;

  const maintenanceRecommendation =
    typeof snapshot?.analysis?.maintenance?.action === 'string'
      ? snapshot.analysis.maintenance.action
      : null;

  // ─────────────────────────────────────────────
  // TIMESTAMP
  // ─────────────────────────────────────────────

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) {
      return 'N/A';
    }

    const date = new Date(timestamp);

    if (Number.isNaN(date.getTime())) {
      return timestamp;
    }

    return date.toLocaleTimeString();
  };

  // ─────────────────────────────────────────────
  // LIVE EVENT GENERATION
  // ─────────────────────────────────────────────

  const alerts = useMemo<EventAlert[]>(() => {
    const generated: EventAlert[] = [];

    if (anomalyDetected) {
      generated.push({
        id: 'ml-anomaly',
        timestamp: formatTimestamp(snapshot?.timestamp),
        level:
          anomalySeverity === 'CRITICAL'
            ? 'WARNING'
            : 'INFO',
        code: 'ML-ANOMALY',
        message: `Anomaly detected by live ML pipeline${
          anomalySeverity
            ? ` — severity ${anomalySeverity}`
            : ''
        }.`,
        source: 'ML Predictive Analytics',
      });
    }

    if (fault) {
      generated.push({
        id: 'ml-fault',
        timestamp: formatTimestamp(snapshot?.timestamp),
        level: 'WARNING',
        code: 'ML-FAULT',
        message: `Predicted fault: ${fault}.`,
        source: 'ML Fault Prediction',
      });
    }

    if (maintenanceRecommendation) {
      generated.push({
        id: 'maintenance',
        timestamp: formatTimestamp(snapshot?.timestamp),
        level: 'INFO',
        code: 'ML-MAINT',
        message: `Maintenance recommendation: ${maintenanceRecommendation}.`,
        source: 'ML Maintenance Advisory',
      });
    }

    return generated;
  }, [
    anomalyDetected,
    anomalySeverity,
    fault,
    maintenanceRecommendation,
    snapshot?.timestamp,
  ]);

  const filteredAlerts =
    filterLevel === 'ALL'
      ? alerts
      : alerts.filter(
          alert => alert.level === filterLevel
        );

  // ─────────────────────────────────────────────
  // SUBSYSTEM STATUS
  // ─────────────────────────────────────────────

  const subsystemStatus =
    healthStatus === 'CRITICAL'
      ? 'CRITICAL'
      : healthStatus === 'WARNING'
        ? 'WARNING'
        : healthStatus === 'HEALTHY' ||
            healthStatus === 'NORMAL'
          ? 'NORMAL'
          : 'NOT AVAILABLE';

  const subsystems = [
    {
      name: 'CYLINDER ASSEMBLY 1 & 3 (STARBOARD)',
      status:
        healthStatus === 'NOT AVAILABLE'
          ? 'NOT AVAILABLE'
          : cht !== null && cht >= 120
            ? 'WARNING'
            : subsystemStatus,
      desc:
        cht !== null
          ? `Cylinder head temperature currently ${cht.toFixed(1)} °C.`
          : 'Live cylinder temperature data unavailable.',
      temp:
        cht !== null
          ? `${cht.toFixed(1)} °C`
          : 'N/A',
      vib:
        vibration !== null
          ? `${vibration.toFixed(2)}`
          : 'N/A',
    },
    {
      name: 'CYLINDER ASSEMBLY 2 & 4 (PORT)',
      status:
        healthStatus === 'NOT AVAILABLE'
          ? 'NOT AVAILABLE'
          : cht !== null && cht >= 120
            ? 'WARNING'
            : subsystemStatus,
      desc:
        cht !== null
          ? `Live thermal monitoring active at ${cht.toFixed(1)} °C CHT.`
          : 'Live thermal telemetry unavailable.',
      temp:
        cht !== null
          ? `${cht.toFixed(1)} °C`
          : 'N/A',
      vib:
        vibration !== null
          ? `${vibration.toFixed(2)}`
          : 'N/A',
    },
    {
      name: 'CRANKCASE & MAIN SHAFT BEARINGS',
      status:
        healthStatus === 'NOT AVAILABLE'
          ? 'NOT AVAILABLE'
          : vibration !== null && vibration >= 0.35
            ? 'WARNING'
            : subsystemStatus,
      desc:
        vibration !== null
          ? `Live vibration level: ${vibration.toFixed(2)}.`
          : 'Live vibration telemetry unavailable.',
      temp:
        oilTemperature !== null
          ? `${oilTemperature.toFixed(1)} °C`
          : 'N/A',
      vib:
        vibration !== null
          ? `${vibration.toFixed(2)}`
          : 'N/A',
    },
    {
      name: 'LUBRICATION & DRY SUMP CIRCUIT',
      status:
        healthStatus === 'NOT AVAILABLE'
          ? 'NOT AVAILABLE'
          : oilPressure !== null && oilPressure < 2.5
            ? 'WARNING'
            : subsystemStatus,
      desc:
        oilPressure !== null
          ? `Live oil pressure: ${oilPressure.toFixed(2)} bar.`
          : 'Live lubrication telemetry unavailable.',
      temp:
        oilTemperature !== null
          ? `${oilTemperature.toFixed(1)} °C`
          : 'N/A',
      vib: 'N/A',
    },
    {
      name: 'EXHAUST GAS SCAVENGING',
      status:
        healthStatus === 'NOT AVAILABLE'
          ? 'NOT AVAILABLE'
          : egt !== null && egt >= 600
            ? 'WARNING'
            : subsystemStatus,
      desc:
        egt !== null
          ? `Live exhaust gas temperature: ${egt.toFixed(1)} °C.`
          : 'Live EGT telemetry unavailable.',
      temp:
        egt !== null
          ? `${egt.toFixed(1)} °C`
          : 'N/A',
      vib: 'N/A',
    },
  ];

  return (
    <div className="space-y-4 font-mono select-none">

      {/* HEADER */}
      <div className="bg-[#0d1527] border border-slate-800 rounded-lg p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-sm">

        <div className="flex items-center gap-3">

          <div className="p-2 rounded bg-cyan-950/60 border border-cyan-500/40 text-cyan-400">
            <HeartPulse className="w-5 h-5" />
          </div>

          <div>

            <div className="flex items-center gap-2 flex-wrap">

              <h2 className="text-base font-bold text-white tracking-wide">
                ENGINE HEALTH & ALERT AUDIT
              </h2>

              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                LIVE ML
              </span>

            </div>

            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Live subsystem monitoring, telemetry boundaries, and predictive
              health events
            </p>

          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">

          <span className="text-slate-400">
            STATE:
          </span>

          <span
            className={`px-2 py-0.5 rounded font-bold ${
              healthStatus === 'CRITICAL'
                ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                : healthStatus === 'WARNING'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : healthStatus === 'HEALTHY' ||
                      healthStatus === 'NORMAL'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
          >
            ● {healthStatus}
          </span>

        </div>
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* SUBSYSTEMS */}
        <div className="lg:col-span-2 bg-[#0d1527] border border-slate-800 rounded-lg p-3.5 shadow-sm">

          <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">

            <div className="flex items-center gap-2">

              <ShieldCheck className="w-4 h-4 text-cyan-400" />

              <h3 className="text-xs font-bold text-slate-200 uppercase">
                SUBSYSTEM INTEGRITY MATRIX
              </h3>

            </div>

            <span className="text-[9px] text-slate-400">
              LIVE TELEMETRY
            </span>

          </div>

          <div className="space-y-2.5">

            {subsystems.map((sub, idx) => {

              const isWarning =
                sub.status === 'WARNING' ||
                sub.status === 'CRITICAL';

              return (
                <div
                  key={idx}
                  className={`p-3 rounded border transition-colors ${
                    isWarning
                      ? 'bg-amber-950/20 border-amber-500/40 text-amber-200'
                      : 'bg-[#0a101d] border-slate-800 text-slate-300'
                  }`}
                >

                  <div className="flex items-center justify-between text-xs mb-1 gap-2">

                    <span className="font-bold text-slate-200">
                      {sub.name}
                    </span>

                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                        sub.status === 'CRITICAL'
                          ? 'bg-red-500/20 text-red-300'
                          : isWarning
                            ? 'bg-amber-500/20 text-amber-300'
                            : sub.status === 'NORMAL'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {sub.status}
                    </span>

                  </div>

                  <p className="text-[11px] font-sans text-slate-400 leading-relaxed mb-2">
                    {sub.desc}
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400 pt-1.5 border-t border-slate-800/60">

                    <span>
                      TEMP:{' '}
                      <strong className="text-slate-300">
                        {sub.temp}
                      </strong>
                    </span>

                    <span>
                      HARMONIC:{' '}
                      <strong className="text-slate-300">
                        {sub.vib}
                      </strong>
                    </span>

                    <span className="text-cyan-400/80">
                      DIAGNOSTIC: LIVE
                    </span>

                  </div>
                </div>
              );
            })}

          </div>
        </div>

        {/* EVENT LOG */}
        <div className="bg-[#0d1527] border border-slate-800 rounded-lg p-3.5 shadow-sm flex flex-col justify-between">

          <div>

            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">

              <div className="flex items-center gap-2">

                <Bell className="w-4 h-4 text-cyan-400" />

                <h3 className="text-xs font-bold text-slate-200 uppercase">
                  EVENT LOG
                </h3>

              </div>

              <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                LIVE ML
              </span>

            </div>

            {/* FILTER BUTTONS */}
            <div className="flex items-center gap-1 mb-3 text-[10px]">

              {(['ALL', 'INFO', 'WARNING'] as const).map(level => (

                <button
                  key={level}
                  type="button"
                  onClick={() => setFilterLevel(level)}
                  className={`px-2 py-1 rounded transition-colors ${
                    filterLevel === level
                      ? 'bg-blue-600/30 text-cyan-300 border border-cyan-500/40 font-bold'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {level}
                </button>

              ))}

            </div>

            <div className="space-y-2">

              {filteredAlerts.length > 0 ? (

                filteredAlerts.map(alert => {

                  const isWarn =
                    alert.level === 'WARNING';

                  return (
                    <div
                      key={alert.id}
                      className={`p-2.5 rounded border text-xs ${
                        isWarn
                          ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                          : 'bg-[#0a101d] border-slate-800 text-slate-300'
                      }`}
                    >

                      <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1 gap-2">

                        <div className="flex items-center gap-1.5">

                          {isWarn ? (
                            <AlertTriangle className="w-3 h-3 text-amber-400" />
                          ) : (
                            <Info className="w-3 h-3 text-cyan-400" />
                          )}

                          <Clock className="w-3 h-3 text-slate-400" />

                          <span className="text-slate-300 font-bold">
                            {alert.timestamp}
                          </span>

                          <span
                            className={`px-1 py-0.5 rounded text-[9px] font-bold ${
                              isWarn
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-blue-500/15 text-cyan-300'
                            }`}
                          >
                            {alert.level}
                          </span>

                        </div>

                        <span>
                          {alert.code}
                        </span>

                      </div>

                      <div className="text-[11px] font-sans text-slate-200 leading-snug">
                        {alert.message}
                      </div>

                      <div className="text-[9px] text-slate-400 mt-1">
                        SRC: {alert.source}
                      </div>

                    </div>
                  );
                })

              ) : (

                <div className="p-4 rounded border border-emerald-500/20 bg-emerald-500/5 text-center">

                  <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto mb-2" />

                  <div className="text-xs text-emerald-300 font-bold">
                    NO ACTIVE ALERTS
                  </div>

                  <div className="text-[10px] text-slate-500 mt-1">
                    Live ML event monitor is clear.
                  </div>

                </div>

              )}

            </div>
          </div>

          <div className="mt-4 pt-2 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">

            <span>
              FILTER: {filterLevel}
            </span>

            <span className="text-slate-400 font-sans">
              LIVE EVENT MONITOR
            </span>

          </div>
        </div>
      </div>

      {/* HEALTH SUMMARY */}
      <div className="bg-[#0d1527] border border-slate-800 rounded-lg p-3.5">

        <div className="flex flex-wrap items-center justify-between gap-3">

          <div>

            <div className="text-[10px] text-slate-500 uppercase">
              LIVE HEALTH SCORE
            </div>

            <div className="text-2xl font-bold text-cyan-300">
              {healthScore !== null
                ? `${healthScore.toFixed(1)}%`
                : 'N/A'}
            </div>

          </div>

          <div className="text-right">

            <div className="text-[10px] text-slate-500 uppercase">
              LAST TELEMETRY
            </div>

            <div className="text-xs text-slate-300">
              {formatTimestamp(snapshot?.timestamp)}
            </div>

          </div>

        </div>
      </div>

    </div>
  );
};