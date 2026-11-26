import { useMemo, useState } from "react";
import {
  MdAccessTime,
  MdCheckCircle,
  MdInfoOutline,
  MdLaunch,
  MdRefresh,
  MdSoupKitchen,
  MdTimeline,
  MdWarning,
} from "react-icons/md";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  PageHeader,
  Pills,
  Spinner,
  StatusBadge,
} from "../../components/ui";

export default function SecaoCozinha({
  filaCozinha,
  filaKds,
  carregando,
  onRecarregar,
}) {
  const fila = useMemo(
    () => filaCozinha || filaKds || [],
    [filaCozinha, filaKds]
  );
  const [filtroStatusFila, setFiltroStatusFila] = useState("Todos");

  const opcoesStatus = useMemo(
    () => [
      { value: "Todos", label: "Todos", count: fila.length },
      {
        value: "Pendente",
        label: "Pendentes",
        count: fila.filter((i) => i.status === "Pendente").length,
      },
      {
        value: "Em preparo",
        label: "Em Preparo",
        count: fila.filter((i) => i.status === "Em preparo").length,
      },
      {
        value: "Pronto",
        label: "Prontos",
        count: fila.filter((i) => i.status === "Pronto").length,
      },
    ],
    [fila]
  );

  const filaFiltrada = useMemo(
    () =>
      fila.filter((item) => {
        if (filtroStatusFila !== "Todos" && item.status !== filtroStatusFila) {
          return false;
        }
        return true;
      }),
    [fila, filtroStatusFila]
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="Fila da Cozinha"
        icon={MdSoupKitchen}
        actions={
          <Button
            variant="secondary"
            size="sm"
            icon={MdRefresh}
            onClick={() => onRecarregar && onRecarregar({ silencioso: false })}
          >
            Atualizar
          </Button>
        }
      />

      <Pills
        items={opcoesStatus}
        value={filtroStatusFila}
        onChange={setFiltroStatusFila}
      />

      <div className="bg-brand-soft/60 border border-gold/25 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-700">
        <div className="flex items-center gap-2">
          <MdInfoOutline className="text-brand shrink-0" size={18} />
          <span>
            <strong>Visão Gerencial:</strong> Esta fila reflete a priorização
            automática dos pedidos em tempo real.
          </span>
        </div>
        <Badge tone="brand">Sincronização automática</Badge>
      </div>

      {carregando && fila.length === 0 ? (
        <Card className="py-14 flex justify-center">
          <Spinner size="lg" label="Carregando fila da cozinha..." />
        </Card>
      ) : filaFiltrada.length === 0 ? (
        <Card className="py-12">
          <EmptyState
            icon={MdCheckCircle}
            title="Cozinha sem pedidos pendentes!"
            description="Todos os pedidos estão em dia ou não há novos itens aguardando preparo."
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filaFiltrada.map((item) => (
            <Card
              key={item.idItemPedido}
              className={`flex flex-col justify-between ${
                item.status === "Em preparo"
                  ? "border-gold ring-1 ring-gold/30"
                  : item.status === "Pronto"
                  ? "border-emerald-300"
                  : ""
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <Badge tone="brand">Mesa #{item.numeroMesa || "--"}</Badge>
                  <StatusBadge status={item.status} />
                </div>

                <h4 className="text-base font-bold text-gray-900 leading-snug">
                  {item.quantidade}x {item.nomeItem || "Item"}
                </h4>
                <p className="text-xs text-gray-500 mb-2">
                  {item.categoria || "Geral"}
                </p>

                {item.observacao && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-xs text-amber-900 font-medium mb-3 flex items-start gap-1.5">
                    <MdWarning
                      size={15}
                      className="text-gold shrink-0 mt-0.5"
                    />
                    <span>Obs: {item.observacao}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <MdAccessTime size={14} />
                  {item.dataCriacao
                    ? new Date(item.dataCriacao).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "--:--"}
                </span>
                {item.idPedido && (
                  <button
                    type="button"
                    onClick={() =>
                      window.open(`/tracking/${item.idPedido}`, "_blank")
                    }
                    className="text-xs text-brand hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <MdTimeline size={14} />
                    <span>Tracking</span>
                    <MdLaunch size={12} />
                  </button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
