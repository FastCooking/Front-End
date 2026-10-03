function ItemFila({ item, onAvancarStatus }) {
  const proximoStatus = {
    pendente: "em preparo",
    "em preparo": "pronto",
  };

  const statusSeguinte = proximoStatus[item.status];

  return (
    <div className="bg-white rounded-xl p-4 shadow-md border-l-8 border-[#9C1C0E] mb-3">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xl font-bold text-gray-900">{item.nomeItem}</h3>
          <p className="text-sm text-gray-600">Mesa {item.mesa}</p>
        </div>
        <span className="text-lg font-semibold text-[#9C1C0E]">
          {item.tempoEsperaMin} min
        </span>
      </div>

      {statusSeguinte && (
        <button onClick={() => onAvancarStatus(item.idItemPedido, statusSeguinte)}className="w-full mt-3 bg-[#9C1C0E] hover:bg-[#7a1509] text-white text-lg font-bold py-4 rounded-lg cursor-pointer">
          Marcar como {statusSeguinte.toUpperCase()}
        </button>
      )}

      {item.status === "pronto" && (
        <p className="mt-3 text-center text-green-700 font-bold text-lg">
          ✓ PRONTO — aguardando retirada
        </p>
      )}
    </div>
  );
}

export default ItemFila;