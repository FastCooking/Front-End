import { useParams, useSearchParams } from 'react-router-dom';
import { useOrderTrackingSocket } from './hooks/useOrderTrackingSocket';
import { STATUS_LABELS } from './types';

import ConnectionBanner from './components/ConnectionBanner';
import OrderProgressBar from './components/OrderProgressBar';
import OrderItemCard from './components/OrderItemCard';
import StatusBadge from './components/StatusBadge';
import OrderTrackingSkeleton from './components/OrderTrackingSkeleton';
import OrderNotFound from './components/OrderNotFound';

import logo from '../../assets/fast cooking logo.png';

/**
 * Formata um Date ISO-8601 para "HH:mm" local.
 * @param {string} isoStr
 * @returns {string}
 */
function formatTime(isoStr) {
  if (!isoStr) return '--:--';
  const d = new Date(isoStr);
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Calcula quanto tempo se passou desde a criação do pedido, em formato "Xm" ou "Xh Ym".
 * @param {string} createdAt
 * @returns {string}
 */
function getElapsedTime(createdAt) {
  if (!createdAt) return '';
  const diff = Math.max(0, Date.now() - new Date(createdAt).getTime());
  const totalMin = Math.floor(diff / 60000);
  if (totalMin < 60) return `${totalMin}min`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${h}h ${m}min`;
}

/**
 * Tela pública de acompanhamento de pedido em tempo real.
 *
 * Aceita o ID do pedido via:
 * - Route param: `/tracking/:orderId`
 * - Query param: `/tracking?orderId=...`
 */
export default function OrderTracking() {
  const { orderId: paramId } = useParams();
  const [searchParams] = useSearchParams();
  const orderId = paramId || searchParams.get('orderId');

  const {
    order,
    connectionStatus,
    error,
    isLoading,
    reconnectAttempt,
  } = useOrderTrackingSocket(orderId);

  // ─── Estado: sem orderId ──────────────────────────────────────
  if (!orderId) {
    return <OrderNotFound message="Nenhum código de pedido foi informado na URL." />;
  }

  // ─── Estado: carregando ───────────────────────────────────────
  if (isLoading && !error) {
    return (
      <>
        <ConnectionBanner connectionStatus={connectionStatus} reconnectAttempt={reconnectAttempt} />
        <OrderTrackingSkeleton />
      </>
    );
  }

  // ─── Estado: erro ─────────────────────────────────────────────
  if (error && !order) {
    return (
      <>
        <ConnectionBanner connectionStatus={connectionStatus} reconnectAttempt={reconnectAttempt} />
        <OrderNotFound message={error} orderId={orderId} />
      </>
    );
  }

  // ─── Estado: pedido carregado ─────────────────────────────────
  const items = order?.items || [];
  const totalItems = items.length;
  const readyOrDelivered = items.filter(
    (it) => it.status === 'READY' || it.status === 'DELIVERED'
  ).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F9ECE5] via-white to-[#F9ECE5] font-[Poppins]">
      {/* Banner de conexão */}
      <ConnectionBanner connectionStatus={connectionStatus} reconnectAttempt={reconnectAttempt} />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* ─── Header ─────────────────────────────────────────── */}
        <header className="text-center mb-10">
          <a href="/" className="inline-block mb-4">
            <img src={logo} alt="Fast Cooking" className="h-10 mx-auto" />
          </a>
          <span className="text-[#B78A10] font-semibold text-xs uppercase tracking-widest block mb-2">
            Acompanhamento de Pedido
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Pedido #{order?.id}
          </h1>
          <div className="flex items-center justify-center gap-3 mt-3 text-sm text-gray-500">
            {order?.tableNumber && (
              <span className="inline-flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6z" />
                </svg>
                Mesa {order.tableNumber}
              </span>
            )}
            {order?.createdAt && (
              <span className="inline-flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {formatTime(order.createdAt)}
                <span className="text-gray-400">({getElapsedTime(order.createdAt)} atrás)</span>
              </span>
            )}
          </div>
        </header>

        {/* ─── Tempo Estimado de Entrega ──────────────────────── */}
        <section
          className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6 text-center"
          id="estimated-time"
        >
          <div className="flex items-center justify-center gap-4">
            <div className="w-14 h-14 bg-[#9C1C0E]/10 rounded-2xl flex items-center justify-center flex-shrink-0">
              <svg className="w-7 h-7 text-[#9C1C0E]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-0.5">
                Tempo estimado
              </p>
              <p className="text-3xl sm:text-4xl font-bold text-[#9C1C0E] leading-tight">
                {order?.estimatedMinutesMin ?? '–'}
                <span className="text-gray-400 mx-1">-</span>
                {order?.estimatedMinutesMax ?? '–'}
                <span className="text-lg font-medium text-gray-500 ml-1.5">min</span>
              </p>
            </div>
          </div>

          {order?.queuePosition != null && (
            <p className="mt-3 text-sm text-gray-500">
              📋 Posição na fila: <strong className="text-gray-800">{order.queuePosition}º</strong>
            </p>
          )}
        </section>

        {/* ─── Barra de Progresso ─────────────────────────────── */}
        <section className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6" id="order-progress">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-5">
            Progresso do Pedido
          </h2>
          <OrderProgressBar status={order?.status || 'PENDING'} />
        </section>

        {/* ─── Lista de Itens ─────────────────────────────────── */}
        <section className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6" id="order-items">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
              Itens do Pedido
            </h2>
            <span className="text-xs text-gray-400 font-medium">
              {readyOrDelivered}/{totalItems} prontos
            </span>
          </div>

          {items.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">
              Nenhum item encontrado neste pedido.
            </p>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <OrderItemCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </section>

        {/* ─── Rodapé / Atualização ──────────────────────────── */}
        <footer className="mt-8 text-center">
          {order?.updatedAt && (
            <p className="text-xs text-gray-400">
              Última atualização: {formatTime(order.updatedAt)}
            </p>
          )}
          <div className="mt-3 flex items-center justify-center gap-2">
            {connectionStatus === 'CONNECTED' ? (
              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Atualização em tempo real
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs text-amber-600 font-medium">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                {connectionStatus === 'RECONNECTING' ? 'Reconectando...' : 'Desconectado'}
              </span>
            )}
          </div>

          <p className="mt-6 text-xs text-gray-300">
            © {new Date().getFullYear()} FastCooking
          </p>
        </footer>
      </div>
    </div>
  );
}
