import { MdVolumeUp, MdVolumeOff, MdOutlineLogout, MdCheckCircle, MdDeliveryDining } from "react-icons/md";
import { HiSparkles } from "react-icons/hi2";
import logo from "../../assets/fast cooking logo.png";

function HeaderGarcom({
  usuario,
  podeAssumir,
  totalPendentes,
  somAtivo,
  onToggleSom,
  onSimularPedido,
  onTestarSom,
  onLogout,
}) {
  return (
    <header className="bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-md mx-auto px-4 py-3">
        {/* Linha superior: Logo + Controles Rápidos */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <img src={logo} alt="FastCooking" className="h-9 w-auto object-contain" />
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#9C1C0E] block leading-tight">
                Módulo Garçom
              </span>
              <h2 className="text-sm font-bold text-gray-800 leading-tight">
                {usuario?.nome || "Garçom em Serviço"}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Toggle de Som */}
            <button
              onClick={onToggleSom}
              title={somAtivo ? "Som ativado (clique para mutar)" : "Som desativado (clique para ativar)"}
              className={`p-2 rounded-lg transition border cursor-pointer ${
                somAtivo
                  ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                  : "bg-gray-100 text-gray-400 border-gray-200 hover:bg-gray-200"
              }`}
            >
              {somAtivo ? <MdVolumeUp size={19} /> : <MdVolumeOff size={19} />}
            </button>

            {/* Logout */}
            <button
              onClick={onLogout}
              title="Sair da sessão"
              className="p-2 rounded-lg text-gray-500 hover:text-[#9C1C0E] hover:bg-red-50 border border-gray-200 transition cursor-pointer"
            >
              <MdOutlineLogout size={19} />
            </button>
          </div>
        </div>

        {/* Linha inferior: Status de Disponibilidade do Garçom (RF08) */}
        <div className="mt-2.5 flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
          <div className="flex items-center gap-2">
            {podeAssumir ? (
              <>
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <div>
                  <div className="flex items-center gap-1 text-xs font-bold text-emerald-800 leading-none">
                    <MdCheckCircle className="text-emerald-600" size={14} />
                    <span>Disponível para Entregas</span>
                  </div>
                  <span className="text-[11px] text-gray-500 leading-tight block">
                    Zero pendências (RF08)
                  </span>
                </div>
              </>
            ) : (
              <>
                <span className="relative flex h-3 w-3">
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                </span>
                <div>
                  <div className="flex items-center gap-1 text-xs font-bold text-amber-800 leading-none">
                    <MdDeliveryDining className="text-amber-600" size={16} />
                    <span>Em Rota de Entrega</span>
                  </div>
                  <span className="text-[11px] text-amber-700 font-medium leading-tight block">
                    {totalPendentes} entrega pendente em andamento
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Atalho de teste rápido */}
          <div className="flex items-center gap-1">
            <button
              onClick={onSimularPedido}
              title="Simular pedido pronto vindo da cozinha"
              className="flex items-center gap-1 text-[11px] font-semibold bg-[#9C1C0E] hover:bg-[#7a1509] text-white px-2.5 py-1 rounded-lg transition shadow-xs cursor-pointer"
            >
              <HiSparkles size={13} />
              <span>+ Pronto</span>
            </button>
            <button
              onClick={onTestarSom}
              title="Testar alerta sonoro"
              className="text-[11px] font-medium text-gray-600 hover:text-gray-900 bg-white border border-gray-300 px-2 py-1 rounded-lg hover:bg-gray-50 transition cursor-pointer"
            >
              Bip 🔔
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default HeaderGarcom;
