# Entity relationships

```mermaid
erDiagram
  ENGINES ||--o{ MISSION_RUNS : participates_in
  MISSION_RUNS ||--o{ MISSION_PHASES : contains
  ENGINES ||--o{ TELEMETRY : emits
  MISSION_RUNS ||--o{ TELEMETRY : contextualizes
  TELEMETRY ||--o| PROCESSED_TELEMETRY : derives
  ENGINES ||--o{ ENGINE_FEATURES : has
  ENGINES ||--o{ DIGITAL_TWIN_STATES : has
  ENGINES ||--o{ ENGINE_HEALTH_STATES : has
  ENGINES ||--o{ HEALTH_EVENTS : has
  ENGINES ||--o{ DEGRADATION_STATES : has
  ENGINES ||--o{ ANALYSIS_RESULTS : has
  ENGINES ||--o{ RUL_RESULTS : has
  ENGINES ||--o{ MISSION_RELIABILITY : has
  DATASETS ||--o{ MODEL_VERSIONS : trains
```

Foreign keys use `RESTRICT`, preserving historical data. Raw telemetry is never overwritten; processed values and features have distinct tables and version/provenance fields.
