import { useCallback, useEffect, useRef, useState } from "react";
import { API_BASE } from "../../../config/api";

function getBackoffDelay(attempt) {
  const base = 1000;
  const max = 30000;
  const delay = Math.min(base * Math.pow(2, attempt), max);
  const jitter = delay * 0.25 * (Math.random() * 2 - 1);
  return Math.round(delay + jitter);
}

function buildWsUrl(orderId) {
  const wsBase = API_BASE.replace(/^http/, "ws").replace(/\/+$/, "");
  return `${wsBase}/ws/tracking/${orderId}`;
}

export function useOrderTrackingSocket(orderId) {
  const [order, setOrder] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("CONNECTING");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);

  const wsRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const attemptRef = useRef(0);
  const isMountedRef = useRef(true);
  const intentionalCloseRef = useRef(false);

  const handleMessage = useCallback((payload) => {
    if (!isMountedRef.current) return;

    switch (payload.type) {
      case "ORDER_UPDATE": {
        if (payload.order) {
          setOrder(payload.order);
          setIsLoading(false);
          setError(null);
        }
        break;
      }

      case "ITEM_UPDATE": {
        if (payload.item) {
          setOrder((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              items: prev.items.map((it) =>
                String(it.id) === String(payload.item.id)
                  ? { ...it, ...payload.item }
                  : it
              ),
              updatedAt: new Date().toISOString(),
            };
          });
        }
        break;
      }

      case "QUEUE_UPDATE": {
        if (payload.queue) {
          setOrder((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              estimatedMinutesMin:
                payload.queue.estimatedMinutesMin ?? prev.estimatedMinutesMin,
              estimatedMinutesMax:
                payload.queue.estimatedMinutesMax ?? prev.estimatedMinutesMax,
              queuePosition: payload.queue.position ?? prev.queuePosition,
              updatedAt: new Date().toISOString(),
            };
          });
        }
        break;
      }

      case "ERROR": {
        setError(payload.message || "Erro desconhecido");
        setIsLoading(false);
        break;
      }

      default:
        if (payload.id && payload.items) {
          setOrder(payload);
          setIsLoading(false);
          setError(null);
        }
        break;
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    attemptRef.current = 0;

    if (!orderId) {
      Promise.resolve().then(() => {
        if (isMountedRef.current) {
          setError("ID do pedido não informado.");
          setIsLoading(false);
          setConnectionStatus("DISCONNECTED");
        }
      });
      return;
    }

    function doConnect() {
      if (!orderId || !isMountedRef.current) return;

      if (wsRef.current) {
        intentionalCloseRef.current = true;
        wsRef.current.close();
      }

      const url = buildWsUrl(orderId);
      setConnectionStatus(
        attemptRef.current === 0 ? "CONNECTING" : "RECONNECTING"
      );

      try {
        const ws = new WebSocket(url);
        wsRef.current = ws;
        intentionalCloseRef.current = false;

        ws.onopen = () => {
          if (!isMountedRef.current) return;
          attemptRef.current = 0;
          setReconnectAttempt(0);
          setConnectionStatus("CONNECTED");
        };

        ws.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data);
            handleMessage(payload);
          } catch {
            // Ignora mensagem malformada
          }
        };

        ws.onclose = (event) => {
          if (!isMountedRef.current) return;
          wsRef.current = null;

          if (intentionalCloseRef.current) {
            setConnectionStatus("DISCONNECTED");
            return;
          }

          if (event.code === 4404) {
            setError("Pedido não encontrado. Verifique o código informado.");
            setIsLoading(false);
            setConnectionStatus("DISCONNECTED");
            return;
          }

          setConnectionStatus("RECONNECTING");
          const delay = getBackoffDelay(attemptRef.current);
          attemptRef.current += 1;
          setReconnectAttempt(attemptRef.current);

          reconnectTimerRef.current = setTimeout(() => {
            if (isMountedRef.current) {
              doConnect();
            }
          }, delay);
        };
      } catch {
        setError("Não foi possível conectar ao servidor.");
        setIsLoading(false);
        setConnectionStatus("DISCONNECTED");
      }
    }

    Promise.resolve().then(() => {
      if (isMountedRef.current) {
        setError(null);
        setIsLoading(true);
        setOrder(null);
        doConnect();
      }
    });

    return () => {
      isMountedRef.current = false;
      intentionalCloseRef.current = true;

      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }

      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [orderId, handleMessage]);

  return {
    order,
    connectionStatus,
    error,
    isLoading,
    reconnectAttempt,
  };
}
