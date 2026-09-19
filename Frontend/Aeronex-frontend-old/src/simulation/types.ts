export type OperatingMode = 'IDLE' | 'CRUISE' | 'HIGH_LOAD'
export type Status = 'NORMAL' | 'WARNING' | 'CRITICAL'
export type DegradationScenario = 'NORMAL' | 'COOLING_DEGRADATION' | 'LUBRICATION_DEGRADATION' | 'VIBRATION_INCREASE' | 'SENSOR_DRIFT'
export type AlertLevel = 'INFO' | 'WARNING' | 'CRITICAL'

export interface Telemetry { rpm:number; cht:number; egt:number; oilTemperature:number; oilPressure:number; fuelFlow:number; vibration:number; throttle:number; altitude:number; ambientTemperature:number }
export interface Alert { id:string; time:string; level:AlertLevel; message:string; detail?:string }
export interface MissionPhase { id:number; name:string; state:'COMPLETED'|'CURRENT'|'UPCOMING'; duration:string }
export interface Reliability { status:'LIKELY_TO_COMPLETE'|'AT_RISK'|'UNLIKELY_TO_COMPLETE'|'NOT_AVAILABLE'; score?:number; confidence?:number; reason:string; modelVersion?:string }
export interface SimulationSnapshot { source:'demo'|'backend'; timestamp:string; telemetry:Telemetry; operatingMode:OperatingMode; health:Status; degradation:{ scenario:DegradationScenario; enabled:boolean; severity:number }; mission:{ name:string; progress:number; currentPhase:string; phases:MissionPhase[]; reliability:Reliability }; alerts:Alert[]; environment:{ altitude:number; ambientTemperature:number }; analysis:{ anomaly:string; fault:string; rul?:string; maintenance?:string } }
