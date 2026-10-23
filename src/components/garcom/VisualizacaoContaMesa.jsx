import { useState } from "react";
import {
  MdArrowBack,
  MdTableRestaurant,
  MdDiscount,
  MdCallSplit,
  MdLock,
  MdCheckCircle,
  MdNotificationsActive,
  MdDeleteOutline,
} from "react-icons/md";
import FormularioPagamento from "./FormularioPagamento.jsx";
import ModalDesconto from "./ModalDesconto.jsx";
import ModalDivisaoConta from "./ModalDivisaoConta.jsx";

function VisualizacaoContaMesa({
  mesa,
  onVoltar,
  onAplicarDesconto,
  onRemoverDesconto,
  onRegistrarPagamento,
  onRemoverPagamento,
  onEncerrarConta,
  carregando,
}) {
  const [modalDescontoAberto, setModalDescontoAberto] = useState(false);
  const [modalDivisaoAberto, setModalDivisaoAberto] = useState(false);
  const [valorSugeridoPagamento, setValorSugeridoPagamento] = useState(null);

  if (!mesa || !mesa.comanda) {
    return (
      <div className="bg-white rounded-2xl p-6 text-center shadow-xs border border-gray-200">
        <p className="text-gray-500 text-sm">Esta mesa não possui comanda aberta.</p>
        <button
          onClick={onVoltar}
          className="mt-3 text-xs font-bold text-[#9C1C0E] hover:underline cursor-pointer"
        >
          ← Voltar para lista de mesas
        </button>
      </div>
    );
  }

  const totais = mesa.totais || {
    subtotal: 0,
    valorDesconto: 0,
    totalComDesconto: 0,
    totalPago: 0,
    saldoRestante: 0,
    podeEncerrar: false,
  };

  const percentualPago =
    totais.totalComDesconto > 0
      ? Math.min(100, Math.round((totais.totalPago / totais.totalComDesconto) * 100))
      : 100;

  function handleSelecionarValorDivisao(valor) {
    setValorSugeridoPagamento(valor);
  }

  return (
    <div className="space-y-4">
      {/* Barra de navegação superior */}
      <div className="flex items-center justify-between">
        <button
          onClick={onVoltar}
          className="inline-flex items-center gap-1 text-xs font-bold text-gray-600 hover:text-gray-900 bg-white border border-gray-300 px-3 py-1.5 rounded-xl shadow-2xs hover:bg-gray-50 transition cursor-pointer"
        >
          <MdArrowBack size={16} />
          <span>Outras Mesas</span>
        </button>

        <span className="text-xs font-semibold text-gray-500">
          Atendimento Compartilhado (RF16)
        </span>
      </div>

      {/* Banner de Solicitação de Fechamento pelo Cliente (RF05) */}
      {mesa.solicitouFechamento && (
        <div className="bg-amber-500 text-slate-950 p-3.5 rounded-2xl shadow-md flex items-center justify-between gap-3 animate-pulse">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-black/15 rounded-xl">
              <MdNotificationsActive size={22} />
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider">
                Solicitação de Fechamento do Cliente (RF05)
              </h4>
              <p className="text-xs font-semibold mt-0.5">
                O cliente sinalizou pelo autoatendimento que deseja encerrar a conta da Mesa {mesa.numeroMesa}.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Card Principal da Mesa / Comanda */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <span className="flex items-center gap-1.5 bg-[#9C1C0E] text-white px-3 py-1.5 rounded-xl text-sm font-black shadow-xs">
              <MdTableRestaurant size={18} />
              MESA {mesa.numeroMesa}
            </span>
            <div>
              <span className="text-[11px] font-mono font-bold text-gray-500 block leading-tight">
                {mesa.comanda.idComanda}
              </span>
              <span className="text-[11px] text-gray-400">
                Aberta às {mesa.horarioAbertura || "--:--"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setModalDivisaoAberto(true)}
              title="Dividir conta por valor ou por item"
              className="flex items-center gap-1 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-xl transition cursor-pointer"
            >
              <MdCallSplit size={16} />
              <span>Dividir (RF15)</span>
            </button>
          </div>
        </div>

        {/* Itens Consumidos */}
        <div className="mt-3">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide block mb-1.5">
            Itens Consumidos ({mesa.comanda.itens?.length || 0})
          </span>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {(mesa.comanda.itens || []).map((item) => (
              <div
                key={item.idItem}
                className="flex items-center justify-between text-xs p-2 rounded-lg bg-gray-50/70 border border-gray-100"
              >
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-[#9C1C0E] bg-red-50 px-1.5 py-0.5 rounded text-[11px]">
                    {item.quantidade}x
                  </span>
                  <div>
                    <span className="font-bold text-gray-800">{item.nomeItem}</span>
                    <span className="text-[10px] text-gray-400 block">
                      {item.categoria} • R$ {item.precoUnitario.toFixed(2)} cada
                    </span>
                  </div>
                </div>

                <span className="font-mono font-bold text-gray-900">
                  R$ {(item.quantidade * item.precoUnitario).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Resumo Financeiro & Desconto */}
        <div className="mt-4 pt-3 border-t border-gray-100 space-y-2">
          <div className="flex justify-between text-xs text-gray-600">
            <span>Subtotal:</span>
            <span className="font-mono font-semibold">R$ {totais.subtotal.toFixed(2)}</span>
          </div>

          {/* Seção de Desconto (RF13, UC12) */}
          {mesa.comanda.desconto && mesa.comanda.desconto.aplicado ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-2.5 flex items-center justify-between text-xs">
              <div className="flex items-start gap-1.5">
                <MdDiscount className="text-red-700 shrink-0 mt-0.5" size={16} />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-red-900">
                      Desconto de R$ {totais.valorDesconto.toFixed(2)}
                    </span>
                    <span className="text-[10px] bg-red-200 text-red-900 px-1.5 py-0.2 rounded font-bold">
                      {mesa.comanda.desconto.tipo === "percentual"
                        ? `${mesa.comanda.desconto.valorInformado}%`
                        : "R$ Fixo"}
                    </span>
                  </div>
                  <span className="text-[11px] text-red-700 italic block">
                    Motivo: {mesa.comanda.desconto.motivo}
                  </span>
                  <span className="text-[10px] text-red-600 block">
                    Autorizado pelo Gerente ({mesa.comanda.desconto.gerenteAutorizador})
                  </span>
                </div>
              </div>

              <button
                onClick={() => onRemoverDesconto(mesa.numeroMesa)}
                title="Remover desconto"
                disabled={carregando}
                className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg transition cursor-pointer"
              >
                <MdDeleteOutline size={18} />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs">
              <span className="text-gray-500 font-medium">Nenhum desconto aplicado</span>
              <button
                onClick={() => setModalDescontoAberto(true)}
                className="flex items-center gap-1 text-[11px] font-bold text-[#9C1C0E] hover:text-[#7a1509] hover:underline cursor-pointer"
              >
                <MdDiscount size={14} />
                <span>Solicitar Desconto (RF13)</span>
              </button>
            </div>
          )}

          {/* Total com Desconto */}
          <div className="flex justify-between items-center text-sm font-black text-gray-900 pt-1">
            <span>Total da Conta:</span>
            <span className="text-base text-gray-900 font-mono">
              R$ {totais.totalComDesconto.toFixed(2)}
            </span>
          </div>

          {/* Barra de Progresso do Pagamento */}
          <div className="bg-gray-100 rounded-xl p-3 space-y-1.5 border border-gray-200">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-gray-600">Total Pago: R$ {totais.totalPago.toFixed(2)}</span>
              <span className={totais.saldoRestante <= 0 ? "text-emerald-700" : "text-amber-800"}>
                {percentualPago}% Quitado
              </span>
            </div>

            <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  totais.saldoRestante <= 0 ? "bg-emerald-500" : "bg-[#9C1C0E]"
                }`}
                style={{ width: `${percentualPago}%` }}
              ></div>
            </div>

            <div className="flex justify-between items-center text-xs pt-1">
              <span className="text-gray-500 font-medium">Saldo Restante a Pagar:</span>
              <span
                className={`text-base font-black font-mono ${
                  totais.saldoRestante <= 0 ? "text-emerald-700" : "text-red-700"
                }`}
              >
                R$ {totais.saldoRestante.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Formulário de Registro de Múltiplos Pagamentos (RF14) */}
      <FormularioPagamento
        mesa={mesa}
        totais={totais}
        valorSugerido={valorSugeridoPagamento}
        onRegistrarPagamento={(dados) => onRegistrarPagamento(mesa.numeroMesa, dados)}
        onRemoverPagamento={(idPagamento) => onRemoverPagamento(mesa.numeroMesa, idPagamento)}
        carregando={carregando}
      />

      {/* Botão de Encerramento de Conta (RF16, UC11) */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
        {totais.podeEncerrar ? (
          <button
            onClick={() => onEncerrarConta(mesa.numeroMesa)}
            disabled={carregando}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-base py-4 px-4 rounded-xl shadow-lg shadow-emerald-600/30 hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
          >
            <MdCheckCircle size={24} />
            <span>Encerrar Conta e Liberar Mesa {mesa.numeroMesa}</span>
          </button>
        ) : (
          <div className="space-y-2">
            <button
              disabled
              className="w-full bg-gray-100 text-gray-400 border border-gray-200 font-bold text-sm py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 cursor-not-allowed"
            >
              <MdLock size={18} />
              <span>Encerrar Conta (Bloqueado)</span>
            </button>
            <p className="text-[11px] text-center text-amber-800 font-semibold leading-tight">
              ⚠️ Critério de aceite: O botão só fica habilitado quando a soma dos pagamentos atinge o total da conta. Faltam R$ {totais.saldoRestante.toFixed(2)}.
            </p>
          </div>
        )}
      </div>

      {/* Modal de Desconto com Senha do Gerente (RF13, UC12) */}
      {modalDescontoAberto && (
        <ModalDesconto
          mesa={mesa}
          subtotal={totais.subtotal}
          onAplicar={(dados) => onAplicarDesconto(mesa.numeroMesa, dados)}
          onFechar={() => setModalDescontoAberto(false)}
          carregando={carregando}
        />
      )}

      {/* Modal de Divisão de Conta por Valor ou Item (RF15) */}
      {modalDivisaoAberto && (
        <ModalDivisaoConta
          mesa={mesa}
          totais={totais}
          onSelecionarValor={handleSelecionarValorDivisao}
          onFechar={() => setModalDivisaoAberto(false)}
        />
      )}
    </div>
  );
}

export default VisualizacaoContaMesa;
