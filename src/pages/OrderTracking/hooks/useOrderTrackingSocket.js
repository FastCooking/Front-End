import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * @typedef {import('../types').Order} Order
 * @typedef {import('../types').WsPayload} WsPayload
 * @typedef {import('../types').ConnectionStatus} ConnectionStatus
 */

const BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

/**
 * Calcula o delay de backoff exponencial com jitter.
 * @param {number} attempt - Número da tentativa (0-indexed).
 * @returns {number} Delay em milissegundos.
 */
function getBackoffDelay(attempt) {
  const base = 1000;
  const max = 30000;
  const delay = Math.min(base * Math.pow(2, attempt), max);
  // Adiciona jitter de ±25% para evitar thundering herd
  const jitter = delay * 0.25 * (Math.random() * 2 - 1);
  return Math.round(delay + jitter);
}

/**
 * Constrói a URL do WebSocket a partir da URL da API REST.
 * Converte http(s) → ws(s) e monta o path.
 * @param {string} orderId
 * @returns {string}
 */
function buildWsUrl(orderId) {
  const wsBase = BASE_URL
    .replace(/^http/, 'ws')
    .replace(/\/+$/, '');
  return `${wsBase}/ws/tracking/${orderId}`;
}

/**
 * Custom Hook para gerenciar a conexão WebSocket de acompanhamento de pedido.
 *
 * Responsabilidades:
 * - Abrir conexão WebSocket ao montar
 * - Reconexão automática com backoff exponencial
 * - Atualizar o estado do pedido em tempo real (< 1s)
 * - Cleanup completo no desmontar
 * - Expor status de conexão para feedback visual
 *
 * @param {string|undefined} orderId - ID do pedido a rastrear.
 * @returns {{
 *   order: Order|null,
 *   connectionStatus: ConnectionStatus,
 *   error: string|null,
 *   isLoading: boolean,
 *   reconnectAttempt: number,
 * }}
 */
export function useOrderTrackingSocket(orderId) {
  const [order, setOrder] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('CONNECTING');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);

  const wsRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const attemptRef = useRef(0);
  const isMountedRef = useRef(true);
  const intentionalCloseRef = useRef(false);

  /**
   * Processa uma mensagem recebida do WebSocket.
   * @param {WsPayload} payload
   */
  const handleMessage = useCallback((payload) => {
    if (!isMountedRef.current) return;

    switch (payload.type) {
      case 'ORDER_UPDATE': {
        if (payload.order) {
          setOrder(payload.order);
          setIsLoading(false);
          setError(null);
        }
        break;
      }

      case 'ITEM_UPDATE': {
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

      case 'QUEUE_UPDATE': {
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

      case 'ERROR': {
        setError(payload.message || 'Erro desconhecido');
        setIsLoading(false);
        break;
      }

      default:
        // Tenta interpretar como snapshot completo do pedido (fallback)
        if (payload.id && payload.items) {
          setOrder(payload);
          setIsLoading(false);
          setError(null);
        }
        break;
    }
  }, []);

  /**
   * Cria e retorna uma nova instância de WebSocket.
   */
  const connect = useCallback(function doConnect() {
    if (!orderId || !isMountedRef.current) return;

    // Limpa conexão anterior
    if (wsRef.current) {
      intentionalCloseRef.current = true;
      wsRef.current.close();
    }

    const url = buildWsUrl(orderId);
    setConnectionStatus(attemptRef.current === 0 ? 'CONNECTING' : 'RECONNECTING');

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;
      intentionalCloseRef.current = false;

      ws.onopen = () => {
        if (!isMountedRef.current) return;
        attemptRef.current = 0;
        setReconnectAttempt(0);
        setConnectionStatus('CONNECTED');
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          handleMessage(payload);
        } catch {
          console.warn('[OrderTracking WS] Falha ao parsear mensagem:', event.data);
        }
      };

      ws.onerror = () => {
        if (!isMountedRef.current) return;
        // O evento 'close' será disparado em seguida, a reconexão acontece lá
      };

      ws.onclose = (event) => {
        if (!isMountedRef.current) return;

        wsRef.current = null;

        // Se o fechamento foi intencional (cleanup/unmount), não reconecta
        if (intentionalCloseRef.current) {
          setConnectionStatus('DISCONNECTED');
          return;
        }

        // Código 4404 = pedido não encontrado (convenção customizada)
        if (event.code === 4404) {
          setError('Pedido não encontrado. Verifique o código informado.');
          setIsLoading(false);
          setConnectionStatus('DISCONNECTED');
          return;
        }

        // Agenda reconexão com backoff exponencial
        setConnectionStatus('RECONNECTING');
        const delay = getBackoffDelay(attemptRef.current);
        attemptRef.current += 1;
        setReconnectAttempt(attemptRef.current);

        reconnectTimerRef.current = setTimeout(() => {
          if (isMountedRef.current) {
            doConnect();
          }
        }, delay);
      };
    } catch (err) {
      console.error('[OrderTracking WS] Erro ao criar WebSocket:', err);
      setError('Não foi possível conectar ao servidor.');
      setIsLoading(false);
      setConnectionStatus('DISCONNECTED');
    }
  }, [orderId, handleMessage]);

  // Efeito principal: conecta ao montar, limpa ao desmontar
  useEffect(() => {
    isMountedRef.current = true;
    attemptRef.current = 0;

    if (!orderId) {
      setTimeout(() => {
        if (isMountedRef.current) {
          setError('ID do pedido não informado.');
          setIsLoading(false);
          setConnectionStatus('DISCONNECTED');
        }
      }, 0);
      return;
    }

    setError(null);
    setIsLoading(true);
    setOrder(null);
    connect();

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
  }, [orderId, connect]);

  return {
    order,
    connectionStatus,
    error,
    isLoading,
    reconnectAttempt,
  };
}
