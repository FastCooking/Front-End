import {
  MdTableRestaurant,
  MdNotificationsActive,
  MdArrowForward,
  MdCheckCircle,
} from "react-icons/md";
import { HiSparkles } from "react-icons/hi2";

function ListaMesasAbertas({
  mesas,
  onSelecionarMesa,
  onSimularChamadoCliente,
}) {
  const abertas = mesas.filter((m) => m.status === "aberta");
  const livres = mesas.filter((m) => m.status === "livre");
  const solicitando = abertas.filter((m) => m.solicitouFechamento);

  return (
    <div className="space-y-4">
      {/* Topo Informativo */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h3 className="text-sm font-extrabold text-gray-800 uppercase tracking-wide">
            Mesas & Contas
          </h3>
          <p className="text-xs text-gray-500">
            Qualquer garçom pode fechar a conta de qualquer mesa (RF16)
          </p>
        </div>

        <button
          onClick={onSimularChamadoCliente}
          title="Simular cliente solicitando encerramento pelo QR Code (RF05)"
          className="inline-flex items-center gap-1 text-[11px] font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 px-2.5 py-1.5 rounded-xl shadow-xs transition cursor-pointer"
        >
          <HiSparkles size={14} />
          <span>Simular Chamado (RF05)</span>
        </button>
      </div>

      {/* Destaque de Mesas que Solicitaram Fechamento (RF05) */}
      {solicitando.length > 0 && (
        <div className="bg-amber-50 border-2 border-amber-400 rounded-2xl p-4 shadow-sm space-y-2.5">
          <div className="flex items-center gap-2 text-amber-900 font-extrabold text-xs uppercase tracking-wider">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-600"></span>
            </span>
            <MdNotificationsActive size={16} />
            <span>Solicitações de Fechamento de Conta ({solicitando.length})</span>
          </div>

          <div className="space-y-2">
            {solicitando.map((mesa) => (
              <div
                key={mesa.numeroMesa}
                onClick={() => onSelecionarMesa(mesa.numeroMesa)}
                className="bg-white rounded-xl p-3 border border-amber-300 shadow-xs flex items-center justify-between hover:bg-amber-50/50 transition cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <span className="bg-[#9C1C0E] text-white font-black text-xs px-2.5 py-1 rounded-lg">
                    Mesa {mesa.numeroMesa}
                  </span>
                  <div>
                    <span className="text-xs font-bold text-gray-900 block leading-tight">
                      Total a Pagar: R$ {mesa.totais?.totalComDesconto.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-amber-800 font-medium">
                      Cliente aguarda na mesa pelo atendimento
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className="bg-[#9C1C0E] hover:bg-[#7a1509] text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1"
                >
                  <span>Atender</span>
                  <MdArrowForward size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista de Mesas Abertas */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-gray-700">
            Mesas com Comanda em Aberto ({abertas.length})
          </span>
          <span className="text-[11px] text-gray-500 font-medium">
            Toque para conduzir pagamento
          </span>
        </div>

        {abertas.length === 0 ? (
          <div className="bg-white/80 rounded-2xl p-6 text-center border border-dashed border-gray-300 text-xs text-gray-500">
            Nenhuma mesa com comanda aberta no momento.
          </div>
        ) : (
          abertas.map((mesa) => {
            const totais = mesa.totais || {};
            const pago = totais.totalPago > 0;
            const quitado = totais.podeEncerrar;

            return (
              <div
                key={mesa.numeroMesa}
                onClick={() => onSelecionarMesa(mesa.numeroMesa)}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition-all flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-red-50 text-[#9C1C0E] rounded-xl font-black text-center min-w-12">
                    <MdTableRestaurant size={20} className="mx-auto" />
                    <span className="text-xs block mt-0.5">{mesa.numeroMesa}</span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-extrabold text-gray-900">
                        Mesa {mesa.numeroMesa}
                      </h4>
                      {mesa.solicitouFechamento && (
                        <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200">
                          Pediu Conta 🛎️
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 block">
                      {mesa.comanda?.itens?.length || 0} itens consumidos • {mesa.comanda?.idComanda}
                    </span>

                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-xs font-black text-gray-900">
                        Total: R$ {totais.totalComDesconto?.toFixed(2)}
                      </span>
                      {pago && (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                            quitado
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {quitado ? "100% Pago ✓" : `R$ ${totais.totalPago?.toFixed(2)} pago`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[#9C1C0E]">
                  <span className="text-xs font-bold hidden sm:inline">Ver Conta</span>
                  <div className="p-2 bg-red-50 rounded-xl">
                    <MdArrowForward size={18} />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Mesas Livres / Disponíveis */}
      {livres.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-gray-200/80">
          <span className="text-xs font-bold text-gray-500 px-1 block">
            Mesas Disponíveis ({livres.length})
          </span>
          <div className="grid grid-cols-3 gap-2">
            {livres.map((m) => (
              <div
                key={m.numeroMesa}
                className="bg-white/60 border border-gray-200 rounded-xl p-2.5 text-center text-xs"
              >
                <span className="font-bold text-gray-800 block">Mesa {m.numeroMesa}</span>
                <span className="text-[10px] font-semibold text-emerald-700 flex items-center justify-center gap-0.5 mt-0.5">
                  <MdCheckCircle size={12} /> Livre
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ListaMesasAbertas;
