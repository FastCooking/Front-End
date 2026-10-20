import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useOrderTrackingSocket } from './hooks/useOrderTrackingSocket';
import { chamarGarcom, obterPedidoAtivoMesa } from '../../services/pedidoService';

import ConnectionBanner from './components/ConnectionBanner';
import OrderProgressBar from './components/OrderProgressBar';
import OrderItemCard from './components/OrderItemCard';
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
 * - Resolução por mesa: `/tracking?idMesa=...`
 */
export default function OrderTracking() {
  const { orderId: paramId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const rawOrderId = paramId || searchParams.get('orderId');

  const [activeOrderId, setActiveOrderId] = useState(rawOrderId || null);
  const [buscandoMesa, setBuscandoMesa] = useState(false);
  const [inputBusca, setInputBusca] = useState('');
  const [erroMesa, setErroMesa] = useState('');

  useEffect(() => {
    if (rawOrderId) {
      setActiveOrderId(rawOrderId);
      return;
    }

    const idMesa = searchParams.get('idMesa');
    if (idMesa) {
      setBuscandoMesa(true);
      setErroMesa('');
      obterPedidoAtivoMesa(idMesa)
        .then((dados) => {
          if (dados && dados.idPedido) {
            setActiveOrderId(dados.idPedido);
          } else {
            setErroMesa('Nenhum pedido ativo em preparo encontrado para esta mesa no momento.');
          }
        })
        .catch(() => {
          setErroMesa('Não foi possível localizar pedidos ativos para a mesa indicada.');
        })
        .finally(() => setBuscandoMesa(false));
    }
  }, [rawOrderId, searchParams]);

  const {
    order,
    connectionStatus,
    error,
    isLoading,
    reconnectAttempt,
  } = useOrderTrackingSocket(activeOrderId);

  // Helper para recuperar e atualizar dados da mesa no sessionStorage
  const getStorageMesa = () => {
    try {
      const raw = sessionStorage.getItem('fastcooking_mesa_cliente');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  // Se o pedido trouxer dados da mesa, sincroniza com o sessionStorage
  useEffect(() => {
    if (order?.idMesa || activeOrderId) {
      try {
        const anterior = getStorageMesa() || {};
        sessionStorage.setItem(
          'fastcooking_mesa_cliente',
          JSON.stringify({
            ...anterior,
            ...(order?.idMesa ? { idMesa: order.idMesa } : {}),
            ...(order?.idRestaurante ? { idRestaurante: order.idRestaurante } : {}),
            ...(order?.tableNumber ? { numero: order.tableNumber } : {}),
            ...(activeOrderId ? { idPedidoAtivo: activeOrderId } : {}),
          })
        );
      } catch (err) {
        console.warn('Erro ao atualizar storage da mesa no tracking:', err);
      }
    }
  }, [order, activeOrderId]);

  const [chamandoGarcom, setChamandoGarcom] = useState(false);
  const [alertaGarcom, setAlertaGarcom] = useState(null);

  const storageMesa = getStorageMesa();
  const mesaIdResolved = order?.idMesa || searchParams.get('idMesa') || storageMesa?.idMesa;
  const idRestauranteResolved = order?.idRestaurante || searchParams.get('idRestaurante') || storageMesa?.idRestaurante;
  const numMesaResolved = order?.tableNumber || searchParams.get('mesa') || storageMesa?.numero;

  function handleVoltarAoCardapio() {
    const params = new URLSearchParams();
    if (mesaIdResolved) params.set('idMesa', mesaIdResolved);
    if (idRestauranteResolved) params.set('idRestaurante', idRestauranteResolved);
    if (numMesaResolved) params.set('mesa', numMesaResolved);
    navigate(`/cardapio?${params.toString()}`);
  }

  async function handleChamarGarcom() {
    if (!mesaIdResolved) {
      alert('Identificação da mesa não disponível neste pedido.');
      return;
    }
    setChamandoGarcom(true);
    try {
      await chamarGarcom(mesaIdResolved);
      setAlertaGarcom('🛎️ Garçom chamado com sucesso! Aguarde em sua mesa.');
      setTimeout(() => setAlertaGarcom(null), 6000);
    } catch (err) {
      alert(`Erro ao chamar garçom: ${err.message}`);
    } finally {
      setChamandoGarcom(false);
    }
  }

  // ─── Estado: sem activeOrderId ─────────────────────────────────
  if (!activeOrderId) {
    if (buscandoMesa) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-[#F9ECE5] via-white to-[#F9ECE5] flex flex-col items-center justify-center p-4">
          <div className="w-12 h-12 border-4 border-[#9C1C0E] border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-700 font-semibold text-sm">Localizando pedido da mesa...</p>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F9ECE5] via-white to-[#F9ECE5] font-[Poppins] flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-white/90 backdrop-blur-md p-8 rounded-3xl shadow-xl border border-gray-100 text-center animate-fade-in">
          <img src={logo} alt="FastCooking" className="h-12 mx-auto mb-4 object-contain" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Acompanhamento de Pedido</h1>
          <p className="text-gray-500 text-xs sm:text-sm mb-6">
            Acompanhe em tempo real o status de preparo dos itens do seu pedido na cozinha.
          </p>

          {erroMesa && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs p-3 rounded-xl mb-4 font-medium">
              {erroMesa}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (inputBusca.trim()) {
                navigate(`/tracking/${inputBusca.trim()}`);
              }
            }}
            className="space-y-4 text-left"
          >
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Código do Pedido ou ID:
              </label>
              <input
                type="text"
                value={inputBusca}
                onChange={(e) => setInputBusca(e.target.value)}
                placeholder="Ex: 550e8400-e29b-41d4-a716-..."
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#9C1C0E]"
              />
            </div>

            <button
              type="submit"
              disabled={!inputBusca.trim()}
              className="w-full py-3 bg-[#9C1C0E] hover:bg-[#7a160b] text-white font-bold text-sm rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              Rastrear Pedido
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 flex flex-col gap-2">
            <button
              onClick={() => navigate('/cardapio')}
              className="text-xs text-[#9C1C0E] hover:underline font-semibold cursor-pointer"
            >
              Ir para o Cardápio / Autoatendimento
            </button>
            <button
              onClick={() => navigate('/')}
              className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              Voltar à Página Inicial
            </button>
          </div>
        </div>
      </div>
    );
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

      <div className="max-w-2xl mx-auto px-3 sm:px-6 py-5 sm:py-10">
        {/* Barra superior com botão Voltar ao Cardápio */}
        <div className="flex items-center justify-between gap-2 mb-6">
          <button
            onClick={handleVoltarAoCardapio}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white/90 hover:bg-white border border-gray-200 text-gray-700 hover:text-[#9C1C0E] text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all cursor-pointer"
            title="Voltar ao cardápio de autoatendimento"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            <span>Voltar ao Cardápio</span>
          </button>

          {mesaIdResolved && (
            <button
              onClick={handleChamarGarcom}
              disabled={chamandoGarcom}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all active:scale-95 disabled:opacity-50"
              title="Chamar o garçom até a sua mesa"
            >
              <span>🛎️</span>
              <span>{chamandoGarcom ? 'Chamando...' : 'Chamar Garçom'}</span>
            </button>
          )}
        </div>

        {/* ─── Header ─────────────────────────────────────────── */}
        <header className="text-center mb-6 sm:mb-10">
          <a href="/" className="inline-block mb-3 sm:mb-4">
            <img src={logo} alt="Fast Cooking" className="h-8 sm:h-10 mx-auto" />
          </a>
          <span className="text-[#B78A10] font-semibold text-[11px] sm:text-xs uppercase tracking-widest block mb-1">
            Acompanhamento de Pedido
          </span>
          <h1 className="text-xl sm:text-3xl font-bold text-gray-900">
            Pedido #{order?.id}
          </h1>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mt-2 text-xs sm:text-sm text-gray-500">
            {order?.tableNumber && (
              <span className="inline-flex items-center gap-1 bg-white/70 px-2.5 py-1 rounded-md border border-gray-200">
                <svg className="w-3.5 h-3.5 text-[#9C1C0E]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6z" />
                </svg>
                Mesa {order.tableNumber}
              </span>
            )}
            {order?.createdAt && (
              <span className="inline-flex items-center gap-1 bg-white/70 px-2.5 py-1 rounded-md border border-gray-200">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {formatTime(order.createdAt)}
                <span className="text-gray-400">({getElapsedTime(order.createdAt)} atrás)</span>
              </span>
            )}
          </div>

          {alertaGarcom && (
            <div className="mt-4 p-3 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-md flex items-center justify-between animate-bounce">
              <span>{alertaGarcom}</span>
              <button onClick={() => setAlertaGarcom(null)} className="ml-2 bg-emerald-800 px-2 py-0.5 rounded text-[10px]">✕</button>
            </div>
          )}
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

        {/* ─── Botão de Ação: Voltar ao Cardápio / Novo Pedido ─── */}
        <div className="mt-8 text-center">
          <button
            onClick={handleVoltarAoCardapio}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#9C1C0E] hover:bg-[#7a160b] text-white font-bold text-sm rounded-xl shadow-md shadow-[#9C1C0E]/20 transition-all cursor-pointer"
          >
            <span>🍽️</span>
            <span>Fazer Mais Pedidos no Cardápio</span>
          </button>
        </div>

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
