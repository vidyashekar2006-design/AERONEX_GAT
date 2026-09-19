import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  AlertCircle,
  Gauge,
} from 'lucide-react';

export interface TelemetryCardProps {
  id: string;
  label: string;
  shortCode: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  warnThresholdHigh?: number;
  critThresholdHigh?: number;
  warnThresholdLow?: number;
  critThresholdLow?: number;
  decimals?: number;
  trend?: 'up' | 'down' | 'steady';
  sparklineData?: number[];
}

export const TelemetryCard: React.FC<TelemetryCardProps> = ({
  id,
  label,
  shortCode,
  value,
  unit,
  min,
  max,
  warnThresholdHigh,
  critThresholdHigh,
  warnThresholdLow,
  critThresholdLow,
  decimals = 0,
  trend = 'steady',
}) => {
  // Determine health state for this specific telemetry metric
  let status: 'NORMAL' | 'WARNING' | 'CRITICAL' = 'NORMAL';

  if (critThresholdHigh !== undefined && value >= critThresholdHigh) {
    status = 'CRITICAL';
  } else if (critThresholdLow !== undefined && value <= critThresholdLow) {
    status = 'CRITICAL';
  } else if (warnThresholdHigh !== undefined && value >= warnThresholdHigh) {
    status = 'WARNING';
  } else if (warnThresholdLow !== undefined && value <= warnThresholdLow) {
    status = 'WARNING';
  }

  // Calculate percentage of range for mini progress gauge
  const range = max - min;
  const percentage = Math.max(0, Math.min(100, ((value - min) / (range || 1)) * 100));

  const getStatusStyles = () => {
    if (status === 'CRITICAL') {
      return {
        cardBorder: 'border-rose-600/70 bg-rose-950/20 shadow-rose-950/40',
        textValue: 'text-rose-400',
        badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
        barColor: 'bg-rose-500',
      };
    }
    if (status === 'WARNING') {
      return {
        cardBorder: 'border-amber-600/60 bg-amber-950/20 shadow-amber-950/30',
        textValue: 'text-amber-400',
        badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        barColor: 'bg-amber-400',
      };
    }
    return {
      cardBorder: 'border-slate-800/80 bg-[#0c121e]/90 hover:border-slate-700/80',
      textValue: 'text-slate-100',
      badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      barColor: 'bg-cyan-400',
    };
  };

  const styles = getStatusStyles();

  return (
    <div
      id={`telemetry-card-${id}`}
      className={`rounded-lg border ${styles.cardBorder} p-3 transition-all duration-200 backdrop-blur-sm relative flex flex-col justify-between`}
    >
      {/* Top Header: Label, Code, and Status/Trend */}
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-tech font-bold text-slate-300 tracking-wider">
            {shortCode}
          </span>
          <span className="text-[10px] text-slate-400 truncate max-w-[105px]">
            {label}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Trend Indicator */}
          <div className="flex items-center text-[10px] text-slate-400">
            {trend === 'up' ? (
              <TrendingUp className="w-3 h-3 text-cyan-400" />
            ) : trend === 'down' ? (
              <TrendingDown className="w-3 h-3 text-slate-400" />
            ) : (
              <Minus className="w-3 h-3 text-slate-600" />
            )}
          </div>

          {/* Status Dot / Badge */}
          {status !== 'NORMAL' && (
            <span
              className={`text-[9px] font-tech font-bold px-1 rounded border uppercase ${styles.badge} animate-pulse`}
            >
              {status}
            </span>
          )}
        </div>
      </div>

      {/* Main Digital Readout */}
      <div className="flex items-baseline justify-between my-1">
        <div className={`text-xl font-bold font-mono-num tracking-tight ${styles.textValue}`}>
          {value.toFixed(decimals)}
        </div>
        <div className="text-xs font-tech text-slate-400 uppercase tracking-wider">
          {unit}
        </div>
      </div>

      {/* Mini Gauge Range Bar */}
      <div className="mt-1">
        <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800 flex">
          <div
            className={`h-full ${styles.barColor} transition-all duration-300 rounded-full`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-[9px] font-mono text-slate-400 mt-1">
          <span>{min}</span>
          <span className="text-slate-400">{max}</span>
        </div>
      </div>
    </div>
  );
};
