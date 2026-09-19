import React, { useState } from 'react';
import { EngineCanvas } from './EngineCanvas';
import { ComponentInfo } from './ComponentInfo';
import { ENGINE_COMPONENTS } from '../../data/mockData';
import { EngineComponent } from '../../types';
import { AeronexSnapshot } from '../../services/websocket';
import {
  Box,
  Layers,
  Thermometer,
  Sliders,
  Cpu,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';

interface DigitalTwinViewProps {
  snapshot: AeronexSnapshot | null;
  degradationActive?: boolean;
  onNavigateToTwinDetail?: () => void;
}

export const DigitalTwinView: React.FC<DigitalTwinViewProps> = ({
  snapshot,
}) => {
  const [selectedComponent, setSelectedComponent] =
    useState<EngineComponent | null>(
      ENGINE_COMPONENTS[0] ?? null
    );

  const [cameraPreset, setCameraPreset] =
    useState<
      'isometric' | 'front' | 'side' | 'top'
    >('isometric');

  const [wireframe, setWireframe] =
    useState(false);

  const [thermalMode, setThermalMode] =
    useState(false);

  const [explodedVal, setExplodedVal] =
    useState(0);

  const cht =
    snapshot?.telemetry?.cht ?? 0;

  const egt =
    snapshot?.telemetry?.egt ?? 0;

  const oilPressure =
    snapshot?.telemetry?.oil_pressure ?? 0;

  const vibration =
    snapshot?.telemetry?.vibration ?? 0;

  const degradationEnabled =
    snapshot?.degradation?.enabled === true;

  // Correct live ML health path
  const healthStatus =
    typeof snapshot?.analysis?.engine_health?.status === 'string'
      ? snapshot.analysis.engine_health.status
      : 'NOT AVAILABLE';

  const healthScore =
    typeof snapshot?.analysis?.engine_health?.score === 'number'
      ? snapshot.analysis.engine_health.score
      : null;

  const healthWarning =
    healthStatus === 'WARNING' ||
    healthStatus === 'CRITICAL';

  const healthCritical =
    healthStatus === 'CRITICAL';

  const healthStatusClass =
    healthCritical
      ? 'text-red-400'
      : healthWarning
        ? 'text-amber-300'
        : healthStatus === 'HEALTHY' ||
            healthStatus === 'NORMAL'
          ? 'text-emerald-400'
          : 'text-slate-400';

  const healthStatusBg =
    healthCritical
      ? 'bg-red-500/15 border-red-500/40'
      : healthWarning
        ? 'bg-amber-500/15 border-amber-500/40'
        : healthStatus === 'HEALTHY' ||
            healthStatus === 'NORMAL'
          ? 'bg-emerald-500/10 border-emerald-500/30'
          : 'bg-slate-900 border-slate-800';

  return (
    <div className="space-y-4 font-mono select-none">

      {/* Header */}
      <div className="bg-[#0d1527] border border-slate-800 rounded-lg p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-sm">

        <div className="flex items-center gap-3">

          <div className="p-2 rounded bg-cyan-950/60 border border-cyan-500/40 text-cyan-400">
            <Box className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">

              <h2 className="text-base font-bold text-white tracking-wide">
                AERO PISTON 3D DIGITAL TWIN
              </h2>

              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                LIVE MODEL
              </span>

            </div>

            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Representative 4-Cylinder Horizontally Opposed Aero Piston Engine
            </p>
          </div>
        </div>

        {/* Live ML Health + Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">

          <div
            className={`flex items-center gap-1.5 px-2 py-1 rounded border ${healthStatusBg}`}
          >

            {healthWarning ? (
              <AlertTriangle
                className={`w-3.5 h-3.5 ${healthStatusClass}`}
              />
            ) : (
              <CheckCircle2
                className={`w-3.5 h-3.5 ${healthStatusClass}`}
              />
            )}

            <span className="text-[10px] text-slate-400">
              ENGINE:
            </span>

            <span
              className={`font-bold ${healthStatusClass}`}
            >
              {healthStatus}
            </span>

            {healthScore !== null && (
              <span className="text-[9px] text-slate-400">
                {healthScore.toFixed(1)}
              </span>
            )}

          </div>

          {/* Camera presets */}
          <div className="flex items-center bg-slate-900 p-0.5 rounded border border-slate-800 text-[11px]">

            {(
              [
                'isometric',
                'front',
                'side',
                'top',
              ] as const
            ).map(preset => (
              <button
                key={preset}
                type="button"
                onClick={() =>
                  setCameraPreset(preset)
                }
                className={`px-2 py-1 rounded uppercase ${
                  cameraPreset === preset
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {preset}
              </button>
            ))}

          </div>

          {/* Thermal */}
          <button
            type="button"
            onClick={() =>
              setThermalMode(prev => !prev)
            }
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded border ${
              thermalMode
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-900 text-slate-300 border-slate-800'
            }`}
          >
            <Thermometer className="w-3.5 h-3.5 text-amber-400" />
            THERMAL MAP
          </button>

          {/* Wireframe */}
          <button
            type="button"
            onClick={() =>
              setWireframe(prev => !prev)
            }
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded border ${
              wireframe
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                : 'bg-slate-900 text-slate-300 border-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            WIREFRAME
          </button>

        </div>
      </div>

      {/* Main */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">

        {/* 3D Twin */}
        <div className="lg:col-span-3 bg-[#0d1527] border border-slate-800 rounded-lg overflow-hidden flex flex-col">

          {/* Controls */}
          <div className="bg-[#0f1a30] px-4 py-2 border-b border-slate-800 flex items-center justify-between text-xs">

            <div className="flex items-center gap-2">

              <Sliders className="w-3.5 h-3.5 text-cyan-400" />

              <span className="text-slate-300 text-[11px]">
                EXPLODED SUBSYSTEM OFFSET:
              </span>

              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={explodedVal}
                onChange={event =>
                  setExplodedVal(
                    parseFloat(event.target.value)
                  )
                }
                className="w-28 sm:w-36 accent-cyan-400 cursor-pointer"
                aria-label="Exploded subsystem offset"
              />

              <span className="text-cyan-400 font-bold text-[11px]">
                {Math.round(
                  explodedVal * 100
                )}
                %
              </span>

            </div>

            <div className="text-[10px] text-slate-400">
              LIVE ENGINE STATE
            </div>

          </div>

          {/* Canvas */}
          <div className="relative w-full h-[540px] bg-[#0a101d]">

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
                degradationEnabled
              }
              chtValue={cht}
              egtValue={egt}
              oilPressureValue={
                oilPressure
              }
              vibrationValue={
                vibration
              }
              wireframeMode={wireframe}
              thermalMode={thermalMode}
              explodedOffset={
                explodedVal
              }
              height="h-[540px]"
              viewMode={cameraPreset}
              showQuickControls={true}
            />

            {selectedComponent && (
              <div className="absolute top-4 left-4 z-20">

                <ComponentInfo
                  component={selectedComponent}
                  snapshot={snapshot}
                  onClose={() =>
                    setSelectedComponent(null)
                  }
                  degradationActive={
                    degradationEnabled
                  }
                />

              </div>
            )}

          </div>
        </div>

        {/* Component Index */}
        <div className="bg-[#0d1527] border border-slate-800 rounded-lg p-3.5 flex flex-col">

          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">

            <div className="flex items-center gap-1.5">

              <Cpu className="w-3.5 h-3.5 text-cyan-400" />

              <h3 className="text-xs font-bold text-slate-200 uppercase">
                COMPONENT INDEX
              </h3>

            </div>

            <span className="text-[9px] text-slate-400">
              {ENGINE_COMPONENTS.length} NODES
            </span>

          </div>

          <div className="space-y-1.5 max-h-[480px] overflow-y-auto pr-1">

            {ENGINE_COMPONENTS.map(comp => {

              const isSelected =
                selectedComponent?.id === comp.id;

              return (
                <button
                  key={comp.id}
                  type="button"
                  onClick={() =>
                    setSelectedComponent(comp)
                  }
                  className={`w-full text-left p-2 rounded border ${
                    isSelected
                      ? 'bg-blue-600/20 border-cyan-500/50 text-white'
                      : 'bg-[#0a101d] border-slate-800/80 text-slate-300 hover:border-slate-700'
                  }`}
                >

                  <div className="flex items-center justify-between text-[11px] mb-0.5">

                    <span className="font-bold truncate">
                      {comp.name}
                    </span>

                    <span
                      className={`text-[9px] px-1 py-0.2 rounded font-bold ${
                        healthWarning
                          ? healthCritical
                            ? 'bg-red-500/20 text-red-300'
                            : 'bg-amber-500/20 text-amber-300'
                          : healthStatus === 'NOT AVAILABLE'
                            ? 'bg-slate-800 text-slate-400'
                            : 'bg-emerald-500/10 text-emerald-400'
                      }`}
                    >
                      {healthCritical
                        ? 'CRITICAL'
                        : healthWarning
                          ? 'WARNING'
                          : healthStatus === 'NOT AVAILABLE'
                            ? 'N/A'
                            : 'NORMAL'}
                    </span>

                  </div>

                  <div className="text-[10px] text-slate-400 truncate">
                    {comp.system}
                  </div>

                  <div className="flex items-center justify-between text-[9px] text-slate-400 mt-1 pt-1 border-t border-slate-800/60">

                    <span>
                      {comp.sensorId}
                    </span>

                    <span>
                      {comp.id.startsWith('cyl')
                        ? `${cht.toFixed(0)} °C`
                        : comp.id === 'exhaust'
                          ? `${egt.toFixed(0)} °C`
                          : comp.id === 'oilsump'
                            ? `${oilPressure.toFixed(2)} bar`
                            : comp.id === 'crankcase'
                              ? `${vibration.toFixed(2)} mm/s`
                              : 'LIVE'}
                    </span>

                  </div>

                </button>
              );
            })}

          </div>

          <div className="mt-auto pt-2 border-t border-slate-800 text-[10px] text-slate-400 flex justify-between">
            <span>
              MODEL: P4 ACADEMIC
            </span>

            <span className="text-cyan-400/80">
              LIVE
            </span>
          </div>

        </div>
      </div>
    </div>
  );
};