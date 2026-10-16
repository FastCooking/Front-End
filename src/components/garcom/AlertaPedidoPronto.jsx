import { useEffect } from "react";
import { MdNotificationsActive, MdClose, MdTableRestaurant } from "react-icons/md";

function AlertaPedidoPronto({ alerta, onDismiss, onVisualizar }) {
  useEffect(() => {
    if (!alerta) return;
    const timer = setTimeout(() => {
      onDismiss();
    }, 6000);
    return () => clearTimeout(timer);
  }, [alerta, onDismiss]);

  if (!alerta) return null;

  return (
    <div className="fixed top-18 left-0 right-0 z-50 px-4 pointer-events-none flex justify-center">
      <div className="pointer-events-auto w-full max-w-md bg-gradient-to-r from-red-600 to-[#9C1C0E] text-white p-3.5 rounded-2xl shadow-xl border border-red-300/40 animate-[slide-in_0.3s_ease-out]">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <div className="p-2 bg-white/20 rounded-xl text-yellow-300 animate-bounce">
              <MdNotificationsActive size={24} />
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="bg-yellow-400 text-gray-950 font-black text-xs px-2 py-0.5 rounded-md flex items-center gap-1">
                  <MdTableRestaurant size={14} /> MESA {alerta.mesa}
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-red-100">
                  Novo Pedido Pronto!
                </span>
              </div>

              <h4 className="text-base font-bold text-white mt-1 leading-snug">
                {alerta.quantidade}x {alerta.nomeItem}
              </h4>

              {alerta.observacoes && (
                <p className="text-xs text-red-100/90 italic mt-0.5 line-clamp-1">
                  Obs: {alerta.observacoes}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1 items-end">
            <button
              onClick={onDismiss}
              aria-label="Fechar alerta"
              className="text-white/80 hover:text-white p-1 rounded-md hover:bg-white/10 transition cursor-pointer"
            >
              <MdClose size={18} />
            </button>
            {onVisualizar && (
              <button
                onClick={() => {
                  onVisualizar(alerta);
                  onDismiss();
                }}
                className="text-[11px] font-bold bg-white text-[#9C1C0E] px-2 py-1 rounded-md shadow-xs hover:bg-gray-100 transition cursor-pointer"
              >
                Ver
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AlertaPedidoPronto;
