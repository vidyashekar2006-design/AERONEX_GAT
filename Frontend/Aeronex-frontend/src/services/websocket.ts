export interface AeronexTelemetry {
  rpm: number;
  cht: number;
  egt: number;
  oilTemperature: number;
  oilPressure: number;
  fuelFlow: number;
  vibration: number;
  throttle: number;
  altitude: number;
  ambientTemperature: number;
}

export interface AeronexAnalysis {
  timestamp?: string;

  data_quality?: {
    status?: string;
    rows?: number;
    sampling_interval_seconds?: number | null;
    missing_ratio?: number;
    invalid_numeric?: number;
    duplicates?: number;
    constant_sensors?: string[];
    range_violations?: Record<string, unknown>;
    sensor_anomalies?: unknown[];
    timestamp_valid?: boolean;
  };

  engine_health?: {
    status?: string;
    score?: number | null;
    confidence?: number | null;
  };

  anomaly?: {
    detected?: boolean;
    score?: number | null;
    severity?: string | null;
    confidence?: number | null;
  };

  fault?: {
    predicted?: string | null;
    probability?: number | null;
    confidence?: number | null;
  };

  degradation?: {
    score?: number | null;
    trend?: string | null;
    rate?: number | null;
    confidence?: number | null;
  };

  rul?: {
    value?: number | null;
    unit?: string;
    status?: string;
    confidence?: number | null;
  };

  maintenance?: {
    action?: string | null;
    priority?: string | null;
    reason?: string | null;
  };

  mission?: {
    completion_probability?: number | null;
    reliability?: number | null;
    risk?: string | null;
    decision?: string | null;
    confidence?: number | null;
  };

  explanations?: string[];

  model_metadata?: Record<string, unknown>;

  inference_latency_ms?: number;

  [key: string]: unknown;
}

export interface AeronexSnapshot {
  timestamp: string;

  telemetry: {
    rpm: number;
    cht: number;
    egt: number;
    oil_temperature: number;
    oil_pressure: number;
    fuel_flow: number;
    vibration: number;
  };

  engine: {
    throttle: number;
    operating_mode: string;
  };

  environment: {
    altitude: number;
    ambient_temperature: number;
  };

  degradation: {
    enabled?: boolean;
    scenario?: string;
    severity?: number;
    [key: string]: unknown;
  };

  health: {
    status?: string;
    score?: number | null;
    confidence?: number | null;
    [key: string]: unknown;
  };

  mission: {
    mission_name?: string;
    phase?: string | null;
    phase_index?: number | null;
    total_phases?: number | null;
    progress?: number | null;
    altitude?: number;
    throttle?: number;
    elapsed_time?: number;
    estimated_end?: string | null;
    mission_reliability?: Record<string, unknown>;
    [key: string]: unknown;
  };

  analysis: AeronexAnalysis;
}

export type SnapshotListener = (
  snapshot: AeronexSnapshot
) => void;

export type ConnectionListener = (
  connected: boolean
) => void;

const getWebSocketUrl = (): string => {
  const protocol =
    window.location.protocol === 'https:' ? 'wss:' : 'ws:';

  return `${protocol}//${window.location.hostname}:8000/ws/simulation`;
};

export class AeronexWebSocket {
  private socket: WebSocket | null = null;
  private reconnectTimer: number | null = null;
  private stopped = false;

  private readonly onSnapshot: SnapshotListener;
  private readonly onConnection: ConnectionListener;

  constructor(
    onSnapshot: SnapshotListener,
    onConnection: ConnectionListener
  ) {
    this.onSnapshot = onSnapshot;
    this.onConnection = onConnection;
  }

  connect(): void {
    this.stopped = false;

    if (
      this.socket &&
      (
        this.socket.readyState === WebSocket.OPEN ||
        this.socket.readyState === WebSocket.CONNECTING
      )
    ) {
      return;
    }

    const url = getWebSocketUrl();

    console.log(
      `🔌 Aeronex WebSocket connecting: ${url}`
    );

    this.socket = new WebSocket(url);

    this.socket.onopen = () => {
      console.log(
        '🟢 Aeronex WebSocket connected'
      );

      this.onConnection(true);
    };

    this.socket.onmessage = (event: MessageEvent) => {
      try {
        const snapshot =
          JSON.parse(event.data) as AeronexSnapshot;

        console.log(
          '📡 Aeronex snapshot received:',
          snapshot
        );

        this.onSnapshot(snapshot);
      } catch (error) {
        console.error(
          '❌ Failed to parse Aeronex WebSocket data:',
          error
        );
      }
    };

    this.socket.onerror = (error) => {
      console.error(
        '❌ Aeronex WebSocket error:',
        error
      );
    };

    this.socket.onclose = () => {
      console.log(
        '🔴 Aeronex WebSocket disconnected'
      );

      this.onConnection(false);

      this.socket = null;

      if (!this.stopped) {
        this.scheduleReconnect();
      }
    };
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer !== null) {
      return;
    }

    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;

      if (!this.stopped) {
        this.connect();
      }
    }, 2000);
  }

  disconnect(): void {
    this.stopped = true;

    if (this.reconnectTimer !== null) {
      window.clearTimeout(
        this.reconnectTimer
      );

      this.reconnectTimer = null;
    }

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    this.onConnection(false);
  }
}