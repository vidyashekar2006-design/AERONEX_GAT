import React from 'react';
import { useSimulation } from '../simulation/simulationProvider';
import type { DegradationScenario } from '../simulation/types';
import {
  Sliders,
  Play,
  Pause,
  RotateCcw,
  Flame,
  AlertTriangle,
  Wind,
  Gauge,
  Zap,
  FastForward,
  Compass,
} from 'lucide-react';

export const SimulationControls: React.FC = () => {
  const {
    controls,
    updateControls,
    simulationState,
    startSimulation,
    pauseSimulation,
    resetSimulation,
  } = useSimulation();

  const handleScenarioChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateControls({ degradation_scenario: e.target.value as DegradationScenario });
  };

  return (
   <div
      id="simulation-controls-console"
      className="rounded-xl border border-slate-800 bg-[#090e18]/95 p-4 backdrop-blur-md space-y-4"
    >
      {/* Console Header & Global Sim Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-tech font-bold uppercase tracking-wider text-slate-200">
              UAV DIGITAL TWIN FLIGHT CONTROLLER
            </h2>
            <p className="text-[10px] text-slate-500 font-mono">
              COMMAND INJECTION & FAULT SIMULATION CONSOLE
            </p>
          </div>
        </div>

        {/* Primary Sim Execution Buttons */}
        <div className="flex items-center gap-2">
          {simulationState === 'RUNNING' ? (
            <button
              id="btn-ctrl-pause"
              onClick={pauseSimulation}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 text-xs font-tech font-bold transition cursor-pointer shadow-sm"
            >
              <Pause className="w-3.5 h-3.5" />
              PAUSE
            </button>
          ) : (
            <button
              id="btn-ctrl-start"
              onClick={startSimulation}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/50 text-xs font-tech font-bold transition cursor-pointer shadow-sm"
            >
              <Play className="w-3.5 h-3.5" />
              START
            </button>
          )}

          <button
            id="btn-ctrl-reset"
            onClick={resetSimulation}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-tech font-bold transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            RESET
          </button>

          {/* Speed Multiplier */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded p-0.5 text-xs font-mono">
            {[1, 2, 5].map((speed) => (
              <button
                key={`spd-${speed}`}
                onClick={() => updateControls({ sim_speed: speed })}
                className={`px-2 py-0.5 rounded text-[10px] transition cursor-pointer ${
                  controls.sim_speed === speed
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Flight & Engine Control Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. THROTTLE */}
        <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <label
              htmlFor="slider-throttle"
              className="text-xs font-tech font-bold text-slate-300 flex items-center gap-1.5 uppercase"
            >
              <Gauge className="w-3.5 h-3.5 text-cyan-400" />
              THROTTLE
            </label>
            <span className="text-sm font-bold font-mono-num text-cyan-400">
              {controls.throttle}%
            </span>
          </div>

          <input
            id="slider-throttle"
            type="range"
            min="0"
            max="100"
            step="1"
            value={controls.throttle}
            onChange={(e) => updateControls({ throttle: Number(e.target.value) })}
            className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
          />

          {/* Throttle Presets */}
          <div className="flex justify-between items-center gap-1 pt-1">
            {[
              { label: 'IDLE', val: 20 },
              { label: 'CRUISE', val: 65 },
              { label: 'CLIMB', val: 82 },
              { label: 'MAX', val: 100 },
            ].map((preset) => (
              <button
                key={preset.label}
                onClick={() => updateControls({ throttle: preset.val })}
                className={`text-[9px] font-tech px-2 py-0.5 rounded border transition cursor-pointer ${
                  controls.throttle === preset.val
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* 2. ALTITUDE */}
        <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <label
              htmlFor="slider-altitude"
              className="text-xs font-tech font-bold text-slate-300 flex items-center gap-1.5 uppercase"
            >
              <Compass className="w-3.5 h-3.5 text-sky-400" />
              ALTITUDE
            </label>
            <span className="text-sm font-bold font-mono-num text-sky-400">
              {controls.altitude.toLocaleString()} m
            </span>
          </div>

          <input
            id="slider-altitude"
            type="range"
            min="0"
            max="15000"
            step="100"
            value={controls.altitude}
            onChange={(e) => updateControls({ altitude: Number(e.target.value) })}
            className="w-full accent-sky-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
          />

          {/* Altitude Presets */}
          <div className="flex justify-between items-center gap-1 pt-1">
            {[
              { label: 'GND', val: 0 },
              { label: '3k m', val: 3000 },
              { label: '6k m', val: 6000 },
              { label: '11k m', val: 11000 },
            ].map((preset) => (
              <button
                key={preset.label}
                onClick={() => updateControls({ altitude: preset.val })}
                className={`text-[9px] font-tech px-2 py-0.5 rounded border transition cursor-pointer ${
                  controls.altitude === preset.val
                    ? 'bg-sky-500/20 text-sky-300 border-sky-500/50'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* 3. AMBIENT TEMPERATURE */}
        <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <label
              htmlFor="slider-ambient-temp"
              className="text-xs font-tech font-bold text-slate-300 flex items-center gap-1.5 uppercase"
            >
              <Wind className="w-3.5 h-3.5 text-teal-400" />
              AMBIENT TEMPERATURE
            </label>
            <span className="text-sm font-bold font-mono-num text-teal-400">
              {controls.ambient_temperature}°C
            </span>
          </div>

          <input
            id="slider-ambient-temp"
            type="range"
            min="-60"
            max="60"
            step="1"
            value={controls.ambient_temperature}
            onChange={(e) => updateControls({ ambient_temperature: Number(e.target.value) })}
            className="w-full accent-teal-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
          />

          <div className="flex justify-between items-center text-[9px] font-mono text-slate-400 pt-1">
            <span>-60°C (Stratosphere)</span>
            <span>+15°C (ISA Std)</span>
            <span>+60°C (Desert)</span>
          </div>
        </div>
      </div>

      {/* Degradation & Fault Injection Console */}
      <div className="p-3.5 rounded-lg border border-amber-600/40 bg-gradient-to-r from-amber-950/20 via-slate-950 to-slate-950/70 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-900/40 pb-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-tech font-bold uppercase tracking-wider text-amber-300">
              PREDICTIVE DIGITAL TWIN FAULT & DEGRADATION INJECTION
            </span>
          </div>

          {/* Enable / Disable Degradation Toggle */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <span className="text-xs font-tech text-slate-300">
              {controls.degradation_enabled ? (
                <span className="text-amber-400 font-bold">DEGRADATION ENABLED</span>
              ) : (
                <span className="text-slate-500">DEGRADATION BYPASSED</span>
              )}
            </span>
            <input
              id="toggle-degradation"
              type="checkbox"
              checked={controls.degradation_enabled}
              onChange={(e) => {
  console.log(
    "🟠 DEGRADATION TOGGLE:",
    e.target.checked
  );

  updateControls({
    degradation_enabled: e.target.checked,
  });
}}
              className="sr-only"
            />
            <div
              className={`w-11 h-6 rounded-full transition-colors relative border ${
                controls.degradation_enabled
                  ? 'bg-amber-600 border-amber-400'
                  : 'bg-slate-800 border-slate-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform transform absolute top-1 ${
                  controls.degradation_enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </div>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          {/* Scenario Selector */}
          <div>
            <label
              htmlFor="select-degradation-scenario"
              className="block text-[11px] font-tech uppercase text-slate-400 mb-1"
            >
              Degradation Scenario:
            </label>
            <select
              id="select-degradation-scenario"
              value={controls.degradation_scenario}
              onChange={handleScenarioChange}
              disabled={!controls.degradation_enabled}
              className={`w-full bg-slate-900 border rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none transition ${
                controls.degradation_enabled
                  ? 'border-amber-500/50 focus:border-amber-400 cursor-pointer'
                  : 'border-slate-800 opacity-50 cursor-not-allowed'
              }`}
            >
              <option value="NORMAL">NORMAL (Nominal Factory Baseline)</option>
              <option value="COOLING_DEGRADATION">
                COOLING_DEGRADATION (Radiator fouling / loss of airflow, spikes CHT/EGT)
              </option>
              <option value="LUBRICATION_DEGRADATION">
                LUBRICATION_DEGRADATION (Oil pump wear / leak, pressure drop & overheating)
              </option>
              <option value="VIBRATION_INCREASE">
                VIBRATION_INCREASE (Propeller imbalance / bearing spalling)
              </option>
              <option value="SENSOR_DRIFT">
                SENSOR_DRIFT (Thermocouple & transducer oscillation bias)
              </option>
            </select>
          </div>

          {/* Severity Slider */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor="slider-severity"
                className="text-[11px] font-tech uppercase text-slate-400"
              >
                Degradation Severity (0.0 to 1.0):
              </label>
              <span
                className={`text-xs font-mono font-bold ${
                  controls.degradation_enabled ? 'text-amber-400' : 'text-slate-500'
                }`}
              >
                {(controls.degradation_severity * 100).toFixed(0)}% (
                {controls.degradation_severity.toFixed(2)})
              </span>
            </div>

            <input
              id="slider-severity"
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={controls.degradation_severity}
              disabled={!controls.degradation_enabled}
              onChange={(e) => updateControls({ degradation_severity: Number(e.target.value) })}
              className={`w-full h-1.5 rounded-lg appearance-none transition ${
                controls.degradation_enabled
                  ? 'accent-amber-400 bg-slate-800 cursor-pointer'
                  : 'bg-slate-900 opacity-50 cursor-not-allowed'
              }`}
            />
          </div>
        </div>

        {/* Mission Progression Mode Toggle */}
        <div className="flex flex-wrap items-center justify-between pt-1 border-t border-slate-800/60 text-xs">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              id="toggle-auto-mission"
              type="checkbox"
              checked={controls.auto_progress_mission}
              onChange={(e) => updateControls({ auto_progress_mission: e.target.checked })}
              className="accent-cyan-400 w-4 h-4 rounded cursor-pointer"
            />
            <span className="font-tech text-slate-300">
              Autonomous Mission Phase Progression (auto-manages throttle & altitude along flight plan)
            </span>
          </label>
          <span className="text-[11px] font-mono text-slate-500">
            Uncheck for 100% manual test-bench control
          </span>
        </div>
      </div>
    </div>
  );
};
