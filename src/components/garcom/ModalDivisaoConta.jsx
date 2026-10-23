import { useState } from "react";
import {
  MdClose,
  MdCallSplit,
  MdGroups,
  MdChecklist,
  MdCheck,
  MdArrowForward,
} from "react-icons/md";

function ModalDivisaoConta({ mesa, totais, onSelecionarValor, onFechar }) {
  const [abaDivisao, setAbaDivisao] = useState("valor"); // "valor" | "item"
  const [numeroPessoas, setNumeroPessoas] = useState(2);

  // Itens selecionados para a divisão por item (set de idItem)
  const [itensSelecionados, setItensSelecionados] = useState(new Set());

  const totalBase = totais?.saldoRestante > 0 ? totais.saldoRestante : totais.totalComDesconto;

  // Cálculo da divisão por valor
  const valorPorPessoa = numeroPessoas > 0 ? totalBase / numeroPessoas : 0;

  // Cálculo da divisão por item
  const itensComanda = mesa?.comanda?.itens || [];
  const subtotalItensSelecionados = itensComanda.reduce((acc, item) => {
    if (itensSelecionados.has(item.idItem)) {
      return acc + item.quantidade * item.precoUnitario;
    }
    return acc;
  }, 0);

  function toggleItem(idItem) {
    setItensSelecionados((prev) => {
      const novo = new Set(prev);
      if (novo.has(idItem)) {
        novo.delete(idItem);
      } else {
        novo.add(idItem);
      }
      return novo;
    });
  }

  function selecionarTodosItens() {
    setItensSelecionados(new Set(itensComanda.map((i) => i.idItem)));
  }

  function limparItens() {
    setItensSelecionados(new Set());
  }

  function handleAplicarDivisaoPorValor() {
    onSelecionarValor(Number(valorPorPessoa.toFixed(2)));
    onFechar();
  }

  function handleAplicarDivisaoPorItem() {
    if (subtotalItensSelecionados <= 0) return;
    onSelecionarValor(Number(subtotalItensSelecionados.toFixed(2)));
    onFechar();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-[slide-in_0.2s_ease-out]">
        {/* Cabeçalho */}
        <div className="bg-gradient-to-r from-gray-900 to-slate-800 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-white/10 rounded-xl text-yellow-400">
              <MdCallSplit size={22} />
            </div>
            <div>
              <h3 className="font-extrabold text-base leading-tight">
                Divisão de Conta • Mesa {mesa?.numeroMesa}
              </h3>
              <span className="text-xs text-gray-300">
                Rateio calculado automaticamente (RF15)
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

        {/* Resumo Base */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex items-center justify-between text-xs">
          <span className="text-gray-600 font-medium">Saldo a Ratear:</span>
          <span className="text-base font-black text-gray-900">
            R$ {totalBase.toFixed(2)}
          </span>
        </div>

        {/* Alternância de Abas: Por Valor ou Por Item (RF15) */}
        <div className="p-4 pb-0">
          <div className="grid grid-cols-2 gap-2 bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setAbaDivisao("valor")}
              className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                abaDivisao === "valor"
                  ? "bg-white text-[#9C1C0E] shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <MdGroups size={16} />
              <span>Divisão por Valor</span>
            </button>
            <button
              onClick={() => setAbaDivisao("item")}
              className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                abaDivisao === "item"
                  ? "bg-white text-[#9C1C0E] shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <MdChecklist size={16} />
              <span>Divisão por Item</span>
            </button>
          </div>
        </div>

        {/* Conteúdo da Aba 1: Divisão por Valor (Rateio) */}
        {abaDivisao === "valor" && (
          <div className="p-5 space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wide block mb-2 text-center">
                Quantidade de Pessoas no Rateio
              </label>

              {/* Controle numérico com botões */}
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setNumeroPessoas((n) => Math.max(2, n - 1))}
                  className="w-12 h-12 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-black text-xl flex items-center justify-center cursor-pointer border border-gray-300"
                >
                  -
                </button>
                <div className="w-20 text-center">
                  <span className="text-3xl font-black text-gray-900 block leading-none">
                    {numeroPessoas}
                  </span>
                  <span className="text-[11px] font-semibold text-gray-500 uppercase">
                    pessoas
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setNumeroPessoas((n) => Math.min(20, n + 1))}
                  className="w-12 h-12 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-black text-xl flex items-center justify-center cursor-pointer border border-gray-300"
                >
                  +
                </button>
              </div>

              {/* Botões rápidos */}
              <div className="flex items-center justify-center gap-1.5 mt-3">
                {[2, 3, 4, 5, 6].map((qtd) => (
                  <button
                    key={qtd}
                    type="button"
                    onClick={() => setNumeroPessoas(qtd)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition cursor-pointer ${
                      numeroPessoas === qtd
                        ? "bg-[#9C1C0E] text-white border-[#9C1C0E]"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {qtd}x
                  </button>
                ))}
              </div>
            </div>

            {/* Resultado do Cálculo */}
            <div className="bg-emerald-50 border-2 border-emerald-400 rounded-2xl p-4 text-center">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
                Valor por Pessoa
              </span>
              <div className="text-3xl font-black text-emerald-950 mt-1">
                R$ {valorPorPessoa.toFixed(2)}
              </div>
              <p className="text-[11px] text-emerald-700 mt-1">
                R$ {totalBase.toFixed(2)} divididos igualmente entre {numeroPessoas} pessoas.
              </p>
            </div>

            <button
              onClick={handleAplicarDivisaoPorValor}
              className="w-full bg-[#9C1C0E] hover:bg-[#7a1509] text-white font-extrabold py-3.5 px-4 rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <span>Usar R$ {valorPorPessoa.toFixed(2)} no Pagamento</span>
              <MdArrowForward size={18} />
            </button>
          </div>
        )}

        {/* Conteúdo da Aba 2: Divisão por Item */}
        {abaDivisao === "item" && (
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between text-xs pb-1 border-b border-gray-100">
              <span className="font-bold text-gray-700">Selecione os itens a pagar:</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={selecionarTodosItens}
                  className="text-[#9C1C0E] font-bold hover:underline cursor-pointer"
                >
                  Todos
                </button>
                <span className="text-gray-300">|</span>
                <button
                  type="button"
                  onClick={limparItens}
                  className="text-gray-500 font-semibold hover:underline cursor-pointer"
                >
                  Limpar
                </button>
              </div>
            </div>

            {/* Lista com checkboxes */}
            <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
              {itensComanda.map((item) => {
                const marcado = itensSelecionados.has(item.idItem);
                const totalItem = item.quantidade * item.precoUnitario;

                return (
                  <div
                    key={item.idItem}
                    onClick={() => toggleItem(item.idItem)}
                    className={`p-3 rounded-xl border transition flex items-center justify-between cursor-pointer ${
                      marcado
                        ? "bg-red-50/80 border-[#9C1C0E] shadow-xs"
                        : "bg-gray-50/60 border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center border transition ${
                          marcado
                            ? "bg-[#9C1C0E] border-[#9C1C0E] text-white"
                            : "bg-white border-gray-300"
                        }`}
                      >
                        {marcado && <MdCheck size={14} className="stroke-[2]" />}
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-gray-900 leading-tight">
                          {item.quantidade}x {item.nomeItem}
                        </h5>
                        <span className="text-[11px] text-gray-500">
                          {item.categoria} • R$ {item.precoUnitario.toFixed(2)} un.
                        </span>
                      </div>
                    </div>

                    <span className="text-xs font-extrabold text-gray-900">
                      R$ {totalItem.toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Total dos itens selecionados */}
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-amber-900 block">
                  Itens Selecionados ({itensSelecionados.size}):
                </span>
                <span className="text-[11px] text-amber-700">
                  Subtotal a ser registrado agora
                </span>
              </div>
              <span className="text-xl font-black text-amber-950">
                R$ {subtotalItensSelecionados.toFixed(2)}
              </span>
            </div>

            <button
              onClick={handleAplicarDivisaoPorItem}
              disabled={subtotalItensSelecionados <= 0}
              className="w-full bg-[#9C1C0E] hover:bg-[#7a1509] text-white font-extrabold py-3.5 px-4 rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span>Usar R$ {subtotalItensSelecionados.toFixed(2)} no Pagamento</span>
              <MdArrowForward size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ModalDivisaoConta;
