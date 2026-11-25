import { useState, useEffect, useMemo } from "react";
import {
  MdReceiptLong,
  MdRestaurantMenu,
  MdClose,
  MdAccessTime,
  MdPerson,
  MdDelete,
  MdTimeline,
  MdLaunch,
  MdAdd,
  MdRemove,
  MdCheckCircle,
  MdWarning,
} from "react-icons/md";
import { obterPedidoAtivoMesa } from "../../services/mesaService";
import {
  cancelarItemPedido,
  alterarQuantidadeItem,
  adicionarItensAoPedido,
} from "../../services/pedidoService";
import ModalAlerta from "../common/ModalAlerta";
import ModalConfirmacao from "../common/ModalConfirmacao";
import ModalAdicionarItemCardapio from "../garcom/ModalAdicionarItemCardapio";

export default function ModalComandaMesa({ mesa, onClose }) {
  const [comanda, setComanda] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [processandoItem, setProcessandoItem] = useState(null);
  const [modalAdicionarAberto, setModalAdicionarAberto] = useState(false);

  // Modais de alerta/confirmação
  const [alerta, setAlerta] = useState({ aberto: false, titulo: "", mensagem: "", tipo: "info" });
  const [confirmacao, setConfirmacao] = useState({
    aberto: false,
    titulo: "",
    mensagem: "",
    detalhes: null,
    tipo: "perigo",
    onConfirmar: null,
  });

  async function carregar() {
    try {
      setCarregando(true);
      setErro("");
      const dados = await obterPedidoAtivoMesa(mesa.idMesa);
      setComanda(dados);
    } catch (err) {
      setErro(err.message || "Nenhuma comanda ativa no momento.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    if (mesa?.idMesa) {
      carregar();
    }
  }, [mesa]);

  // Tempo decorrido desde a abertura
  const tempoAberto = useMemo(() => {
    const dataAbertura = comanda?.pedido?.dataAbertura || comanda?.dataAbertura;
    if (!dataAbertura) return null;
    const diffMs = Date.now() - new Date(dataAbertura).getTime();
    const minutos = Math.floor(diffMs / 60000);
    if (minutos < 60) return `${minutos} min`;
    const horas = Math.floor(minutos / 60);
    return `${horas}h ${minutos % 60}m`;
  }, [comanda]);

  // Contagem de status dos itens (Tracking unificado)
  const contagemStatus = useMemo(() => {
    const counts = { Pendente: 0, "Em preparo": 0, Pronto: 0, Entregue: 0, Cancelado: 0 };
    (comanda?.itens || []).forEach((it) => {
      const s = it.status || "Pendente";
      if (counts[s] !== undefined) counts[s]++;
    });
    return counts;
  }, [comanda]);

  async function handleAlterarQuantidade(item, novaQuantidade) {
    if (item.status !== "Pendente") {
      setAlerta({
        aberto: true,
        titulo: "Operação não permitida",
        mensagem: "Apenas itens no status 'Pendente' (antes do início do preparo) podem ter a quantidade alterada.",
        tipo: "aviso",
      });
      return;
    }

    if (novaQuantidade <= 0) {
      handleRemoverItem(item);
      return;
    }

    setProcessandoItem(item.idItemPedido);
    try {
      const res = await alterarQuantidadeItem(item.idItemPedido, novaQuantidade);
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
      setAlerta({
        aberto: true,
        titulo: "Erro ao alterar",
        mensagem: err.message || "Não foi possível atualizar a quantidade.",
        tipo: "erro",
      });
    } finally {
      setProcessandoItem(null);
    }
  }

  function handleRemoverItem(item) {
    const nomeItem = item.nomeItem || item.nome || "Item";

    if (item.status === "Em preparo") {
      setAlerta({
        aberto: true,
        titulo: "Item em Preparo",
        mensagem: "Este item já está em preparo na cozinha e não pode ser cancelado diretamente.",
        tipo: "aviso",
      });
      return;
    }

    setConfirmacao({
      aberto: true,
      titulo: "Cancelar Item do Pedido",
      mensagem: `Deseja realmente cancelar "${nomeItem}" (${item.quantidade}x) da Mesa #${mesa.numero}?`,
      tipo: "perigo",
      textoConfirmar: "Sim, Cancelar Item",
      onConfirmar: async () => {
        setProcessandoItem(item.idItemPedido);
        try {
          await cancelarItemPedido(item.idItemPedido);
          setConfirmacao({ aberto: false });
          setComanda((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              itens: (prev.itens || []).map((it) =>
                it.idItemPedido === item.idItemPedido ? { ...it, status: "Cancelado" } : it
              ),
            };
          });
          setAlerta({
            aberto: true,
            titulo: "Item Cancelado",
            mensagem: `O item "${nomeItem}" foi cancelado.`,
            tipo: "sucesso",
          });
        } catch (err) {
          setAlerta({
            aberto: true,
            titulo: "Erro ao cancelar",
            mensagem: err.message || "Não foi possível cancelar o item.",
            tipo: "erro",
          });
        } finally {
          setProcessandoItem(null);
        }
      },
    });
  }

  async function handleItensAdicionados(itens) {
    const idPed = comanda?.idPedido || comanda?.pedido?.idPedido;
    if (!idPed) return;
    await adicionarItensAoPedido(idPed, itens);
    await carregar();
    setAlerta({
      aberto: true,
      titulo: "Itens Adicionados",
      mensagem: "Novos itens foram incluídos no pedido com sucesso!",
      tipo: "sucesso",
    });
  }

  const totalComanda = (comanda?.itens || []).reduce((acc, item) => {
    if (item.status === "Cancelado") return acc;
    return acc + (Number(item.precoUnitario || item.preco || 0) * (item.quantidade || 1));
  }, 0);

  const idPedido = comanda?.idPedido || comanda?.pedido?.idPedido;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 font-[Poppins] overflow-y-auto">
      <div className="bg-[#FAF6F3] rounded-3xl shadow-2xl w-full max-w-xl p-6 md:p-7 border border-gray-200 animate-fade-in flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex justify-between items-start pb-4 border-b border-gray-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-[#9C1C0E]/10 text-[#9C1C0E] rounded-xl">
                <MdReceiptLong size={22} />
              </span>
              <div>
                <h2 className="text-lg font-black text-gray-900 tracking-tight">
                  Comanda & Tracking — Mesa #{mesa.numero}
                </h2>
                <div className="flex items-center gap-2 text-xs text-gray-500 font-medium mt-0.5">
                  {idPedido && (
                    <span>
                      ID Pedido: <strong className="font-mono text-gray-800">{idPedido.slice(0, 8)}</strong>
                    </span>
                  )}
                  {tempoAberto && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-[#B78A10] font-semibold">
                        <MdAccessTime size={14} /> Aberto há {tempoAberto}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 p-1 rounded-xl hover:bg-gray-200/60 transition-colors cursor-pointer"
          >
            <MdClose size={22} />
          </button>
        </div>

        {carregando ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-10 h-10 border-4 border-[#9C1C0E] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-gray-500 font-medium">Buscando comanda ativa...</span>
          </div>
        ) : erro ? (
          <div className="py-12 text-center">
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
              <MdRestaurantMenu size={28} />
            </div>
            <p className="text-gray-700 font-bold text-sm mb-1">{erro}</p>
            <p className="text-xs text-gray-400">A mesa não possui pedidos ativos no momento.</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto py-3 space-y-3.5 pr-1">
            {/* Tracking Summary Integrado */}
            <div className="bg-white rounded-2xl p-3 border border-gray-200 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <MdTimeline className="text-[#9C1C0E]" size={16} /> Acompanhamento de Preparo:
                </span>
                <span className="text-[11px] font-bold text-[#9C1C0E]">
                  Status: {comanda?.status || comanda?.pedido?.status || "Aberto"}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 text-center text-[11px]">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-1.5">
                  <span className="block font-black text-amber-900">{contagemStatus.Pendente}</span>
                  <span className="text-[10px] text-amber-700 font-medium">Pendente</span>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-1.5">
                  <span className="block font-black text-orange-900">{contagemStatus["Em preparo"]}</span>
                  <span className="text-[10px] text-orange-700 font-medium">Em Preparo</span>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-1.5">
                  <span className="block font-black text-emerald-900">{contagemStatus.Pronto}</span>
                  <span className="text-[10px] text-emerald-700 font-medium">Pronto</span>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-1.5">
                  <span className="block font-black text-blue-900">{contagemStatus.Entregue}</span>
                  <span className="text-[10px] text-blue-700 font-medium">Entregue</span>
                </div>
              </div>
            </div>

            {/* Inclusão de itens pelo Gerente */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-800">
                Itens do Pedido ({comanda?.itens?.filter((i) => i.status !== "Cancelado").length || 0})
              </span>
              <button
                type="button"
                onClick={() => setModalAdicionarAberto(true)}
                className="px-3 py-1.5 bg-[#9C1C0E] hover:bg-[#7a160b] text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1 shadow-xs"
              >
                <MdAdd size={16} /> + Incluir Itens
              </button>
            </div>

            {/* Lista de Itens */}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {comanda?.itens?.map((it, idx) => {
                const podeEditar = it.status === "Pendente";
                const emPreparo = it.status === "Em preparo";

                return (
                  <div
                    key={it.idItemPedido || idx}
                    className="p-3 bg-white rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between gap-3"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 text-xs sm:text-sm">
                          {it.quantidade}x {it.nomeItem || it.nome || "Item do Cardápio"}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                            it.status === "Pronto"
                              ? "bg-emerald-100 text-emerald-800"
                              : it.status === "Em preparo"
                              ? "bg-orange-100 text-orange-800"
                              : it.status === "Entregue"
                              ? "bg-blue-100 text-blue-800"
                              : it.status === "Cancelado"
                              ? "bg-red-100 text-red-800 line-through"
                              : "bg-amber-100 text-amber-900"
                          }`}
                        >
                          {it.status}
                        </span>
                      </div>
                      {it.observacao && (
                        <p className="text-[11px] text-gray-500 italic mt-0.5">Obs: {it.observacao}</p>
                      )}
                      <p className="text-[11px] text-gray-600 mt-0.5">
                        Subtotal:{" "}
                        <strong className="text-gray-900">
                          R$ {((Number(it.precoUnitario || it.preco || 0)) * (it.quantidade || 1)).toFixed(2)}
                        </strong>
                      </p>
                    </div>

                    {/* Controles de Quantidade e Cancelamento */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {podeEditar ? (
                        <>
                          <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-xl border border-gray-200">
                            <button
                              type="button"
                              onClick={() => handleAlterarQuantidade(it, it.quantidade - 1)}
                              disabled={processandoItem === it.idItemPedido}
                              className="w-6 h-6 rounded-lg bg-white flex items-center justify-center text-gray-700 hover:text-[#9C1C0E] cursor-pointer"
                              title="Diminuir quantidade"
                            >
                              <MdRemove size={14} />
                            </button>
                            <span className="text-xs font-black text-gray-900 w-5 text-center">
                              {it.quantidade}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleAlterarQuantidade(it, it.quantidade + 1)}
                              disabled={processandoItem === it.idItemPedido}
                              className="w-6 h-6 rounded-lg bg-white flex items-center justify-center text-gray-700 hover:text-[#9C1C0E] cursor-pointer"
                              title="Aumentar quantidade"
                            >
                              <MdAdd size={14} />
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoverItem(it)}
                            disabled={processandoItem === it.idItemPedido}
                            className="p-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold transition-all cursor-pointer"
                            title="Cancelar item"
                          >
                            <MdClose size={16} />
                          </button>
                        </>
                      ) : (
                        <span className="text-[11px] text-gray-400 italic">
                          {emPreparo ? "Preparo iniciado" : it.status}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total */}
            <div className="bg-white rounded-2xl p-3.5 border border-gray-200 flex justify-between items-center">
              <span className="text-xs font-bold text-gray-700">Total da Comanda:</span>
              <span className="text-lg font-black text-[#9C1C0E]">
                R$ {totalComanda.toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {/* Rodapé */}
        <div className="mt-4 pt-3 border-t border-gray-200 flex items-center justify-between gap-3">
          {idPedido ? (
            <button
              type="button"
              onClick={() => window.open(`/tracking/${idPedido}`, "_blank")}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 text-xs font-bold transition-all shadow-xs cursor-pointer"
              title="Abrir página de tracking em nova aba"
            >
              <MdTimeline size={16} className="text-[#9C1C0E]" />
              <span>Abrir Tracking Detalhado</span>
              <MdLaunch size={12} />
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs sm:text-sm transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>

      {/* Modal Adicionar Item ao Cardápio */}
      {modalAdicionarAberto && idPedido && (
        <ModalAdicionarItemCardapio
          aberto={modalAdicionarAberto}
          mesa={mesa}
          idPedido={idPedido}
          idRestaurante={comanda?.pedido?.idRestaurante || comanda?.idRestaurante}
          onFechar={() => setModalAdicionarAberto(false)}
          onItensAdicionados={handleItensAdicionados}
        />
      )}

      {/* Alerta e Confirmação */}
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
        onConfirmar={confirmacao.onConfirmar}
        onCancelar={() => setConfirmacao((c) => ({ ...c, aberto: false }))}
      />
    </div>
  );
}
