import { TelemetryParam, EngineComponent, EventAlert, MissionPhase, ReportItem } from '../types';

export const NOMINAL_TELEMETRY: Record<string, TelemetryParam> = {
  rpm: {
    id: 'rpm',
    name: 'Engine Speed',
    shortName: 'RPM',
    value: 4250,
    unit: 'RPM',
    status: 'NORMAL',
    nominalRange: '4000 - 4600',
    min: 0,
    max: 6000,
    history: [4210, 4220, 4235, 4240, 4250, 4245, 4250, 4260, 4255, 4250, 4248, 4250],
    category: 'core'
  },
  cht: {
    id: 'cht',
    name: 'Cylinder Head Temp',
    shortName: 'CHT',
    value: 96,
    unit: '°C',
    status: 'NORMAL',
    nominalRange: '80 - 110',
    min: 20,
    max: 180,
    history: [94, 95, 95, 96, 96, 95, 96, 97, 96, 96, 96, 96],
    category: 'thermal'
  },
  egt: {
    id: 'egt',
    name: 'Exhaust Gas Temp',
    shortName: 'EGT',
    value: 540,
    unit: '°C',
    status: 'NORMAL',
    nominalRange: '480 - 620',
    min: 200,
    max: 850,
    history: [535, 538, 539, 540, 542, 540, 539, 541, 540, 540, 538, 540],
    category: 'thermal'
  },
  oilPressure: {
    id: 'oilPressure',
    name: 'Oil Pressure',
    shortName: 'OIL PRESSURE',
    value: 3.8,
    unit: 'bar',
    status: 'NORMAL',
    nominalRange: '3.0 - 5.0',
    min: 0,
    max: 7.0,
    history: [3.75, 3.8, 3.8, 3.82, 3.8, 3.79, 3.81, 3.8, 3.8, 3.79, 3.8, 3.8],
    category: 'fluid'
  },
  oilTemp: {
    id: 'oilTemp',
    name: 'Oil Temperature',
    shortName: 'OIL TEMP',
    value: 88,
    unit: '°C',
    status: 'NORMAL',
    nominalRange: '75 - 105',
    min: 20,
    max: 150,
    history: [86, 87, 87, 88, 88, 88, 89, 88, 88, 88, 87, 88],
    category: 'fluid'
  },
  vibration: {
    id: 'vibration',
    name: 'Engine Vibration (RMS)',
    shortName: 'VIBRATION',
    value: 0.18,
    unit: 'mm/s',
    status: 'NORMAL',
    nominalRange: '0.05 - 0.40',
    min: 0,
    max: 1.0,
    history: [0.16, 0.17, 0.19, 0.18, 0.18, 0.17, 0.18, 0.19, 0.18, 0.18, 0.17, 0.18],
    category: 'dynamics'
  },
  fuelFlow: {
    id: 'fuelFlow',
    name: 'Fuel Consumption Rate',
    shortName: 'FUEL FLOW',
    value: 28.4,
    unit: 'L/h',
    status: 'NORMAL',
    nominalRange: '24.0 - 34.0',
    min: 0,
    max: 50.0,
    history: [28.1, 28.2, 28.5, 28.4, 28.3, 28.4, 28.6, 28.4, 28.3, 28.4, 28.5, 28.4],
    category: 'fluid'
  },
  throttle: {
    id: 'throttle',
    name: 'Throttle Position',
    shortName: 'THROTTLE',
    value: 74,
    unit: '%',
    status: 'NORMAL',
    nominalRange: '0 - 100',
    min: 0,
    max: 100,
    history: [74, 74, 74, 74, 74, 74, 74, 74, 74, 74, 74, 74],
    category: 'core'
  },
  altitude: {
    id: 'altitude',
    name: 'Pressure Altitude',
    shortName: 'ALTITUDE',
    value: '8,500',
    unit: 'ft',
    status: 'NORMAL',
    nominalRange: '0 - 25,000',
    min: 0,
    max: 25000,
    history: [8480, 8490, 8495, 8500, 8500, 8500, 8505, 8500, 8500, 8500, 8500, 8500],
    category: 'flight'
  },
  ambientTemp: {
    id: 'ambientTemp',
    name: 'Outside Air Temperature',
    shortName: 'AMBIENT TEMP',
    value: -4,
    unit: '°C',
    status: 'NORMAL',
    nominalRange: '-40 - +45',
    min: -50,
    max: 50,
    history: [-3, -4, -4, -4, -4, -5, -4, -4, -4, -4, -4, -4],
    category: 'flight'
  }
};

export const DEGRADED_TELEMETRY_DELTA = {
  cht: { value: 134, status: 'WARNING' as const, history: [96, 102, 110, 118, 126, 131, 134] },
  oilTemp: { value: 109, status: 'WARNING' as const, history: [88, 92, 98, 103, 107, 109, 109] },
  vibration: { value: 0.38, status: 'WARNING' as const, history: [0.18, 0.22, 0.28, 0.33, 0.36, 0.38, 0.38] }
};

export const ENGINE_COMPONENTS: EngineComponent[] = [
  {
    id: 'cyl1',
    name: 'CYLINDER 1 & HEAD',
    system: 'Thermal & Combustion (Starboard Fwd)',
    status: 'NORMAL',
    material: 'Forged Al-Si Alloy with Cast Iron Liner',
    temperature: '96 °C',
    pressure: 'Nominal peak (Pmax ~72 bar)',
    vibration: '0.18 mm/s',
    description: 'Starboard forward cylinder assembly with finned air/liquid cooling jacket and dual spark plugs.',
    sensorId: 'SEN-CHT-01'
  },
  {
    id: 'cyl2',
    name: 'CYLINDER 2 & HEAD',
    system: 'Thermal & Combustion (Port Fwd)',
    status: 'NORMAL',
    material: 'Forged Al-Si Alloy with Cast Iron Liner',
    temperature: '98 °C',
    pressure: 'Nominal peak (Pmax ~71 bar)',
    vibration: '0.19 mm/s',
    description: 'Port forward opposed cylinder assembly with high-efficiency cooling fins and thermocouple well.',
    sensorId: 'SEN-CHT-02'
  },
  {
    id: 'cyl3',
    name: 'CYLINDER 3 & HEAD',
    system: 'Thermal & Combustion (Starboard Aft)',
    status: 'NORMAL',
    material: 'Forged Al-Si Alloy with Cast Iron Liner',
    temperature: '95 °C',
    pressure: 'Nominal peak (Pmax ~72 bar)',
    vibration: '0.17 mm/s',
    description: 'Starboard aft opposed cylinder assembly with crossflow overhead valves.',
    sensorId: 'SEN-CHT-03'
  },
  {
    id: 'cyl4',
    name: 'CYLINDER 4 & HEAD',
    system: 'Thermal & Combustion (Port Aft)',
    status: 'NORMAL',
    material: 'Forged Al-Si Alloy with Cast Iron Liner',
    temperature: '97 °C',
    pressure: 'Nominal peak (Pmax ~71 bar)',
    vibration: '0.18 mm/s',
    description: 'Port aft opposed cylinder assembly. Monitored for cooling envelope margins.',
    sensorId: 'SEN-CHT-04'
  },
  {
    id: 'crankcase',
    name: 'MAIN CRANKCASE',
    system: 'Structural & Lubrication Base',
    status: 'NORMAL',
    material: 'Aerospace Cast Aluminum-Copper A356-T6',
    temperature: '84 °C',
    pressure: 'Internal case ~0.04 bar crankcase breather',
    vibration: '0.14 mm/s',
    description: 'Vertically split two-piece rigid crankcase housing crankshaft bearings, camshaft, and oil gallery conduits.',
    sensorId: 'SEN-VIB-01'
  },
  {
    id: 'propshaft',
    name: 'PROPELLER SHAFT & REDUCTION',
    system: 'Drivetrain & Mechanical Output',
    status: 'NORMAL',
    material: 'Nitrided 4340 High-Tensile Steel',
    temperature: '76 °C',
    vibration: '0.15 mm/s',
    description: 'Integrated planetary reduction gearbox shaft with SAE flange and dual tapered roller thrust bearings.',
    sensorId: 'SEN-RPM-01'
  },
  {
    id: 'exhaust',
    name: 'EXHAUST MANIFOLD & COLLECTOR',
    system: 'Exhaust Gas Scavenging',
    status: 'NORMAL',
    material: 'Inconel 625 / 321 Stainless Steel',
    temperature: '540 °C',
    description: 'Tuned 4-into-1 stainless header assembly with welded thermocouple bosses for individual cylinder EGT sampling.',
    sensorId: 'SEN-EGT-01'
  },
  {
    id: 'intake',
    name: 'INDUCTION MANIFOLD & PLENUM',
    system: 'Fuel/Air Induction',
    status: 'NORMAL',
    material: 'Carbon-Composite Molded Runner',
    temperature: '22 °C (Post-intercooler)',
    pressure: 'MAP 28.2 inHg',
    description: 'Equalized runner plenum distributing metered air to port fuel injectors with intake air temp sensing.',
    sensorId: 'SEN-MAP-01'
  },
  {
    id: 'oilsump',
    name: 'LUBRICATION SUMP & FILTER',
    system: 'Fluid Recirculation & Scavenge',
    status: 'NORMAL',
    material: 'Magnesium-Aluminum Alloy Cast Sump',
    temperature: '88 °C',
    pressure: '3.8 bar regulated',
    description: 'Dry-sump scavenge pickup block with dual filter bypass valves and oil pressure transducer module.',
    sensorId: 'SEN-OIL-01'
  }
];

export const INITIAL_ALERTS: EventAlert[] = [
  {
    id: 'evt-01',
    timestamp: '12:41:12',
    level: 'INFO',
    code: 'NAV-302',
    message: 'Mission phase → CRUISE',
    source: 'Mission Management Subsystem'
  },
  {
    id: 'evt-02',
    timestamp: '12:41:32',
    level: 'INFO',
    code: 'ENG-101',
    message: 'Engine operating state stable',
    source: 'FADEC Telemetry Channel A'
  },
  {
    id: 'evt-03',
    timestamp: '12:42:01',
    level: 'INFO',
    code: 'DTW-044',
    message: 'Telemetry stream simulated',
    source: 'Digital Twin Synchronizer'
  },
  {
    id: 'evt-04',
    timestamp: '12:42:18',
    level: 'INFO',
    code: 'VIB-008',
    message: 'Harmonic spectral baseline verified',
    source: 'Dynamics Monitor'
  }
];

export const MISSION_PHASES: MissionPhase[] = [
  { id: 'p1', name: 'START', label: 'PRE-FLIGHT & START', status: 'completed', durationEst: '15m', altitudeEst: '0 ft' },
  { id: 'p2', name: 'TAKEOFF', label: 'RUNWAY TAKEOFF', status: 'completed', durationEst: '8m', altitudeEst: '0 - 1,200 ft' },
  { id: 'p3', name: 'CLIMB', label: 'ENROUTE CLIMB', status: 'completed', durationEst: '24m', altitudeEst: '1,200 - 8,500 ft' },
  { id: 'p4', name: 'CRUISE', label: 'LOITER & RECON (CRUISE)', status: 'current', durationEst: '3h 40m', altitudeEst: '8,500 ft' },
  { id: 'p5', name: 'HIGH ALTITUDE', label: 'HIGH ALT TRANSIENT', status: 'upcoming', durationEst: '45m', altitudeEst: '14,000 ft' },
  { id: 'p6', name: 'RETURN', label: 'BASE INGRESS & DESCENT', status: 'upcoming', durationEst: '35m', altitudeEst: '8,500 - 0 ft' },
  { id: 'p7', name: 'COMPLETE', label: 'LANDING & SHUTDOWN', status: 'upcoming', durationEst: '10m', altitudeEst: '0 ft' }
];

export const AEROSPACE_REPORTS: ReportItem[] = [
  {
    id: 'rep-01',
    title: 'ENGINE HEALTH REPORT',
    code: 'AER-RPT-ENG-2026-089',
    date: '2026-09-11 12:40 UTC',
    type: 'Subsystem Integrity Audit',
    author: 'AERONEX Diagnostics Engine',
    status: 'CERTIFIED NOMINAL (DEMO)',
    summary: 'Comprehensive audit of 4-cylinder aero piston powerplant. All primary thermal boundaries, oil film pressures, and crankcase harmonics within envelope.',
    pages: 14
  },
  {
    id: 'rep-02',
    title: 'MISSION ANALYSIS REPORT',
    code: 'AER-RPT-MIS-2026-042',
    date: '2026-09-11 12:35 UTC',
    type: 'ISR Flight Profile Review',
    author: 'Team AETHERIS Operations',
    status: 'PHASE EVALUATION COMPLETE',
    summary: 'Long-Duration ISR demonstration flight telemetry comparison against mission baseline envelope. Cruise loiter fuel burn rate is 28.4 L/h.',
    pages: 22
  },
  {
    id: 'rep-03',
    title: 'TELEMETRY SUMMARY',
    code: 'AER-RPT-TEL-2026-104',
    date: '2026-09-11 12:42 UTC',
    type: 'Sensor Array Time-Series Log',
    author: 'AERONEX Data Acquisition (DAQ)',
    status: 'STATIC DEMO LOG',
    summary: 'Synchronized snapshot of 10 primary aero parameters: RPM, CHT, EGT, Oil Temp, Oil Pressure, Fuel Flow, Vibration, Throttle, Altitude, and Ambient Temp.',
    pages: 8
  },
  {
    id: 'rep-04',
    title: 'DEGRADATION REPORT',
    code: 'AER-RPT-DEG-2026-017',
    date: '2026-09-11 12:30 UTC',
    type: 'Component Wear & Thermal Margin Analysis',
    author: 'Digital Twin Analytical Pipeline',
    status: 'SCENARIO AUDIT: NORMAL',
    summary: 'Zero anomalous thermal accumulation detected. Cooling degradation simulation model calibrated and available for demonstration preview.',
    pages: 18
  }
];
