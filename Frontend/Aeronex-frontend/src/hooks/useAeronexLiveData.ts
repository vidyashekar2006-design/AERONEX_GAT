import { useEffect, useState } from 'react';
import {
  AeronexSnapshot,
  AeronexWebSocket,
} from '../services/websocket';

export function useAeronexLiveData() {
  const [snapshot, setSnapshot] =
    useState<AeronexSnapshot | null>(null);

  const [connected, setConnected] =
    useState(false);

  useEffect(() => {
    const client = new AeronexWebSocket(
      setSnapshot,
      setConnected
    );

    client.connect();

    return () => {
      client.disconnect();
    };
  }, []);

  return {
    snapshot,
    connected,
  };
}