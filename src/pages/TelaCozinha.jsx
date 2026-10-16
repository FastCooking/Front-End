import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { obterFilaKds, alterarStatusItem } from '../services/pedidoService';
import logo from '../assets/fast cooking logo.png';

const BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

function buildWsUrl() {
  const wsBase = BASE_URL.replace(/^http/, 'ws');
  return `${wsBase}/pedidos/ws`;
}

export default function TelaCozinha() {
  const navigate = useNavigate();
  const [fila, setFila] = useState([]);
  const [filtroStatus, setFiltroStatus] = useState('Todos');
  const [statusConexao, setStatusConexao] = useState('CONECTANDO');
  const [processandoItem, setProcessandoItem] = useState(null);
  const [erro, setErro] = useState(null);

  const wsRef = useRef(null);
  const isMountedRef = useRef(true);

  const carregarFilaHttp = useCallback(async () => {
    try {
      const data = await obterFilaKds();
      if (data && Array.isArray(data.items)) {
        setFila(data.items);
      }
    } catch (err) {
      console.warn('Erro ao carregar fila KDS via HTTP:', err);
    }
  }, []);

  const conectarWs = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setErro('Usuário não autenticado. Faça login como Cozinheiro.');
      return;
    }

    if (wsRef.current) {
      wsRef.current.close();
    }

    try {
      const ws = new WebSocket(buildWsUrl());
      wsRef.current = ws;
      setStatusConexao('CONECTANDO');

      ws.onopen = () => {
        if (!isMountedRef.current) return;
        setStatusConexao('CONECTADO');
        setErro(null);
        // Autentica no hub KDS
        ws.send(JSON.stringify({ type: 'authenticate', token }));
      };

      ws.onmessage = (event) => {
        if (!isMountedRef.current) return;
        try {
          const payload = JSON.parse(event.data);

          if (payload.type === 'queue.snapshot' && payload.data?.items) {
            setFila(payload.data.items);
          } else if (payload.type === 'item.created' && payload.item) {
            setFila((prev) => {
              const existe = prev.some((i) => i.idItemPedido === payload.item.idItemPedido);
              if (existe) return prev;
              const novaFila = [...prev, payload.item];
              return novaFila.sort((a, b) => (b.pontuacao || 0) - (a.pontuacao || 0));
            });
          } else if (payload.type === 'item.status_changed' && payload.item) {
            setFila((prev) => {
              if (payload.item.status === 'Pronto' || payload.item.status === 'Entregue' || payload.item.status === 'Cancelado') {
                return prev.filter((i) => i.idItemPedido !== payload.item.idItemPedido);
              }
              return prev.map((i) =>
                i.idItemPedido === payload.item.idItemPedido ? { ...i, ...payload.item } : i
              );
            });
          } else if (payload.type === 'queue.updated') {
            carregarFilaHttp();
          }
        } catch {
          // Ignora mensagens mal formatadas
        }
      };

      ws.onclose = () => {
        if (!isMountedRef.current) return;
        setStatusConexao('DESCONECTADO');
        // Tenta reconectar após 3s
        setTimeout(() => {
          if (isMountedRef.current) conectarWs();
        }, 3000);
      };

      ws.onerror = () => {
        if (!isMountedRef.current) return;
        setStatusConexao('ERRO');
      };
    } catch (err) {
      setStatusConexao('ERRO');
    }
  }, [carregarFilaHttp]);

  useEffect(() => {
    isMountedRef.current = true;
    carregarFilaHttp();
    conectarWs();

    const intervalId = setInterval(() => {
      carregarFilaHttp();
    }, 15000);

    return () => {
      isMountedRef.current = false;
      clearInterval(intervalId);
      if (wsRef.current) wsRef.current.close();
    };
  }, [conectarWs, carregarFilaHttp]);

  async function atualizarStatus(idItemPedido, novoStatus) {
    setProcessandoItem(idItemPedido);
    try {
      await alterarStatusItem(idItemPedido, novoStatus);
      if (novoStatus === 'Pronto') {
        setFila((prev) => prev.filter((i) => i.idItemPedido !== idItemPedido));
      } else {
        setFila((prev) =>
          prev.map((i) => (i.idItemPedido === idItemPedido ? { ...i, status: novoStatus } : i))
        );
      }
    } catch (err) {
      alert(`Erro ao alterar status: ${err.message}`);
    } finally {
      setProcessandoItem(null);
    }
  }

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  }

  const itensFiltrados = fila.filter((item) => {
    if (filtroStatus === 'Todos') return true;
    if (filtroStatus === 'Pendentes') return item.status === 'Pendente';
    if (filtroStatus === 'Em preparo') return item.status === 'Em preparo';
    return true;
  });

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100 flex flex-col">
      {/* Top Bar KDS */}
      <header className="bg-stone-800 border-b border-stone-700 px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-4">
          <img src={logo} alt="FastCooking Logo" className="h-10 w-auto object-contain brightness-125" />
          <div>
            <h1 className="text-xl font-black text-amber-500 tracking-wide uppercase">
              KDS — Cozinha em Tempo Real
            </h1>
            <p className="text-xs text-stone-400">
              Fila Dinâmica de Pedidos com Prioridade KDS
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Status WebSocket */}
          <div className="flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full bg-stone-900 border border-stone-700">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                statusConexao === 'CONECTADO'
                  ? 'bg-emerald-500 animate-pulse'
                  : statusConexao === 'CONECTANDO'
                  ? 'bg-amber-500 animate-ping'
                  : 'bg-red-500'
              }`}
            />
            <span className="text-stone-300">
              {statusConexao === 'CONECTADO'
                ? 'Ao vivo'
                : statusConexao === 'CONECTANDO'
                ? 'Conectando...'
                : 'Offline (Polling)'}
            </span>
          </div>

          <button
            onClick={carregarFilaHttp}
            className="text-xs bg-stone-700 hover:bg-stone-600 text-stone-200 px-3 py-1.5 rounded-lg font-semibold transition-colors"
          >
            🔄 Atualizar
          </button>

          <button
            onClick={handleLogout}
            className="text-xs bg-red-900/60 hover:bg-red-800 text-red-200 px-3 py-1.5 rounded-lg font-semibold transition-colors"
          >
            Sair
          </button>
        </div>
      </header>

      {/* Filter Tabs & Summary */}
      <div className="bg-stone-850 border-b border-stone-750 px-6 py-3 flex items-center justify-between">
        <div className="flex gap-2">
          {['Todos', 'Pendentes', 'Em preparo'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFiltroStatus(tab)}
              className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
                filtroStatus === tab
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'bg-stone-800 text-stone-400 hover:bg-stone-700'
              }`}
            >
              {tab} (
              {tab === 'Todos'
                ? fila.length
                : fila.filter((i) => i.status === (tab === 'Pendentes' ? 'Pendente' : tab)).length}
              )
            </button>
          ))}
        </div>

        <div className="text-xs text-stone-400">
          Total em produção: <strong className="text-white">{fila.length} pratos</strong>
        </div>
      </div>

      {/* Main Grid of Orders */}
      <main className="flex-1 p-6 overflow-y-auto">
        {erro && (
          <div className="mb-4 p-4 bg-red-950 border border-red-700 text-red-300 rounded-xl text-sm">
            {erro}
          </div>
        )}

        {itensFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-28 text-stone-500">
            <span className="text-5xl mb-3">🍳</span>
            <p className="text-lg font-bold text-stone-400">Nenhum item aguardando preparo</p>
            <p className="text-sm">Novos pedidos aparecerão aqui instantaneamente em tempo real.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {itensFiltrados.map((item) => {
              const isEmPreparo = item.status === 'Em preparo';
              const minutosEspera = item.tempoEsperaMinutos || 0;
              const prioridadeAlta = minutosEspera >= 15 || (item.pontuacao || 0) >= 30;

              return (
                <div
                  key={item.idItemPedido}
                  className={`rounded-2xl border flex flex-col justify-between overflow-hidden shadow-lg transition-all ${
                    isEmPreparo
                      ? 'bg-amber-950/40 border-amber-500/80'
                      : prioridadeAlta
                      ? 'bg-red-950/30 border-red-500/80 animate-pulse'
                      : 'bg-stone-800/90 border-stone-700'
                  }`}
                >
                  {/* Card Header */}
                  <div className="p-4 border-b border-stone-700/60 flex items-center justify-between">
                    <div>
                      <span className="text-xs uppercase font-extrabold text-stone-400 tracking-wider">
                        {item.numeroMesa ? `Mesa #${item.numeroMesa}` : 'Balcão / Mesa'}
                      </span>
                      <div className="text-xs text-stone-400">
                        Espera: <strong className={prioridadeAlta ? 'text-red-400' : 'text-stone-200'}>{minutosEspera} min</strong>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-extrabold ${
                          isEmPreparo
                            ? 'bg-amber-500 text-black'
                            : 'bg-stone-700 text-stone-300'
                        }`}
                      >
                        {item.status}
                      </span>
                      {item.categoria && (
                        <span className="text-[10px] text-stone-400 bg-stone-750 px-2 py-0.5 rounded">
                          {item.categoria}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-black text-lg text-white leading-tight">
                        {item.quantidade}x {item.nomeItem || 'Prato'}
                      </h3>
                      {item.pontuacao !== undefined && (
                        <span className="text-xs bg-stone-700/80 text-amber-300 font-mono px-2 py-0.5 rounded font-bold" title="Pontuação de Prioridade KDS">
                          ★ {Number(item.pontuacao).toFixed(1)}
                        </span>
                      )}
                    </div>

                    {item.observacao && (
                      <div className="mt-3 p-2.5 rounded-lg bg-black/40 border border-amber-600/40 text-amber-300 text-xs font-semibold">
                        ⚠️ Obs: {item.observacao}
                      </div>
                    )}
                  </div>

                  {/* Card Actions */}
                  <div className="p-4 border-t border-stone-700/60 bg-stone-850/70 flex gap-2">
                    {!isEmPreparo ? (
                      <button
                        onClick={() => atualizarStatus(item.idItemPedido, 'Em preparo')}
                        disabled={processandoItem === item.idItemPedido}
                        className="flex-1 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-extrabold py-2.5 px-3 rounded-xl text-sm transition-colors shadow-sm"
                      >
                        {processandoItem === item.idItemPedido ? 'Iniciando...' : '▶ Iniciar Preparo'}
                      </button>
                    ) : (
                      <button
                        onClick={() => atualizarStatus(item.idItemPedido, 'Pronto')}
                        disabled={processandoItem === item.idItemPedido}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold py-2.5 px-3 rounded-xl text-sm transition-colors shadow-sm"
                      >
                        {processandoItem === item.idItemPedido ? 'Finalizando...' : '✓ Concluir (Pronto)'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}