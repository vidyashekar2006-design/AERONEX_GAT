import React from 'react';
import {
  Cpu,
  AlertTriangle,
  CheckCircle2,
  Clock,
  HelpCircle,
} from 'lucide-react';
import { AeronexSnapshot } from '../../services/websocket';

interface AnalysisPanelProps {
  snapshot: AeronexSnapshot | null;
}

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({
  snapshot,
}) => {
  const analysis = snapshot?.analysis;

  const anomalyDetected =
    analysis?.anomaly?.detected === true;

  const anomalyScore =
    typeof analysis?.anomaly?.score === 'number'
      ? analysis.anomaly.score
      : null;

  const anomalySeverity =
    typeof analysis?.anomaly?.severity === 'string'
      ? analysis.anomaly.severity
      : null;

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
      : null;

  const rul =
    typeof analysis?.rul?.value === 'number'
      ? analysis.rul.value
      : null;

  const rulUnit =
    analysis?.rul?.unit ?? 'hours';

  const maintenance =
    typeof analysis?.maintenance?.action === 'string'
      ? analysis.maintenance.action
      : null;

  const maintenancePriority =
    typeof analysis?.maintenance?.priority === 'string'
      ? analysis.maintenance.priority
      : null;

  const dataQuality =
    typeof analysis?.data_quality?.status === 'string'
      ? analysis.data_quality.status
      : 'NOT AVAILABLE';

  const anomalyColor = anomalyDetected
    ? 'text-amber-400'
    : 'text-emerald-400';

  return (
    <div className="bg-[#0d1527] border border-slate-800 rounded-lg p-3.5 shadow-sm font-mono">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-cyan-400" />

          <h3 className="text-xs font-bold tracking-wider text-slate-200 uppercase">
            AI / ENGINEERING ANALYSIS
          </h3>
        </div>

        <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
          LIVE ML
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">

        {/* ANOMALY */}
        <div className="bg-[#0a101d] p-3 rounded border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
              <span>ANOMALY DETECTION</span>

              {anomalyDetected ? (
                <AlertTriangle className="w-3 h-3 text-amber-400" />
              ) : (
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              )}
            </div>

            <div className={`text-sm font-black mt-1 ${anomalyColor}`}>
              {anomalyDetected
                ? 'ANOMALY DETECTED'
                : 'NORMAL'}
            </div>

            <p className="text-[10px] text-slate-400 font-sans mt-1 leading-snug">
              Score:{' '}
              {anomalyScore !== null
                ? anomalyScore.toFixed(4)
                : 'N/A'}

              {anomalySeverity
                ? ` • ${anomalySeverity}`
                : ''}
            </p>
          </div>

          <div className="mt-2 pt-1.5 border-t border-slate-800/80 text-[9px] text-slate-400">
            DATA QUALITY: {dataQuality}
          </div>
        </div>

        {/* FAULT */}
        <div className="bg-[#0a101d] p-3 rounded border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
              <span>FAULT ANALYSIS</span>
              <AlertTriangle className="w-3 h-3 text-slate-500" />
            </div>

            <div
              className={`text-sm font-black mt-1 ${
                fault
                  ? 'text-red-400'
                  : 'text-emerald-400'
              }`}
            >
              {fault ?? 'NO FAULT'}
            </div>

            <p className="text-[10px] text-slate-400 font-sans mt-1 leading-snug">
              Probability:{' '}
              {faultProbability !== null
                ? `${(faultProbability * 100).toFixed(1)}%`
                : 'N/A'}
            </p>
          </div>

          <div className="mt-2 pt-1.5 border-t border-slate-800/80 text-[9px] text-slate-400">
            ML FAULT CLASSIFIER
          </div>
        </div>

        {/* DEGRADATION */}
        <div className="bg-[#0a101d] p-3 rounded border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
              <span>DEGRADATION</span>

              <span className="text-[9px] text-slate-400">
                LIVE ESTIMATE
              </span>
            </div>

            <div className="text-sm font-black text-slate-200 mt-1">
              {degradation !== null
                ? `${(degradation * 100).toFixed(1)}%`
                : 'N/A'}
            </div>

            <p className="text-[10px] text-slate-400 font-sans mt-1 leading-snug">
              Trend:{' '}
              {degradationTrend ?? 'N/A'}
            </p>
          </div>

          <div className="mt-2 pt-1.5 border-t border-slate-800/80 text-[9px] text-slate-400">
            WEAR / DEGRADATION MODEL
          </div>
        </div>

        {/* RUL */}
        <div className="bg-[#0a101d] p-3 rounded border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
              <span>REMAINING USEFUL LIFE</span>
              <Clock className="w-3 h-3 text-cyan-400" />
            </div>

            <div className="text-sm font-black text-cyan-300 mt-1">
              {rul !== null
                ? `${rul.toFixed(1)} ${rulUnit}`
                : 'NOT AVAILABLE'}
            </div>

            <p className="text-[10px] text-slate-400 font-sans mt-1 leading-snug">
              Current model-estimated remaining useful life.
            </p>
          </div>

          <div className="mt-2 pt-1.5 border-t border-slate-800/80 text-[9px] text-slate-400">
            RUL MODEL:{' '}
            {rul !== null ? 'ACTIVE' : 'N/A'}
          </div>
        </div>

        {/* MAINTENANCE */}
        <div className="bg-[#0a101d] p-3 rounded border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
              <span>PREDICTIVE MAINT.</span>
              <HelpCircle className="w-3 h-3 text-cyan-400" />
            </div>

            <div className="text-sm font-black text-cyan-300 mt-1">
              {maintenance ?? 'NOT AVAILABLE'}
            </div>

            <p className="text-[10px] text-slate-400 font-sans mt-1 leading-snug">
              Priority:{' '}
              {maintenancePriority ?? 'N/A'}
            </p>
          </div>

          <div className="mt-2 pt-1.5 border-t border-slate-800/80 text-[9px] text-slate-400">
            PREDICTIVE MAINTENANCE
          </div>
        </div>

      </div>
    </div>
  );
};