import { useMemo, useState } from "react";
import {
  MdArrowDownward,
  MdArrowUpward,
  MdCalendarToday,
  MdChevronLeft,
  MdChevronRight,
  MdCreditCard,
  MdHistory,
  MdRefresh,
  MdSearch,
  MdSort,
} from "react-icons/md";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  Modal,
  PageHeader,
  Select,
  Spinner,
  StatusBadge,
} from "../../components/ui";

const PERIODOS = [
  { id: "todos", label: "Todos" },
  { id: "hoje", label: "Hoje" },
  { id: "7dias", label: "7 dias" },
  { id: "30dias", label: "30 dias" },
  { id: "custom", label: "Personalizado" },
];

export default function SecaoHistorico({
  historicoPedidos,
  carregando,
  onRecarregar,
}) {
  const [buscaHistorico, setBuscaHistorico] = useState("");
  const [filtroStatusHistorico, setFiltroStatusHistorico] = useState("Todos");
  const [filtroPeriodoHistorico, setFiltroPeriodoHistorico] =
    useState("todos");
  const [dataInicioHistorico, setDataInicioHistorico] = useState("");
  const [dataFimHistorico, setDataFimHistorico] = useState("");
  const [filtroPagamentoHistorico, setFiltroPagamentoHistorico] =
    useState("Todos");
  const [ordenacaoColuna, setOrdenacaoColuna] = useState("data");
  const [ordenacaoDirecao, setOrdenacaoDirecao] = useState("desc");
  const [itensPorPagina, setItensPorPagina] = useState(10);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [detalhesModal, setDetalhesModal] = useState(null);

  const historicoFiltrado = useMemo(() => {
    let lista = [...historicoPedidos];

    if (buscaHistorico.trim()) {
      const termo = buscaHistorico.toLowerCase().trim();
      lista = lista.filter((h) => {
        const bateMesa = String(h.numeroMesa).includes(termo);
        const bateId = String(h.idPedido).toLowerCase().includes(termo);
        return bateMesa || bateId;
      });
    }

    if (filtroStatusHistorico !== "Todos") {
      lista = lista.filter((h) => h.status === filtroStatusHistorico);
    }

    if (filtroPagamentoHistorico !== "Todos") {
      lista = lista.filter((h) => {
        const forma = h.pagamentos?.[0]?.formaPagamento || "";
        return forma
          .toLowerCase()
          .includes(filtroPagamentoHistorico.toLowerCase());
      });
    }

    const agora = new Date();
    if (filtroPeriodoHistorico === "hoje") {
      const inicioHoje = new Date(
        agora.getFullYear(),
        agora.getMonth(),
        agora.getDate()
      );
      lista = lista.filter(
        (h) => h.dataAbertura && new Date(h.dataAbertura) >= inicioHoje
      );
    } else if (filtroPeriodoHistorico === "7dias") {
      const seteDiasAtras = new Date(
        agora.getTime() - 7 * 24 * 60 * 60 * 1000
      );
      lista = lista.filter(
        (h) => h.dataAbertura && new Date(h.dataAbertura) >= seteDiasAtras
      );
    } else if (filtroPeriodoHistorico === "30dias") {
      const trintaDiasAtras = new Date(
        agora.getTime() - 30 * 24 * 60 * 60 * 1000
      );
      lista = lista.filter(
        (h) => h.dataAbertura && new Date(h.dataAbertura) >= trintaDiasAtras
      );
    } else if (filtroPeriodoHistorico === "custom") {
      if (dataInicioHistorico) {
        const dIni = new Date(dataInicioHistorico + "T00:00:00");
        lista = lista.filter(
          (h) => h.dataAbertura && new Date(h.dataAbertura) >= dIni
        );
      }
      if (dataFimHistorico) {
        const dFim = new Date(dataFimHistorico + "T23:59:59");
        lista = lista.filter(
          (h) => h.dataAbertura && new Date(h.dataAbertura) <= dFim
        );
      }
    }

    lista.sort((a, b) => {
      let valA;
      let valB;
      if (ordenacaoColuna === "data") {
        valA = new Date(a.dataAbertura || 0).getTime();
        valB = new Date(b.dataAbertura || 0).getTime();
      } else if (ordenacaoColuna === "total") {
        valA = Number(a.total) || 0;
        valB = Number(b.total) || 0;
      } else {
        valA = Number(a.numeroMesa) || 0;
        valB = Number(b.numeroMesa) || 0;
      }

      if (valA < valB) return ordenacaoDirecao === "asc" ? -1 : 1;
      if (valA > valB) return ordenacaoDirecao === "asc" ? 1 : -1;
      return 0;
    });

    return lista;
  }, [
    historicoPedidos,
    buscaHistorico,
    filtroStatusHistorico,
    filtroPagamentoHistorico,
    filtroPeriodoHistorico,
    dataInicioHistorico,
    dataFimHistorico,
    ordenacaoColuna,
    ordenacaoDirecao,
  ]);

  const totalItens = historicoFiltrado.length;
  const totalPaginas =
    itensPorPagina === "Todos"
      ? 1
      : Math.ceil(totalItens / (Number(itensPorPagina) || 10)) || 1;

  const paginaSegura = Math.min(paginaAtual, totalPaginas);

  const historicoPaginado = useMemo(() => {
    if (itensPorPagina === "Todos") return historicoFiltrado;
    const qtd = Number(itensPorPagina) || 10;
    const inicio = (paginaSegura - 1) * qtd;
    return historicoFiltrado.slice(inicio, inicio + qtd);
  }, [historicoFiltrado, itensPorPagina, paginaSegura]);

  function alternarOrdenacao(coluna) {
    if (ordenacaoColuna === coluna) {
      setOrdenacaoDirecao((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setOrdenacaoColuna(coluna);
      setOrdenacaoDirecao(coluna === "mesa" ? "asc" : "desc");
    }
  }

  const pedidosFechados = historicoFiltrado.filter(
    (h) => h.status === "Fechado"
  );
  const pedidosCancelados = historicoFiltrado.filter(
    (h) => h.status === "Cancelado"
  );
  const totalFaturado = pedidosFechados.reduce(
    (acc, h) => acc + (Number(h.total) || 0),
    0
  );
  const ticketMedio =
    pedidosFechados.length > 0 ? totalFaturado / pedidosFechados.length : 0;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Histórico de Vendas & Pedidos"
        icon={MdHistory}
        actions={
          <Button
            variant="secondary"
            size="sm"
            icon={MdRefresh}
            onClick={onRecarregar}
          >
            Atualizar
          </Button>
        }
      />

      {/* KPIs Financeiros */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <span className="text-xs text-gray-500 font-medium">
            Total Faturado
          </span>
          <div className="text-xl sm:text-2xl font-black text-brand mt-1">
            R$ {totalFaturado.toFixed(2)}
          </div>
          <span className="text-[11px] text-emerald-700 font-semibold mt-1 inline-block">
            {pedidosFechados.length} pedidos pagos
          </span>
        </Card>

        <Card>
          <span className="text-xs text-gray-500 font-medium">
            Ticket Médio
          </span>
          <div className="text-xl sm:text-2xl font-black text-gray-900 mt-1">
            R$ {ticketMedio.toFixed(2)}
          </div>
          <span className="text-[11px] text-gray-400 mt-1 inline-block">
            Por pedido finalizado
          </span>
        </Card>

        <Card>
          <span className="text-xs text-gray-500 font-medium">
            Pedidos Finalizados
          </span>
          <div className="text-xl sm:text-2xl font-black text-emerald-700 mt-1">
            {pedidosFechados.length}
          </div>
          <span className="text-[11px] text-gray-400 mt-1 inline-block">
            Fechados e pagos
          </span>
        </Card>

        <Card>
          <span className="text-xs text-gray-500 font-medium">
            Pedidos Cancelados
          </span>
          <div className="text-xl sm:text-2xl font-black text-red-600 mt-1">
            {pedidosCancelados.length}
          </div>
          <span className="text-[11px] text-gray-400 mt-1 inline-block">
            Sem faturamento
          </span>
        </Card>
      </div>

      {/* Filtros */}
      <Card padding="p-4" className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <MdSearch
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              size={19}
            />
            <Input
              type="text"
              placeholder="Buscar por mesa ou código..."
              value={buscaHistorico}
              onChange={(e) => {
                setBuscaHistorico(e.target.value);
                setPaginaAtual(1);
              }}
              className="pl-10"
            />
          </div>

          <Select
            value={filtroStatusHistorico}
            onChange={(e) => {
              setFiltroStatusHistorico(e.target.value);
              setPaginaAtual(1);
            }}
          >
            <option value="Todos">
              Todos os Status ({historicoPedidos.length})
            </option>
            <option value="Fechado">Fechados ({pedidosFechados.length})</option>
            <option value="Cancelado">
              Cancelados ({pedidosCancelados.length})
            </option>
          </Select>

          <Select
            value={filtroPagamentoHistorico}
            onChange={(e) => {
              setFiltroPagamentoHistorico(e.target.value);
              setPaginaAtual(1);
            }}
          >
            <option value="Todos">Todas as Formas de Pagamento</option>
            <option value="Cartão de Crédito">Cartão de Crédito</option>
            <option value="Cartão de Débito">Cartão de Débito</option>
            <option value="PIX">PIX</option>
            <option value="Dinheiro">Dinheiro</option>
          </Select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-medium text-gray-500 flex items-center gap-1 mr-1">
              <MdCalendarToday size={14} className="text-brand" /> Período:
            </span>
            {PERIODOS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setFiltroPeriodoHistorico(p.id);
                  setPaginaAtual(1);
                }}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                  filtroPeriodoHistorico === p.id
                    ? "bg-brand text-white"
                    : "bg-surface hover:bg-brand-soft text-gray-700 border border-gray-200"
                }`}
              >
                {p.label}
              </button>
            ))}

            {filtroPeriodoHistorico === "custom" && (
              <div className="flex items-center gap-1.5 ml-1">
                <Input
                  type="date"
                  value={dataInicioHistorico}
                  onChange={(e) => {
                    setDataInicioHistorico(e.target.value);
                    setPaginaAtual(1);
                  }}
                  className="py-1 px-2 text-xs"
                />
                <span className="text-xs text-gray-400">até</span>
                <Input
                  type="date"
                  value={dataFimHistorico}
                  onChange={(e) => {
                    setDataFimHistorico(e.target.value);
                    setPaginaAtual(1);
                  }}
                  className="py-1 px-2 text-xs"
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Por página:</span>
            <Select
              value={itensPorPagina}
              onChange={(e) => {
                setItensPorPagina(
                  e.target.value === "Todos" ? "Todos" : Number(e.target.value)
                );
                setPaginaAtual(1);
              }}
              className="w-24 py-1 px-2 text-xs"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value="Todos">Todos</option>
            </Select>
          </div>
        </div>
      </Card>

      {/* Tabela */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-700">
            <thead className="bg-brand-soft/70 text-xs uppercase text-brand border-b border-gray-200/80 select-none">
              <tr>
                <th
                  onClick={() => alternarOrdenacao("data")}
                  className="px-5 py-3.5 font-semibold cursor-pointer hover:bg-brand-soft transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Data / Horário</span>
                    {ordenacaoColuna === "data" ? (
                      ordenacaoDirecao === "asc" ? (
                        <MdArrowUpward size={14} />
                      ) : (
                        <MdArrowDownward size={14} />
                      )
                    ) : (
                      <MdSort size={14} className="opacity-40" />
                    )}
                  </div>
                </th>
                <th className="px-5 py-3.5 font-semibold">ID Pedido</th>
                <th
                  onClick={() => alternarOrdenacao("mesa")}
                  className="px-5 py-3.5 font-semibold cursor-pointer hover:bg-brand-soft transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Mesa</span>
                    {ordenacaoColuna === "mesa" ? (
                      ordenacaoDirecao === "asc" ? (
                        <MdArrowUpward size={14} />
                      ) : (
                        <MdArrowDownward size={14} />
                      )
                    ) : (
                      <MdSort size={14} className="opacity-40" />
                    )}
                  </div>
                </th>
                <th className="px-5 py-3.5 font-semibold">Fechado por</th>
                <th className="px-5 py-3.5 font-semibold">Pagamento</th>
                <th
                  onClick={() => alternarOrdenacao("total")}
                  className="px-5 py-3.5 font-semibold cursor-pointer hover:bg-brand-soft transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Total</span>
                    {ordenacaoColuna === "total" ? (
                      ordenacaoDirecao === "asc" ? (
                        <MdArrowUpward size={14} />
                      ) : (
                        <MdArrowDownward size={14} />
                      )
                    ) : (
                      <MdSort size={14} className="opacity-40" />
                    )}
                  </div>
                </th>
                <th className="px-5 py-3.5 font-semibold">Status</th>
                <th className="px-5 py-3.5 font-semibold text-right">
                  Detalhes
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {carregando ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <Spinner
                      size="lg"
                      label="Carregando histórico de pedidos..."
                    />
                  </td>
                </tr>
              ) : historicoPaginado.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <EmptyState
                      icon={MdHistory}
                      title="Nenhum pedido encontrado"
                      description="Ajuste o período ou os filtros de status e pagamento."
                    />
                  </td>
                </tr>
              ) : (
                historicoPaginado.map((h) => {
                  const formaPag =
                    h.pagamentos?.[0]?.formaPagamento || "Não informado";
                  return (
                    <tr
                      key={h.idPedido}
                      className="hover:bg-surface/60 transition-colors"
                    >
                      <td className="px-5 py-3.5 text-xs text-gray-600">
                        <div className="font-semibold text-gray-900">
                          {h.dataAbertura
                            ? new Date(h.dataAbertura).toLocaleDateString(
                                "pt-BR"
                              )
                            : "--"}
                        </div>
                        <div className="text-[11px] text-gray-400">
                          {h.dataAbertura
                            ? new Date(h.dataAbertura).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "--:--"}
                          {h.dataFechamento
                            ? ` → ${new Date(
                                h.dataFechamento
                              ).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}`
                            : ""}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-mono font-bold text-gray-800 text-xs">
                        #{h.idPedido ? h.idPedido.slice(0, 8) : "--"}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-gray-900">
                        Mesa #{h.numeroMesa || "--"}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-gray-700">
                        <span className="font-semibold text-gray-900 block">
                          {h.nomeUsuarioFechamento ||
                            h.nomeGarcom ||
                            "Atendimento"}
                        </span>
                        <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-md font-medium">
                          {h.funcaoUsuarioFechamento === "Garcom"
                            ? "Garçom"
                            : h.funcaoUsuarioFechamento || "Equipe"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs">
                        <Badge tone="neutral" icon={MdCreditCard}>
                          {formaPag}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 font-bold text-gray-900 text-xs">
                        R$ {Number(h.total || 0).toFixed(2)}
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={h.status} />
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Button
                          variant="secondary"
                          size="xs"
                          onClick={() => setDetalhesModal(h)}
                        >
                          Ver Detalhes
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {itensPorPagina !== "Todos" && totalPaginas > 1 && (
          <div className="px-5 py-3.5 bg-surface/60 border-t border-gray-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600">
            <div>
              Exibindo{" "}
              <span className="font-semibold text-gray-900">
                {Math.min(
                  (paginaSegura - 1) * Number(itensPorPagina) + 1,
                  totalItens
                )}
              </span>{" "}
              a{" "}
              <span className="font-semibold text-gray-900">
                {Math.min(paginaSegura * Number(itensPorPagina), totalItens)}
              </span>{" "}
              de <span className="font-semibold text-gray-900">{totalItens}</span>{" "}
              pedidos
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))}
                disabled={paginaSegura === 1}
                className="p-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                title="Página Anterior"
              >
                <MdChevronLeft size={18} />
              </button>

              {Array.from({ length: totalPaginas }, (_, i) => i + 1)
                .filter(
                  (p) =>
                    p === 1 ||
                    p === totalPaginas ||
                    Math.abs(p - paginaSegura) <= 1
                )
                .map((p, idx, arr) => {
                  const showEllipsis = idx > 0 && p - arr[idx - 1] > 1;
                  return (
                    <div key={p} className="flex items-center">
                      {showEllipsis && (
                        <span className="px-1 text-gray-400">...</span>
                      )}
                      <button
                        type="button"
                        onClick={() => setPaginaAtual(p)}
                        className={`w-7 h-7 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                          paginaSegura === p
                            ? "bg-brand text-white"
                            : "bg-white border border-gray-200 hover:bg-gray-100 text-gray-700"
                        }`}
                      >
                        {p}
                      </button>
                    </div>
                  );
                })}

              <button
                type="button"
                onClick={() =>
                  setPaginaAtual((p) => Math.min(totalPaginas, p + 1))
                }
                disabled={paginaSegura === totalPaginas}
                className="p-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                title="Próxima Página"
              >
                <MdChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Detalhes do Histórico */}
      {detalhesModal && (
        <Modal
          open
          onClose={() => setDetalhesModal(null)}
          title={`Pedido #${detalhesModal.idPedido?.slice(0, 8) || ""}${
            detalhesModal.numeroMesa
              ? ` — Mesa #${detalhesModal.numeroMesa}`
              : ""
          }`}
          subtitle={`Status: ${detalhesModal.status}`}
          icon={MdHistory}
          size="lg"
          footer={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setDetalhesModal(null)}
            >
              Fechar
            </Button>
          }
        >
          <div className="space-y-4">
            <div className="bg-brand-soft/60 p-3.5 rounded-2xl text-xs text-gray-700 flex flex-wrap justify-between gap-2">
              <span>
                Abertura:{" "}
                <strong>
                  {detalhesModal.dataAbertura
                    ? new Date(detalhesModal.dataAbertura).toLocaleString(
                        "pt-BR"
                      )
                    : "--"}
                </strong>
              </span>
              <span>
                Fechamento:{" "}
                <strong>
                  {detalhesModal.dataFechamento
                    ? new Date(detalhesModal.dataFechamento).toLocaleString(
                        "pt-BR"
                      )
                    : "--"}
                </strong>
              </span>
              <span>
                Fechado por:{" "}
                <strong className="text-brand">
                  {detalhesModal.nomeUsuarioFechamento ||
                    detalhesModal.nomeGarcom ||
                    "Atendimento"}{" "}
                  (
                  {detalhesModal.funcaoUsuarioFechamento === "Garcom"
                    ? "Garçom"
                    : detalhesModal.funcaoUsuarioFechamento || "Equipe"}
                  )
                </strong>
              </span>
            </div>

            <div>
              <h4 className="text-xs font-bold text-gray-700 uppercase mb-2">
                Itens Consumidos:
              </h4>
              <div className="max-h-52 overflow-y-auto divide-y divide-gray-100 border border-gray-200/80 rounded-2xl p-2.5">
                {detalhesModal.itens?.map((it, idx) => (
                  <div
                    key={idx}
                    className="py-2 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-semibold text-gray-900">
                        {it.quantidade}x {it.nome}
                      </span>
                      {it.observacao && (
                        <p className="text-[11px] text-gray-400 italic">
                          Obs: {it.observacao}
                        </p>
                      )}
                    </div>
                    <span className="font-bold text-gray-800">
                      R${" "}
                      {(
                        (Number(it.precoUnitario) || 0) *
                        (it.quantidade || 1)
                      ).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {detalhesModal.pagamentos &&
              detalhesModal.pagamentos.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-gray-700 uppercase mb-2">
                    Pagamento Registrado:
                  </h4>
                  <div className="bg-surface rounded-2xl p-3 space-y-1.5 text-xs border border-gray-200/80">
                    {detalhesModal.pagamentos.map((pg, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center"
                      >
                        <span className="flex items-center gap-1.5 font-semibold text-gray-800">
                          <MdCreditCard className="text-brand" size={16} />
                          {pg.formaPagamento}
                        </span>
                        <span className="font-bold text-gray-900">
                          R$ {Number(pg.valor || 0).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
              <span className="text-sm font-bold text-gray-700">
                Total do Pedido:
              </span>
              <span className="text-xl font-black text-brand">
                R$ {Number(detalhesModal.total || 0).toFixed(2)}
              </span>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
