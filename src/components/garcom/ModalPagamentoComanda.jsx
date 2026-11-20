import { useEffect, useMemo, useState } from "react";
import {
  MdCalculate,
  MdCheckCircle,
  MdPayment,
  MdPerson,
  MdReceipt,
  MdWarning,
} from "react-icons/md";
import { obterPedido, registrarPagamento } from "../../services/pedidoService";
import { Button, Field, Input, Modal, Select } from "../ui";

export default function ModalPagamentoComanda({
  aberto,
  mesa,
  pedido,
  itens = [],
  onFechar,
  onSucesso,
}) {
  const [pagamentosAnteriores, setPagamentosAnteriores] = useState([]);
  const [formaPagamento, setFormaPagamento] = useState("PIX");
  const [valorInput, setValorInput] = useState("");
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState(null);
  const [sucessoMsg, setSucessoMsg] = useState(null);

  const [abaDivisao, setAbaDivisao] = useState("valor");
  const [numeroPessoas, setNumeroPessoas] = useState(2);
  const [itensSelecionados, setItensSelecionados] = useState({});

  useEffect(() => {
    if (!aberto || !pedido?.idPedido) return;
    let ativo = true;
    async function carregarDetalhes() {
      try {
        const dados = await obterPedido(pedido.idPedido);
        if (ativo && dados?.pagamentos) {
          setPagamentosAnteriores(dados.pagamentos);
        }
      } catch {
        // Silencia erro opcional de pagamentos
      }
    }
    carregarDetalhes();
    return () => {
      ativo = false;
    };
  }, [aberto, pedido?.idPedido]);

  const temItemEmPreparo = useMemo(
    () => itens.some((it) => it.status === "Em preparo"),
    [itens]
  );

  const itensPendentes = useMemo(
    () => itens.filter((it) => it.status === "Pendente"),
    [itens]
  );

  const itensConsumidos = useMemo(
    () =>
      itens.filter((it) => it.status === "Entregue" || it.status === "Pronto"),
    [itens]
  );

  const nenhumItemConsumido = itensConsumidos.length === 0;

  const totalPedido = useMemo(() => {
    if (nenhumItemConsumido) return 0;
    return itensConsumidos.reduce(
      (acc, it) => acc + (Number(it.precoUnitario) || 0) * (it.quantidade || 1),
      0
    );
  }, [itensConsumidos, nenhumItemConsumido]);

  const totalPago = useMemo(
    () =>
      pagamentosAnteriores.reduce(
        (acc, p) => acc + (Number(p.valor) || 0),
        0
      ),
    [pagamentosAnteriores]
  );

  const saldoRestante = useMemo(
    () => Math.max(0, Number((totalPedido - totalPago).toFixed(2))),
    [totalPedido, totalPago]
  );

  const [prevSaldo, setPrevSaldo] = useState(saldoRestante);
  if (saldoRestante !== prevSaldo) {
    setPrevSaldo(saldoRestante);
    if (saldoRestante > 0) {
      setValorInput(saldoRestante.toFixed(2));
    }
  }

  const valorPorPessoa = useMemo(() => {
    if (numeroPessoas <= 0) return 0;
    return Number((saldoRestante / numeroPessoas).toFixed(2));
  }, [saldoRestante, numeroPessoas]);

  const subtotalItensSelecionados = useMemo(
    () =>
      itensConsumidos
        .filter((it) => itensSelecionados[it.idItemPedido])
        .reduce(
          (acc, it) =>
            acc + (Number(it.precoUnitario) || 0) * (it.quantidade || 1),
          0
        ),
    [itensConsumidos, itensSelecionados]
  );

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

  async function handleCancelarELiberarMesa() {
    setErro(null);
    setSucessoMsg(null);

    if (temItemEmPreparo) {
      setErro(
        "Não é possível fechar a conta pois existem itens em preparo na cozinha."
      );
      return;
    }

    setProcessando(true);
    try {
      const res = await registrarPagamento(
        pedido.idPedido,
        "DINHEIRO",
        0,
        true
      );
      setSucessoMsg(
        res.message || "Mesa liberada e pedido encerrado sem cobrança."
      );
      setTimeout(() => {
        onSucesso(res);
        onFechar();
      }, 1200);
    } catch (err) {
      setErro(err.message || "Erro ao cancelar itens e liberar mesa.");
    } finally {
      setProcessando(false);
    }
  }

  async function handleRegistrar() {
    setErro(null);
    setSucessoMsg(null);

    if (temItemEmPreparo) {
      setErro(
        "Não é possível registrar o pagamento pois existem itens em preparo na cozinha. Aguarde a finalização."
      );
      return;
    }

    const valorNum = parseFloat(String(valorInput).replace(",", "."));
    if (isNaN(valorNum) || valorNum <= 0) {
      setErro("Por favor, informe um valor válido de pagamento.");
      return;
    }

    if (valorNum > saldoRestante + 0.01) {
      setErro(
        `O valor informado (R$ ${valorNum.toFixed(
          2
        )}) ultrapassa o saldo restante (R$ ${saldoRestante.toFixed(2)}).`
      );
      return;
    }

    setProcessando(true);
    try {
      const res = await registrarPagamento(
        pedido.idPedido,
        formaPagamento,
        valorNum,
        true
      );

      setSucessoMsg(res.message);

      if (res.pagamento) {
        setPagamentosAnteriores((prev) => [...prev, res.pagamento]);
      }

      if (res.pedidoEncerrado || res.saldoRestante <= 0.01) {
        setTimeout(() => {
          onSucesso(res);
          onFechar();
        }, 1200);
      } else {
        setValorInput(res.saldoRestante.toFixed(2));
      }
    } catch (err) {
      setErro(err.message || "Erro ao registrar pagamento.");
    } finally {
      setProcessando(false);
    }
  }

  return (
    <Modal
      open={Boolean(aberto)}
      onClose={onFechar}
      title={`Pagamento & Fechamento — Mesa #${mesa?.numero || ""}`}
      subtitle={
        pedido?.idPedido
          ? `Pedido #${pedido.idPedido.slice(0, 8)}`
          : undefined
      }
      icon={MdPayment}
      size="2xl"
      footer={
        <div className="w-full flex items-center justify-between gap-3">
          <Button variant="secondary" size="sm" onClick={onFechar}>
            Fechar
          </Button>

          {!nenhumItemConsumido && saldoRestante > 0 && (
            <Button
              size="sm"
              onClick={handleRegistrar}
              loading={processando}
              disabled={temItemEmPreparo}
            >
              Registrar Pagamento
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-4">
        {erro && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
            <MdWarning className="text-red-600 shrink-0 text-base" />
            <span>{erro}</span>
          </div>
        )}

        {sucessoMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
            <MdCheckCircle className="text-emerald-600 shrink-0 text-base" />
            <span>{sucessoMsg}</span>
          </div>
        )}

        {temItemEmPreparo && (
          <div className="p-3 bg-amber-50 border border-amber-300 text-amber-800 text-xs rounded-xl flex items-center gap-2">
            <MdWarning className="text-gold shrink-0 text-lg" />
            <span>
              <strong>Atenção:</strong> Há itens sendo preparados na cozinha. O
              encerramento ficará liberado após a conclusão do preparo.
            </span>
          </div>
        )}

        {nenhumItemConsumido ? (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center text-amber-900 space-y-3">
            <MdWarning className="text-4xl text-gold mx-auto" />
            <h4 className="font-bold text-base">Nenhum Item Consumido</h4>
            <p className="text-xs text-amber-800 leading-relaxed max-w-md mx-auto">
              Nenhum item foi consumido ou entregue nesta mesa. Ao confirmar, os
              itens pendentes serão cancelados e a mesa será liberada sem
              cobrança.
            </p>
            <Button
              onClick={handleCancelarELiberarMesa}
              loading={processando}
              disabled={temItemEmPreparo}
            >
              Liberar Mesa & Cancelar Itens
            </Button>
          </div>
        ) : (
          <>
            {!temItemEmPreparo && itensPendentes.length > 0 && (
              <div className="p-3 bg-sky-50 border border-sky-200 text-sky-800 text-xs rounded-xl flex items-center gap-2">
                <MdWarning className="text-sky-600 shrink-0 text-base" />
                <span>
                  Existem {itensPendentes.length}{" "}
                  {itensPendentes.length === 1
                    ? "item pendente"
                    : "itens pendentes"}
                  . O fechamento cobrará apenas os itens consumidos/prontos e os
                  pendentes serão cancelados.
                </span>
              </div>
            )}

            <div className="bg-surface rounded-2xl p-4 border border-gray-200/80 grid grid-cols-3 gap-3 text-center">
              <div>
                <span className="text-[11px] text-gray-500 font-medium">
                  Total Consumido
                </span>
                <p className="text-sm sm:text-base font-extrabold text-gray-800">
                  R$ {totalPedido.toFixed(2)}
                </p>
              </div>
              <div>
                <span className="text-[11px] text-emerald-700 font-medium">
                  Já Quitado
                </span>
                <p className="text-sm sm:text-base font-extrabold text-emerald-700">
                  R$ {totalPago.toFixed(2)}
                </p>
              </div>
              <div>
                <span className="text-[11px] text-brand font-medium">
                  Saldo Restante
                </span>
                <p className="text-base sm:text-lg font-black text-brand">
                  R$ {saldoRestante.toFixed(2)}
                </p>
              </div>
            </div>

            {pagamentosAnteriores.length > 0 && (
              <div className="bg-white rounded-2xl p-3.5 border border-gray-200/80 space-y-2">
                <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <MdReceipt className="text-gray-500" /> Pagamentos Registrados
                </span>
                <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                  {pagamentosAnteriores.map((pg, idx) => (
                    <div
                      key={pg.idPagamento || idx}
                      className="flex items-center justify-between text-xs bg-surface p-2 rounded-xl"
                    >
                      <span className="font-semibold text-gray-700">
                        {pg.formaPagamento}
                      </span>
                      <span className="font-bold text-emerald-700">
                        R$ {Number(pg.valor || 0).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {saldoRestante > 0 && (
              <div className="bg-white rounded-2xl p-4 border border-gray-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                    <MdCalculate className="text-brand" size={18} /> Divisão de
                    Conta
                  </span>
                  <div className="flex bg-surface p-0.5 rounded-xl text-xs font-semibold border border-gray-200/80">
                    <button
                      type="button"
                      onClick={() => setAbaDivisao("valor")}
                      className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                        abaDivisao === "valor"
                          ? "bg-brand text-white"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      Por Valor
                    </button>
                    <button
                      type="button"
                      onClick={() => setAbaDivisao("item")}
                      className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                        abaDivisao === "item"
                          ? "bg-brand text-white"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      Por Item
                    </button>
                  </div>
                </div>

                {abaDivisao === "valor" ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600 font-medium flex items-center gap-1">
                        <MdPerson className="text-gray-400" /> Dividir entre
                        quantas pessoas?
                      </span>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="1"
                          max="50"
                          value={numeroPessoas}
                          onChange={(e) =>
                            setNumeroPessoas(
                              Math.max(1, parseInt(e.target.value, 10) || 1)
                            )
                          }
                          className="w-16 py-1 px-2 text-center text-xs font-bold"
                        />
                        <span className="text-gray-500">pessoas</span>
                      </div>
                    </div>

                    <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="text-[11px] text-amber-800 font-medium block">
                          Valor sugerido por pessoa:
                        </span>
                        <strong className="text-sm sm:text-base text-amber-900 font-black">
                          R$ {valorPorPessoa.toFixed(2)}
                        </strong>
                      </div>
                      <Button
                        variant="gold"
                        size="xs"
                        onClick={() => handleUsarValorCalculado(valorPorPessoa)}
                      >
                        Usar Valor
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <span className="text-[11px] text-gray-500 block">
                      Selecione os itens pagos por este cliente:
                    </span>
                    <div className="max-h-36 overflow-y-auto space-y-1 pr-1 border border-gray-100 rounded-xl p-2 bg-surface">
                      {itensConsumidos.map((it) => (
                        <label
                          key={it.idItemPedido}
                          className="flex items-center justify-between p-2 rounded-lg bg-white border border-gray-200 text-xs cursor-pointer hover:bg-brand-soft/30"
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={Boolean(
                                itensSelecionados[it.idItemPedido]
                              )}
                              onChange={() => handleToggleItem(it.idItemPedido)}
                              className="accent-brand"
                            />
                            <span className="font-medium text-gray-800">
                              {it.quantidade}x {it.nomeItem || "Item"}
                            </span>
                          </div>
                          <span className="font-bold text-gray-700">
                            R${" "}
                            {(
                              Number(it.precoUnitario || 0) *
                              (it.quantidade || 1)
                            ).toFixed(2)}
                          </span>
                        </label>
                      ))}
                    </div>
                    {subtotalItensSelecionados > 0 && (
                      <div className="flex items-center justify-between pt-1 text-xs">
                        <span className="text-gray-600 font-medium">
                          Subtotal selecionado:{" "}
                          <strong className="text-brand font-bold">
                            R$ {subtotalItensSelecionados.toFixed(2)}
                          </strong>
                        </span>
                        <Button
                          variant="gold"
                          size="xs"
                          onClick={() =>
                            handleUsarValorCalculado(subtotalItensSelecionados)
                          }
                        >
                          Usar Valor Selecionado
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {saldoRestante > 0 ? (
              <div className="bg-white rounded-2xl p-4 border border-gray-200/80 space-y-3">
                <span className="text-xs font-bold text-gray-800 block">
                  Registrar Pagamento Atual
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Forma de Pagamento">
                    <Select
                      value={formaPagamento}
                      onChange={(e) => setFormaPagamento(e.target.value)}
                      disabled={processando}
                    >
                      <option value="PIX">PIX</option>
                      <option value="Cartão de Crédito">
                        Cartão de Crédito
                      </option>
                      <option value="Cartão de Débito">Cartão de Débito</option>
                      <option value="Dinheiro">Dinheiro</option>
                    </Select>
                  </Field>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-gray-700">
                        Valor a Pagar (R$)
                      </label>
                      <button
                        type="button"
                        onClick={() => setValorInput(saldoRestante.toFixed(2))}
                        className="text-[11px] text-brand font-bold hover:underline cursor-pointer"
                      >
                        Total (R$ {saldoRestante.toFixed(2)})
                      </button>
                    </div>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      max={saldoRestante}
                      value={valorInput}
                      onChange={(e) => setValorInput(e.target.value)}
                      disabled={processando}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center text-emerald-800">
                <MdCheckCircle className="text-4xl text-emerald-600 mx-auto mb-2" />
                <h4 className="font-bold text-base">
                  Comanda Totalmente Quitada!
                </h4>
                <p className="text-xs text-emerald-700 mt-1">
                  O saldo desta mesa foi zerado e ela já está pronta para
                  liberação.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
