import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  MdAccessTime,
  MdCheckCircle,
  MdPlayArrow,
  MdRefresh,
  MdSoupKitchen,
  MdStar,
  MdWarning,
} from "react-icons/md";
import { useNavigate } from "react-router-dom";

import AppShell from "../components/layout/AppShell";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Pills,
  StatusBadge,
  useToast,
} from "../components/ui";
import { API_BASE } from "../config/api";
import { alterarStatusItem, obterFilaCozinha } from "../services/pedidoService";

function buildWsUrl() {
  const wsBase = API_BASE.replace(/^http/, "ws");
  return `${wsBase}/pedidos/ws`;
}

export default function TelaCozinha() {
  const navigate = useNavigate();
  const toast = useToast();
  const [fila, setFila] = useState([]);
  const [filtroStatus, setFiltroStatus] = useState("Todos");
  const [statusConexao, setStatusConexao] = useState("CONECTANDO");
  const [processandoItem, setProcessandoItem] = useState(null);

  const wsRef = useRef(null);
  const isMountedRef = useRef(true);
  const reconnectTimerRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const funcao = (localStorage.getItem("funcao") || "").toLowerCase();

    if (!token) {
      navigate("/login");
      return;
    }

    if (funcao !== "cozinheiro" && funcao !== "cozinha") {
      if (funcao === "garcom") navigate("/garcom");
      else if (funcao === "gerente") navigate("/gerente");
      else if (funcao === "adm") navigate("/administrativo");
      else navigate("/login");
    }
  }, [navigate]);

  const carregarFilaHttp = useCallback(async () => {
    try {
      const data = await obterFilaCozinha();
      if (data && Array.isArray(data.items)) {
        setFila(data.items);
      }
    } catch {
      // Silencia falha transitória de polling
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    function abrirSocket() {
      const token = localStorage.getItem("token");
      if (!token) return;

      if (wsRef.current) {
        wsRef.current.close();
      }

      try {
        const ws = new WebSocket(buildWsUrl());
        wsRef.current = ws;

        ws.onopen = () => {
          if (!isMountedRef.current) return;
          setStatusConexao("CONECTADO");
          ws.send(JSON.stringify({ type: "authenticate", token }));
        };

        ws.onmessage = (event) => {
          if (!isMountedRef.current) return;
          try {
            const payload = JSON.parse(event.data);

            if (payload.type === "queue.snapshot" && payload.data?.items) {
              setFila(payload.data.items);
            } else if (payload.type === "item.created" && payload.item) {
              setFila((prev) => {
                const existe = prev.some(
                  (i) => i.idItemPedido === payload.item.idItemPedido
                );
                if (existe) return prev;
                const novaFila = [...prev, payload.item];
                return novaFila.sort(
                  (a, b) => (b.pontuacao || 0) - (a.pontuacao || 0)
                );
              });
            } else if (payload.type === "item.status_changed" && payload.item) {
              setFila((prev) => {
                if (
                  payload.item.status === "Pronto" ||
                  payload.item.status === "Entregue" ||
                  payload.item.status === "Cancelado"
                ) {
                  return prev.filter(
                    (i) => i.idItemPedido !== payload.item.idItemPedido
                  );
                }
                return prev.map((i) =>
                  i.idItemPedido === payload.item.idItemPedido
                    ? { ...i, ...payload.item }
                    : i
                );
              });
            } else if (payload.type === "queue.updated") {
              carregarFilaHttp();
            }
          } catch {
            // Ignora payload malformado
          }
        };

        ws.onclose = () => {
          if (!isMountedRef.current) return;
          setStatusConexao("DESCONECTADO");
          reconnectTimerRef.current = setTimeout(() => {
            if (isMountedRef.current) abrirSocket();
          }, 3000);
        };

        ws.onerror = () => {
          if (!isMountedRef.current) return;
          setStatusConexao("ERRO");
        };
      } catch {
        setStatusConexao("ERRO");
      }
    }

    Promise.resolve().then(() => {
      if (isMountedRef.current) {
        carregarFilaHttp();
        abrirSocket();
      }
    });

    const intervalId = setInterval(() => {
      carregarFilaHttp();
    }, 15000);

    return () => {
      isMountedRef.current = false;
      clearInterval(intervalId);
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [carregarFilaHttp]);

  async function atualizarStatus(idItemPedido, novoStatus) {
    setProcessandoItem(idItemPedido);
    try {
      await alterarStatusItem(idItemPedido, novoStatus);
      if (novoStatus === "Pronto") {
        setFila((prev) => prev.filter((i) => i.idItemPedido !== idItemPedido));
        toast.success("Item marcado como pronto!");
      } else {
        setFila((prev) =>
          prev.map((i) =>
            i.idItemPedido === idItemPedido ? { ...i, status: novoStatus } : i
          )
        );
      }
    } catch (err) {
      toast.error(err.message || "Não foi possível atualizar o preparo.");
    } finally {
      setProcessandoItem(null);
    }
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    localStorage.removeItem("funcao");
    navigate("/login");
  }

  const opcoesFiltro = useMemo(
    () => [
      { value: "Todos", label: "Todos", count: fila.length },
      {
        value: "Pendentes",
        label: "Pendentes",
        count: fila.filter((i) => i.status === "Pendente").length,
      },
      {
        value: "Em preparo",
        label: "Em preparo",
        count: fila.filter((i) => i.status === "Em preparo").length,
      },
    ],
    [fila]
  );

  const itensFiltrados = useMemo(
    () =>
      fila.filter((item) => {
        if (filtroStatus === "Todos") return true;
        if (filtroStatus === "Pendentes") return item.status === "Pendente";
        if (filtroStatus === "Em preparo") return item.status === "Em preparo";
        return true;
      }),
    [fila, filtroStatus]
  );

  return (
    <AppShell
      modulo="Fila da Cozinha"
      onLogout={handleLogout}
      headerActions={
        <>
          <div className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-white border border-gray-200 shadow-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                statusConexao === "CONECTADO" ? "bg-emerald-500" : "bg-gold"
              }`}
            />
            <span className="text-gray-600 hidden xs:inline">
              {statusConexao === "CONECTADO" ? "Tempo Real" : "Reconectando"}
            </span>
          </div>

          <Button
            variant="secondary"
            size="sm"
            icon={MdRefresh}
            onClick={carregarFilaHttp}
          >
            <span className="hidden sm:inline">Atualizar</span>
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Pills
            items={opcoesFiltro}
            value={filtroStatus}
            onChange={setFiltroStatus}
          />
          <div className="text-xs sm:text-sm text-gray-600 font-medium">
            Em produção:{" "}
            <strong className="text-brand font-extrabold">
              {fila.length} {fila.length === 1 ? "prato" : "pratos"}
            </strong>
          </div>
        </div>

        {itensFiltrados.length === 0 ? (
          <Card className="py-12">
            <EmptyState
              icon={MdSoupKitchen}
              title="Nenhum item aguardando preparo"
              description="Novos pedidos realizados no cardápio aparecerão aqui instantaneamente."
            />
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {itensFiltrados.map((item) => {
              const isEmPreparo = item.status === "Em preparo";
              const minutosEspera = Math.floor(
                Number(item.tempoEsperaMinutos) || 0
              );
              const prioridadeAlta =
                minutosEspera >= 15 || (item.pontuacao || 0) >= 30;

              return (
                <Card
                  key={item.idItemPedido}
                  padding="p-0"
                  className={`flex flex-col justify-between overflow-hidden ${
                    isEmPreparo
                      ? "border-gold ring-1 ring-gold/40 bg-amber-50/30"
                      : prioridadeAlta
                      ? "border-red-400 ring-1 ring-red-400/40 bg-red-50/40"
                      : ""
                  }`}
                >
                  <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                    <div>
                      <span className="text-sm uppercase font-black text-gray-900 tracking-wide">
                        {item.numeroMesa
                          ? `Mesa #${item.numeroMesa}`
                          : "Balcão / Mesa"}
                      </span>
                      <div className="text-xs text-gray-500 font-medium flex items-center gap-1 mt-0.5">
                        <MdAccessTime size={14} />
                        <span>
                          Espera:{" "}
                          <strong
                            className={
                              prioridadeAlta
                                ? "text-red-600 font-bold"
                                : "text-gray-700"
                            }
                          >
                            {minutosEspera} min
                          </strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <StatusBadge status={item.status} />
                      {item.categoria && (
                        <Badge tone="neutral">{item.categoria}</Badge>
                      )}
                    </div>
                  </div>

                  <div className="p-4 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-black text-lg sm:text-xl text-gray-900 leading-snug">
                        {item.quantidade}x {item.nomeItem || "Prato"}
                      </h3>
                      {item.pontuacao !== undefined && (
                        <Badge
                          tone="gold"
                          icon={MdStar}
                          className="shrink-0"
                        >
                          {Number(item.pontuacao).toFixed(1)}
                        </Badge>
                      )}
                    </div>

                    {item.observacao && (
                      <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-xs sm:text-sm font-semibold flex items-start gap-1.5">
                        <MdWarning
                          size={16}
                          className="text-gold shrink-0 mt-0.5"
                        />
                        <span>Obs: {item.observacao}</span>
                      </div>
                    )}
                  </div>

                  <div className="p-4 border-t border-gray-100 bg-surface/60 flex gap-2">
                    {!isEmPreparo ? (
                      <Button
                        variant="gold"
                        size="lg"
                        icon={MdPlayArrow}
                        loading={processandoItem === item.idItemPedido}
                        onClick={() =>
                          atualizarStatus(item.idItemPedido, "Em preparo")
                        }
                        className="w-full"
                      >
                        Iniciar Preparo
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        size="lg"
                        icon={MdCheckCircle}
                        loading={processandoItem === item.idItemPedido}
                        onClick={() =>
                          atualizarStatus(item.idItemPedido, "Pronto")
                        }
                        className="w-full !bg-emerald-600 hover:!bg-emerald-700"
                      >
                        Concluir (Pronto)
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
