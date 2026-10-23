import { MdCheckCircle, MdClose, MdPrint, MdTableRestaurant } from "react-icons/md";
import logo from "../../assets/fast cooking logo.png";

function ModalReciboFechamento({ recibo, onFechar }) {
  if (!recibo) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-[slide-in_0.2s_ease-out]">
        {/* Topo do Recibo */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-5 text-center relative">
          <button
            onClick={onFechar}
            className="absolute right-3 top-3 text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
          >
            <MdClose size={22} />
          </button>

          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
            <MdCheckCircle size={32} className="text-white" />
          </div>
          <h3 className="text-xl font-black">Conta Encerrada com Sucesso!</h3>
          <p className="text-xs text-emerald-100 mt-0.5">
            Mesa {recibo.numeroMesa} foi liberada e está disponível (RF16)
          </p>
        </div>

        {/* Corpo do Comprovante (Estilo Nota / Recibo) */}
        <div className="p-5 space-y-4 font-sans text-xs text-gray-700 max-h-[70vh] overflow-y-auto">
          {/* Cabeçalho do Restaurante */}
          <div className="text-center pb-3 border-b border-dashed border-gray-300">
            <img src={logo} alt="FastCooking" className="h-8 mx-auto mb-1 object-contain" />
            <p className="font-mono text-[11px] text-gray-500">FastCooking Restaurante • Barueri/SP</p>
            <div className="mt-2 inline-flex items-center gap-1.5 bg-gray-100 text-gray-800 px-3 py-1 rounded-lg font-bold">
              <MdTableRestaurant size={15} />
              <span>MESA {recibo.numeroMesa}</span>
              <span className="text-gray-400">•</span>
              <span className="font-mono text-gray-600">{recibo.idComanda}</span>
            </div>
            <p className="text-[10px] text-gray-400 mt-1">
              Abertura: {recibo.horarioAbertura || "--:--"} • Encerramento: {recibo.horarioFechamento}
            </p>
          </div>

          {/* Itens Consumidos */}
          <div>
            <span className="font-bold uppercase tracking-wider text-gray-500 block mb-2">
              Itens Consumidos
            </span>
            <div className="space-y-1.5">
              {(recibo.itens || []).map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-gray-900">{item.quantidade}x</span>
                    <span>{item.nomeItem}</span>
                  </div>
                  <span className="font-mono font-semibold">
                    R$ {(item.quantidade * item.precoUnitario).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Totais e Desconto */}
          <div className="pt-3 border-t border-dashed border-gray-300 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-gray-500">Subtotal:</span>
              <span className="font-mono font-semibold">R$ {recibo.subtotal.toFixed(2)}</span>
            </div>

            {recibo.desconto && recibo.desconto.aplicado && (
              <div className="flex justify-between text-red-600 font-semibold bg-red-50 p-2 rounded-lg">
                <div>
                  <span>Desconto ({recibo.desconto.motivo}):</span>
                  <span className="block text-[10px] text-red-500 italic">
                    Autorizado por: {recibo.desconto.gerenteAutorizador}
                  </span>
                </div>
                <span className="font-mono font-bold">
                  - R$ {recibo.desconto.valorDesconto.toFixed(2)}
                </span>
              </div>
            )}

            <div className="flex justify-between text-base font-black text-gray-900 pt-1 border-t border-gray-200">
              <span>Total Pago:</span>
              <span className="text-emerald-700 font-mono">
                R$ {recibo.totalFinal.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Formas de Pagamento Registradas (RF14) */}
          <div className="pt-3 border-t border-dashed border-gray-300">
            <span className="font-bold uppercase tracking-wider text-gray-500 block mb-1.5">
              Pagamentos Efetuados
            </span>
            <div className="space-y-1">
              {(recibo.pagamentos || []).map((p, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center bg-gray-50 p-2 rounded-lg text-xs"
                >
                  <span className="font-bold text-gray-800">
                    {p.forma} {p.troco > 0 && <span className="text-emerald-700 text-[10px]">(Troco: R$ {p.troco.toFixed(2)})</span>}
                  </span>
                  <span className="font-mono font-bold text-gray-900">
                    R$ {p.valor.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Rodapé do Recibo */}
          <div className="text-center text-[10px] text-gray-400 pt-2 border-t border-gray-200">
            <p>Garçom responsável pelo fechamento: <strong>{recibo.garcomFechamento}</strong></p>
            <p className="mt-0.5">Obrigado pela preferência e volte sempre!</p>
          </div>
        </div>

        {/* Botão de Fechamento */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex gap-2">
          <button
            onClick={() => window.print()}
            className="flex-1 py-3 px-3 rounded-xl border border-gray-300 text-gray-700 font-bold text-xs hover:bg-gray-100 transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <MdPrint size={16} />
            <span>Imprimir</span>
          </button>
          <button
            onClick={onFechar}
            className="flex-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition flex items-center justify-center gap-1 cursor-pointer"
          >
            <span>Concluir e Voltar às Mesas</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default ModalReciboFechamento;
