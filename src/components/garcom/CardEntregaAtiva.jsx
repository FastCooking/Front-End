import { MdCheck, MdTableRestaurant, MdNotes, MdDirectionsWalk, MdAccessTime } from "react-icons/md";

function CardEntregaAtiva({ entrega, onMarcarEntregue, carregando }) {
  if (!entrega) return null;

  return (
    <div className="bg-gradient-to-br from-emerald-50 via-white to-emerald-50/50 rounded-2xl p-5 shadow-lg border-2 border-emerald-500 relative overflow-hidden">
      {/* Faixa superior */}
      <div className="flex items-center justify-between pb-3 border-b border-emerald-200">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-600"></span>
          </span>
          <span className="text-xs font-black uppercase tracking-wider text-emerald-800">
            Sua Entrega em Andamento
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs text-emerald-700 font-semibold">
          <MdAccessTime size={14} />
          <span>Assumido às {entrega.horarioAssumido || "agora"}</span>
        </div>
      </div>

      {/* Destaque Gigante do Destino (Mesa) */}
      <div className="mt-4 bg-emerald-600 text-white rounded-xl p-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white/20 rounded-xl">
            <MdTableRestaurant size={32} />
          </div>
          <div>
            <span className="text-xs font-bold text-emerald-100 uppercase tracking-widest block">
              Destino
            </span>
            <h2 className="text-3xl font-black tracking-tight leading-none">
              MESA {entrega.mesa}
            </h2>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs bg-emerald-700/80 px-2.5 py-1 rounded-md font-mono text-emerald-100">
            {entrega.pedidoId || `#${entrega.idItemPedido}`}
          </span>
        </div>
      </div>

      {/* Detalhes do Item */}
      <div className="mt-4 bg-white rounded-xl p-3.5 border border-emerald-200/80 shadow-xs">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
          Item a Entregar
        </span>
        <h4 className="text-xl font-extrabold text-gray-900 mt-0.5">
          {entrega.quantidade && entrega.quantidade > 1 ? `${entrega.quantidade}x ` : ""}
          {entrega.nomeItem}
        </h4>
        <span className="inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
          {entrega.categoria}
        </span>

        {/* Observações da comanda */}
        {entrega.observacoes && (
          <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-2.5 flex items-start gap-2">
            <MdNotes size={16} className="text-amber-700 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold text-amber-900">Observações: </span>
              <span className="text-amber-950 font-medium">{entrega.observacoes}</span>
            </div>
          </div>
        )}
      </div>

      {/* Instruções operacionais */}
      <div className="mt-3.5 flex items-center gap-2 text-xs text-gray-600 px-1">
        <MdDirectionsWalk size={16} className="text-emerald-600 shrink-0" />
        <span>Retire o item no balcão, entregue na mesa e confirme abaixo:</span>
      </div>

      {/* Botão de Finalização: Marcar como Entregue (RF08, RF19) */}
      <div className="mt-4">
        <button
          onClick={() => onMarcarEntregue(entrega.idItemPedido)}
          disabled={carregando}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-lg py-4 px-4 rounded-xl shadow-lg shadow-emerald-600/30 hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
        >
          <MdCheck size={26} className="stroke-[1.5]" />
          <span>Confirmar Entrega na Mesa</span>
        </button>
      </div>
    </div>
  );
}

export default CardEntregaAtiva;
