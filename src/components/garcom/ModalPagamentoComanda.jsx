import React, { useState, useMemo, useEffect } from 'react';
import {
  MdClose,
  MdPayment,
  MdCheckCircle,
  MdWarning,
  MdCalculate,
  MdPerson,
  MdReceipt,
  MdAdd,
} from 'react-icons/md';
import { registrarPagamento, obterPedido } from '../../services/pedidoService';

export default function ModalPagamentoComanda({
  aberto,
  mesa,
  pedido,
  itens = [],
  onFechar,
  onSucesso,
}) {
  const [pagamentosAnteriores, setPagamentosAnteriores] = useState([]);
  const [formaPagamento, setFormaPagamento] = useState('PIX');
  const [valorInput, setValorInput] = useState('');
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState(null);
  const [sucessoMsg, setSucessoMsg] = useState(null);

  // Divisão de conta
  const [abaDivisao, setAbaDivisao] = useState('valor'); // 'valor' | 'item'
  const [numeroPessoas, setNumeroPessoas] = useState(2);
  const [itensSelecionados, setItensSelecionados] = useState({});

  // Recarrega detalhes atualizados do pedido e pagamentos ao abrir
  useEffect(() => {
    if (!aberto || !pedido?.idPedido) return;
    async function carregarDetalhes() {
      try {
        const dados = await obterPedido(pedido.idPedido);
        if (dados?.pagamentos) {
          setPagamentosAnteriores(dados.pagamentos);
        }
      } catch (e) {
        console.warn('Erro ao carregar pagamentos anteriores:', e);
      }
    }
    carregarDetalhes();
  }, [aberto, pedido?.idPedido]);

  // Cálculos do pedido
  const totalPedido = useMemo(() => {
    return itens
      .filter((it) => it.status !== 'Cancelado')
      .reduce((acc, it) => acc + (Number(it.precoUnitario) || 0) * (it.quantidade || 1), 0);
  }, [itens]);

  const totalPago = useMemo(() => {
    return pagamentosAnteriores.reduce((acc, p) => acc + (Number(p.valor) || 0), 0);
  }, [pagamentosAnteriores]);

  const saldoRestante = useMemo(() => {
    return Math.max(0, Number((totalPedido - totalPago).toFixed(2)));
  }, [totalPedido, totalPago]);

  // Inicializa o valor com o saldo restante
  useEffect(() => {
    if (saldoRestante > 0) {
      setValorInput(saldoRestante.toFixed(2));
    }
  }, [saldoRestante]);

  // Checagens de regras de negócio
  const temItemEmPreparo = useMemo(() => {
    return itens.some((it) => it.status === 'Em preparo');
  }, [itens]);

  const itensPendentes = useMemo(() => {
    return itens.filter((it) => it.status === 'Pendente');
  }, [itens]);

  // Divisão por valor
  const valorPorPessoa = useMemo(() => {
    if (numeroPessoas <= 0) return 0;
    return Number((saldoRestante / numeroPessoas).toFixed(2));
  }, [saldoRestante, numeroPessoas]);

  // Divisão por item
  const subtotalItensSelecionados = useMemo(() => {
    return itens
      .filter((it) => itensSelecionados[it.idItemPedido] && it.status !== 'Cancelado')
      .reduce((acc, it) => acc + (Number(it.precoUnitario) || 0) * (it.quantidade || 1), 0);
  }, [itens, itensSelecionados]);

  function handleToggleItem(idItemPedido) {
    setItensSelecionados((prev) => ({
      ...prev,
      [idItemPedido]: !prev[idItemPedido],
    }));
  }

  function handleUsarValorCalculado(valor) {
    if (valor > 0) {
      setValorInput(Math.min(valor, saldoRestante).toFixed(2));
    }
  }

  async function handleRegistrar() {
    setErro(null);
    setSucessoMsg(null);

    if (temItemEmPreparo) {
      setErro('Não é possível registrar o pagamento pois existem itens em preparo na cozinha. Aguarde a finalização.');
      return;
    }

    const valorNum = parseFloat(valorInput.replace(',', '.'));
    if (isNaN(valorNum) || valorNum <= 0) {
      setErro('Por favor, informe um valor válido de pagamento.');
      return;
    }

    if (valorNum > saldoRestante + 0.01) {
      setErro(`O valor informado (R$ ${valorNum.toFixed(2)}) ultrapassa o saldo restante (R$ ${saldoRestante.toFixed(2)}).`);
      return;
    }

    setProcessando(true);
    try {
      const res = await registrarPagamento(
        pedido.idPedido,
        formaPagamento,
        valorNum,
        true // confirma cancelamento de pendentes se for fechamento
      );

      setSucessoMsg(res.message);

      if (res.pagamento) {
        setPagamentosAnteriores((prev) => [...prev, res.pagamento]);
      }

      if (res.pedidoEncerrado || res.saldoRestante <= 0.01) {
        setTimeout(() => {
          onSucesso(res);
          onFechar();
        }, 1500);
      } else {
        setValorInput(res.saldoRestante.toFixed(2));
      }
    } catch (err) {
      setErro(err.message || 'Erro ao registrar pagamento.');
    } finally {
      setProcessando(false);
    }
  }

  if (!aberto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-[Poppins]">
      <div className="bg-[#FAF6F3] rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-gray-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
              <span className="p-2 bg-[#9C1C0E]/10 text-[#9C1C0E] rounded-xl">
                <MdPayment size={20} />
              </span>
              Pagamento & Fechamento — Mesa #{mesa?.numero}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              ID do Pedido: <span className="font-mono font-bold text-gray-700">{pedido?.idPedido?.slice(0, 8)}</span>
            </p>
          </div>
          <button
            onClick={onFechar}
            className="text-gray-400 hover:text-gray-700 p-1 rounded-xl hover:bg-gray-200/60 transition-colors cursor-pointer"
          >
            <MdClose size={22} />
          </button>
        </div>

        {/* Mensagens de feedback */}
        {erro && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl flex items-center gap-2">
            <MdWarning className="text-red-600 shrink-0 text-base" />
            <span>{erro}</span>
          </div>
        )}

        {sucessoMsg && (
          <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl flex items-center gap-2">
            <MdCheckCircle className="text-emerald-600 shrink-0 text-base" />
            <span>{sucessoMsg}</span>
          </div>
        )}

        {/* Alerta de Itens em Preparo */}
        {temItemEmPreparo && (
          <div className="mt-3 p-3 bg-amber-50 border border-amber-300 text-amber-800 text-xs rounded-2xl flex items-center gap-2">
            <MdWarning className="text-[#B78A10] shrink-0 text-lg" />
            <span>
              <strong>Atenção:</strong> Há itens sendo preparados na cozinha. O encerramento da mesa ficará liberado após a entrega dos itens.
            </span>
          </div>
        )}

        {/* Alerta de Itens Pendentes */}
        {!temItemEmPreparo && itensPendentes.length > 0 && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 text-blue-800 text-xs rounded-2xl flex items-center gap-2">
            <MdWarning className="text-blue-600 shrink-0 text-base" />
            <span>
              Existem {itensPendentes.length} {itensPendentes.length === 1 ? 'item pendente' : 'itens pendentes'}. Ao quitar a comanda, itens não preparados serão cancelados automaticamente.
            </span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto py-3 space-y-4 pr-1">
          {/* Card Resumo Financeiro */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-xs grid grid-cols-3 gap-3 text-center">
            <div>
              <span className="text-[11px] text-gray-500 font-medium">Total da Comanda</span>
              <p className="text-sm sm:text-base font-black text-gray-800">
                R$ {totalPedido.toFixed(2)}
              </p>
            </div>
            <div>
              <span className="text-[11px] text-emerald-600 font-medium">Já Quitado</span>
              <p className="text-sm sm:text-base font-black text-emerald-600">
                R$ {totalPago.toFixed(2)}
              </p>
            </div>
            <div>
              <span className="text-[11px] text-[#9C1C0E] font-medium">Saldo Restante</span>
              <p className="text-base sm:text-lg font-black text-[#9C1C0E]">
                R$ {saldoRestante.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Histórico de Pagamentos Parciais já registrados */}
          {pagamentosAnteriores.length > 0 && (
            <div className="bg-white rounded-2xl p-3.5 border border-gray-200 space-y-2">
              <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                <MdReceipt className="text-gray-500" /> Pagamentos Registrados Nesta Comanda:
              </span>
              <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                {pagamentosAnteriores.map((pg, idx) => (
                  <div
                    key={pg.idPagamento || idx}
                    className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded-xl"
                  >
                    <span className="font-semibold text-gray-700">
                      {pg.formaPagamento}
                    </span>
                    <span className="font-extrabold text-emerald-700">
                      R$ {Number(pg.valor || 0).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Calculadora de Divisão de Conta */}
          {saldoRestante > 0 && (
            <div className="bg-white rounded-2xl p-4 border border-amber-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                  <MdCalculate className="text-[#B78A10]" size={16} /> Calculadora de Divisão de Conta
                </span>
                <div className="flex rounded-xl bg-gray-100 p-0.5 text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setAbaDivisao('valor')}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      abaDivisao === 'valor' ? 'bg-[#9C1C0E] text-white shadow-xs' : 'text-gray-600'
                    }`}
                  >
                    Por Valor
                  </button>
                  <button
                    type="button"
                    onClick={() => setAbaDivisao('item')}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      abaDivisao === 'item' ? 'bg-[#9C1C0E] text-white shadow-xs' : 'text-gray-600'
                    }`}
                  >
                    Por Item
                  </button>
                </div>
              </div>

              {abaDivisao === 'valor' ? (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#FAF6F3] p-3 rounded-xl border border-gray-200">
                  <div className="flex items-center gap-2">
                    <MdPerson className="text-gray-500" />
                    <span className="text-xs text-gray-600">Dividir saldo em:</span>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={numeroPessoas}
                      onChange={(e) => setNumeroPessoas(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-14 px-2 py-1 bg-white border border-gray-300 rounded-lg text-xs font-bold text-center"
                    />
                    <span className="text-xs text-gray-600">pessoas</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-[#9C1C0E]">
                      R$ {valorPorPessoa.toFixed(2)} / pessoa
                    </span>
                    <button
                      type="button"
                      onClick={() => handleUsarValorCalculado(valorPorPessoa)}
                      className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold rounded-lg transition-all cursor-pointer"
                    >
                      Usar Valor
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-[11px] text-gray-500">
                    Selecione os itens para somar e preencher o valor do pagamento:
                  </p>
                  <div className="max-h-32 overflow-y-auto space-y-1.5 pr-1">
                    {itens
                      .filter((it) => it.status !== 'Cancelado')
                      .map((item) => (
                        <label
                          key={item.idItemPedido}
                          className="flex items-center justify-between text-xs p-2 bg-[#FAF6F3] rounded-xl hover:bg-gray-100 cursor-pointer border border-gray-200"
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={Boolean(itensSelecionados[item.idItemPedido])}
                              onChange={() => handleToggleItem(item.idItemPedido)}
                              className="accent-[#9C1C0E] w-4 h-4 cursor-pointer"
                            />
                            <span className="text-gray-800 font-medium">
                              {item.quantidade}x {item.nomeItem || 'Item'}
                            </span>
                          </div>
                          <span className="font-bold text-gray-700">
                            R$ {(Number(item.precoUnitario || 0) * (item.quantidade || 1)).toFixed(2)}
                          </span>
                        </label>
                      ))}
                  </div>
                  {subtotalItensSelecionados > 0 && (
                    <div className="flex items-center justify-between pt-1 text-xs">
                      <span className="text-gray-600 font-medium">
                        Subtotal selecionado:{' '}
                        <strong className="text-[#9C1C0E] font-bold">
                          R$ {subtotalItensSelecionados.toFixed(2)}
                        </strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUsarValorCalculado(subtotalItensSelecionados)}
                        className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold rounded-lg transition-all cursor-pointer"
                      >
                        Usar Valor Selecionado
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Formulário de Registro do Pagamento */}
          {saldoRestante > 0 ? (
            <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-xs space-y-3">
              <span className="text-xs font-bold text-gray-800">
                Registrar Pagamento Atual
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-gray-600 block mb-1">
                    Forma de Pagamento
                  </label>
                  <select
                    value={formaPagamento}
                    onChange={(e) => setFormaPagamento(e.target.value)}
                    disabled={processando}
                    className="w-full px-3 py-2 bg-[#FAF6F3] border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:border-[#9C1C0E]"
                  >
                    <option value="PIX">PIX</option>
                    <option value="Cartão de Crédito">Cartão de Crédito</option>
                    <option value="Cartão de Débito">Cartão de Débito</option>
                    <option value="Dinheiro">Dinheiro</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-gray-600">
                      Valor a Pagar (R$)
                    </label>
                    <button
                      type="button"
                      onClick={() => setValorInput(saldoRestante.toFixed(2))}
                      className="text-[10px] text-[#9C1C0E] font-bold hover:underline cursor-pointer"
                    >
                      Total restante (R$ {saldoRestante.toFixed(2)})
                    </button>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={saldoRestante}
                    value={valorInput}
                    onChange={(e) => setValorInput(e.target.value)}
                    disabled={processando}
                    className="w-full px-3 py-2 bg-[#FAF6F3] border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:border-[#9C1C0E]"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center text-emerald-800">
              <MdCheckCircle className="text-4xl text-emerald-600 mx-auto mb-2" />
              <h4 className="font-black text-base">Comanda Totalmente Quitada!</h4>
              <p className="text-xs text-emerald-700 mt-1">
                O saldo desta mesa foi zerado e ela já está pronta para liberação.
              </p>
            </div>
          )}
        </div>

        {/* Rodapé com Ação */}
        <div className="pt-4 border-t border-gray-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onFechar}
            className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs sm:text-sm font-bold rounded-2xl transition-all cursor-pointer"
          >
            Fechar
          </button>

          {saldoRestante > 0 && (
            <button
              type="button"
              onClick={handleRegistrar}
              disabled={processando || temItemEmPreparo}
              className="px-6 py-2.5 bg-[#9C1C0E] hover:bg-[#7a160b] text-white text-xs sm:text-sm font-bold rounded-2xl shadow-md transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              {processando && (
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              Registrar Pagamento
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
