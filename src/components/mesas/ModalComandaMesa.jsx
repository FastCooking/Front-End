import { useCallback, useEffect, useMemo, useState } from "react";
import {
  MdAccessTime,
  MdAdd,
  MdClose,
  MdLaunch,
  MdReceiptLong,
  MdRemove,
  MdRestaurantMenu,
  MdTimeline,
} from "react-icons/md";
import { obterPedidoAtivoMesa } from "../../services/mesaService";
import {
  adicionarItensAoPedido,
  alterarQuantidadeItem,
  cancelarItemPedido,
} from "../../services/pedidoService";
import ModalAdicionarItemCardapio from "../garcom/ModalAdicionarItemCardapio";
import {
  Button,
  EmptyState,
  Field,
  Input,
  Modal,
  Spinner,
  StatusBadge,
  useToast,
} from "../ui";

export default function ModalComandaMesa({ mesa, onClose }) {
  const [comanda, setComanda] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [processandoItem, setProcessandoItem] = useState(null);
  const [modalAdicionarAberto, setModalAdicionarAberto] = useState(false);
  const [itemParaCancelar, setItemParaCancelar] = useState(null);
  const [justificativaCancelamento, setJustificativaCancelamento] =
    useState("");

  const toast = useToast();

  const [agoraMs, setAgoraMs] = useState(0);
  const idMesa = mesa?.idMesa;

  const carregar = useCallback(async () => {
    if (!idMesa) return;
    try {
      setCarregando(true);
      setErro("");
      const dados = await obterPedidoAtivoMesa(idMesa);
      setComanda(dados);
      setAgoraMs(Date.now());
    } catch (err) {
      setErro(err.message || "Nenhuma comanda ativa no momento.");
    } finally {
      setCarregando(false);
    }
  }, [idMesa]);

  useEffect(() => {
    let ativo = true;
    Promise.resolve().then(() => {
      if (ativo) carregar();
    });
    return () => {
      ativo = false;
    };
  }, [carregar]);

  const tempoAberto = useMemo(() => {
    const dataAbertura = comanda?.pedido?.dataAbertura || comanda?.dataAbertura;
    if (!dataAbertura || !agoraMs) return null;
    const diffMs = Math.max(0, agoraMs - new Date(dataAbertura).getTime());
    const minutos = Math.floor(diffMs / 60000);
    if (minutos < 60) return `${minutos} min`;
    const horas = Math.floor(minutos / 60);
    return `${horas}h ${minutos % 60}m`;
  }, [comanda, agoraMs]);

  const contagemStatus = useMemo(() => {
    const counts = {
      Pendente: 0,
      "Em preparo": 0,
      Pronto: 0,
      Entregue: 0,
      Cancelado: 0,
    };
    (comanda?.itens || []).forEach((it) => {
      const s = it.status || "Pendente";
      if (counts[s] !== undefined) counts[s]++;
    });
    return counts;
  }, [comanda]);

  async function handleAlterarQuantidade(item, novaQuantidade) {
    if (item.status !== "Pendente") {
      toast.warning(
        "Apenas itens no status 'Pendente' podem ter a quantidade alterada."
      );
      return;
    }

    if (novaQuantidade <= 0) {
      handleRemoverItem(item);
      return;
    }

    setProcessandoItem(item.idItemPedido);
    try {
      const res = await alterarQuantidadeItem(
        item.idItemPedido,
        novaQuantidade
      );
      setComanda((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          itens: (prev.itens || []).map((it) =>
            it.idItemPedido === item.idItemPedido
              ? { ...it, quantidade: res.item?.quantidade || novaQuantidade }
              : it
          ),
        };
      });
    } catch (err) {
      toast.error(err.message || "Não foi possível atualizar a quantidade.");
    } finally {
      setProcessandoItem(null);
    }
  }

  function handleRemoverItem(item) {
    if (item.status === "Em preparo") {
      toast.warning(
        "Este item já está em preparo na cozinha e não pode ser cancelado diretamente."
      );
      return;
    }

    setJustificativaCancelamento("");
    setItemParaCancelar(item);
  }

  async function confirmarCancelamentoItem() {
    if (!itemParaCancelar) return;
    const item = itemParaCancelar;
    const nomeItem = item.nomeItem || item.nome || "Item";
    const motivoEfetivo =
      justificativaCancelamento.trim() ||
      "Cancelado no acompanhamento da comanda da mesa";

    setProcessandoItem(item.idItemPedido);
    try {
      await cancelarItemPedido(item.idItemPedido, motivoEfetivo);
      setComanda((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          itens: (prev.itens || []).map((it) =>
            it.idItemPedido === item.idItemPedido
              ? { ...it, status: "Cancelado" }
              : it
          ),
        };
      });
      setItemParaCancelar(null);
      setJustificativaCancelamento("");
      toast.success(`O item "${nomeItem}" foi cancelado.`);
    } catch (err) {
      toast.error(err.message || "Não foi possível cancelar o item.");
    } finally {
      setProcessandoItem(null);
    }
  }

  async function handleItensAdicionados(itens) {
    const idPed = comanda?.idPedido || comanda?.pedido?.idPedido;
    if (!idPed) return;
    await adicionarItensAoPedido(idPed, itens);
    await carregar();
    toast.success("Novos itens foram incluídos no pedido com sucesso!");
  }

  const totalComanda = (comanda?.itens || []).reduce((acc, item) => {
    if (item.status === "Cancelado") return acc;
    return (
      acc +
      Number(item.precoUnitario || item.preco || 0) * (item.quantidade || 1)
    );
  }, 0);

  const idPedido = comanda?.idPedido || comanda?.pedido?.idPedido;

  const subtitulo = [
    idPedido ? `Pedido #${idPedido.slice(0, 8)}` : null,
    tempoAberto ? `Aberto há ${tempoAberto}` : null,
  ]
    .filter(Boolean)
    .join(" • ");

  return (
    <>
      <Modal
        open
        onClose={onClose}
        title={`Comanda — Mesa #${mesa.numero}`}
        subtitle={subtitulo}
        icon={MdReceiptLong}
        size="xl"
        footer={
          <div className="w-full flex items-center justify-between gap-3">
            {idPedido ? (
              <Button
                variant="secondary"
                size="sm"
                icon={MdTimeline}
                onClick={() => window.open(`/tracking/${idPedido}`, "_blank")}
              >
                <span>Tracking</span>
                <MdLaunch size={13} />
              </Button>
            ) : (
              <div />
            )}

            <Button variant="secondary" size="sm" onClick={onClose}>
              Fechar
            </Button>
          </div>
        }
      >
        {carregando ? (
          <div className="py-14 flex justify-center">
            <Spinner size="lg" label="Buscando comanda ativa..." />
          </div>
        ) : erro ? (
          <EmptyState
            icon={MdRestaurantMenu}
            title={erro}
            description="A mesa não possui pedidos ativos no momento."
          />
        ) : (
          <div className="space-y-4">
            <div className="bg-surface rounded-2xl p-3.5 border border-gray-200/80">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <MdAccessTime className="text-brand" size={16} />{" "}
                  Acompanhamento de Preparo
                </span>
                <StatusBadge
                  status={
                    comanda?.status || comanda?.pedido?.status || "Aberto"
                  }
                />
              </div>
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="bg-white border border-gray-200/80 rounded-xl p-2">
                  <span className="block font-extrabold text-amber-800">
                    {contagemStatus.Pendente}
                  </span>
                  <span className="text-[11px] text-gray-500">Pendente</span>
                </div>
                <div className="bg-white border border-gray-200/80 rounded-xl p-2">
                  <span className="block font-extrabold text-sky-700">
                    {contagemStatus["Em preparo"]}
                  </span>
                  <span className="text-[11px] text-gray-500">Preparo</span>
                </div>
                <div className="bg-white border border-gray-200/80 rounded-xl p-2">
                  <span className="block font-extrabold text-emerald-700">
                    {contagemStatus.Pronto}
                  </span>
                  <span className="text-[11px] text-gray-500">Pronto</span>
                </div>
                <div className="bg-white border border-gray-200/80 rounded-xl p-2">
                  <span className="block font-extrabold text-gray-700">
                    {contagemStatus.Entregue}
                  </span>
                  <span className="text-[11px] text-gray-500">Entregue</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-800">
                Itens do Pedido (
                {comanda?.itens?.filter((i) => i.status !== "Cancelado")
                  .length || 0}
                )
              </span>
              <Button
                size="xs"
                icon={MdAdd}
                onClick={() => setModalAdicionarAberto(true)}
              >
                Incluir Itens
              </Button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {comanda?.itens?.map((it, idx) => {
                const podeEditar = it.status === "Pendente";
                const emPreparo = it.status === "Em preparo";

                return (
                  <div
                    key={it.idItemPedido || idx}
                    className="p-3 bg-white rounded-2xl border border-gray-200/80 flex items-center justify-between gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`font-bold text-gray-900 text-xs sm:text-sm ${
                            it.status === "Cancelado"
                              ? "line-through text-gray-400"
                              : ""
                          }`}
                        >
                          {it.quantidade}x{" "}
                          {it.nomeItem || it.nome || "Item do Cardápio"}
                        </span>
                        <StatusBadge status={it.status} />
                      </div>
                      {it.observacao && (
                        <p className="text-[11px] text-gray-500 italic mt-0.5">
                          Obs: {it.observacao}
                        </p>
                      )}
                      <p className="text-[11px] text-gray-600 mt-0.5">
                        Subtotal:{" "}
                        <strong className="text-gray-900">
                          R${" "}
                          {(
                            Number(it.precoUnitario || it.preco || 0) *
                            (it.quantidade || 1)
                          ).toFixed(2)}
                        </strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {podeEditar ? (
                        <>
                          <div className="flex items-center gap-1 bg-surface p-0.5 rounded-xl border border-gray-200">
                            <button
                              type="button"
                              onClick={() =>
                                handleAlterarQuantidade(it, it.quantidade - 1)
                              }
                              disabled={processandoItem === it.idItemPedido}
                              className="w-6 h-6 rounded-lg bg-white flex items-center justify-center text-gray-700 hover:text-brand cursor-pointer"
                              title="Diminuir quantidade"
                            >
                              <MdRemove size={14} />
                            </button>
                            <span className="text-xs font-bold text-gray-900 w-5 text-center">
                              {it.quantidade}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                handleAlterarQuantidade(it, it.quantidade + 1)
                              }
                              disabled={processandoItem === it.idItemPedido}
                              className="w-6 h-6 rounded-lg bg-white flex items-center justify-center text-gray-700 hover:text-brand cursor-pointer"
                              title="Aumentar quantidade"
                            >
                              <MdAdd size={14} />
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoverItem(it)}
                            disabled={processandoItem === it.idItemPedido}
                            className="p-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold transition-colors cursor-pointer"
                            title="Cancelar item"
                          >
                            <MdClose size={16} />
                          </button>
                        </>
                      ) : (
                        <span className="text-[11px] text-gray-400 italic">
                          {emPreparo ? "Em preparo" : it.status}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-brand-soft/60 rounded-2xl p-3.5 border border-brand/15 flex justify-between items-center">
              <span className="text-xs font-bold text-gray-700">
                Total da Comanda:
              </span>
              <span className="text-lg font-black text-brand">
                R$ {totalComanda.toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </Modal>

      {modalAdicionarAberto && idPedido && (
        <ModalAdicionarItemCardapio
          aberto={modalAdicionarAberto}
          mesa={mesa}
          idPedido={idPedido}
          idRestaurante={
            comanda?.pedido?.idRestaurante || comanda?.idRestaurante
          }
          onFechar={() => setModalAdicionarAberto(false)}
          onItensAdicionados={handleItensAdicionados}
        />
      )}

      {itemParaCancelar && (
        <Modal
          open
          onClose={() => {
            if (!processandoItem) {
              setItemParaCancelar(null);
              setJustificativaCancelamento("");
            }
          }}
          title="Cancelar Item do Pedido"
          subtitle={`Mesa #${mesa.numero}`}
          icon={MdClose}
          size="sm"
          footer={
            <div className="w-full flex items-center justify-end gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={Boolean(processandoItem)}
                onClick={() => {
                  setItemParaCancelar(null);
                  setJustificativaCancelamento("");
                }}
              >
                Voltar
              </Button>
              <Button
                variant="danger"
                size="sm"
                loading={processandoItem === itemParaCancelar.idItemPedido}
                disabled={
                  !justificativaCancelamento.trim() || Boolean(processandoItem)
                }
                onClick={confirmarCancelamentoItem}
              >
                Confirmar Cancelamento
              </Button>
            </div>
          }
        >
          <div className="space-y-3">
            <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
              Deseja cancelar{" "}
              <strong className="text-gray-900">
                {itemParaCancelar.quantidade}x{" "}
                {itemParaCancelar.nomeItem || itemParaCancelar.nome || "Item"}
              </strong>{" "}
              da Mesa #{mesa.numero}?
            </p>
            <Field
              label="Justificativa do cancelamento"
              required
              hint="Informe o motivo para habilitar o cancelamento do item."
            >
              <Input
                type="text"
                placeholder="Ex: Solicitação do cliente..."
                value={justificativaCancelamento}
                onChange={(e) => setJustificativaCancelamento(e.target.value)}
                disabled={Boolean(processandoItem)}
                maxLength={160}
              />
            </Field>
          </div>
        </Modal>
      )}
    </>
  );
}
