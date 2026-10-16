import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  alterarStatusItem,
  liberarSobremesa,
  listarMesas,
  abrirMesa,
} from '../services/pedidoService';
import logo from '../assets/fast cooking logo.png';

const BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

function buildWsUrl() {
  const wsBase = BASE_URL.replace(/^http/, 'ws');
  return `${wsBase}/pedidos/ws`;
}

export default function TelaGarcom() {
  const navigate = useNavigate();

  const [pratosProntos, setPratosProntos] = useState([]);
  const [mesas, setMesas] = useState([]);
  const [statusConexao, setStatusConexao] = useState('CONECTANDO');
  const [notificacaoAlerta, setNotificacaoAlerta] = useState(null);
  const [processando, setProcessando] = useState(false);
  const [idMesaParaAbrir, setIdMesaParaAbrir] = useState('');
  const [usuario, setUsuario] = useState(null);

  const wsRef = useRef(null);
  const isMountedRef = useRef(true);

  // Carrega usuário e mesas iniciais
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        setUsuario(JSON.parse(userStr));
      } catch (e) {
        // ignore
      }
    }
  }, []);

  const carregarMesas = useCallback(async () => {
    try {
      const idRestaurante = usuario?.idRestaurante;
      const data = await listarMesas(idRestaurante).catch(() => []);
      setMesas(data || []);
    } catch (err) {
      console.warn('Erro ao carregar mesas:', err);
    }
  }, [usuario]);

  useEffect(() => {
    carregarMesas();
  }, [carregarMesas]);

  // Conexão WebSocket para Garçom (RF06 Notificação Pedido Pronto)
  const conectarWs = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

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

          if (payload.type === 'item.status_changed' && payload.item) {
            const item = payload.item;
            if (item.status === 'Pronto') {
              setPratosProntos((prev) => {
                const existe = prev.some((p) => p.idItemPedido === item.idItemPedido);
                if (existe) return prev;
                return [item, ...prev];
              });

              setNotificacaoAlerta(`🔔 Prato PRONTO para a Mesa ${item.numeroMesa || ''}: ${item.nomeItem || 'Item'}!`);
            } else if (item.status === 'Entregue' || item.status === 'Cancelado') {
              setPratosProntos((prev) =>
                prev.filter((p) => p.idItemPedido !== item.idItemPedido)
              );
            }
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
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    conectarWs();

    return () => {
      isMountedRef.current = false;
      if (wsRef.current) wsRef.current.close();
    };
  }, [conectarWs]);

  async function marcarComoEntregue(idItemPedido) {
    setProcessando(true);
    try {
      await alterarStatusItem(idItemPedido, 'Entregue');
      setPratosProntos((prev) => prev.filter((p) => p.idItemPedido !== idItemPedido));
    } catch (err) {
      alert(`Erro ao marcar como entregue: ${err.message}`);
    } finally {
      setProcessando(false);
    }
  }

  async function handleAbrirMesa(idMesa) {
    setProcessando(true);
    try {
      const res = await abrirMesa(idMesa);
      alert(`Mesa #${res.numero || ''} aberta com sucesso! Sessão ativa.`);
      carregarMesas();
    } catch (err) {
      alert(`Erro ao abrir mesa: ${err.message}`);
    } finally {
      setProcessando(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('funcao');
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 pb-16">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white shadow-xs border-b border-stone-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="FastCooking Logo" className="h-10 w-auto object-contain" />
            <div>
              <h1 className="text-xl font-black text-[#b84226]">FastCooking Garçom</h1>
              <p className="text-xs text-stone-500">Notificações em Tempo Real e Entregas</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Status Conexão */}
            <div className="flex items-center gap-2 text-xs font-bold px-3 py-1 rounded-full bg-stone-100 border border-stone-200">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  statusConexao === 'CONECTADO'
                    ? 'bg-emerald-500 animate-pulse'
                    : 'bg-amber-500'
                }`}
              />
              <span className="text-stone-600">
                {statusConexao === 'CONECTADO' ? 'Prontos Ativo' : 'Conectando...'}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="text-xs bg-stone-200 hover:bg-stone-300 text-stone-700 px-3 py-1.5 rounded-lg font-bold transition-colors"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Alerta de Notificação em Tempo Real (RF06) */}
      {notificacaoAlerta && (
        <div className="max-w-6xl mx-auto mt-4 px-4">
          <div className="bg-emerald-600 text-white p-4 rounded-xl shadow-lg flex items-center justify-between animate-bounce">
            <span className="font-extrabold text-sm">{notificacaoAlerta}</span>
            <button
              onClick={() => setNotificacaoAlerta(null)}
              className="bg-emerald-800 hover:bg-emerald-900 text-xs font-bold px-3 py-1 rounded-md"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-6xl mx-auto p-4 space-y-8 mt-2">
        {/* Pratos Prontos para Entrega */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-black text-stone-900 flex items-center gap-2">
                <span>🍽️</span> Pratos Prontos para Entrega na Mesa
              </h2>
              <p className="text-xs text-stone-500">
                Dishes finalizados pela cozinha aguardando entrega imediata (RF06)
              </p>
            </div>
            <span className="bg-[#b84226] text-white text-xs font-extrabold px-3 py-1 rounded-full">
              {pratosProntos.length} prontos
            </span>
          </div>

          {pratosProntos.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-stone-300 p-12 text-center text-stone-400">
              <span className="text-4xl">✨</span>
              <p className="text-base font-bold text-stone-600 mt-2">Nenhum prato aguardando entrega no momento</p>
              <p className="text-xs text-stone-400">Assim que a cozinha concluir um prato, o alarme tocará aqui.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pratosProntos.map((item) => (
                <div
                  key={item.idItemPedido}
                  className="bg-white border-2 border-emerald-500 rounded-2xl p-5 shadow-md flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="bg-emerald-100 text-emerald-800 text-xs font-black px-3 py-1 rounded-full">
                        Mesa #{item.numeroMesa || '—'}
                      </span>
                      <span className="text-xs font-bold text-emerald-600 animate-pulse">
                        ● PRONTO
                      </span>
                    </div>

                    <h3 className="font-extrabold text-stone-900 text-lg mt-3">
                      {item.quantidade}x {item.nomeItem || 'Prato'}
                    </h3>

                    {item.observacao && (
                      <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 p-2 rounded-lg mt-2">
                        Obs: {item.observacao}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => marcarComoEntregue(item.idItemPedido)}
                    disabled={processando}
                    className="mt-4 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-2.5 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
                  >
                    <span>✓ Entregue ao Cliente</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Gerenciamento Rápido de Mesas */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-black text-stone-900 flex items-center gap-2">
                <span>🪑</span> Mesas do Salão
              </h2>
              <p className="text-xs text-stone-500">Status atual das mesas e comandas</p>
            </div>

            <button
              onClick={carregarMesas}
              className="text-xs bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold px-3 py-1.5 rounded-lg border border-stone-300"
            >
              🔄 Recarregar Mesas
            </button>
          </div>

          {mesas.length === 0 ? (
            <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center text-stone-400">
              <p className="text-sm">Nenhuma mesa cadastrada para este restaurante.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {mesas.map((mesa) => {
                const isOcupada = mesa.status === 'Indisponivel' || mesa.status === 'Ocupada';

                return (
                  <div
                    key={mesa.idMesa}
                    className={`rounded-xl p-4 border flex flex-col justify-between text-center transition-all ${
                      isOcupada
                        ? 'bg-amber-50/70 border-amber-300'
                        : 'bg-white border-stone-200 hover:border-stone-400'
                    }`}
                  >
                    <div>
                      <span className="text-xl font-black text-stone-900">
                        #{mesa.numero}
                      </span>
                      <p className={`text-[11px] font-extrabold mt-1 ${isOcupada ? 'text-amber-700' : 'text-emerald-700'}`}>
                        {isOcupada ? 'Em Atendimento' : 'Disponível'}
                      </p>
                    </div>

                    <div className="mt-3 flex flex-col gap-1.5">
                      {!isOcupada ? (
                        <button
                          onClick={() => handleAbrirMesa(mesa.idMesa)}
                          disabled={processando}
                          className="w-full text-xs bg-stone-900 hover:bg-black text-white font-bold py-1.5 rounded-lg"
                        >
                          Abrir Mesa
                        </button>
                      ) : (
                        <button
                          onClick={() => navigate(`/cardapio?idMesa=${mesa.idMesa}&idRestaurante=${mesa.idRestaurante}`)}
                          className="w-full text-xs bg-[#b84226] hover:bg-[#9c351c] text-white font-bold py-1.5 rounded-lg"
                        >
                          Ver Comanda
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}