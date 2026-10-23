import { useState, useEffect } from "react";
import {
  MdPayments,
  MdCreditCard,
  MdAttachMoney,
  MdQrCode2,
  MdDeleteOutline,
  MdAdd,
  MdCheckCircle,
} from "react-icons/md";

function FormularioPagamento({
  mesa,
  totais,
  valorSugerido,
  onRegistrarPagamento,
  onRemoverPagamento,
  carregando,
}) {
  const [forma, setForma] = useState("Pix"); // 'Pix' | 'Crédito' | 'Débito' | 'Dinheiro'
  const [valor, setValor] = useState("");
  const [valorRecebido, setValorRecebido] = useState("");
  const [erro, setErro] = useState("");

  const saldoRestante = totais?.saldoRestante || 0;

  // Quando o valor sugerido mudar (ex: vindo da divisão de conta) ou na carga inicial, atualiza o campo
  useEffect(() => {
    let cancelado = false;
    Promise.resolve().then(() => {
      if (cancelado) return;
      if (valorSugerido && valorSugerido > 0) {
        setValor(valorSugerido.toFixed(2));
      } else if (saldoRestante > 0) {
        setValor(saldoRestante.toFixed(2));
      } else {
        setValor("");
      }
    });
    return () => {
      cancelado = true;
    };
  }, [valorSugerido, saldoRestante]);

  // Cálculo de troco para dinheiro
  const valorNum = parseFloat(valor) || 0;
  const recebidoNum = parseFloat(valorRecebido) || 0;
  const trocoCalculado =
    forma === "Dinheiro" && recebidoNum > valorNum ? recebidoNum - valorNum : 0;

  async function handleAdicionarPagamento(e) {
    e.preventDefault();
    setErro("");

    if (!valorNum || valorNum <= 0) {
      setErro("Informe um valor válido maior que zero.");
      return;
    }

    if (saldoRestante <= 0) {
      setErro("O total da conta já está totalmente pago!");
      return;
    }

    if (valorNum > saldoRestante + 0.01) {
      setErro(`O valor máximo restante é de R$ ${saldoRestante.toFixed(2)}.`);
      return;
    }

    if (forma === "Dinheiro" && recebidoNum > 0 && recebidoNum < valorNum) {
      setErro("O valor em dinheiro entregue não pode ser menor que o valor a registrar.");
      return;
    }

    try {
      await onRegistrarPagamento({
        forma,
        valor: valorNum,
        valorRecebido: forma === "Dinheiro" && recebidoNum > 0 ? recebidoNum : valorNum,
      });

      // Limpa os campos após registro
      setValorRecebido("");
    } catch (err) {
      setErro(err.message || "Erro ao registrar pagamento.");
    }
  }

  const pagamentos = mesa?.comanda?.pagamentos || [];

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200 space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
            <MdPayments size={20} />
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-gray-900 leading-tight">
              Registrar Pagamentos (RF14)
            </h4>
            <span className="text-[11px] text-gray-500">
              Suporta múltiplos pagamentos com formas diferentes
            </span>
          </div>
        </div>

        {saldoRestante <= 0 && (
          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-xs font-black px-2.5 py-1 rounded-full border border-emerald-200">
            <MdCheckCircle size={14} /> 100% PAGO
          </span>
        )}
      </div>

      {erro && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-xs p-2.5 rounded-xl font-semibold">
          ⚠️ {erro}
        </div>
      )}

      {/* Formulário para adicionar novo pagamento (se ainda houver saldo a quitar) */}
      {saldoRestante > 0 ? (
        <form onSubmit={handleAdicionarPagamento} className="space-y-3">
          {/* Seletor de Formas de Pagamento */}
          <div>
            <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wide block mb-1.5">
              Forma de Pagamento
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {/* PIX */}
              <button
                type="button"
                onClick={() => setForma("Pix")}
                className={`p-2.5 rounded-xl border text-xs font-extrabold flex flex-col items-center gap-1 transition cursor-pointer ${
                  forma === "Pix"
                    ? "bg-teal-50 border-teal-600 text-teal-800 ring-2 ring-teal-500/20 shadow-xs"
                    : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                }`}
              >
                <MdQrCode2 size={22} className={forma === "Pix" ? "text-teal-600" : "text-gray-500"} />
                <span>Pix</span>
              </button>

              {/* CRÉDITO */}
              <button
                type="button"
                onClick={() => setForma("Crédito")}
                className={`p-2.5 rounded-xl border text-xs font-extrabold flex flex-col items-center gap-1 transition cursor-pointer ${
                  forma === "Crédito"
                    ? "bg-blue-50 border-blue-600 text-blue-800 ring-2 ring-blue-500/20 shadow-xs"
                    : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                }`}
              >
                <MdCreditCard size={22} className={forma === "Crédito" ? "text-blue-600" : "text-gray-500"} />
                <span>Crédito</span>
              </button>

              {/* DÉBITO */}
              <button
                type="button"
                onClick={() => setForma("Débito")}
                className={`p-2.5 rounded-xl border text-xs font-extrabold flex flex-col items-center gap-1 transition cursor-pointer ${
                  forma === "Débito"
                    ? "bg-indigo-50 border-indigo-600 text-indigo-800 ring-2 ring-indigo-500/20 shadow-xs"
                    : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                }`}
              >
                <MdCreditCard size={22} className={forma === "Débito" ? "text-indigo-600" : "text-gray-500"} />
                <span>Débito</span>
              </button>

              {/* DINHEIRO */}
              <button
                type="button"
                onClick={() => setForma("Dinheiro")}
                className={`p-2.5 rounded-xl border text-xs font-extrabold flex flex-col items-center gap-1 transition cursor-pointer ${
                  forma === "Dinheiro"
                    ? "bg-emerald-50 border-emerald-600 text-emerald-800 ring-2 ring-emerald-500/20 shadow-xs"
                    : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                }`}
              >
                <MdAttachMoney size={22} className={forma === "Dinheiro" ? "text-emerald-600" : "text-gray-500"} />
                <span>Dinheiro</span>
              </button>
            </div>
          </div>

          {/* Campo Valor do Pagamento */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="valor-pagamento" className="text-[11px] font-bold text-gray-600 uppercase tracking-wide">
                Valor do Pagamento (R$)
              </label>
              <button
                type="button"
                onClick={() => setValor(saldoRestante.toFixed(2))}
                className="text-[11px] text-[#9C1C0E] font-bold hover:underline cursor-pointer"
              >
                Preencher Restante (R$ {saldoRestante.toFixed(2)})
              </button>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">
                R$
              </span>
              <input
                id="valor-pagamento"
                type="number"
                step="0.01"
                min="0.01"
                max={saldoRestante + 0.01}
                placeholder="0.00"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-xl p-2.5 pl-10 text-base font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#9C1C0E]"
              />
            </div>
          </div>

          {/* Se for Dinheiro: Campo opcional de valor entregue e cálculo de troco */}
          {forma === "Dinheiro" && (
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 space-y-2">
              <label htmlFor="valor-entregue-dinheiro" className="text-[11px] font-bold text-emerald-950 uppercase tracking-wide block">
                Valor Entregue pelo Cliente (Calculadora de Troco)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-800 font-bold text-sm">
                  R$
                </span>
                <input
                  id="valor-entregue-dinheiro"
                  type="number"
                  step="0.01"
                  placeholder="Ex: 50.00, 100.00..."
                  value={valorRecebido}
                  onChange={(e) => setValorRecebido(e.target.value)}
                  className="w-full bg-white border border-emerald-300 rounded-lg p-2 pl-10 text-sm font-bold text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {trocoCalculado > 0 && (
                <div className="flex items-center justify-between bg-white border border-emerald-300 rounded-lg p-2.5 text-xs font-bold text-emerald-900 shadow-2xs">
                  <span>Troco a Devolver:</span>
                  <span className="text-base font-black text-emerald-700">
                    R$ {trocoCalculado.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Botão Registrar Pagamento */}
          <button
            type="submit"
            disabled={carregando}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 px-4 rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
          >
            <MdAdd size={20} />
            <span>Registrar Pagamento de R$ {valorNum > 0 ? valorNum.toFixed(2) : "0.00"}</span>
          </button>
        </form>
      ) : (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center text-xs font-bold text-emerald-800">
          ✓ Todos os pagamentos foram registrados! O total da conta foi 100% atingido.
        </div>
      )}

      {/* Lista de Pagamentos Registrados na Comanda (RF14) */}
      <div className="space-y-2 pt-2 border-t border-gray-100">
        <span className="text-xs font-bold text-gray-700 block">
          Pagamentos Registrados ({pagamentos.length}):
        </span>

        {pagamentos.length === 0 ? (
          <p className="text-xs text-gray-400 italic">
            Nenhum pagamento registrado ainda para esta mesa.
          </p>
        ) : (
          <div className="space-y-1.5">
            {pagamentos.map((pag) => (
              <div
                key={pag.idPagamento}
                className="bg-gray-50 border border-gray-200 rounded-xl p-2.5 flex items-center justify-between text-xs transition"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                      pag.forma === "Pix"
                        ? "bg-teal-100 text-teal-800"
                        : pag.forma === "Crédito"
                        ? "bg-blue-100 text-blue-800"
                        : pag.forma === "Débito"
                        ? "bg-indigo-100 text-indigo-800"
                        : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {pag.forma}
                  </span>
                  <div>
                    <span className="font-extrabold text-gray-900 text-sm">
                      R$ {pag.valor.toFixed(2)}
                    </span>
                    {pag.troco > 0 && (
                      <span className="text-[10px] text-emerald-700 block font-semibold">
                        (Recebido: R$ {pag.valorRecebido.toFixed(2)} • Troco: R$ {pag.troco.toFixed(2)})
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-500 font-mono">
                    {pag.dataHora}
                  </span>
                  <button
                    onClick={() => onRemoverPagamento(pag.idPagamento)}
                    title="Remover pagamento"
                    disabled={carregando}
                    className="p-1 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                  >
                    <MdDeleteOutline size={17} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default FormularioPagamento;
