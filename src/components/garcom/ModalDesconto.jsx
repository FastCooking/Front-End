import { useState } from "react";
import {
  MdClose,
  MdLock,
  MdDiscount,
  MdPercent,
  MdAttachMoney,
  MdVisibility,
  MdVisibilityOff,
  MdCheck,
} from "react-icons/md";

function ModalDesconto({ mesa, subtotal, onAplicar, onFechar, carregando }) {
  const [senhaGerente, setSenhaGerente] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [tipo, setTipo] = useState("percentual"); // "percentual" | "valor"
  const [valor, setValor] = useState("10");
  const [motivo, setMotivo] = useState("Cortesia da gerência");
  const [erro, setErro] = useState("");

  // Cálculo da simulação em tempo real
  const valorNumerico = parseFloat(valor) || 0;
  const valorCalculado =
    tipo === "percentual" ? (subtotal * valorNumerico) / 100 : valorNumerico;
  const valorDescontoCalculado = Math.min(valorCalculado, subtotal);
  const novoTotal = Math.max(0, subtotal - valorDescontoCalculado);

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");

    if (!senhaGerente.trim()) {
      setErro("Informe a senha do gerente para autorizar o desconto.");
      return;
    }

    if (valorNumerico <= 0) {
      setErro("Informe um valor de desconto válido maior que zero.");
      return;
    }

    if (tipo === "percentual" && valorNumerico > 100) {
      setErro("O percentual de desconto não pode ser maior que 100%.");
      return;
    }

    if (tipo === "valor" && valorNumerico > subtotal) {
      setErro("O desconto não pode ser maior que o subtotal da conta.");
      return;
    }

    if (!motivo.trim()) {
      setErro("O motivo/justificativa é obrigatório (RF13).");
      return;
    }

    try {
      await onAplicar({
        senhaGerente,
        tipo,
        valor: valorNumerico,
        motivo,
      });
      onFechar();
    } catch (err) {
      setErro(err.message || "Erro ao validar autorização do gerente.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-[slide-in_0.2s_ease-out]">
        {/* Cabeçalho */}
        <div className="bg-gradient-to-r from-[#9C1C0E] to-red-700 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-white/20 rounded-xl">
              <MdDiscount size={22} />
            </div>
            <div>
              <h3 className="font-extrabold text-base leading-tight">
                Aplicar Desconto • Mesa {mesa?.numeroMesa}
              </h3>
              <span className="text-xs text-red-100 flex items-center gap-1 mt-0.5">
                <MdLock size={12} /> Requer autenticação do gerente (RF13, UC12)
              </span>
            </div>
          </div>
          <button
            onClick={onFechar}
            className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition cursor-pointer"
          >
            <MdClose size={20} />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {erro && (
            <div className="bg-red-50 border border-red-200 text-red-800 text-xs p-3 rounded-xl font-semibold flex items-start gap-2">
              <span className="text-red-600 font-bold shrink-0">⚠️</span>
              <span>{erro}</span>
            </div>
          )}

          {/* Campo Senha do Gerente */}
          <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="senha-gerente"
                className="text-xs font-bold text-amber-950 flex items-center gap-1 uppercase tracking-wide"
              >
                <MdLock className="text-amber-700" size={14} />
                Senha do Gerente *
              </label>
              <span className="text-[11px] text-amber-700 font-medium">
                💡 Senha teste: <code className="bg-white px-1 py-0.5 rounded font-mono font-bold">654321</code>
              </span>
            </div>
            <div className="relative">
              <input
                id="senha-gerente"
                type={mostrarSenha ? "text" : "password"}
                placeholder="Digite a senha do gerente..."
                value={senhaGerente}
                onChange={(e) => setSenhaGerente(e.target.value)}
                required
                className="w-full bg-white border border-amber-300 rounded-lg p-2.5 pr-10 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <button
                type="button"
                onClick={() => setMostrarSenha(!mostrarSenha)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 cursor-pointer"
              >
                {mostrarSenha ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
              </button>
            </div>
          </div>

          {/* Seleção do Tipo de Desconto */}
          <div>
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wide block mb-1.5">
              Tipo de Desconto
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTipo("percentual")}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition cursor-pointer ${
                  tipo === "percentual"
                    ? "bg-[#9C1C0E] text-white border-[#9C1C0E] shadow-xs"
                    : "bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100"
                }`}
              >
                <MdPercent size={15} />
                <span>Percentual (%)</span>
              </button>
              <button
                type="button"
                onClick={() => setTipo("valor")}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition cursor-pointer ${
                  tipo === "valor"
                    ? "bg-[#9C1C0E] text-white border-[#9C1C0E] shadow-xs"
                    : "bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100"
                }`}
              >
                <MdAttachMoney size={16} />
                <span>Valor em R$</span>
              </button>
            </div>
          </div>

          {/* Input do Valor */}
          <div>
            <label htmlFor="valor-desconto" className="text-xs font-bold text-gray-700 uppercase tracking-wide block mb-1">
              {tipo === "percentual" ? "Percentual de Desconto (%)" : "Valor do Desconto (R$)"}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">
                {tipo === "percentual" ? "%" : "R$"}
              </span>
              <input
                id="valor-desconto"
                type="number"
                step={tipo === "percentual" ? "1" : "0.01"}
                min="0"
                max={tipo === "percentual" ? "100" : subtotal}
                placeholder={tipo === "percentual" ? "10" : "15.00"}
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-xl p-2.5 pl-10 text-base font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#9C1C0E]"
              />
            </div>
          </div>

          {/* Justificativa / Motivo Obrigatório (RF13) */}
          <div>
            <label htmlFor="motivo-desconto" className="text-xs font-bold text-gray-700 uppercase tracking-wide block mb-1">
              Motivo / Justificativa (Obrigatório) *
            </label>
            <input
              id="motivo-desconto"
              type="text"
              placeholder="Ex: Demora na cozinha, aniversariante, cortesia..."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#9C1C0E]"
            />
          </div>

          {/* Prévia do Cálculo */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1.5">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal original:</span>
              <span className="font-semibold">R$ {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-red-600 font-bold">
              <span>Desconto a aplicar:</span>
              <span>- R$ {valorDescontoCalculado.toFixed(2)}</span>
            </div>
            <div className="border-t border-slate-200 pt-1.5 flex justify-between text-sm font-extrabold text-gray-900">
              <span>Novo Total com Desconto:</span>
              <span className="text-emerald-700">R$ {novoTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onFechar}
              disabled={carregando}
              className="flex-1 py-3 px-4 rounded-xl border border-gray-300 text-gray-700 font-bold text-sm hover:bg-gray-100 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={carregando}
              className="flex-2 py-3 px-4 rounded-xl bg-[#9C1C0E] hover:bg-[#7a1509] text-white font-extrabold text-sm shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <MdCheck size={18} />
              <span>{carregando ? "Validando..." : "Autorizar e Aplicar"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ModalDesconto;
