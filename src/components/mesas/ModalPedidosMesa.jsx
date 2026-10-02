import { MdShoppingBag, MdReceipt } from "react-icons/md";

function ModalPedidosMesa({ mesa, onClose }) {
  const pedidos = mesa?.pedidosAtivos || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 md:p-8 my-8">
        <div className="flex justify-between items-center mb-4 border-b pb-3 border-[#B78A10]/30">
          <h2 className="text-xl font-bold text-[#9C1C0E] flex items-center gap-2">
            <MdShoppingBag size={24} />
            Pedidos Ativos - Mesa {mesa?.numero}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-2xl font-bold cursor-pointer"
          >
            &times;
          </button>
        </div>

        {pedidos.length === 0 ? (
          <div className="py-8 text-center text-gray-500 space-y-2">
            <MdReceipt size={40} className="mx-auto text-gray-300" />
            <p className="text-sm font-medium">Não há pedidos ativos nesta mesa no momento.</p>
            <p className="text-xs text-gray-400">
              A mesa está livre para novas reservas e atendimento.
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {pedidos.map((ped, idx) => (
              <div
                key={ped.idPedido || idx}
                className="bg-gray-50 border border-gray-200 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-gray-900">
                      #{ped.idPedido || `Pedido ${idx + 1}`}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        ped.status === "Pronto"
                          ? "bg-green-100 text-green-800"
                          : ped.status === "Em Preparo"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {ped.status}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {ped.qtdItens ? `${ped.qtdItens} item(ns)` : "Itens diversos"} •{" "}
                    {ped.dataAbertura
                      ? new Date(ped.dataAbertura).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Aberto recentemente"}
                  </div>
                </div>

                <div className="text-right sm:text-right font-bold text-sm text-[#9C1C0E]">
                  R$ {Number(ped.total || 0).toFixed(2).replace(".", ",")}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end pt-4 border-t border-gray-100 mt-6">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

export default ModalPedidosMesa;
