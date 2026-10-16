import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  alterarStatusItem,
  liberarSobremesa,
  listarMesas,
  abrirMesa,
  cancelarItemPedido,
  atenderChamadoMesa,
  obterChamadosAtivos,
  obterPedidoAtivoMesa,
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
  const [chamadosMesa, setChamadosMesa] = useState([]);
  const [statusConexao, setStatusConexao] = useState('CONECTANDO');
  const [notificacaoAlerta, setNotificacaoAlerta] = useState(null);
  const [processando, setProcessando] = useState(false);
  const [comandaModal, setComandaModal] = useState(null);
  const [carregandoComanda, setCarregandoComanda] = useState(false);
  const [usuario, setUsuario] = useState(null);

  const wsRef = useRef(null);
  const isMountedRef = useRef(true);

  // Carrega usuário
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

  const carregarChamados = useCallback(async () => {
    try {
      const idRestaurante = usuario?.idRestaurante;
      if (!idRestaurante) return;
      const data = await obterChamadosAtivos(idRestaurante).catch(() => []);
      setChamadosMesa(data || []);
    } catch (err) {
      console.warn('Erro ao carregar chamados das mesas:', err);
    }
  }, [usuario]);

  useEffect(() => {
    carregarMesas();
    carregarChamados();
  }, [carregarMesas, carregarChamados]);

  // Conexão WebSocket para Garçom
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

          // RF06: Notificação de Prato Pronto
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

            // Se a comanda aberta no modal for afetada, atualiza seu status
            setComandaModal((prev) => {
              if (!prev || !prev.itens) return prev;
              const afetaModal = prev.itens.some((it) => it.idItemPedido === item.idItemPedido);
              if (!afetaModal) return prev;
              return {
                ...prev,
                itens: prev.itens.map((it) =>
                  it.idItemPedido === item.idItemPedido ? { ...it, status: item.status } : it
                ),
              };
            });
          }

          // Chamados de mesa em tempo real
          if (payload.type === 'mesa.garcom_chamado' && payload.mesa) {
            const mesaChamada = payload.mesa;
            setChamadosMesa((prev) => {
              const existe = prev.some((c) => c.idMesa === mesaChamada.idMesa);
              if (existe) return prev;
              return [mesaChamada, ...prev];
            });
            setNotificacaoAlerta(`🛎️ CHAMADO: Mesa #${mesaChamada.numero} solicitou o Garçom!`);
          } else if (payload.type === 'mesa.garcom_atendido' && payload.mesa) {
            const mesaChamada = payload.mesa;
            setChamadosMesa((prev) =>
              prev.filter((c) => c.idMesa !== mesaChamada.idMesa)
            );
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

  async function handleAtenderChamado(idMesa) {
    setProcessando(true);
    try {
      await atenderChamadoMesa(idMesa);
      setChamadosMesa((prev) => prev.filter((c) => c.idMesa !== idMesa));
    } catch (err) {
      alert(`Erro ao atender chamado: ${err.message}`);
    } finally {
      setProcessando(false);
    }
  }

  async function handleVerComanda(mesa) {
    setCarregandoComanda(true);
    try {
      const dados = await obterPedidoAtivoMesa(mesa.idMesa);
      setComandaModal({
        mesa,
        pedido: dados.pedido,
        itens: dados.itens || [],
      });
    } catch (err) {
      alert(`Não há pedido ativo ou comanda encontrada para a Mesa #${mesa.numero}.`);
    } finally {
      setCarregandoComanda(false);
    }
  }

  async function handleCancelarItem(item) {
    const confirmou = window.confirm(
      `Deseja realmente cancelar o item "${item.nomeItem || 'Item'}" (Qtd: ${item.quantidade}) da Mesa #${comandaModal?.mesa?.numero}?`
    );
    if (!confirmou) return;

    setProcessando(true);
    try {
      await cancelarItemPedido(item.idItemPedido);
      setComandaModal((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          itens: prev.itens.map((it) =>
            it.idItemPedido === item.idItemPedido ? { ...it, status: 'Cancelado' } : it
          ),
        };
      });
      alert('Item cancelado com sucesso!');
    } catch (err) {
      alert(`Não foi possível cancelar o item: ${err.message}`);
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
              <p className="text-xs text-stone-500">Notificações em Tempo Real, Entregas e Salão</p>
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
                {statusConexao === 'CONECTADO' ? 'Tempo Real Ativo' : 'Conectando...'}
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

      {/* Alerta de Notificação em Tempo Real */}
      {notificacaoAlerta && (
        <div className="max-w-6xl mx-auto mt-4 px-4">
          <div className="bg-amber-500 text-white p-4 rounded-xl shadow-lg flex items-center justify-between animate-bounce">
            <span className="font-extrabold text-sm flex items-center gap-2">
              <span>📢</span> {notificacaoAlerta}
            </span>
            <button
              onClick={() => setNotificacaoAlerta(null)}
              className="bg-amber-700 hover:bg-amber-800 text-xs font-bold px-3 py-1 rounded-md"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-6xl mx-auto p-4 space-y-8 mt-2">
        {/* Chamados de Atendimento das Mesas */}
        {chamadosMesa.length > 0 && (
          <section className="bg-amber-50 border-2 border-amber-400 rounded-2xl p-5 shadow-md">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-black text-amber-900 flex items-center gap-2">
                <span>🛎️</span> Chamados de Atendimento Urgentes
              </h2>
              <span className="bg-amber-600 text-white text-xs font-black px-3 py-1 rounded-full animate-pulse">
                {chamadosMesa.length} {chamadosMesa.length === 1 ? 'chamado' : 'chamados'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {chamadosMesa.map((chamado) => (
                <div
                  key={chamado.idMesa}
                  className="bg-white border border-amber-300 rounded-xl p-4 shadow-sm flex items-center justify-between"
                >
                  <div>
                    <span className="text-lg font-black text-stone-900">
                      Mesa #{chamado.numero}
                    </span>
                    <p className="text-xs text-amber-700 font-bold mt-0.5">
                      Cliente solicitando atendimento
                    </p>
                  </div>

                  <button
                    onClick={() => handleAtenderChamado(chamado.idMesa)}
                    disabled={processando}
                    className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-black px-3 py-2 rounded-lg shadow-xs transition-colors"
                  >
                    ✓ Atender
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Pratos Prontos para Entrega */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-black text-stone-900 flex items-center gap-2">
                <span>🍽️</span> Pratos Prontos para Entrega na Mesa
              </h2>
              <p className="text-xs text-stone-500">
                Pratos finalizados pela cozinha aguardando entrega imediata (RF06)
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
              <p className="text-xs text-stone-400">Assim que a cozinha concluir um prato, o alerta tocará aqui.</p>
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
              <p className="text-xs text-stone-500">Status atual das mesas, comandas e cancelamento de itens</p>
            </div>

            <button
              onClick={() => {
                carregarMesas();
                carregarChamados();
              }}
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
                const temChamado = chamadosMesa.some((c) => c.idMesa === mesa.idMesa);

                return (
                  <div
                    key={mesa.idMesa}
                    className={`rounded-xl p-4 border flex flex-col justify-between text-center transition-all ${
                      temChamado
                        ? 'bg-amber-100/90 border-amber-400 ring-2 ring-amber-400 animate-pulse'
                        : isOcupada
                        ? 'bg-amber-50/70 border-amber-300'
                        : 'bg-white border-stone-200 hover:border-stone-400'
                    }`}
                  >
                    <div>
                      <span className="text-xl font-black text-stone-900">
                        #{mesa.numero}
                      </span>
                      <p className={`text-[11px] font-extrabold mt-1 ${temChamado ? 'text-amber-800' : isOcupada ? 'text-amber-700' : 'text-emerald-700'}`}>
                        {temChamado ? '🛎️ Chamando Garçom' : isOcupada ? 'Em Atendimento' : 'Disponível'}
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
                          onClick={() => handleVerComanda(mesa)}
                          disabled={carregandoComanda}
                          className="w-full text-xs bg-[#b84226] hover:bg-[#9c351c] text-white font-bold py-1.5 rounded-lg transition-colors"
                        >
                          Ver Comanda
                        </button>
                      )}

                      {temChamado && (
                        <button
                          onClick={() => handleAtenderChamado(mesa.idMesa)}
                          disabled={processando}
                          className="w-full text-xs bg-amber-600 hover:bg-amber-700 text-white font-bold py-1 rounded-lg"
                        >
                          Atender
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

      {/* Modal de Detalhes da Comanda com Cancelamento de Itens */}
      {comandaModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between pb-4 border-b border-stone-200">
              <div>
                <h3 className="text-lg font-black text-stone-900">
                  Comanda — Mesa #{comandaModal.mesa.numero}
                </h3>
                <p className="text-xs text-stone-500">
                  Status do Pedido: <strong className="text-[#b84226]">{comandaModal.pedido?.status || 'Aberto'}</strong>
                </p>
              </div>
              <button
                onClick={() => setComandaModal(null)}
                className="text-stone-400 hover:text-stone-700 font-bold text-lg p-1"
              >
                ✕
              </button>
            </div>

            {/* Lista de Itens */}
            <div className="overflow-y-auto py-4 space-y-3 flex-1">
              {comandaModal.itens.length === 0 ? (
                <p className="text-center text-sm text-stone-400 py-6">
                  Nenhum item adicionado a este pedido ainda.
                </p>
              ) : (
                comandaModal.itens.map((item) => {
                  const podeCancelar = item.status === 'Pendente';

                  return (
                    <div
                      key={item.idItemPedido}
                      className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/70 flex items-center justify-between gap-3"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-stone-900 text-sm">
                            {item.quantidade}x {item.nomeItem || 'Item'}
                          </span>
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                              item.status === 'Pendente'
                                ? 'bg-amber-100 text-amber-800'
                                : item.status === 'Em preparo'
                                ? 'bg-orange-100 text-orange-800'
                                : item.status === 'Pronto'
                                ? 'bg-emerald-100 text-emerald-800'
                                : item.status === 'Entregue'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>
                        {item.observacao && (
                          <p className="text-xs text-stone-500 italic mt-0.5">
                            Obs: {item.observacao}
                          </p>
                        )}
                        <p className="text-xs text-stone-600 mt-1">
                          R$ {Number(item.precoUnitario || 0).toFixed(2)} cada
                        </p>
                      </div>

                      {/* Botão de Cancelamento para Itens Pendentes */}
                      {podeCancelar ? (
                        <button
                          onClick={() => handleCancelarItem(item)}
                          disabled={processando}
                          className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                          title="Cancelar item antes do preparo"
                        >
                          <span>✕</span>
                          <span>Cancelar Item</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-stone-400 italic">
                          {item.status === 'Cancelado'
                            ? 'Cancelado'
                            : 'Preparo iniciado'}
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Rodapé do Modal */}
            <div className="pt-4 border-t border-stone-200 flex items-center justify-between">
              <div>
                <span className="text-xs text-stone-500">Total da Comanda:</span>
                <p className="text-base font-extrabold text-stone-900">
                  R${' '}
                  {comandaModal.itens
                    .filter((it) => it.status !== 'Cancelado')
                    .reduce((acc, it) => acc + (Number(it.precoUnitario) || 0) * (it.quantidade || 1), 0)
                    .toFixed(2)}
                </p>
              </div>

              <button
                onClick={() => setComandaModal(null)}
                className="bg-stone-900 hover:bg-black text-white text-xs font-bold px-5 py-2.5 rounded-xl"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}