export type UnknownRecord = Record<string, unknown>

export interface SimulationSnapshot {
  telemetry?: UnknownRecord
  engine?: UnknownRecord
  environment?: UnknownRecord
  degradation?: UnknownRecord
  health?: UnknownRecord
  mission?: UnknownRecord
  analysis?: UnknownRecord
}
