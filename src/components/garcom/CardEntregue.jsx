import { MdCheckCircle, MdTableRestaurant, MdAccessTime } from "react-icons/md";

function CardEntregue({ item }) {
  return (
    <div className="bg-white/80 rounded-xl p-3.5 border border-gray-200 shadow-xs flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg shrink-0">
          <MdCheckCircle size={22} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-gray-800 flex items-center gap-1 bg-gray-100 px-1.5 py-0.5 rounded">
              <MdTableRestaurant size={13} /> Mesa {item.mesa}
            </span>
            <span className="text-[11px] text-gray-500 font-medium">
              {item.categoria}
            </span>
          </div>
          <h4 className="text-sm font-bold text-gray-800 mt-0.5">
            {item.quantidade && item.quantidade > 1 ? `${item.quantidade}x ` : ""}
            {item.nomeItem}
          </h4>
        </div>
      </div>

      <div className="text-right shrink-0">
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
          <MdAccessTime size={12} />
          {item.horarioEntregue ? `Entregue às ${item.horarioEntregue}` : "Entregue"}
        </span>
      </div>
    </div>
  );
}

export default CardEntregue;
