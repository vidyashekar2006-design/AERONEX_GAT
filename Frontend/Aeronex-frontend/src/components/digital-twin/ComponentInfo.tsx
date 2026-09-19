import React from 'react';
import {
  EngineComponent,
  SystemHealthStatus,
} from '../../types';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  Cpu,
} from 'lucide-react';
import { AeronexSnapshot } from '../../services/websocket';

interface ComponentInfoProps {
  component: EngineComponent | null;
  snapshot: AeronexSnapshot | null;
  onClose: () => void;
  degradationActive?: boolean;
}

export const ComponentInfo: React.FC<ComponentInfoProps> = ({
  component,
  snapshot,
  onClose,
  degradationActive = false,
}) => {
  if (!component) return null;

  const cht =
    snapshot?.telemetry?.cht ?? null;

  const egt =
    snapshot?.telemetry?.egt ?? null;

  const oilPressure =
    snapshot?.telemetry?.oil_pressure ?? null;

  const vibration =
    snapshot?.telemetry?.vibration ?? null;

  const isCylinder =
    component.id.startsWith('cyl');

  const isExhaust =
    component.id === 'exhaust';

  const isOilSump =
    component.id === 'oilsump';

  const isCrankcase =
    component.id === 'crankcase';

  const componentValue = isCylinder
    ? cht !== null
      ? `${cht.toFixed(0)} °C`
      : 'N/A'
    : isExhaust
      ? egt !== null
        ? `${egt.toFixed(0)} °C`
        : 'N/A'
      : isOilSump
        ? oilPressure !== null
          ? `${oilPressure.toFixed(2)} bar`
          : 'N/A'
        : isCrankcase
          ? vibration !== null
            ? `${vibration.toFixed(2)} mm/s`
            : 'N/A'
          : 'N/A';

  const parameterName = isCylinder || isExhaust
    ? 'TEMPERATURE'
    : isOilSump
      ? 'OIL PRESSURE'
      : isCrankcase
        ? 'VIBRATION'
        : 'PARAMETER';

  const componentStatus: SystemHealthStatus =
    snapshot?.analysis?.engine_health?.status === 'HEALTHY'
      ? 'NORMAL'
      : snapshot?.analysis?.engine_health?.status === 'WARNING'
        ? 'WARNING'
        : snapshot?.analysis?.engine_health?.status === 'CRITICAL'
          ? 'CRITICAL'
          : component.status;

  const getStatusBadge = (
    status: SystemHealthStatus,
  ) => {
    switch (status) {
      case 'NORMAL':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" />
            NORMAL
          </span>
        );

      case 'WARNING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <AlertTriangle className="w-3 h-3" />
            WARNING
          </span>
        );

      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <AlertCircle className="w-3 h-3" />
            CRITICAL
          </span>
        );

      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono text-slate-400 bg-slate-800 border border-slate-700">
            <Info className="w-3 h-3" />
            NOT AVAILABLE
          </span>
        );
    }
  };

  return (
    <div className="bg-[#0f172a]/95 backdrop-blur-md border border-cyan-500/40 rounded-lg p-3.5 shadow-2xl text-slate-200 text-xs w-80 max-w-full">

      {/* Header */}
      <div className="flex items-start justify-between border-b border-slate-800 pb-2 mb-2.5">

        <div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-semibold flex items-center gap-1">
            <Cpu className="w-3 h-3" />
            COMPONENT INSPECTOR
          </div>

          <h4 className="font-mono text-sm font-bold text-white mt-0.5">
            {component.name}
          </h4>

          <p className="text-[11px] text-slate-400">
            {component.system}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors"
          title="Close Inspector"
        >
          <X className="w-4 h-4" />
        </button>

      </div>

      <div className="space-y-2 font-mono">

        {/* Status */}
        <div className="flex items-center justify-between py-1 border-b border-slate-800/60">

          <span className="text-slate-400">
            STATUS
          </span>

          {getStatusBadge(componentStatus)}

        </div>

        {/* Sensor */}
        <div className="flex items-center justify-between py-1 border-b border-slate-800/60">

          <span className="text-slate-400">
            SENSOR ID
          </span>

          <span className="text-cyan-300 font-medium">
            {component.sensorId || 'N/A'}
          </span>

        </div>

        {/* Live parameter */}
        <div className="py-1">

          <div className="text-[10px] uppercase text-slate-400 font-semibold mb-1">
            LIVE PARAMETER
          </div>

          <div className="grid grid-cols-2 gap-1.5 bg-slate-900/80 p-2 rounded border border-slate-800">

            <div>
              <span className="text-[10px] text-slate-400 block">
                {parameterName}
              </span>

              <span
                className={`text-xs font-bold ${
                  degradationActive &&
                  (
                    componentStatus === 'WARNING' ||
                    componentStatus === 'CRITICAL'
                  )
                    ? 'text-amber-400'
                    : 'text-slate-200'
                }`}
              >
                {componentValue}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 block">
                ML HEALTH
              </span>

              <span className="text-xs font-bold text-emerald-400">
                {snapshot?.analysis?.engine_health?.score !== null &&
                typeof snapshot?.analysis?.engine_health?.score === 'number'
                  ? `${snapshot.analysis.engine_health.score.toFixed(1)}`
                  : 'N/A'}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 block">
                ANOMALY
              </span>

              <span
                className={`text-xs font-bold ${
                  snapshot?.analysis?.anomaly?.detected
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              >
                {snapshot?.analysis?.anomaly?.detected
                  ? 'DETECTED'
                  : 'NONE'}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 block">
                DATA
              </span>

              <span className="text-xs font-bold text-cyan-400">
                {snapshot
                  ? 'LIVE'
                  : 'WAITING'}
              </span>
            </div>

          </div>
        </div>

        {/* Description */}
        <div className="pt-1 text-[11px] font-sans text-slate-400 leading-relaxed">
          {component.description}
        </div>

        {/* Metadata */}
        <div className="mt-2 pt-2 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between gap-2">

          <span>
            SPEC: {component.material}
          </span>

          <span className="text-cyan-500/80 uppercase font-semibold">
            LIVE STATE
          </span>

        </div>

      </div>
    </div>
  );
};