import React, { useRef, useEffect, useState } from 'react';
import { useSimulation } from '../simulation/simulationProvider';
import { TelemetryCard } from './TelemetryCard';
import { Activity, Gauge } from 'lucide-react';

export const TelemetryGrid: React.FC = () => {
  const { telemetry } = useSimulation();

  // Track previous values for trend arrows
  const prevRef = useRef(telemetry);
  const [trends, setTrends] = useState<Record<string, 'up' | 'down' | 'steady'>>({});

  useEffect(() => {
    const prev = prevRef.current;
    const calculateTrend = (curr: number, prior: number): 'up' | 'down' | 'steady' => {
      const diff = curr - prior;
      if (Math.abs(diff) < 0.1) return 'steady';
      return diff > 0 ? 'up' : 'down';
    };

    setTrends({
      rpm: calculateTrend(telemetry.rpm, prev.rpm),
      cht: calculateTrend(telemetry.cht, prev.cht),
      egt: calculateTrend(telemetry.egt, prev.egt),
      oil_temperature: calculateTrend(telemetry.oil_temperature, prev.oil_temperature),
      oil_pressure: calculateTrend(telemetry.oil_pressure, prev.oil_pressure),
      fuel_flow: calculateTrend(telemetry.fuel_flow, prev.fuel_flow),
      vibration: calculateTrend(telemetry.vibration, prev.vibration),
      engine_load: calculateTrend(telemetry.engine_load, prev.engine_load),
      available_performance: calculateTrend(telemetry.available_performance, prev.available_performance),
      altitude: calculateTrend(telemetry.altitude, prev.altitude),
      ambient_temperature: calculateTrend(telemetry.ambient_temperature, prev.ambient_temperature),
    });

    prevRef.current = telemetry;
  }, [telemetry]);

  return (
    <div id="live-telemetry-grid" className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <h2 className="text-xs font-tech font-bold uppercase tracking-wider text-slate-300">
            LIVE ENGINE TELEMETRY CHANNELS
          </h2>
        </div>
        <span className="text-[11px] font-mono text-slate-500">11 ACTIVE SENSORS</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
        {/* 1. RPM */}
        <TelemetryCard
          id="rpm"
          shortCode="RPM"
          label="Engine Speed"
          value={telemetry.rpm}
          unit="RPM"
          min={0}
          max={6000}
          warnThresholdHigh={5500}
          critThresholdHigh={5850}
          decimals={0}
          trend={trends.rpm}
        />

        {/* 2. CHT */}
        <TelemetryCard
          id="cht"
          shortCode="CHT"
          label="Cyl Head Temp"
          value={telemetry.cht}
          unit="°C"
          min={40}
          max={180}
          warnThresholdHigh={135}
          critThresholdHigh={150}
          decimals={1}
          trend={trends.cht}
        />

        {/* 3. EGT */}
        <TelemetryCard
          id="egt"
          shortCode="EGT"
          label="Exhaust Gas Temp"
          value={telemetry.egt}
          unit="°C"
          min={500}
          max={1000}
          warnThresholdHigh={860}
          critThresholdHigh={900}
          decimals={1}
          trend={trends.egt}
        />

        {/* 4. Oil Temperature */}
        <TelemetryCard
          id="oil_temperature"
          shortCode="T_OIL"
          label="Oil Temp"
          value={telemetry.oil_temperature}
          unit="°C"
          min={40}
          max={150}
          warnThresholdHigh={115}
          critThresholdHigh={130}
          decimals={1}
          trend={trends.oil_temperature}
        />

        {/* 5. Oil Pressure */}
        <TelemetryCard
          id="oil_pressure"
          shortCode="P_OIL"
          label="Oil Pressure"
          value={telemetry.oil_pressure}
          unit="bar"
          min={0}
          max={7}
          warnThresholdLow={2.3}
          critThresholdLow={1.6}
          warnThresholdHigh={6.2}
          critThresholdHigh={6.8}
          decimals={2}
          trend={trends.oil_pressure}
        />

        {/* 6. Fuel Flow */}
        <TelemetryCard
          id="fuel_flow"
          shortCode="FF"
          label="Fuel Flow Rate"
          value={telemetry.fuel_flow}
          unit="L/h"
          min={0}
          max={40}
          warnThresholdHigh={34}
          critThresholdHigh={38}
          decimals={1}
          trend={trends.fuel_flow}
        />

        {/* 7. Vibration */}
        <TelemetryCard
          id="vibration"
          shortCode="VIB"
          label="Crankcase RMS"
          value={telemetry.vibration}
          unit="mm/s"
          min={0}
          max={10}
          warnThresholdHigh={3.5}
          critThresholdHigh={5.5}
          decimals={2}
          trend={trends.vibration}
        />

        {/* 8. Engine Load */}
        <TelemetryCard
          id="engine_load"
          shortCode="LOAD"
          label="Manifold Load"
          value={telemetry.engine_load}
          unit="%"
          min={0}
          max={100}
          warnThresholdHigh={95}
          decimals={0}
          trend={trends.engine_load}
        />

        {/* 9. Available Performance */}
        <TelemetryCard
          id="available_performance"
          shortCode="PERF"
          label="Avail Margin"
          value={telemetry.available_performance}
          unit="%"
          min={0}
          max={100}
          warnThresholdLow={65}
          critThresholdLow={45}
          decimals={0}
          trend={trends.available_performance}
        />

        {/* 10. Altitude */}
        <TelemetryCard
          id="altitude"
          shortCode="ALT"
          label="UAV Altitude"
          value={telemetry.altitude}
          unit="m"
          min={0}
          max={15000}
          decimals={0}
          trend={trends.altitude}
        />

        {/* 11. Ambient Temperature */}
        <TelemetryCard
          id="ambient_temperature"
          shortCode="OAT"
          label="Ambient Temp"
          value={telemetry.ambient_temperature}
          unit="°C"
          min={-60}
          max={60}
          decimals={0}
          trend={trends.ambient_temperature}
        />

        {/* 12. Throttle Command Feedback */}
        <TelemetryCard
          id="throttle_feedback"
          shortCode="THROT"
          label="ECU Demand"
          value={telemetry.throttle}
          unit="%"
          min={0}
          max={100}
          decimals={0}
          trend="steady"
        />
      </div>
    </div>
  );
};
