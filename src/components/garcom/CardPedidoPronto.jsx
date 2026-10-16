import { MdTableRestaurant, MdDeliveryDining, MdAccessTime, MdNotes, MdLock } from "react-icons/md";

function CardPedidoPronto({ item, podeAssumir, onAssumir, carregando }) {
  // Cores de badge por categoria
  const coresCategoria = {
    Bebidas: "bg-blue-100 text-blue-800 border-blue-200",
    Entrada: "bg-amber-100 text-amber-800 border-amber-200",
    "Prato Principal": "bg-red-100 text-red-800 border-red-200",
    Sobremesa: "bg-purple-100 text-purple-800 border-purple-200",
  };

  const badgeCategoria = coresCategoria[item.categoria] || "bg-gray-100 text-gray-800 border-gray-200";

  return (
    <div className="bg-white rounded-2xl p-4 shadow-md border-l-6 border-[#9C1C0E] border-y border-r border-slate-100 transition-all hover:shadow-lg">
      {/* Topo do Card: Mesa + Horário */}
      <div className="flex items-center justify-between pb-2 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 bg-[#9C1C0E] text-white px-2.5 py-1 rounded-lg text-xs font-black tracking-wide shadow-xs">
            <MdTableRestaurant size={15} />
            MESA {item.mesa}
          </span>
          <span className="text-[11px] font-mono text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
            {item.pedidoId || `#${item.idItemPedido}`}
          </span>
        </div>

        <div className="flex items-center gap-1 text-xs font-semibold text-gray-700">
          <MdAccessTime size={14} className="text-gray-600" />
          <span>Pronto {item.horarioPronto ? `às ${item.horarioPronto}` : "agora"}</span>
        </div>
      </div>

      {/* Conteúdo: Itens + Categoria */}
      <div className="mt-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg font-bold text-gray-900 leading-snug">
            {item.quantidade && item.quantidade > 1 ? `${item.quantidade}x ` : ""}
            {item.nomeItem}
          </h3>
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${badgeCategoria}`}>
            {item.categoria}
          </span>
        </div>

        {/* Observações do Pedido (RF07) */}
        <div className="mt-2.5 bg-amber-50/70 border border-amber-200/80 rounded-xl p-2.5 flex items-start gap-2">
          <MdNotes size={16} className="text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold text-amber-900">Observações: </span>
            <span className="text-amber-950 font-medium">
              {item.observacoes && item.observacoes.trim() !== ""
                ? item.observacoes
                : "Nenhuma observação informada."}
            </span>
          </div>
        </div>
      </div>

      {/* Ação: Botão Assumir Entrega (RF08) */}
      <div className="mt-4">
        {podeAssumir ? (
          <button
            onClick={() => onAssumir(item.idItemPedido)}
            disabled={carregando}
            className="w-full bg-[#9C1C0E] hover:bg-[#7a1509] text-white text-base font-bold py-3.5 px-4 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
          >
            <MdDeliveryDining size={22} />
            <span>Assumir Entrega</span>
          </button>
        ) : (
          <div className="space-y-1.5">
            <button
              disabled
              className="w-full bg-gray-100 text-gray-400 border border-gray-200 text-sm font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 cursor-not-allowed"
            >
              <MdLock size={16} />
              <span>Assumir Entrega (Bloqueado)</span>
            </button>
            <p className="text-[11px] text-center text-amber-800 font-medium leading-tight">
              ⚠️ Regra RF08: Você já possui uma entrega em andamento. Conclua-a para poder assumir outro pedido.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default CardPedidoPronto;
