export type SystemHealthStatus = 'NORMAL' | 'WARNING' | 'CRITICAL' | 'NOT AVAILABLE' | 'DEMO';

export interface TelemetryParam {
  id: string;
  name: string;
  shortName: string;
  value: number | string;
  unit: string;
  status: SystemHealthStatus;
  nominalRange: string;
  min: number;
  max: number;
  history: number[];
  category: 'core' | 'thermal' | 'fluid' | 'dynamics' | 'flight';
}

export interface EngineComponent {
  id: string;
  name: string;
  system: string;
  status: SystemHealthStatus;
  material: string;
  temperature?: string;
  pressure?: string;
  vibration?: string;
  description: string;
  sensorId?: string;
}

export interface EventAlert {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARNING' | 'CAUTION';
  code: string;
  message: string;
  source: string;
}

export interface MissionPhase {
  id: string;
  name: string;
  label: string;
  status: 'completed' | 'current' | 'upcoming';
  durationEst: string;
  altitudeEst: string;
}

export interface ReportItem {
  id: string;
  title: string;
  code: string;
  date: string;
  type: string;
  author: string;
  status: string;
  summary: string;
  pages: number;
}
