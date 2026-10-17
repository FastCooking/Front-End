import { useState, useEffect } from "react";
import { MdReceiptLong, MdRestaurantMenu, MdClose, MdAccessTime, MdPerson, MdDelete } from "react-icons/md";
import { obterPedidoAtivoMesa } from "../../services/mesaService";
import { cancelarItemPedido } from "../../services/pedidoService";

export default function ModalComandaMesa({ mesa, onClose }) {
  const [comanda, setComanda] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [processandoItem, setProcessandoItem] = useState(null);

  useEffect(() => {
    let ativo = true;
    async function carregar() {
      try {
        setCarregando(true);
        setErro("");
        const dados = await obterPedidoAtivoMesa(mesa.idMesa);
        if (ativo) setComanda(dados);
      } catch (err) {
        if (ativo) setErro(err.message || "Nenhuma comanda ativa no momento.");
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    if (mesa?.idMesa) {
      carregar();
    }

    return () => {
      ativo = false;
    };
  }, [mesa]);

  async function handleRemoverItem(item) {
    const nomeItem = item.nomeItem || item.nome || "Item";
    const confirmou = window.confirm(
      `Deseja realmente remover o item "${nomeItem}" (Qtd: ${item.quantidade}) da Mesa #${mesa.numero}?`
    );
    if (!confirmou) return;

    setProcessandoItem(item.idItemPedido);
    try {
      await cancelarItemPedido(item.idItemPedido);
      setComanda((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          itens: (prev.itens || []).map((it) =>
            it.idItemPedido === item.idItemPedido ? { ...it, status: "Cancelado" } : it
          ),
        };
      });
      alert(`Item "${nomeItem}" removido com sucesso.`);
    } catch (err) {
      alert(`Não foi possível remover o item: ${err.message}`);
    } finally {
      setProcessandoItem(null);
    }
  }

  const totalComanda = (comanda?.itens || []).reduce((acc, item) => {
    if (item.status === "Cancelado") return acc;
    return acc + (Number(item.precoUnitario || item.preco || 0) * (item.quantidade || 1));
  }, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 md:p-8 animate-fade-in">
        <div className="flex justify-between items-center mb-4 border-b pb-3 border-[#B78A10]/30">
          <div>
            <h2 className="text-xl font-bold text-[#9C1C0E] flex items-center gap-2">
              <MdReceiptLong size={24} /> Comanda da Mesa #{mesa.numero}
            </h2>
            <p className="text-xs text-gray-500">
              Visualização de consumo e status de preparo dos itens.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-2xl font-bold cursor-pointer"
          >
            &times;
          </button>
        </div>

        {carregando ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-10 h-10 border-4 border-[#9C1C0E] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-gray-500 font-medium">Buscando comanda ativa...</span>
          </div>
        ) : erro ? (
          <div className="py-10 text-center">
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
              <MdRestaurantMenu size={28} />
            </div>
            <p className="text-gray-600 font-semibold text-sm mb-1">{erro}</p>
            <p className="text-xs text-gray-400">A mesa está sem pedidos pendentes ou em preparo.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-[#F9ECE5]/60 p-3 rounded-xl text-xs text-gray-700">
              <span className="flex items-center gap-1 font-semibold">
                Status: <span className="text-[#9C1C0E]">{comanda?.status || "Aberto"}</span>
              </span>
              <span className="text-gray-500">
                Itens: {comanda?.itens?.length || 0}
              </span>
            </div>

            <div className="max-h-64 overflow-y-auto divide-y divide-gray-100 pr-1">
              {comanda?.itens?.map((it, idx) => (
                <div key={it.idItemPedido || idx} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-gray-900">
                      {it.quantidade}x {it.nomeItem || it.nome || "Item do Cardápio"}
                    </span>
                    {it.observacao && (
                      <p className="text-[11px] text-gray-500 italic mt-0.5">Obs: {it.observacao}</p>
                    )}
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <div className="flex flex-col items-end gap-1">
                      <span className="font-bold text-gray-900">
                        R$ {((Number(it.precoUnitario || it.preco || 0)) * (it.quantidade || 1)).toFixed(2)}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          it.status === "Pronto"
                            ? "bg-green-100 text-green-800"
                            : it.status === "Em preparo"
                            ? "bg-amber-100 text-amber-800"
                            : it.status === "Entregue"
                            ? "bg-blue-100 text-blue-800"
                            : it.status === "Cancelado"
                            ? "bg-red-100 text-red-800 line-through"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {it.status}
                      </span>
                    </div>

                    {it.status !== "Cancelado" && (
                      <button
                        type="button"
                        onClick={() => handleRemoverItem(it)}
                        disabled={processandoItem === it.idItemPedido}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer shrink-0"
                        title="Remover item deste pedido"
                      >
                        <MdDelete size={17} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
              <span className="text-sm font-bold text-gray-700">Total Consumido:</span>
              <span className="text-lg font-bold text-[#9C1C0E]">
                R$ {totalComanda.toFixed(2)}
              </span>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-sm transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
