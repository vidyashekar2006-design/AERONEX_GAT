import React from 'react';
import {
  Bell,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { AeronexSnapshot } from '../../services/websocket';

interface AlertPanelProps {
  snapshot: AeronexSnapshot | null;
}

interface LiveAlert {
  id: string;
  level: 'CRITICAL' | 'WARNING' | 'INFO';
  code: string;
  message: string;
}

export const AlertPanel: React.FC<AlertPanelProps> = ({
  snapshot,
}) => {
  const analysis = snapshot?.analysis;

  // ─────────────────────────────────────────────
  // LIVE ML VALUES
  // ─────────────────────────────────────────────

  const anomalyDetected =
    analysis?.anomaly?.detected === true;

  const anomalySeverity =
    typeof analysis?.anomaly?.severity === 'string'
      ? analysis.anomaly.severity.toUpperCase()
      : null;

  const fault =
    typeof analysis?.fault?.predicted === 'string'
      ? analysis.fault.predicted
      : null;

  const maintenance =
    typeof analysis?.maintenance?.action === 'string'
      ? analysis.maintenance.action
      : null;

  const maintenancePriority =
    typeof analysis?.maintenance?.priority === 'string'
      ? analysis.maintenance.priority.toUpperCase()
      : null;

  const timestamp = snapshot?.timestamp
    ? new Date(snapshot.timestamp).toLocaleTimeString()
    : '--:--:--';

  // ─────────────────────────────────────────────
  // BUILD LIVE ALERTS
  // ─────────────────────────────────────────────

  const alerts: LiveAlert[] = [];

  if (anomalyDetected) {
    alerts.push({
      id: 'ml-anomaly',
      level:
        anomalySeverity === 'CRITICAL'
          ? 'CRITICAL'
          : 'WARNING',
      code: 'ML-ANOM',
      message: `Anomaly detected by the health-monitoring model${
        anomalySeverity
          ? ` — severity ${anomalySeverity}`
          : ''
      }.`,
    });
  }

  if (fault) {
    alerts.push({
      id: 'ml-fault',
      level: 'CRITICAL',
      code: 'ML-FAULT',
      message: `Predicted fault: ${fault}.`,
    });
  }

  if (maintenance) {
    alerts.push({
      id: 'ml-maintenance',
      level:
        maintenancePriority === 'HIGH' ||
        maintenancePriority === 'CRITICAL'
          ? 'WARNING'
          : 'INFO',
      code: 'ML-MAINT',
      message: `Maintenance action: ${maintenance}${
        maintenancePriority
          ? ` — priority ${maintenancePriority}`
          : ''
      }.`,
    });
  }

  return (
    <div className="bg-[#0d1527] border border-slate-800 rounded-lg p-3.5 shadow-sm flex flex-col justify-between">

      <div>

        {/* ─────────────────────────────────────────
            HEADER
        ───────────────────────────────────────── */}

        <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-800">

          <div className="flex items-center gap-2">

            <Bell className="w-4 h-4 text-cyan-400" />

            <h3 className="font-mono text-xs font-bold tracking-wider text-slate-200 uppercase">
              RECENT EVENTS
            </h3>

          </div>

          <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
            LIVE ML
          </span>

        </div>


        {/* ─────────────────────────────────────────
            LIVE ALERTS
        ───────────────────────────────────────── */}

        <div className="space-y-2 max-h-[190px] overflow-y-auto pr-1 font-mono">

          {alerts.length === 0 ? (

            <div className="p-3 rounded border border-emerald-500/20 bg-emerald-950/10 flex items-center gap-2">

              <CheckCircle2 className="w-4 h-4 text-emerald-400" />

              <div>

                <div className="text-[11px] font-bold text-emerald-400">
                  NO ACTIVE ALERTS
                </div>

                <div className="text-[10px] text-slate-400 font-sans">
                  No active anomaly, fault, or maintenance alert.
                </div>

              </div>

            </div>

          ) : (

            alerts.map(alert => {

              const isCritical =
                alert.level === 'CRITICAL';

              const isWarning =
                alert.level === 'WARNING';

              return (
                <div
                  key={alert.id}
                  className={`p-2 rounded border text-xs ${
                    isCritical
                      ? 'bg-red-950/20 border-red-500/40 text-red-200'
                      : isWarning
                        ? 'bg-amber-950/25 border-amber-500/40 text-amber-200'
                        : 'bg-[#0a101d] border-slate-800/80 text-slate-300'
                  }`}
                >

                  {/* ALERT META */}

                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">

                    <div className="flex items-center gap-1.5">

                      <Clock className="w-3 h-3 text-slate-400" />

                      <span className="font-bold text-slate-300">
                        {timestamp}
                      </span>

                      <span
                        className={`px-1 py-0.5 rounded text-[9px] font-bold ${
                          isCritical
                            ? 'bg-red-500/20 text-red-300'
                            : isWarning
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-blue-500/15 text-cyan-300'
                        }`}
                      >
                        {alert.level}
                      </span>

                    </div>

                    <span className="text-[9px] text-slate-400">
                      {alert.code}
                    </span>

                  </div>


                  {/* MESSAGE */}

                  <div className="text-[11px] font-sans font-medium text-slate-200 mt-0.5 leading-snug">
                    {alert.message}
                  </div>

                </div>
              );
            })

          )}

        </div>

      </div>


      {/* ─────────────────────────────────────────
          FOOTER
      ───────────────────────────────────────── */}

      <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-400">

        <span className="flex items-center gap-1">

          {alerts.length > 0 ? (

            <AlertTriangle className="w-3 h-3 text-amber-400" />

          ) : (

            <CheckCircle2 className="w-3 h-3 text-emerald-400" />

          )}

          ML EVENT MONITOR

        </span>

        <span
          className={
            snapshot
              ? 'text-emerald-400'
              : 'text-amber-400'
          }
        >
          {snapshot ? 'LIVE' : 'WAITING'}
        </span>

      </div>

    </div>
  );
};