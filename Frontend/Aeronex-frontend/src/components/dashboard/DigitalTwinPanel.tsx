import React, { useState } from 'react';
import { EngineCanvas } from '../digital-twin/EngineCanvas';
import { ComponentInfo } from '../digital-twin/ComponentInfo';
import { AeronexSnapshot } from '../../services/websocket';
import { EngineComponent } from '../../types';
import {
  Maximize2,
  Minimize2,
  Layers,
  Thermometer,
  Sliders,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface DigitalTwinPanelProps {
  degradationActive?: boolean;
  onNavigateToTwinDetail?: () => void;
  snapshot: AeronexSnapshot | null;
}

type ParameterStatus =
  | 'NORMAL'
  | 'ELEVATED'
  | 'HIGH'
  | 'LOW'
  | 'CRITICAL'
  | 'N/A';

const getParameterStatus = (
  value: number | null,
  warningThreshold: number,
  criticalThreshold: number,
  direction: 'high' | 'low'
): ParameterStatus => {
  if (
    value === null ||
    !Number.isFinite(value)
  ) {
    return 'N/A';
  }

  if (direction === 'high') {
    if (value >= criticalThreshold) {
      return 'CRITICAL';
    }

    if (value >= warningThreshold) {
      return 'HIGH';
    }
  }

  if (direction === 'low') {
    if (value <= criticalThreshold) {
      return 'CRITICAL';
    }

    if (value <= warningThreshold) {
      return 'LOW';
    }
  }

  return 'NORMAL';
};

const statusTextClass = (
  status: ParameterStatus
): string => {
  if (
    status === 'CRITICAL' ||
    status === 'HIGH'
  ) {
    return 'text-red-400';
  }

  if (
    status === 'LOW' ||
    status === 'ELEVATED'
  ) {
    return 'text-amber-400';
  }

  if (status === 'NORMAL') {
    return 'text-emerald-400';
  }

  return 'text-slate-500';
};

const formatValue = (
  value: number | null,
  decimals = 1
): string => {
  if (
    value === null ||
    !Number.isFinite(value)
  ) {
    return '--';
  }

  return value.toFixed(decimals);
};

export const DigitalTwinPanel: React.FC<
  DigitalTwinPanelProps
> = ({
  snapshot,
}) => {
  const [selectedComponent, setSelectedComponent] =
    useState<EngineComponent | null>(null);

  const [wireframe, setWireframe] =
    useState(false);

  const [thermalMode, setThermalMode] =
    useState(false);

  const [exploded, setExploded] =
    useState(false);

  const [isFullscreen, setIsFullscreen] =
    useState(false);

  /*
   * Simulator degradation state.
   *
   * The simulator reports whether a degradation
   * scenario is currently active.
   */
  const backendDegradationActive =
    snapshot?.degradation?.enabled === true;

  /*
   * ML engine health.
   */
  const healthStatus =
    typeof snapshot?.analysis?.engine_health?.status ===
    'string'
      ? snapshot.analysis.engine_health.status.toUpperCase()
      : 'NOT AVAILABLE';

  const healthScore =
    typeof snapshot?.analysis?.engine_health?.score ===
      'number' &&
    Number.isFinite(
      snapshot.analysis.engine_health.score
    )
      ? snapshot.analysis.engine_health.score
      : null;

  const isCritical =
    healthStatus === 'CRITICAL';

  const isWarning =
    healthStatus === 'WARNING';

  const isHealthy =
    healthStatus === 'HEALTHY' ||
    healthStatus === 'NORMAL';

  const healthStatusColor =
    isCritical
      ? 'text-red-400'
      : isWarning
        ? 'text-amber-300'
        : isHealthy
          ? 'text-emerald-400'
          : 'text-slate-400';

  const healthStatusBg =
    isCritical
      ? 'bg-red-500/15 border-red-500/40'
      : isWarning
        ? 'bg-amber-500/20 border-amber-500/40'
        : isHealthy
          ? 'bg-emerald-500/15 border-emerald-500/30'
          : 'bg-slate-800 border-slate-700';

  /*
   * Live telemetry.
   */
  const cht =
    typeof snapshot?.telemetry?.cht === 'number'
      ? snapshot.telemetry.cht
      : null;

  const egt =
    typeof snapshot?.telemetry?.egt === 'number'
      ? snapshot.telemetry.egt
      : null;

  const oilPressure =
    typeof snapshot?.telemetry?.oil_pressure ===
      'number'
      ? snapshot.telemetry.oil_pressure
      : null;

  const vibration =
    typeof snapshot?.telemetry?.vibration === 'number'
      ? snapshot.telemetry.vibration
      : null;

  const rpm =
    typeof snapshot?.telemetry?.rpm === 'number'
      ? snapshot.telemetry.rpm
      : null;

  /*
   * These are visual telemetry-band indicators only.
   * They are NOT the ML diagnosis.
   */
  const chtStatus = getParameterStatus(
    cht,
    120,
    140,
    'high'
  );

  const egtStatus = getParameterStatus(
    egt,
    550,
    650,
    'high'
  );

  const oilPressureStatus = getParameterStatus(
    oilPressure,
    2.5,
    2.0,
    'low'
  );

  const vibrationStatus =
    vibration === null ||
    !Number.isFinite(vibration)
      ? 'N/A'
      : vibration >= 0.5
        ? 'HIGH'
        : vibration >= 0.35
          ? 'ELEVATED'
          : 'NORMAL';

  const liveTelemetryAvailable =
    snapshot !== null;

  const liveAnalysisAvailable =
    snapshot?.analysis !== undefined;

  return (
    <div
      className={`bg-[#0d1527] border border-slate-800 rounded-lg overflow-hidden flex flex-col shadow-lg transition-all ${
        isFullscreen
          ? 'fixed inset-4 z-50 bg-[#0a101d] border-cyan-500/50'
          : 'w-full'
      }`}
    >

      {/* Panel Header */}
      <div className="bg-[#0f1a30] border-b border-slate-800/90 px-4 py-2.5 flex items-center justify-between gap-3">

        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={`w-2 h-2 rounded-full ${
                liveTelemetryAvailable
                  ? 'bg-cyan-400 animate-pulse'
                  : 'bg-slate-500'
              }`}
            />

            <h2 className="font-mono text-sm font-bold tracking-wider text-white uppercase truncate">
              ENGINE DIGITAL TWIN
            </h2>
          </div>

          <span
            className={`font-mono text-[10px] px-2 py-0.5 rounded border ${
              liveTelemetryAvailable
                ? 'bg-blue-950 text-cyan-300 border-blue-500/30'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            {liveTelemetryAvailable
              ? 'LIVE TWIN'
              : 'WAITING'}
          </span>
        </div>

        {/* Status + Controls */}
        <div className="flex items-center gap-2 font-mono text-xs">

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-400">
              ENGINE:
            </span>

            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-bold border ${healthStatusBg} ${healthStatusColor}`}
            >
              {isWarning || isCritical ? (
                <AlertTriangle className="w-3 h-3" />
              ) : isHealthy ? (
                <CheckCircle2 className="w-3 h-3" />
              ) : null}

              {healthStatus}

              {healthScore !== null && (
                <span className="text-[9px] opacity-80">
                  {healthScore.toFixed(1)}
                </span>
              )}
            </span>
          </div>

          {/* Quick Filter Buttons */}
          <div className="hidden sm:flex items-center gap-1 pl-3 border-l border-slate-800">

            {/* Thermal */}
            <button
              type="button"
              onClick={() =>
                setThermalMode(
                  (previous) => !previous
                )
              }
              title="Toggle thermal visualization"
              aria-label="Toggle thermal visualization"
              className={`p-1.5 rounded transition-colors ${
                thermalMode
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Thermometer className="w-3.5 h-3.5" />
            </button>

            {/* Wireframe */}
            <button
              type="button"
              onClick={() =>
                setWireframe(
                  (previous) => !previous
                )
              }
              title="Toggle structural wireframe"
              aria-label="Toggle structural wireframe"
              className={`p-1.5 rounded transition-colors ${
                wireframe
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
            </button>

            {/* Exploded View */}
            <button
              type="button"
              onClick={() =>
                setExploded(
                  (previous) => !previous
                )
              }
              title="Toggle subsystem separation"
              aria-label="Toggle subsystem separation"
              className={`p-1.5 rounded transition-colors ${
                exploded
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
            </button>

            {/* Fullscreen */}
            <button
              type="button"
              onClick={() =>
                setIsFullscreen(
                  (previous) => !previous
                )
              }
              title={
                isFullscreen
                  ? 'Exit expanded view'
                  : 'Expand 3D view'
              }
              aria-label={
                isFullscreen
                  ? 'Exit expanded view'
                  : 'Expand 3D view'
              }
              className="p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              {isFullscreen ? (
                <Minimize2 className="w-3.5 h-3.5" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5" />
              )}
            </button>

          </div>
        </div>
      </div>

      {/* 3D Model Area */}
      <div className="relative flex-1 min-h-[460px] md:min-h-[500px] w-full bg-[#0a101d]">

        <EngineCanvas
          selectedComponentId={
            selectedComponent
              ? selectedComponent.id
              : null
          }
          onSelectComponent={
            setSelectedComponent
          }
          degradationEnabled={
            backendDegradationActive
          }
          chtValue={cht ?? 0}
          egtValue={egt ?? 0}
          oilPressureValue={
            oilPressure ?? 0
          }
          vibrationValue={
            vibration ?? 0
          }
          wireframeMode={wireframe}
          thermalMode={thermalMode}
          explodedOffset={
            exploded ? 0.7 : 0
          }
          height={
            isFullscreen
              ? 'h-full'
              : 'h-[460px] md:h-[500px]'
          }
          showQuickControls={true}
        />

        {/* Selected Component */}
        {selectedComponent && (
          <div className="absolute top-4 left-4 z-20 animate-fadeIn">
            <ComponentInfo
              component={selectedComponent}
              onClose={() =>
                setSelectedComponent(null)
              }
              degradationActive={
                backendDegradationActive
              }
            />
          </div>
        )}

        {/* Technical Callouts */}
        <div className="absolute top-4 right-4 pointer-events-none hidden md:flex flex-col gap-1.5 text-right font-mono text-[10px]">

          {/* Prototype reference */}
          <div className="bg-slate-900/80 px-2 py-1 rounded border border-slate-800 text-slate-400">
            DIGITAL TWIN:{' '}
            <span className="text-cyan-400">
              PROTOTYPE MODEL
            </span>
          </div>

          {/* Live synchronization state */}
          <div className="bg-slate-900/80 px-2 py-1 rounded border border-slate-800 text-slate-400">
            TELEMETRY:{' '}
            <span
              className={
                liveTelemetryAvailable
                  ? 'text-emerald-400'
                  : 'text-slate-500'
              }
            >
              {liveTelemetryAvailable
                ? 'RECEIVING'
                : 'WAITING'}
            </span>
          </div>

          {thermalMode && (
            <div className="bg-amber-950/80 px-2 py-1 rounded border border-amber-500/40 text-amber-300">
              THERMAL VISUALIZATION ACTIVE
            </div>
          )}

          {backendDegradationActive && (
            <div className="bg-amber-950/80 px-2 py-1 rounded border border-amber-500/40 text-amber-300">
              DEGRADATION ACTIVE
            </div>
          )}

        </div>

        {/* Waiting state */}
        {!liveTelemetryAvailable && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="bg-slate-950/70 border border-slate-800 rounded px-4 py-2 text-center">
              <div className="font-mono text-xs text-slate-400">
                WAITING FOR TELEMETRY
              </div>

              <div className="font-mono text-[9px] text-slate-600 mt-1">
                DIGITAL TWIN READY
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Live Telemetry Strip */}
      <div className="bg-[#0b1322] border-t border-slate-800 px-4 py-2.5 grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono">

        {/* RPM */}
        <div className="flex flex-col border-r border-slate-800/80 pr-2">
          <span className="text-[10px] text-slate-400 tracking-wider">
            RPM
          </span>

          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-lg font-bold text-white tracking-tight">
              {formatValue(rpm, 0)}
            </span>

            <span className="text-[10px] text-slate-400">
              RPM
            </span>
          </div>

          <span className="text-[9px] font-medium text-emerald-400">
            {rpm !== null
              ? 'LIVE'
              : 'N/A'}
          </span>
        </div>

        {/* CHT */}
        <div className="flex flex-col border-r border-slate-800/80 pr-2">
          <span className="text-[10px] text-slate-400 tracking-wider">
            CHT
          </span>

          <div className="flex items-baseline gap-1 mt-0.5">
            <span
              className={`text-lg font-bold tracking-tight ${statusTextClass(
                chtStatus
              )}`}
            >
              {formatValue(cht)}
            </span>

            <span className="text-[10px] text-slate-400">
              °C
            </span>
          </div>

          <span
            className={`text-[9px] font-medium ${statusTextClass(
              chtStatus
            )}`}
          >
            {chtStatus}
          </span>
        </div>

        {/* EGT */}
        <div className="flex flex-col border-r border-slate-800/80 pr-2">
          <span className="text-[10px] text-slate-400 tracking-wider">
            EGT
          </span>

          <div className="flex items-baseline gap-1 mt-0.5">
            <span
              className={`text-lg font-bold tracking-tight ${statusTextClass(
                egtStatus
              )}`}
            >
              {formatValue(egt)}
            </span>

            <span className="text-[10px] text-slate-400">
              °C
            </span>
          </div>

          <span
            className={`text-[9px] font-medium ${statusTextClass(
              egtStatus
            )}`}
          >
            {egtStatus}
          </span>
        </div>

        {/* Oil Pressure */}
        <div className="flex flex-col border-r border-slate-800/80 pr-2">
          <span className="text-[10px] text-slate-400 tracking-wider">
            OIL PRESSURE
          </span>

          <div className="flex items-baseline gap-1 mt-0.5">
            <span
              className={`text-lg font-bold tracking-tight ${statusTextClass(
                oilPressureStatus
              )}`}
            >
              {formatValue(
                oilPressure,
                2
              )}
            </span>

            <span className="text-[10px] text-slate-400">
              bar
            </span>
          </div>

          <span
            className={`text-[9px] font-medium ${statusTextClass(
              oilPressureStatus
            )}`}
          >
            {oilPressureStatus}
          </span>
        </div>

        {/* Vibration */}
        <div className="flex flex-col col-span-2 sm:col-span-1">
          <span className="text-[10px] text-slate-400 tracking-wider">
            VIBRATION
          </span>

          <div className="flex items-baseline gap-1 mt-0.5">
            <span
              className={`text-lg font-bold tracking-tight ${statusTextClass(
                vibrationStatus
              )}`}
            >
              {formatValue(
                vibration,
                2
              )}
            </span>

            <span className="text-[10px] text-slate-400">
              g
            </span>
          </div>

          <span
            className={`text-[9px] font-medium ${statusTextClass(
              vibrationStatus
            )}`}
          >
            {vibrationStatus}
          </span>
        </div>

      </div>
    </div>
  );
};