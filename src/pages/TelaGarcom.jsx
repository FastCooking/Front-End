import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MdRestaurantMenu,
  MdNotificationsActive,
  MdTableBar,
  MdCheckCircle,
  MdClose,
  MdAdd,
  MdRemove,
  MdPayment,
  MdRefresh,
  MdLogout,
  MdAccessTime,
  MdDinnerDining,
  MdRoomService,
} from 'react-icons/md';

import {
  alterarStatusItem,
  alterarQuantidadeItem,
  listarMesas,
  abrirMesa,
  cancelarItemPedido,
  atenderChamadoMesa,
  obterChamadosAtivos,
  obterPedidoAtivoMesa,
  adicionarItensAoPedido,
} from '../services/pedidoService';
import logo from '../assets/fast cooking logo.png';
import { tocarAlertaSonoro } from '../utils/audioNotification';
import ModalAlerta from '../components/common/ModalAlerta';
import ModalConfirmacao from '../components/common/ModalConfirmacao';
import ModalAdicionarItemCardapio from '../components/garcom/ModalAdicionarItemCardapio';
import ModalPagamentoComanda from '../components/garcom/ModalPagamentoComanda';

const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/+$/, '');

function buildWsUrl() {
  const wsBase = BASE_URL.replace(/^http/, 'ws');
  return `${wsBase}/pedidos/ws`;
}

export default function TelaGarcom() {
  const navigate = useNavigate();

  // Estados principais
  const [pratosProntos, setPratosProntos] = useState([]);
  const [mesas, setMesas] = useState([]);
  const [chamadosMesa, setChamadosMesa] = useState([]);
  const [statusConexao, setStatusConexao] = useState('CONECTANDO');
  const [usuario, setUsuario] = useState(null);
  const [processando, setProcessando] = useState(false);

  // Modais de detalhe e ação
  const [comandaModal, setComandaModal] = useState(null);
  const [carregandoComanda, setCarregandoComanda] = useState(false);
  const [modalAdicionarAberto, setModalAdicionarAberto] = useState(false);
  const [modalPagamentoAberto, setModalPagamentoAberto] = useState(false);

  // Modais customizados de feedback (substituindo alert/confirm)
  const [alerta, setAlerta] = useState({ aberto: false, titulo: '', mensagem: '', tipo: 'info' });
  const [confirmacao, setConfirmacao] = useState({
    aberto: false,
    titulo: '',
    mensagem: '',
    detalhes: null,
    tipo: 'aviso',
    onConfirmar: null,
  });

  const wsRef = useRef(null);
  const isMountedRef = useRef(true);
  const ultimosChamadosIdsRef = useRef(new Set());

  // Autenticação e RBAC
  useEffect(() => {
    const token = localStorage.getItem('token');
    const funcao = (localStorage.getItem('funcao') || '').toLowerCase();

    if (!token) {
      navigate('/login');
      return;
    }

    if (funcao !== 'garcom') {
      if (funcao === 'cozinheiro' || funcao === 'cozinha') navigate('/cozinha');
      else if (funcao === 'gerente') navigate('/gerente');
      else if (funcao === 'adm') navigate('/administrativo');
      else navigate('/login');
    }
  }, [navigate]);

  // Carrega usuário autenticado
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
      const lista = data || [];

      // Checa se há novo chamado para tocar som e alertar
      let temNovo = false;
      lista.forEach((c) => {
        if (!ultimosChamadosIdsRef.current.has(c.idMesa)) {
          temNovo = true;
          ultimosChamadosIdsRef.current.add(c.idMesa);
        }
      });

      if (temNovo) {
        tocarAlertaSonoro();
      }

      setChamadosMesa(lista);
    } catch (err) {
      console.warn('Erro ao carregar chamados das mesas:', err);
    }
  }, [usuario]);

  // Carregamento inicial e Polling de 5 segundos para chamados
  useEffect(() => {
    carregarMesas();
    carregarChamados();

    const interval = setInterval(() => {
      carregarChamados();
    }, 5000);

    return () => clearInterval(interval);
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

          // Prato pronto liberado para entrega
          if (payload.type === 'item.status_changed' && payload.item) {
            const item = payload.item;
            if (item.status === 'Pronto') {
              setPratosProntos((prev) => {
                const existe = prev.some((p) => p.idItemPedido === item.idItemPedido);
                if (existe) return prev;
                return [item, ...prev];
              });
              tocarAlertaSonoro();
            } else if (item.status === 'Entregue' || item.status === 'Cancelado') {
              setPratosProntos((prev) =>
                prev.filter((p) => p.idItemPedido !== item.idItemPedido)
              );
            }

            // Atualiza comanda ativa caso aberta no modal
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
            ultimosChamadosIdsRef.current.add(mesaChamada.idMesa);
            tocarAlertaSonoro();
          } else if (payload.type === 'mesa.garcom_atendido' && payload.mesa) {
            const mesaChamada = payload.mesa;
            setChamadosMesa((prev) =>
              prev.filter((c) => c.idMesa !== mesaChamada.idMesa)
            );
            ultimosChamadosIdsRef.current.delete(mesaChamada.idMesa);
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

  // Ações de atendimento e entrega
  async function confirmarEntrega(item) {
    setConfirmacao({
      aberto: true,
      titulo: 'Confirmar Entrega de Item',
      mensagem: `Deseja registrar que o item "${item.nomeItem || 'Prato'}" (${item.quantidade}x) foi entregue na Mesa #${item.numeroMesa}?`,
      detalhes: `Garçom responsável: ${usuario?.nome || 'Garçom'}`,
      tipo: 'info',
      textoConfirmar: 'Confirmar Entrega',
      onConfirmar: async () => {
        setProcessando(true);
        try {
          await alterarStatusItem(item.idItemPedido, 'Entregue');
          setPratosProntos((prev) => prev.filter((p) => p.idItemPedido !== item.idItemPedido));
          setConfirmacao({ aberto: false });
          setAlerta({
            aberto: true,
            titulo: 'Entrega Registrada',
            mensagem: `O item foi marcado como Entregue na Mesa #${item.numeroMesa}.`,
            tipo: 'sucesso',
          });
        } catch (err) {
          setAlerta({
            aberto: true,
            titulo: 'Erro ao entregar',
            mensagem: err.message || 'Não foi possível registrar a entrega.',
            tipo: 'erro',
          });
        } finally {
          setProcessando(false);
        }
      },
    });
  }

  async function handleAbrirMesa(idMesa, numeroMesa) {
    setConfirmacao({
      aberto: true,
      titulo: 'Abrir Mesa',
      mensagem: `Confirmar abertura e início de sessão da Mesa #${numeroMesa}?`,
      tipo: 'info',
      textoConfirmar: 'Abrir Mesa',
      onConfirmar: async () => {
        setProcessando(true);
        try {
          await abrirMesa(idMesa);
          setConfirmacao({ aberto: false });
          setAlerta({
            aberto: true,
            titulo: 'Mesa Aberta',
            mensagem: `Mesa #${numeroMesa} aberta com sucesso!`,
            tipo: 'sucesso',
          });
          carregarMesas();
        } catch (err) {
          setAlerta({
            aberto: true,
            titulo: 'Erro ao abrir mesa',
            mensagem: err.message || 'Não foi possível abrir a mesa.',
            tipo: 'erro',
          });
        } finally {
          setProcessando(false);
        }
      },
    });
  }

  async function handleAtenderChamado(idMesa) {
    setProcessando(true);
    try {
      await atenderChamadoMesa(idMesa);
      setChamadosMesa((prev) => prev.filter((c) => c.idMesa !== idMesa));
      ultimosChamadosIdsRef.current.delete(idMesa);
    } catch (err) {
      setAlerta({
        aberto: true,
        titulo: 'Erro ao atender chamado',
        mensagem: err.message || 'Não foi possível registrar atendimento do chamado.',
        tipo: 'erro',
      });
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
        pedido: dados.pedido || dados,
        itens: dados.itens || [],
      });
    } catch (err) {
      setAlerta({
        aberto: true,
        titulo: 'Comanda não encontrada',
        mensagem: `Não há pedido ativo ou comanda aberta para a Mesa #${mesa.numero}.`,
        tipo: 'aviso',
      });
    } finally {
      setCarregandoComanda(false);
    }
  }

  // Alteração de quantidade de item pendente
  async function handleAlterarQuantidade(item, novaQuantidade) {
    if (novaQuantidade <= 0) {
      setConfirmacao({
        aberto: true,
        titulo: 'Cancelar Item',
        mensagem: `A quantidade foi reduzida a zero. Deseja realmente cancelar o item "${item.nomeItem || 'Item'}"?`,
        tipo: 'perigo',
        textoConfirmar: 'Sim, Cancelar Item',
        onConfirmar: async () => {
          setProcessando(true);
          try {
            await cancelarItemPedido(item.idItemPedido);
            setConfirmacao({ aberto: false });
            setComandaModal((prev) => {
              if (!prev) return null;
              return {
                ...prev,
                itens: prev.itens.map((it) =>
                  it.idItemPedido === item.idItemPedido ? { ...it, status: 'Cancelado' } : it
                ),
              };
            });
          } catch (err) {
            setAlerta({
              aberto: true,
              titulo: 'Erro ao cancelar',
              mensagem: err.message || 'Não foi possível cancelar o item.',
              tipo: 'erro',
            });
          } finally {
            setProcessando(false);
          }
        },
      });
      return;
    }

    setProcessando(true);
    try {
      const res = await alterarQuantidadeItem(item.idItemPedido, novaQuantidade);
      setComandaModal((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          itens: prev.itens.map((it) =>
            it.idItemPedido === item.idItemPedido
              ? { ...it, quantidade: res.item?.quantidade || novaQuantidade }
              : it
          ),
        };
      });
    } catch (err) {
      setAlerta({
        aberto: true,
        titulo: 'Não foi possível alterar quantidade',
        mensagem: err.message || 'Erro ao alterar quantidade do item.',
        tipo: 'erro',
      });
    } finally {
      setProcessando(false);
    }
  }

  // Cancelamento direto de item pendente
  async function handleCancelarItem(item) {
    setConfirmacao({
      aberto: true,
      titulo: 'Cancelar Item do Pedido',
      mensagem: `Deseja realmente cancelar o item "${item.nomeItem || 'Item'}" (Qtd: ${item.quantidade}) da Mesa #${comandaModal?.mesa?.numero}?`,
      tipo: 'perigo',
      textoConfirmar: 'Cancelar Item',
      onConfirmar: async () => {
        setProcessando(true);
        try {
          await cancelarItemPedido(item.idItemPedido);
          setConfirmacao({ aberto: false });
          setComandaModal((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              itens: prev.itens.map((it) =>
                it.idItemPedido === item.idItemPedido ? { ...it, status: 'Cancelado' } : it
              ),
            };
          });
          setAlerta({
            aberto: true,
            titulo: 'Item Cancelado',
            mensagem: 'O item foi cancelado com sucesso.',
            tipo: 'sucesso',
          });
        } catch (err) {
          setAlerta({
            aberto: true,
            titulo: 'Erro ao cancelar',
            mensagem: err.message || 'Não foi possível cancelar o item.',
            tipo: 'erro',
          });
        } finally {
          setProcessando(false);
        }
      },
    });
  }

  // Inclusão de itens pelo garçom
  async function handleItensAdicionados(itens) {
    if (!comandaModal?.pedido?.idPedido) return;
    await adicionarItensAoPedido(comandaModal.pedido.idPedido, itens);
    // Recarrega os itens da comanda
    const dados = await obterPedidoAtivoMesa(comandaModal.mesa.idMesa);
    setComandaModal({
      mesa: comandaModal.mesa,
      pedido: dados.pedido || dados,
      itens: dados.itens || [],
    });
    setAlerta({
      aberto: true,
      titulo: 'Itens Adicionados',
      mensagem: 'Os itens foram incluídos no pedido com sucesso!',
      tipo: 'sucesso',
    });
  }

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('funcao');
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-[#FAF6F3] font-[Poppins] text-gray-800 pb-20">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#FAF6F3]/95 backdrop-blur-md border-b border-gray-200/80 shadow-xs px-4 sm:px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img src={logo} alt="FastCooking Logo" className="h-9 sm:h-10 w-auto object-contain" />
            <div>
              <h1 className="text-base sm:text-xl font-black text-[#9C1C0E] tracking-tight leading-tight">
                FastCooking Atendimento
              </h1>
              <p className="text-[11px] sm:text-xs text-gray-500 font-medium">
                Garçom: <strong className="text-gray-700">{usuario?.nome || 'Atendente'}</strong>
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
              onClick={handleLogout}
              className="text-xs bg-white hover:bg-gray-100 text-gray-700 hover:text-[#9C1C0E] px-3 py-1.5 rounded-xl font-bold border border-gray-200 shadow-xs transition-all cursor-pointer flex items-center gap-1"
            >
              <MdLogout size={15} />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6 sm:space-y-8">
        {/* Chamados Urgentes de Garçom */}
        {chamadosMesa.length > 0 && (
          <section className="bg-gradient-to-r from-amber-500/15 via-[#B78A10]/15 to-amber-500/10 border-2 border-[#B78A10] rounded-3xl p-4 sm:p-5 shadow-md animate-fade-in">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base sm:text-lg font-black text-amber-950 flex items-center gap-2">
                <MdNotificationsActive className="text-[#B78A10] animate-bounce" size={24} />
                Chamados de Atendimento Urgentes
              </h2>
              <span className="bg-[#B78A10] text-white text-xs font-black px-3 py-1 rounded-full animate-pulse">
                {chamadosMesa.length} {chamadosMesa.length === 1 ? 'chamado' : 'chamados'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {chamadosMesa.map((chamado) => (
                <div
                  key={chamado.idMesa}
                  className="bg-white border border-amber-300 rounded-2xl p-4 shadow-xs flex items-center justify-between gap-3"
                >
                  <div>
                    <span className="text-base sm:text-lg font-black text-gray-900">
                      Mesa #{chamado.numero}
                    </span>
                    <p className="text-xs text-[#B78A10] font-bold mt-0.5">
                      Cliente solicitando atendimento
                    </p>
                  </div>

                  <button
                    onClick={() => handleAtenderChamado(chamado.idMesa)}
                    disabled={processando}
                    className="bg-[#B78A10] hover:bg-amber-700 text-white text-xs font-extrabold px-3.5 py-2 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1 shrink-0"
                  >
                    <MdCheckCircle size={15} /> Atender
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Pratos Prontos para Entrega na Mesa */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base sm:text-lg font-black text-gray-900 flex items-center gap-2">
                <MdRoomService className="text-[#9C1C0E]" size={22} />
                Pratos Prontos para Entrega
              </h2>
              <p className="text-xs text-gray-500 font-medium">
                Pratos finalizados pela cozinha — Liberados para entrega no salão
              </p>
            </div>
            <span className="bg-[#9C1C0E] text-white text-xs font-extrabold px-3 py-1 rounded-full">
              {pratosProntos.length} prontos
            </span>
          </div>

          {pratosProntos.length === 0 ? (
            <div className="bg-white rounded-3xl border border-dashed border-gray-300 p-8 sm:p-12 text-center text-gray-400">
              <span className="text-3xl sm:text-4xl">✨</span>
              <p className="text-sm sm:text-base font-bold text-gray-700 mt-2">
                Nenhum prato aguardando entrega no momento
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Assim que a cozinha concluir o preparo, o aviso soará automaticamente.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {pratosProntos.map((item) => (
                <div
                  key={item.idItemPedido}
                  className="bg-white border-2 border-emerald-500 rounded-3xl p-5 shadow-md flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="bg-emerald-100 text-emerald-800 text-xs font-black px-3 py-1 rounded-full">
                        Mesa #{item.numeroMesa || '—'}
                      </span>
                      <span className="text-xs font-bold text-emerald-600 animate-pulse">
                        ● LIBERADO P/ ENTREGA
                      </span>
                    </div>

                    <h3 className="font-extrabold text-gray-900 text-base sm:text-lg mt-3 leading-tight">
                      {item.quantidade}x {item.nomeItem || 'Prato'}
                    </h3>

                    {item.observacao && (
                      <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 p-2 rounded-xl mt-2">
                        Obs: {item.observacao}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => confirmarEntrega(item)}
                    disabled={processando}
                    className="mt-4 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-2.5 rounded-2xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5 text-xs sm:text-sm"
                  >
                    <MdCheckCircle size={18} />
                    <span>Confirmar Entrega na Mesa</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Mesas do Salão */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base sm:text-lg font-black text-gray-900 flex items-center gap-2">
                <MdTableBar className="text-[#9C1C0E]" size={22} />
                Mesas do Salão
              </h2>
              <p className="text-xs text-gray-500 font-medium">
                Status das mesas, comandas ativas e atendimento
              </p>
            </div>

            <button
              onClick={() => {
                carregarMesas();
                carregarChamados();
              }}
              className="text-xs bg-white hover:bg-gray-100 text-gray-700 font-bold px-3 py-1.5 rounded-xl border border-gray-200 shadow-xs transition-all cursor-pointer flex items-center gap-1"
            >
              <MdRefresh size={16} /> Recarregar
            </button>
          </div>

          {mesas.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-200 p-8 text-center text-gray-400">
              <p className="text-sm">Nenhuma mesa cadastrada para este restaurante.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
              {mesas.map((mesa) => {
                const isOcupada = mesa.status === 'Indisponivel' || mesa.status === 'Ocupada';
                const temChamado = chamadosMesa.some((c) => c.idMesa === mesa.idMesa);

                return (
                  <div
                    key={mesa.idMesa}
                    className={`rounded-2xl sm:rounded-3xl p-4 border flex flex-col justify-between text-center transition-all ${
                      temChamado
                        ? 'bg-amber-100/90 border-[#B78A10] ring-2 ring-[#B78A10] shadow-md animate-pulse'
                        : isOcupada
                        ? 'bg-amber-50/70 border-amber-300 shadow-xs'
                        : 'bg-white border-gray-200 hover:border-gray-300 shadow-xs'
                    }`}
                  >
                    <div>
                      <span className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                        #{mesa.numero}
                      </span>
                      <p
                        className={`text-[11px] font-extrabold mt-1 ${
                          temChamado
                            ? 'text-amber-900'
                            : isOcupada
                            ? 'text-[#B78A10]'
                            : 'text-emerald-700'
                        }`}
                      >
                        {temChamado
                          ? '🛎️ Chamando'
                          : isOcupada
                          ? 'Ocupada'
                          : 'Disponível'}
                      </p>
                    </div>

                    <div className="mt-3 flex flex-col gap-1.5">
                      {!isOcupada ? (
                        <button
                          onClick={() => handleAbrirMesa(mesa.idMesa, mesa.numero)}
                          disabled={processando}
                          className="w-full text-xs bg-gray-900 hover:bg-black text-white font-bold py-1.5 rounded-xl transition-all cursor-pointer"
                        >
                          Abrir Mesa
                        </button>
                      ) : (
                        <button
                          onClick={() => handleVerComanda(mesa)}
                          disabled={carregandoComanda}
                          className="w-full text-xs bg-[#9C1C0E] hover:bg-[#7a160b] text-white font-bold py-1.5 rounded-xl transition-all cursor-pointer shadow-xs"
                        >
                          Ver Comanda
                        </button>
                      )}

                      {temChamado && (
                        <button
                          onClick={() => handleAtenderChamado(mesa.idMesa)}
                          disabled={processando}
                          className="w-full text-xs bg-[#B78A10] hover:bg-amber-700 text-white font-bold py-1 rounded-xl transition-all cursor-pointer"
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

      {/* Modal de Detalhes da Comanda */}
      {comandaModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 font-[Poppins]">
          <div className="bg-[#FAF6F3] rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-gray-200 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
                  <span className="p-2 bg-[#9C1C0E]/10 text-[#9C1C0E] rounded-xl">
                    <MdRestaurantMenu size={20} />
                  </span>
                  Comanda — Mesa #{comandaModal.mesa.numero}
                </h3>
                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 font-medium">
                  <span>
                    Pedido ID:{' '}
                    <strong className="font-mono text-gray-800">
                      {comandaModal.pedido?.idPedido?.slice(0, 8)}
                    </strong>
                  </span>
                  <span>•</span>
                  <span>
                    Status:{' '}
                    <strong className="text-[#9C1C0E]">
                      {comandaModal.pedido?.status || 'Aberto'}
                    </strong>
                  </span>
                </div>
              </div>
              <button
                onClick={() => setComandaModal(null)}
                className="text-gray-400 hover:text-gray-700 p-1 rounded-xl hover:bg-gray-200/60 transition-colors cursor-pointer"
              >
                <MdClose size={22} />
              </button>
            </div>

            {/* Ações da Comanda */}
            <div className="pt-3 pb-2 flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-gray-700">
                Itens Consumidos ({comandaModal.itens.filter((i) => i.status !== 'Cancelado').length})
              </span>
              <button
                type="button"
                onClick={() => setModalAdicionarAberto(true)}
                className="px-3 py-1.5 bg-[#9C1C0E] hover:bg-[#7a160b] text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1 shadow-xs"
              >
                <MdAdd size={16} /> Incluir Item à Mesa
              </button>
            </div>

            {/* Lista de Itens */}
            <div className="overflow-y-auto py-2 space-y-2.5 flex-1 pr-1">
              {comandaModal.itens.length === 0 ? (
                <p className="text-center text-sm text-gray-400 py-8">
                  Nenhum item adicionado a esta comanda ainda.
                </p>
              ) : (
                comandaModal.itens.map((item) => {
                  const podeEditarQtd = item.status === 'Pendente';
                  const podeCancelar = item.status === 'Pendente';

                  return (
                    <div
                      key={item.idItemPedido}
                      className="p-3.5 rounded-2xl border border-gray-200 bg-white flex items-center justify-between gap-3 shadow-xs"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-gray-900 text-sm">
                            {item.quantidade}x {item.nomeItem || 'Item'}
                          </span>
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                              item.status === 'Pendente'
                                ? 'bg-amber-100 text-amber-900'
                                : item.status === 'Em preparo'
                                ? 'bg-orange-100 text-orange-900'
                                : item.status === 'Pronto'
                                ? 'bg-emerald-100 text-emerald-900'
                                : item.status === 'Entregue'
                                ? 'bg-blue-100 text-blue-900'
                                : 'bg-red-100 text-red-900'
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>
                        {item.observacao && (
                          <p className="text-xs text-gray-500 italic mt-0.5">
                            Obs: {item.observacao}
                          </p>
                        )}
                        <p className="text-xs text-gray-600 mt-1 font-medium">
                          R$ {Number(item.precoUnitario || 0).toFixed(2)} un. •{' '}
                          <strong className="text-gray-900">
                            Subtotal: R${' '}
                            {(Number(item.precoUnitario || 0) * (item.quantidade || 1)).toFixed(2)}
                          </strong>
                        </p>
                      </div>

                      {/* Controle de Quantidade e Cancelamento para itens Pendentes */}
                      <div className="flex items-center gap-2 shrink-0">
                        {podeEditarQtd ? (
                          <>
                            <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-xl border border-gray-200">
                              <button
                                type="button"
                                onClick={() => handleAlterarQuantidade(item, item.quantidade - 1)}
                                disabled={processando}
                                className="w-6 h-6 rounded-lg bg-white flex items-center justify-center text-gray-700 hover:text-[#9C1C0E] cursor-pointer"
                                title="Diminuir quantidade"
                              >
                                <MdRemove size={14} />
                              </button>
                              <span className="text-xs font-black text-gray-900 w-5 text-center">
                                {item.quantidade}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleAlterarQuantidade(item, item.quantidade + 1)}
                                disabled={processando}
                                className="w-6 h-6 rounded-lg bg-white flex items-center justify-center text-gray-700 hover:text-[#9C1C0E] cursor-pointer"
                                title="Aumentar quantidade"
                              >
                                <MdAdd size={14} />
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleCancelarItem(item)}
                              disabled={processando}
                              className="p-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold transition-all cursor-pointer"
                              title="Cancelar item"
                            >
                              <MdClose size={16} />
                            </button>
                          </>
                        ) : (
                          <span className="text-[11px] text-gray-400 italic">
                            {item.status === 'Cancelado'
                              ? 'Cancelado'
                              : item.status === 'Em preparo'
                              ? 'Em preparo'
                              : 'Entregue'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Rodapé do Modal com Ações */}
            <div className="pt-4 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-xs text-gray-500 font-medium">Total da Comanda:</span>
                <p className="text-lg font-black text-[#9C1C0E]">
                  R${' '}
                  {comandaModal.itens
                    .filter((it) => it.status !== 'Cancelado')
                    .reduce((acc, it) => acc + (Number(it.precoUnitario) || 0) * (it.quantidade || 1), 0)
                    .toFixed(2)}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {comandaModal.pedido?.status !== 'Fechado' && (
                  <button
                    onClick={() => setModalPagamentoAberto(true)}
                    className="bg-[#9C1C0E] hover:bg-[#7a160b] text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-2xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <MdPayment size={18} />
                    <span>Pagamento & Fechamento</span>
                  </button>
                )}

                <button
                  onClick={() => setComandaModal(null)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs sm:text-sm font-bold px-4 py-2.5 rounded-2xl transition-all cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Adicionar Item ao Cardápio */}
      {modalAdicionarAberto && comandaModal && (
        <ModalAdicionarItemCardapio
          aberto={modalAdicionarAberto}
          mesa={comandaModal.mesa}
          idPedido={comandaModal.pedido?.idPedido}
          idRestaurante={usuario?.idRestaurante}
          onFechar={() => setModalAdicionarAberto(false)}
          onItensAdicionados={handleItensAdicionados}
        />
      )}

      {/* Modal Pagamento & Fechamento com Múltiplos Pagamentos e Divisão */}
      {modalPagamentoAberto && comandaModal && (
        <ModalPagamentoComanda
          aberto={modalPagamentoAberto}
          mesa={comandaModal.mesa}
          pedido={comandaModal.pedido}
          itens={comandaModal.itens}
          onFechar={() => setModalPagamentoAberto(false)}
          onSucesso={async () => {
            setComandaModal(null);
            await carregarMesas();
            setAlerta({
              aberto: true,
              titulo: 'Comanda Encerrada',
              mensagem: `A Mesa #${comandaModal.mesa.numero} foi encerrada e liberada com sucesso!`,
              tipo: 'sucesso',
            });
          }}
        />
      )}

      {/* Modais de Alerta e Confirmação (Zero browser alert/confirm) */}
      <ModalAlerta
        aberto={alerta.aberto}
        titulo={alerta.titulo}
        mensagem={alerta.mensagem}
        tipo={alerta.tipo}
        onFechar={() => setAlerta((a) => ({ ...a, aberto: false }))}
      />

      <ModalConfirmacao
        aberto={confirmacao.aberto}
        titulo={confirmacao.titulo}
        mensagem={confirmacao.mensagem}
        detalhes={confirmacao.detalhes}
        tipo={confirmacao.tipo}
        textoConfirmar={confirmacao.textoConfirmar}
        processando={processando}
        onConfirmar={confirmacao.onConfirmar}
        onCancelar={() => setConfirmacao((c) => ({ ...c, aberto: false }))}
      />
    </div>
  );
}
