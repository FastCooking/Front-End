import { useCallback, useEffect, useRef, useState } from "react";
import {
  MdAdd,
  MdCheckCircle,
  MdClose,
  MdNotificationsActive,
  MdPayment,
  MdRefresh,
  MdRemove,
  MdRestaurantMenu,
  MdRoomService,
  MdTableBar,
} from "react-icons/md";
import { useNavigate } from "react-router-dom";

import ModalAdicionarItemCardapio from "../components/garcom/ModalAdicionarItemCardapio";
import ModalPagamentoComanda from "../components/garcom/ModalPagamentoComanda";
import AppShell from "../components/layout/AppShell";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Modal,
  PageHeader,
  StatusBadge,
  useConfirm,
  useToast,
} from "../components/ui";
import { API_BASE } from "../config/api";
import {
  abrirMesa,
  adicionarItensAoPedido,
  alterarQuantidadeItem,
  atenderChamadoMesa,
  cancelarItemPedido,
  concluirEntrega,
  listarMesas,
  obterChamadosAtivos,
  obterFilaEntregasProntas,
  obterPedidoAtivoMesa,
} from "../services/pedidoService";
import { tocarAlertaSonoro } from "../utils/audioNotification";

function buildWsUrl() {
  const wsBase = API_BASE.replace(/^http/, "ws");
  return `${wsBase}/pedidos/ws`;
}

export default function TelaGarcom() {
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();

  const [pratosProntos, setPratosProntos] = useState([]);
  const [mesas, setMesas] = useState([]);
  const [chamadosMesa, setChamadosMesa] = useState([]);
  const [statusConexao, setStatusConexao] = useState("CONECTANDO");
  const [usuario] = useState(() => {
    try {
      const userStr = localStorage.getItem("user");
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  });
  const [processando, setProcessando] = useState(false);
  const [itemEmAtualizacao, setItemEmAtualizacao] = useState(null);

  const [comandaModal, setComandaModal] = useState(null);
  const [carregandoComanda, setCarregandoComanda] = useState(false);
  const [modalAdicionarAberto, setModalAdicionarAberto] = useState(false);
  const [modalPagamentoAberto, setModalPagamentoAberto] = useState(false);

  const wsRef = useRef(null);
  const isMountedRef = useRef(true);
  const reconnectTimerRef = useRef(null);
  const ultimosChamadosIdsRef = useRef(new Set());
  const carregarMesasRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const funcao = (localStorage.getItem("funcao") || "").toLowerCase();

    if (!token) {
      navigate("/login");
      return;
    }

    if (funcao !== "garcom") {
      if (funcao === "cozinheiro" || funcao === "cozinha") navigate("/cozinha");
      else if (funcao === "gerente") navigate("/gerente");
      else if (funcao === "adm") navigate("/administrativo");
      else navigate("/login");
    }
  }, [navigate]);

  const idRestaurante = usuario?.idRestaurante;

  const carregarMesas = useCallback(async () => {
    try {
      const data = await listarMesas(idRestaurante).catch(() => []);
      setMesas(data || []);
    } catch {
      // Silencia erro transitório
    }
  }, [idRestaurante]);

  const carregarChamados = useCallback(async () => {
    try {
      if (!idRestaurante) return;
      const data = await obterChamadosAtivos(idRestaurante).catch(() => []);
      const lista = data || [];

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
    } catch {
      // Silencia erro transitório
    }
  }, [idRestaurante]);

  const carregarPratosProntos = useCallback(async () => {
    try {
      const fila = await obterFilaEntregasProntas();
      if (Array.isArray(fila)) {
        setPratosProntos(
          fila.map((it) => ({
            idItemPedido: it.idItemPedido,
            deliveryId: it.deliveryId,
            nomeItem: it.nomeItem || it.nome,
            quantidade: it.quantidade,
            numeroMesa: it.numeroMesa,
            idMesa: it.idMesa,
            status: it.status || "Pronto",
            observacao: it.observacao,
          }))
        );
      }
    } catch {
      // Silencia erro transitório
    }
  }, []);

  useEffect(() => {
    carregarMesasRef.current = carregarMesas;
  }, [carregarMesas]);

  useEffect(() => {
    let ativo = true;
    Promise.resolve().then(() => {
      if (ativo) {
        carregarMesas();
        carregarChamados();
        carregarPratosProntos();
      }
    });

    const interval = setInterval(() => {
      carregarChamados();
      carregarPratosProntos();
    }, 5000);

    return () => {
      ativo = false;
      clearInterval(interval);
    };
  }, [carregarMesas, carregarChamados, carregarPratosProntos]);

  useEffect(() => {
    isMountedRef.current = true;

    function abrirSocket() {
      const token = localStorage.getItem("token");
      if (!token) return;

      if (wsRef.current) {
        wsRef.current.close();
      }

      try {
        const ws = new WebSocket(buildWsUrl());
        wsRef.current = ws;

        ws.onopen = () => {
          if (!isMountedRef.current) return;
          setStatusConexao("CONECTADO");
          ws.send(JSON.stringify({ type: "authenticate", token }));
        };

        ws.onmessage = (event) => {
          if (!isMountedRef.current) return;
          try {
            const payload = JSON.parse(event.data);

            if (payload.type === "item.status_changed" && payload.item) {
              const item = payload.item;
              if (item.status === "Pronto") {
                setPratosProntos((prev) => {
                  const existe = prev.some(
                    (p) => p.idItemPedido === item.idItemPedido
                  );
                  if (existe) return prev;
                  return [item, ...prev];
                });
                tocarAlertaSonoro();
              } else if (
                item.status === "Entregue" ||
                item.status === "Cancelado"
              ) {
                setPratosProntos((prev) =>
                  prev.filter((p) => p.idItemPedido !== item.idItemPedido)
                );
              }

              setComandaModal((prev) => {
                if (!prev || !prev.itens) return prev;
                const afetaModal = prev.itens.some(
                  (it) => it.idItemPedido === item.idItemPedido
                );
                if (!afetaModal) return prev;
                return {
                  ...prev,
                  itens: prev.itens.map((it) =>
                    it.idItemPedido === item.idItemPedido
                      ? { ...it, status: item.status }
                      : it
                  ),
                };
              });
            }

            if (
              payload.type === "kds:item_ready" ||
              payload.type === "delivery:claimed" ||
              payload.type === "queue.updated"
            ) {
              carregarPratosProntos();
              if (payload.type === "kds:item_ready") {
                tocarAlertaSonoro();
              }
            }

            if (payload.type === "mesa.garcom_chamado" && payload.mesa) {
              const mesaChamada = payload.mesa;
              setChamadosMesa((prev) => {
                const existe = prev.some(
                  (c) => c.idMesa === mesaChamada.idMesa
                );
                if (existe) return prev;
                return [mesaChamada, ...prev];
              });
              ultimosChamadosIdsRef.current.add(mesaChamada.idMesa);
              tocarAlertaSonoro();
            } else if (
              payload.type === "mesa.garcom_atendido" &&
              payload.mesa
            ) {
              const mesaChamada = payload.mesa;
              setChamadosMesa((prev) =>
                prev.filter((c) => c.idMesa !== mesaChamada.idMesa)
              );
              ultimosChamadosIdsRef.current.delete(mesaChamada.idMesa);
            }

            if (
              payload.type === "table.opened" ||
              payload.type === "table.status_changed" ||
              payload.type === "order.closed" ||
              payload.type === "order.created"
            ) {
              const idMesaEvento = payload.idMesa || payload.mesa?.idMesa;
              const novoStatus = payload.status || payload.mesa?.status;
              if (idMesaEvento && novoStatus) {
                setMesas((prev) =>
                  prev.map((m) =>
                    String(m.idMesa) === String(idMesaEvento)
                      ? { ...m, status: novoStatus }
                      : m
                  )
                );
              }
              carregarMesasRef.current?.();
            }
          } catch {
            // Ignora payload malformado
          }
        };

        ws.onclose = () => {
          if (!isMountedRef.current) return;
          setStatusConexao("DESCONECTADO");
          reconnectTimerRef.current = setTimeout(() => {
            if (isMountedRef.current) abrirSocket();
          }, 3000);
        };

        ws.onerror = () => {
          if (!isMountedRef.current) return;
          setStatusConexao("ERRO");
        };
      } catch {
        setStatusConexao("ERRO");
      }
    }

    Promise.resolve().then(() => {
      if (isMountedRef.current) abrirSocket();
    });

    return () => {
      isMountedRef.current = false;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [carregarPratosProntos]);

  async function confirmarEntrega(item) {
    const ok = await confirm({
      title: "Confirmar Entrega de Item",
      message: `Deseja registrar que o item "${item.nomeItem || "Prato"}" (${
        item.quantidade
      }x) foi entregue na Mesa #${item.numeroMesa}?`,
      confirmText: "Confirmar Entrega",
      tone: "primary",
    });
    if (!ok) return;

    setProcessando(true);
    try {
      await concluirEntrega(item.deliveryId || item.idItemPedido);
      setPratosProntos((prev) =>
        prev.filter((p) => p.idItemPedido !== item.idItemPedido)
      );
      setComandaModal((prev) => {
        if (!prev || !prev.itens) return prev;
        return {
          ...prev,
          itens: prev.itens.map((it) =>
            it.idItemPedido === item.idItemPedido
              ? { ...it, status: "Entregue" }
              : it
          ),
        };
      });
      toast.success(
        `Item marcado como Entregue na Mesa #${item.numeroMesa}.`
      );
    } catch (err) {
      toast.error(err.message || "Não foi possível registrar a entrega.");
    } finally {
      setProcessando(false);
    }
  }

  async function handleAbrirMesa(idMesa, numeroMesa) {
    const ok = await confirm({
      title: "Abrir Mesa",
      message: `Confirmar abertura e início de sessão da Mesa #${numeroMesa}?`,
      confirmText: "Abrir Mesa",
      tone: "primary",
    });
    if (!ok) return;

    setProcessando(true);
    try {
      await abrirMesa(idMesa);
      setMesas((prev) =>
        prev.map((m) =>
          String(m.idMesa) === String(idMesa)
            ? { ...m, status: "Indisponivel" }
            : m
        )
      );
      toast.success(`Mesa #${numeroMesa} aberta com sucesso!`);
      carregarMesas();
    } catch (err) {
      toast.error(err.message || "Não foi possível abrir a mesa.");
    } finally {
      setProcessando(false);
    }
  }

  async function handleAtenderChamado(idMesa) {
    setProcessando(true);
    try {
      await atenderChamadoMesa(idMesa);
      setChamadosMesa((prev) => prev.filter((c) => c.idMesa !== idMesa));
      ultimosChamadosIdsRef.current.delete(idMesa);
      toast.success("Chamado atendido!");
    } catch (err) {
      toast.error(
        err.message || "Não foi possível registrar atendimento do chamado."
      );
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
    } catch {
      toast.warning(
        `Não há pedido ativo ou comanda aberta para a Mesa #${mesa.numero}.`
      );
    } finally {
      setCarregandoComanda(false);
    }
  }

  async function handleAlterarQuantidade(item, novaQuantidade) {
    if (novaQuantidade <= 0) {
      const ok = await confirm({
        title: "Cancelar Item",
        message: `A quantidade foi reduzida a zero. Deseja realmente cancelar o item "${
          item.nomeItem || "Item"
        }"?`,
        confirmText: "Sim, Cancelar Item",
        tone: "danger",
      });
      if (!ok) return;

      setItemEmAtualizacao(item.idItemPedido);
      setProcessando(true);
      try {
        await cancelarItemPedido(item.idItemPedido);
        setComandaModal((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            itens: prev.itens.map((it) =>
              it.idItemPedido === item.idItemPedido
                ? { ...it, status: "Cancelado" }
                : it
            ),
          };
        });
        toast.success("Item cancelado.");
      } catch (err) {
        toast.error(err.message || "Não foi possível cancelar o item.");
      } finally {
        setItemEmAtualizacao(null);
        setProcessando(false);
      }
      return;
    }

    setItemEmAtualizacao(item.idItemPedido);
    setProcessando(true);
    try {
      const res = await alterarQuantidadeItem(
        item.idItemPedido,
        novaQuantidade
      );
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
      toast.error(err.message || "Erro ao alterar quantidade do item.");
    } finally {
      setItemEmAtualizacao(null);
      setProcessando(false);
    }
  }

  async function handleCancelarItem(item) {
    const ok = await confirm({
      title: "Cancelar Item do Pedido",
      message: `Deseja realmente cancelar o item "${
        item.nomeItem || "Item"
      }" (Qtd: ${item.quantidade}) da Mesa #${comandaModal?.mesa?.numero}?`,
      confirmText: "Cancelar Item",
      tone: "danger",
    });
    if (!ok) return;

    setItemEmAtualizacao(item.idItemPedido);
    setProcessando(true);
    try {
      await cancelarItemPedido(item.idItemPedido);
      setComandaModal((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          itens: prev.itens.map((it) =>
            it.idItemPedido === item.idItemPedido
              ? { ...it, status: "Cancelado" }
              : it
          ),
        };
      });
      toast.success("O item foi cancelado com sucesso.");
    } catch (err) {
      toast.error(err.message || "Não foi possível cancelar o item.");
    } finally {
      setItemEmAtualizacao(null);
      setProcessando(false);
    }
  }

  async function handleItensAdicionados(itens) {
    if (!comandaModal?.pedido?.idPedido) return;
    await adicionarItensAoPedido(comandaModal.pedido.idPedido, itens);
    const dados = await obterPedidoAtivoMesa(comandaModal.mesa.idMesa);
    setComandaModal({
      mesa: comandaModal.mesa,
      pedido: dados.pedido || dados,
      itens: dados.itens || [],
    });
    toast.success("Os itens foram incluídos no pedido com sucesso!");
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    localStorage.removeItem("funcao");
    navigate("/login");
  }

  return (
    <AppShell
      modulo="Atendimento do Salão"
      restauranteNome={usuario?.nome ? `Garçom: ${usuario.nome}` : undefined}
      onLogout={handleLogout}
      headerActions={
        <div className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-white border border-gray-200 shadow-xs">
          <span
            className={`w-2 h-2 rounded-full ${
              statusConexao === "CONECTADO" ? "bg-emerald-500" : "bg-gold"
            }`}
          />
          <span className="text-gray-600 hidden xs:inline">
            {statusConexao === "CONECTADO" ? "Tempo Real" : "Reconectando"}
          </span>
        </div>
      }
    >
      <div className="space-y-6 sm:space-y-8">
        {/* Chamados Urgentes de Garçom */}
        {chamadosMesa.length > 0 && (
          <Card className="bg-amber-50 border-2 border-gold animate-fade-in">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base sm:text-lg font-black text-amber-950 flex items-center gap-2">
                <MdNotificationsActive
                  className="text-gold animate-pulse"
                  size={24}
                />
                Chamados de Atendimento Urgentes
              </h2>
              <Badge tone="gold" className="animate-pulse">
                {chamadosMesa.length}{" "}
                {chamadosMesa.length === 1 ? "chamado" : "chamados"}
              </Badge>
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
                    <p className="text-xs text-gold font-bold mt-0.5">
                      Cliente solicitando atendimento
                    </p>
                  </div>

                  <Button
                    variant="gold"
                    size="sm"
                    icon={MdCheckCircle}
                    disabled={processando}
                    onClick={() => handleAtenderChamado(chamado.idMesa)}
                  >
                    Atender
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Pratos Prontos para Entrega na Mesa */}
        <section className="space-y-4">
          <PageHeader
            title="Pratos Prontos para Entrega"
            icon={MdRoomService}
            badge={<Badge tone="brand">{pratosProntos.length} prontos</Badge>}
          />

          {pratosProntos.length === 0 ? (
            <Card>
              <EmptyState
                icon={MdRoomService}
                title="Nenhum prato aguardando entrega no momento"
                description="Assim que a cozinha concluir o preparo, o aviso soará automaticamente."
              />
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {pratosProntos.map((item) => (
                <Card
                  key={item.idItemPedido}
                  className="border-2 border-emerald-500 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <Badge tone="success">
                        Mesa #{item.numeroMesa || "—"}
                      </Badge>
                      <span className="text-xs font-bold text-emerald-600 animate-pulse">
                        ● LIBERADO P/ ENTREGA
                      </span>
                    </div>

                    <h3 className="font-extrabold text-gray-900 text-base sm:text-lg mt-3 leading-tight">
                      {item.quantidade}x {item.nomeItem || "Prato"}
                    </h3>

                    {item.observacao && (
                      <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 p-2 rounded-xl mt-2">
                        Obs: {item.observacao}
                      </p>
                    )}
                  </div>

                  <Button
                    size="sm"
                    icon={MdCheckCircle}
                    disabled={processando}
                    onClick={() => confirmarEntrega(item)}
                    className="mt-4 w-full !bg-emerald-600 hover:!bg-emerald-700"
                  >
                    Confirmar Entrega na Mesa
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Mesas do Salão */}
        <section className="space-y-4">
          <PageHeader
            title="Mesas do Salão"
            icon={MdTableBar}
            actions={
              <Button
                variant="secondary"
                size="sm"
                icon={MdRefresh}
                onClick={() => {
                  carregarMesas();
                  carregarChamados();
                }}
              >
                Recarregar
              </Button>
            }
          />

          {mesas.length === 0 ? (
            <Card>
              <EmptyState
                icon={MdTableBar}
                title="Nenhuma mesa cadastrada para este restaurante"
              />
            </Card>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
              {mesas.map((mesa) => {
                const isOcupada =
                  mesa.status === "Indisponivel" || mesa.status === "Ocupada";
                const temChamado = chamadosMesa.some(
                  (c) => c.idMesa === mesa.idMesa
                );

                return (
                  <Card
                    key={mesa.idMesa}
                    padding="p-4"
                    className={`flex flex-col justify-between text-center ${
                      temChamado
                        ? "bg-amber-50 border-gold ring-2 ring-gold animate-pulse"
                        : isOcupada
                        ? "bg-brand-soft/40 border-gold/40"
                        : ""
                    }`}
                  >
                    <div>
                      <span className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                        #{mesa.numero}
                      </span>
                      <div className="mt-1 flex justify-center">
                        {temChamado ? (
                          <Badge tone="gold" icon={MdNotificationsActive}>
                            Chamando
                          </Badge>
                        ) : (
                          <StatusBadge
                            status={isOcupada ? "Ocupada" : "Disponivel"}
                          />
                        )}
                      </div>
                    </div>

                    <div className="mt-3 flex flex-col gap-1.5">
                      {!isOcupada ? (
                        <Button
                          variant="secondary"
                          size="xs"
                          disabled={processando}
                          onClick={() =>
                            handleAbrirMesa(mesa.idMesa, mesa.numero)
                          }
                          className="w-full"
                        >
                          Abrir Mesa
                        </Button>
                      ) : (
                        <Button
                          size="xs"
                          disabled={carregandoComanda}
                          onClick={() => handleVerComanda(mesa)}
                          className="w-full"
                        >
                          Ver Comanda
                        </Button>
                      )}

                      {temChamado && (
                        <Button
                          variant="gold"
                          size="xs"
                          disabled={processando}
                          onClick={() => handleAtenderChamado(mesa.idMesa)}
                          className="w-full"
                        >
                          Atender
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Modal de Detalhes da Comanda */}
      {comandaModal && (
        <Modal
          open
          onClose={() => setComandaModal(null)}
          title={`Comanda — Mesa #${comandaModal.mesa.numero}`}
          subtitle={
            comandaModal.pedido?.idPedido
              ? `Pedido #${comandaModal.pedido.idPedido.slice(0, 8)} • ${
                  comandaModal.pedido?.status || "Aberto"
                }`
              : undefined
          }
          icon={MdRestaurantMenu}
          size="2xl"
          footer={
            <div className="w-full flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-xs text-gray-500 font-medium">
                  Total da Comanda:
                </span>
                <p className="text-lg font-black text-brand">
                  R${" "}
                  {comandaModal.itens
                    .filter((it) => it.status !== "Cancelado")
                    .reduce(
                      (acc, it) =>
                        acc +
                        (Number(it.precoUnitario) || 0) * (it.quantidade || 1),
                      0
                    )
                    .toFixed(2)}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setComandaModal(null)}
                >
                  Fechar
                </Button>
                {comandaModal.pedido?.status !== "Fechado" && (
                  <Button
                    size="sm"
                    icon={MdPayment}
                    onClick={() => setModalPagamentoAberto(true)}
                  >
                    Pagamento & Fechamento
                  </Button>
                )}
              </div>
            </div>
          }
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-gray-700">
                Itens Consumidos (
                {
                  comandaModal.itens.filter((i) => i.status !== "Cancelado")
                    .length
                }
                )
              </span>
              <Button
                size="xs"
                icon={MdAdd}
                onClick={() => setModalAdicionarAberto(true)}
              >
                Incluir Item à Mesa
              </Button>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2.5 pr-1">
              {comandaModal.itens.length === 0 ? (
                <p className="text-center text-sm text-gray-400 py-8">
                  Nenhum item adicionado a esta comanda ainda.
                </p>
              ) : (
                comandaModal.itens.map((item) => {
                  const podeEditarQtd = item.status === "Pendente";

                  return (
                    <div
                      key={item.idItemPedido}
                      className="p-3.5 rounded-2xl border border-gray-200/80 bg-white flex items-center justify-between gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`font-bold text-gray-900 text-sm ${
                              item.status === "Cancelado"
                                ? "line-through text-gray-400"
                                : ""
                            }`}
                          >
                            {item.quantidade}x {item.nomeItem || "Item"}
                          </span>
                          <StatusBadge status={item.status} />
                        </div>
                        {item.observacao && (
                          <p className="text-xs text-gray-500 italic mt-0.5">
                            Obs: {item.observacao}
                          </p>
                        )}
                        <p className="text-xs text-gray-600 mt-1 font-medium">
                          R$ {Number(item.precoUnitario || 0).toFixed(2)} un. •{" "}
                          <strong className="text-gray-900">
                            Subtotal: R${" "}
                            {(
                              Number(item.precoUnitario || 0) *
                              (item.quantidade || 1)
                            ).toFixed(2)}
                          </strong>
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {itemEmAtualizacao === item.idItemPedido ? (
                          <span className="text-xs text-gray-500 font-medium">
                            Atualizando...
                          </span>
                        ) : podeEditarQtd ? (
                          <>
                            <div className="flex items-center gap-1 bg-surface p-0.5 rounded-xl border border-gray-200">
                              <button
                                type="button"
                                onClick={() =>
                                  handleAlterarQuantidade(
                                    item,
                                    item.quantidade - 1
                                  )
                                }
                                disabled={processando}
                                className="w-6 h-6 rounded-lg bg-white flex items-center justify-center text-gray-700 hover:text-brand cursor-pointer"
                                title="Diminuir quantidade"
                              >
                                <MdRemove size={14} />
                              </button>
                              <span className="text-xs font-bold text-gray-900 w-5 text-center">
                                {item.quantidade}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  handleAlterarQuantidade(
                                    item,
                                    item.quantidade + 1
                                  )
                                }
                                disabled={processando}
                                className="w-6 h-6 rounded-lg bg-white flex items-center justify-center text-gray-700 hover:text-brand cursor-pointer"
                                title="Aumentar quantidade"
                              >
                                <MdAdd size={14} />
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleCancelarItem(item)}
                              disabled={processando}
                              className="p-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold transition-colors cursor-pointer"
                              title="Cancelar item"
                            >
                              <MdClose size={16} />
                            </button>
                          </>
                        ) : item.status === "Pronto" ? (
                          <Button
                            size="xs"
                            disabled={processando}
                            onClick={() =>
                              confirmarEntrega({
                                idItemPedido: item.idItemPedido,
                                nomeItem:
                                  item.cardapio?.nome ||
                                  item.nomeItem ||
                                  item.nome ||
                                  "Prato",
                                quantidade: item.quantidade,
                                numeroMesa:
                                  comandaModal.mesa?.numero ||
                                  comandaModal.pedido?.idMesa,
                              })
                            }
                            className="!bg-emerald-600 hover:!bg-emerald-700"
                          >
                            Entregar
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </Modal>
      )}

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

      {modalPagamentoAberto && comandaModal && (
        <ModalPagamentoComanda
          aberto={modalPagamentoAberto}
          mesa={comandaModal.mesa}
          pedido={comandaModal.pedido}
          itens={comandaModal.itens}
          onFechar={() => setModalPagamentoAberto(false)}
          onSucesso={async () => {
            const numMesa = comandaModal.mesa.numero;
            setComandaModal(null);
            await carregarMesas();
            toast.success(
              `A Mesa #${numMesa} foi encerrada e liberada com sucesso!`
            );
          }}
        />
      )}
    </AppShell>
  );
}
