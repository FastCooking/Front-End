import { useState } from "react";
import {
  MdTouchApp,
  MdShoppingBag,
  MdRestaurant,
  MdCheckCircle,
  MdClose,
  MdLockOpen,
} from "react-icons/md";

function GuiaAutoatendimento({ totalItensPedido, mesaNumero }) {
  const [minimizado, setMinimizado] = useState(() => {
    return localStorage.getItem("fastcooking_guia_minimizado") === "true";
  });

  function toggleMinimizado() {
    const novo = !minimizado;
    setMinimizado(novo);
    localStorage.setItem("fastcooking_guia_minimizado", String(novo));
  }

  // Determina qual passo está ativo
  const passoAtivo = totalItensPedido === 0 ? 1 : 2;

  if (minimizado) {
    return (
      <div className="flex items-center justify-between bg-amber-500/10 border border-amber-300/70 rounded-2xl px-4 py-2 text-xs text-amber-950 shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="font-bold">Guia Rápido:</span>
          <span>1. Escolha o prato ➔ 2. Confira ➔ 3. Envie (sem login)</span>
        </div>
        <button
          onClick={toggleMinimizado}
          className="font-bold text-[#9C1C0E] hover:underline cursor-pointer text-[11px]"
        >
          Expandir dicas ▾
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-stone-50 via-white to-amber-50/50 border border-amber-200/90 rounded-3xl p-3.5 sm:p-4 shadow-sm relative animate-fade-in">
      <div className="flex items-center justify-between pb-2 border-b border-gray-100">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="bg-[#9C1C0E] text-white text-[11px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            Autoatendimento FastCooking
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
            <MdLockOpen size={13} /> 100% Livre de Cadastro ou Login
          </span>
          {mesaNumero && (
            <span className="text-xs font-extrabold text-gray-700">
              • Mesa {mesaNumero}
            </span>
          )}
        </div>

        <button
          onClick={toggleMinimizado}
          title="Minimizar guia"
          className="text-gray-400 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100 transition cursor-pointer"
        >
          <MdClose size={18} />
        </button>
      </div>

      <p className="text-xs text-gray-600 mt-2">
        Faça seu pedido diretamente para a cozinha em <strong>até 3 toques</strong>, sem precisar criar conta:
      </p>

      {/* Grid dos 3 Passos */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 mt-2.5">
        {/* Passo 1 */}
        <div
          className={`p-2.5 rounded-2xl border transition-all flex items-start gap-2.5 ${
            passoAtivo === 1
              ? "bg-amber-50/90 border-[#B78A10] ring-2 ring-[#B78A10]/20 shadow-xs"
              : "bg-white/70 border-gray-200"
          }`}
        >
          <div
            className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
              passoAtivo === 1
                ? "bg-[#9C1C0E] text-white"
                : "bg-emerald-600 text-white"
            }`}
          >
            {totalItensPedido > 0 ? <MdCheckCircle size={16} /> : "1"}
          </div>
          <div>
            <strong className="text-xs font-bold text-gray-900 block leading-tight">
              1. Escolha seu Prato
            </strong>
            <span className="text-[11px] text-gray-500 leading-snug block mt-0.5">
              Toque em <strong>"+ Pedir"</strong> para adicionar direto com 1 clique.
            </span>
          </div>
        </div>

        {/* Passo 2 */}
        <div
          className={`p-2.5 rounded-2xl border transition-all flex items-start gap-2.5 ${
            passoAtivo === 2
              ? "bg-amber-50/90 border-[#B78A10] ring-2 ring-[#B78A10]/20 shadow-xs"
              : "bg-white/70 border-gray-200"
          }`}
        >
          <div
            className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
              passoAtivo === 2
                ? "bg-[#9C1C0E] text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            2
          </div>
          <div>
            <strong className="text-xs font-bold text-gray-900 block leading-tight">
              2. Confira seu Pedido
            </strong>
            <span className="text-[11px] text-gray-500 leading-snug block mt-0.5">
              Toque no botão <strong>"Meu Pedido ({totalItensPedido})"</strong> para revisar.
            </span>
          </div>
        </div>

        {/* Passo 3 */}
        <div className="p-2.5 rounded-2xl border border-gray-200 bg-white/70 flex items-start gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-gray-200 text-gray-700 flex items-center justify-center font-black text-xs shrink-0">
            3
          </div>
          <div>
            <strong className="text-xs font-bold text-gray-900 block leading-tight">
              3. Envie para a Cozinha
            </strong>
            <span className="text-[11px] text-gray-500 leading-snug block mt-0.5">
              Confirme e acompanhe o preparo em tempo real na tela!
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GuiaAutoatendimento;
