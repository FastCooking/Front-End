import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MdRestaurantMenu,
  MdPlayArrow,
  MdCheckCircle,
  MdRefresh,
  MdLogout,
  MdAccessTime,
  MdStar,
  MdWarning,
  MdSoupKitchen,
} from 'react-icons/md';

import { obterFilaKds, alterarStatusItem } from '../services/pedidoService';
import logo from '../assets/fast cooking logo.png';
import ModalAlerta from '../components/common/ModalAlerta';

const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/+$/, '');

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
  const [alerta, setAlerta] = useState({ aberto: false, titulo: '', mensagem: '', tipo: 'info' });

  const wsRef = useRef(null);
  const isMountedRef = useRef(true);

  // Verificação de permissão e autenticação para Cozinha
  useEffect(() => {
    const token = localStorage.getItem('token');
    const funcao = (localStorage.getItem('funcao') || '').toLowerCase();

    if (!token) {
      navigate('/login');
      return;
    }

    if (funcao !== 'cozinheiro' && funcao !== 'cozinha') {
      if (funcao === 'garcom') navigate('/garcom');
      else if (funcao === 'gerente') navigate('/gerente');
      else if (funcao === 'adm') navigate('/administrativo');
      else navigate('/login');
    }
  }, [navigate]);

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
      setAlerta({
        aberto: true,
        titulo: 'Autenticação necessária',
        mensagem: 'Usuário não autenticado. Faça login como Cozinheiro.',
        tipo: 'aviso',
      });
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
              if (
                payload.item.status === 'Pronto' ||
                payload.item.status === 'Entregue' ||
                payload.item.status === 'Cancelado'
              ) {
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
          // ignore
        }
      };

      ws.onclose = () => {
        if (!isMountedRef.current) return;
        setStatusConexao('DESCONECTADO');
        setTimeout(() => {
          if (isMountedRef.current) conectarWs();
        }, 3000);
      };

      ws.onerror = () => {
        if (!isMountedRef.current) return;
        setStatusConexao('ERRO');
      };
    } catch {
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
      setAlerta({
        aberto: true,
        titulo: 'Erro ao atualizar status',
        mensagem: err.message || 'Não foi possível atualizar o preparo.',
        tipo: 'erro',
      });
    } finally {
      setProcessandoItem(null);
    }
  }

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('funcao');
    navigate('/login');
  }

  const itensFiltrados = fila.filter((item) => {
    if (filtroStatus === 'Todos') return true;
    if (filtroStatus === 'Pendentes') return item.status === 'Pendente';
    if (filtroStatus === 'Em preparo') return item.status === 'Em preparo';
    return true;
  });

  return (
    <div className="min-h-screen bg-[#FAF6F3] font-[Poppins] text-gray-800 flex flex-col pb-16">
      {/* Top Bar KDS */}
      <header className="sticky top-0 z-40 bg-[#FAF6F3]/95 backdrop-blur-md border-b border-gray-200/80 shadow-xs px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <img src={logo} alt="FastCooking Logo" className="h-9 sm:h-10 w-auto object-contain" />
          <div>
            <h1 className="text-base sm:text-xl font-black text-[#9C1C0E] tracking-tight leading-tight flex items-center gap-2">
              <MdSoupKitchen size={22} />
              KDS — Cozinha em Tempo Real
            </h1>
            <p className="text-[11px] sm:text-xs text-gray-500 font-medium">
              Fila Dinâmica e Gestão de Preparo
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Status Conexão */}
          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold px-2.5 sm:px-3 py-1 rounded-full bg-white border border-gray-200 shadow-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                statusConexao === 'CONECTADO'
                  ? 'bg-emerald-500 animate-pulse'
                  : 'bg-[#B78A10]'
              }`}
            />
            <span className="text-gray-600 hidden xs:inline">
              {statusConexao === 'CONECTADO' ? 'Tempo Real Ativo' : 'Conectando...'}
            </span>
          </div>

          <button
            onClick={carregarFilaHttp}
            className="text-xs bg-white hover:bg-gray-100 text-gray-700 font-bold px-3 py-1.5 rounded-xl border border-gray-200 shadow-xs transition-all cursor-pointer flex items-center gap-1"
          >
            <MdRefresh size={16} />
            <span className="hidden sm:inline">Atualizar</span>
          </button>

          <button
            onClick={handleLogout}
            className="text-xs bg-white hover:bg-gray-100 text-gray-700 hover:text-[#9C1C0E] px-3 py-1.5 rounded-xl font-bold border border-gray-200 shadow-xs transition-all cursor-pointer flex items-center gap-1"
          >
            <MdLogout size={15} />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </header>

      {/* Filter Tabs & Summary */}
      <div className="bg-white/80 border-b border-gray-200 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {['Todos', 'Pendentes', 'Em preparo'].map((tab) => {
            const count =
              tab === 'Todos'
                ? fila.length
                : fila.filter((i) => i.status === (tab === 'Pendentes' ? 'Pendente' : tab)).length;

            return (
              <button
                key={tab}
                type="button"
                onClick={() => setFiltroStatus(tab)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                  filtroStatus === tab
                    ? 'bg-[#9C1C0E] text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
                }`}
              >
                {tab} ({count})
              </button>
            );
          })}
        </div>

        <div className="text-xs text-gray-600 font-medium">
          Total em produção: <strong className="text-[#9C1C0E] font-black">{fila.length} pratos</strong>
        </div>
      </div>

      {/* Main Grid of Orders */}
      <main className="max-w-7xl mx-auto w-full p-4 sm:p-6 flex-1 overflow-y-auto">
        {itensFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <span className="text-5xl mb-3">🍳</span>
            <p className="text-base sm:text-lg font-bold text-gray-700">Nenhum item aguardando preparo</p>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              Novos pedidos realizados no cardápio aparecerão aqui instantaneamente.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {itensFiltrados.map((item) => {
              const isEmPreparo = item.status === 'Em preparo';
              const minutosEspera = item.tempoEsperaMinutos || 0;
              const prioridadeAlta = minutosEspera >= 15 || (item.pontuacao || 0) >= 30;

              return (
                <div
                  key={item.idItemPedido}
                  className={`rounded-3xl border flex flex-col justify-between overflow-hidden shadow-xs transition-all ${
                    isEmPreparo
                      ? 'bg-amber-50/60 border-[#B78A10] ring-1 ring-[#B78A10]'
                      : prioridadeAlta
                      ? 'bg-red-50/70 border-red-400 ring-1 ring-red-400'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {/* Card Header */}
                  <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                    <div>
                      <span className="text-xs uppercase font-extrabold text-gray-900 tracking-wide">
                        {item.numeroMesa ? `Mesa #${item.numeroMesa}` : 'Balcão / Mesa'}
                      </span>
                      <div className="text-[11px] text-gray-500 font-medium flex items-center gap-1 mt-0.5">
                        <MdAccessTime size={13} />
                        <span>
                          Espera:{' '}
                          <strong className={prioridadeAlta ? 'text-red-600 font-bold' : 'text-gray-700'}>
                            {minutosEspera} min
                          </strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`text-[10px] px-2.5 py-0.5 rounded-full font-black ${
                          isEmPreparo
                            ? 'bg-[#B78A10] text-white'
                            : 'bg-amber-100 text-amber-900'
                        }`}
                      >
                        {item.status}
                      </span>
                      {item.categoria && (
                        <span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md font-semibold">
                          {item.categoria}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-black text-base sm:text-lg text-gray-900 leading-tight">
                        {item.quantidade}x {item.nomeItem || 'Prato'}
                      </h3>
                      {item.pontuacao !== undefined && (
                        <span
                          className="text-[11px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-md flex items-center gap-0.5 shrink-0"
                          title="Pontuação de Prioridade KDS"
                        >
                          <MdStar size={13} className="text-[#B78A10]" /> {Number(item.pontuacao).toFixed(1)}
                        </span>
                      )}
                    </div>

                    {item.observacao && (
                      <div className="mt-3 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-start gap-1.5">
                        <MdWarning size={15} className="text-[#B78A10] shrink-0 mt-0.5" />
                        <span>Obs: {item.observacao}</span>
                      </div>
                    )}
                  </div>

                  {/* Card Actions */}
                  <div className="p-4 border-t border-gray-200 bg-[#FAF6F3]/50 flex gap-2">
                    {!isEmPreparo ? (
                      <button
                        onClick={() => atualizarStatus(item.idItemPedido, 'Em preparo')}
                        disabled={processandoItem === item.idItemPedido}
                        className="flex-1 bg-[#B78A10] hover:bg-amber-700 disabled:opacity-50 text-white font-bold py-2.5 px-3 rounded-2xl text-xs sm:text-sm transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <MdPlayArrow size={18} />
                        <span>{processandoItem === item.idItemPedido ? 'Iniciando...' : 'Iniciar Preparo'}</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => atualizarStatus(item.idItemPedido, 'Pronto')}
                        disabled={processandoItem === item.idItemPedido}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-2.5 px-3 rounded-2xl text-xs sm:text-sm transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <MdCheckCircle size={18} />
                        <span>{processandoItem === item.idItemPedido ? 'Finalizando...' : 'Concluir (Pronto)'}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Alerta Modal */}
      <ModalAlerta
        aberto={alerta.aberto}
        titulo={alerta.titulo}
        mensagem={alerta.mensagem}
        tipo={alerta.tipo}
        onFechar={() => setAlerta((a) => ({ ...a, aberto: false }))}
      />
    </div>
  );
}
