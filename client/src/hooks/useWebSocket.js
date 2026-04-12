import { useEffect, useRef, useState, useCallback } from 'react';

export default function useWebSocket() {
  const wsRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [lastEvent, setLastEvent] = useState(null);
  const reconnectTimer = useRef(null);

  const connect = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const host = window.location.hostname;
    const wsUrl = `${protocol}://${host}:5000/ws?token=${token}`;

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('[WS] Connected');
      setConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        setLastEvent(data);

        if (data.type === 'threat_alert') {
          setAlerts((prev) => [data, ...prev].slice(0, 50));
        }

        if (data.type === 'scan_complete') {
          setAlerts((prev) => [data, ...prev].slice(0, 50));
        }
      } catch {}
    };

    ws.onclose = () => {
      console.log('[WS] Disconnected');
      setConnected(false);
      // Auto-reconnect after 3 seconds
      reconnectTimer.current = setTimeout(connect, 3000);
    };

    ws.onerror = () => {
      ws.close();
    };

    wsRef.current = ws;
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    };
  }, [connect]);

  const clearAlerts = useCallback(() => setAlerts([]), []);

  return { connected, alerts, lastEvent, clearAlerts };
}