import { useState } from "react";
import { MdTableBar, MdCheckCircle, MdQrCodeScanner } from "react-icons/md";

function SeletorMesaManual({ onSelecionarMesa, onFechar }) {
  const [numeroCustom, setNumeroCustom] = useState("");

  const mesasSugeridas = Array.from({ length: 20 }, (_, i) => i + 1);

  function handleConfirmarCustom(e) {
    e.preventDefault();
    const n = parseInt(numeroCustom, 10);
    if (!isNaN(n) && n > 0) {
      onSelecionarMesa(n);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-5 border border-gray-100">
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#9C1C0E]/10 text-[#9C1C0E] flex items-center justify-center mx-auto mb-3 shadow-inner">
            <MdTableBar size={32} />
          </div>
          <h3 className="text-xl font-black text-gray-900 leading-tight">
            Em qual mesa você está sentado?
          </h3>
          <p className="text-xs text-gray-500 mt-1 leading-relaxed">
            Selecione o número da sua mesa abaixo para iniciarmos seu autoatendimento imediatamente (sem login nem cadastro).
          </p>
        </div>

        {/* Grade de Mesas (1 a 20) */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block text-center">
            Toque na sua mesa (1 a 20):
          </span>
          <div className="grid grid-cols-5 gap-2 max-h-56 overflow-y-auto p-1">
            {mesasSugeridas.map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => onSelecionarMesa(num)}
                className="py-2.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-[#9C1C0E] hover:text-white hover:border-[#9C1C0E] text-gray-900 font-extrabold text-sm transition-all shadow-2xs active:scale-95 cursor-pointer"
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        {/* Input Manual Alternativo */}
        <form onSubmit={handleConfirmarCustom} className="pt-2 border-t border-gray-100 flex gap-2">
          <input
            type="number"
            min="1"
            max="99"
            placeholder="Outro nº..."
            value={numeroCustom}
            onChange={(e) => setNumeroCustom(e.target.value)}
            className="w-28 p-2.5 text-center text-sm font-bold border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9C1C0E]"
          />
          <button
            type="submit"
            disabled={!numeroCustom}
            className="flex-1 py-2.5 px-4 bg-[#9C1C0E] hover:bg-[#7a160b] text-white font-bold text-xs rounded-xl shadow-xs transition-all disabled:opacity-40 cursor-pointer"
          >
            Confirmar Mesa
          </button>
        </form>

        {onFechar && (
          <div className="text-center pt-1">
            <button
              type="button"
              onClick={onFechar}
              className="text-xs text-gray-400 hover:text-gray-600 font-semibold cursor-pointer"
            >
              Apenas navegar pelo cardápio
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default SeletorMesaManual;
