import { useEffect, useState } from "react";
import {
  MdAccessTime,
  MdFormatListNumbered,
  MdNotificationsActive,
  MdRestaurantMenu,
  MdTableBar,
} from "react-icons/md";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import logo from "../../assets/fast cooking logo.png";
import PublicShell from "../../components/layout/PublicShell";
import {
  Button,
  Card,
  Field,
  Input,
  PageLoader,
  useToast,
} from "../../components/ui";
import {
  chamarGarcom,
  obterPedidoAtivoMesa,
} from "../../services/pedidoService";
import ConnectionBanner from "./components/ConnectionBanner";
import OrderItemCard from "./components/OrderItemCard";
import OrderNotFound from "./components/OrderNotFound";
import OrderProgressBar from "./components/OrderProgressBar";
import OrderTrackingSkeleton from "./components/OrderTrackingSkeleton";
import { useOrderTrackingSocket } from "./hooks/useOrderTrackingSocket";

function formatTime(isoStr) {
  if (!isoStr) return "--:--";
  const d = new Date(isoStr);
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function getStorageMesa() {
  try {
    const raw = sessionStorage.getItem("fastcooking_mesa_cliente");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function OrderTracking() {
  const { orderId: paramId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const rawOrderId = paramId || searchParams.get("orderId");

  const [activeOrderId, setActiveOrderId] = useState(rawOrderId || null);
  const [buscandoMesa, setBuscandoMesa] = useState(false);
  const [inputBusca, setInputBusca] = useState("");
  const [erroMesa, setErroMesa] = useState("");
  const [chamandoGarcom, setChamandoGarcom] = useState(false);

  const [prevRawOrderId, setPrevRawOrderId] = useState(rawOrderId);
  if (rawOrderId !== prevRawOrderId) {
    setPrevRawOrderId(rawOrderId);
    if (rawOrderId) {
      setActiveOrderId(rawOrderId);
    }
  }

  const idMesaParam = searchParams.get("idMesa");

  useEffect(() => {
    if (rawOrderId || !idMesaParam) return;
    let ativo = true;

    Promise.resolve().then(() => {
      if (!ativo) return;
      setBuscandoMesa(true);
      setErroMesa("");
      obterPedidoAtivoMesa(idMesaParam)
        .then((dados) => {
          if (!ativo) return;
          if (dados && dados.idPedido) {
            setActiveOrderId(dados.idPedido);
          } else {
            setErroMesa(
              "Nenhum pedido ativo em preparo encontrado para esta mesa no momento."
            );
          }
        })
        .catch(() => {
          if (ativo) {
            setErroMesa(
              "Não foi possível localizar pedidos ativos para a mesa indicada."
            );
          }
        })
        .finally(() => {
          if (ativo) setBuscandoMesa(false);
        });
    });

    return () => {
      ativo = false;
    };
  }, [rawOrderId, idMesaParam]);

  const { order, connectionStatus, error, isLoading, reconnectAttempt } =
    useOrderTrackingSocket(activeOrderId);

  useEffect(() => {
    if (order?.idMesa || activeOrderId) {
      try {
        const statusUpper = String(order?.status || "").toUpperCase();
        const isFinalizado =
          statusUpper === "CANCELLED" ||
          statusUpper === "CANCELADO" ||
          statusUpper === "CLOSED" ||
          statusUpper === "FECHADO";

        const anterior = getStorageMesa() || {};
        sessionStorage.setItem(
          "fastcooking_mesa_cliente",
          JSON.stringify({
            ...anterior,
            ...(order?.idMesa ? { idMesa: order.idMesa } : {}),
            ...(order?.idRestaurante
              ? { idRestaurante: order.idRestaurante }
              : {}),
            ...(order?.tableNumber ? { numero: order.tableNumber } : {}),
            idPedidoAtivo: isFinalizado ? null : activeOrderId,
          })
        );
      } catch {
        // Ignora erro de storage
      }
    }
  }, [order, activeOrderId]);

  const storageMesa = getStorageMesa();
  const mesaIdResolved =
    order?.idMesa || searchParams.get("idMesa") || storageMesa?.idMesa;
  const idRestauranteResolved =
    order?.idRestaurante ||
    searchParams.get("idRestaurante") ||
    storageMesa?.idRestaurante;
  const numMesaResolved =
    order?.tableNumber || searchParams.get("mesa") || storageMesa?.numero;

  function handleVoltarAoCardapio() {
    const params = new URLSearchParams();
    if (mesaIdResolved) params.set("idMesa", mesaIdResolved);
    if (idRestauranteResolved)
      params.set("idRestaurante", idRestauranteResolved);
    if (numMesaResolved) params.set("mesa", numMesaResolved);
    const query = params.toString();
    navigate(query ? `/cardapio?${query}` : "/cardapio");
  }

  async function handleChamarGarcom() {
    if (!mesaIdResolved) {
      toast.warning("Identificação da mesa não disponível neste pedido.");
      return;
    }
    setChamandoGarcom(true);
    try {
      await chamarGarcom(mesaIdResolved);
      toast.success("Garçom chamado com sucesso! Aguarde em sua mesa.");
    } catch (err) {
      toast.error(`Erro ao chamar garçom: ${err.message}`);
    } finally {
      setChamandoGarcom(false);
    }
  }

  if (!activeOrderId) {
    if (buscandoMesa) {
      return <PageLoader label="Localizando pedido da mesa..." />;
    }

    return (
      <div className="min-h-screen bg-surface flex items-center justify-center px-4 py-12">
        <Card className="max-w-md w-full p-7 sm:p-8 text-center">
          <img
            src={logo}
            alt="Fast Cooking"
            className="h-12 mx-auto mb-4 object-contain"
          />
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1.5">
            Acompanhamento de Pedido
          </h1>
          <p className="text-gray-500 text-xs sm:text-sm mb-6">
            Acompanhe em tempo real o status de preparo dos itens na cozinha.
          </p>

          {erroMesa && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs p-3 rounded-xl mb-4 font-medium">
              {erroMesa}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (inputBusca.trim()) {
                navigate(`/tracking/${inputBusca.trim()}`);
              }
            }}
            className="space-y-4 text-left"
          >
            <Field label="Código do Pedido ou ID">
              <Input
                type="text"
                value={inputBusca}
                onChange={(e) => setInputBusca(e.target.value)}
                placeholder="Ex: 550e8400-e29b-41d4-a716-..."
              />
            </Field>

            <Button
              type="submit"
              disabled={!inputBusca.trim()}
              className="w-full"
            >
              Rastrear Pedido
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-gray-100 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => navigate("/cardapio")}
              className="text-xs text-brand hover:underline font-semibold cursor-pointer"
            >
              Ir para o Cardápio / Autoatendimento
            </button>
            <button
              type="button"
              onClick={() => navigate("/")}
              className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              Voltar à Página Inicial
            </button>
          </div>
        </Card>
      </div>
    );
  }

  if (isLoading && !error) {
    return (
      <>
        <ConnectionBanner
          connectionStatus={connectionStatus}
          reconnectAttempt={reconnectAttempt}
        />
        <OrderTrackingSkeleton />
      </>
    );
  }

  if (error && !order) {
    return (
      <>
        <ConnectionBanner
          connectionStatus={connectionStatus}
          reconnectAttempt={reconnectAttempt}
        />
        <OrderNotFound message={error} orderId={activeOrderId} />
      </>
    );
  }

  const items = order?.items || [];
  const totalItems = items.length;
  const readyOrDelivered = items.filter(
    (it) => it.status === "READY" || it.status === "DELIVERED"
  ).length;

  return (
    <PublicShell
      title={`Pedido #${String(order?.id || activeOrderId).slice(0, 8)}`}
      subtitle={
        order?.createdAt
          ? `Recebido às ${formatTime(order.createdAt)}`
          : "Acompanhamento em tempo real"
      }
      onBack={handleVoltarAoCardapio}
      backTitle="Voltar ao Cardápio"
      maxWidth="max-w-2xl"
      badge={
        order?.tableNumber || numMesaResolved ? (
          <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-bold text-gold bg-gold/15 px-2 py-0.5 rounded-md">
            <MdTableBar size={13} /> Mesa{" "}
            {order?.tableNumber || numMesaResolved}
          </span>
        ) : null
      }
      actions={
        mesaIdResolved ? (
          <Button
            variant="gold"
            size="sm"
            icon={MdNotificationsActive}
            loading={chamandoGarcom}
            onClick={handleChamarGarcom}
          >
            <span className="hidden sm:inline">Chamar Garçom</span>
            <span className="sm:hidden text-xs">Garçom</span>
          </Button>
        ) : null
      }
    >
      <ConnectionBanner
        connectionStatus={connectionStatus}
        reconnectAttempt={reconnectAttempt}
      />

      <div className="space-y-5">
        {/* Tempo Estimado */}
        <Card className="text-center" id="estimated-time">
          <div className="flex items-center justify-center gap-4">
            <div className="w-13 h-13 bg-brand-soft text-brand rounded-2xl flex items-center justify-center shrink-0">
              <MdAccessTime size={28} />
            </div>
            <div className="text-left">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Tempo estimado
              </p>
              <p className="text-2xl sm:text-3xl font-black text-brand leading-tight">
                {order?.estimatedMinutesMin ?? "–"}
                <span className="text-gray-400 mx-1">-</span>
                {order?.estimatedMinutesMax ?? "–"}
                <span className="text-base font-semibold text-gray-500 ml-1">
                  min
                </span>
              </p>
            </div>
          </div>

          {order?.queuePosition != null && (
            <p className="mt-3 text-xs sm:text-sm text-gray-500 inline-flex items-center gap-1.5">
              <MdFormatListNumbered className="text-gold" size={16} />
              <span>
                Posição na fila:{" "}
                <strong className="text-gray-900">
                  {order.queuePosition}º
                </strong>
              </span>
            </p>
          )}
        </Card>

        {/* Barra de Progresso */}
        <Card id="order-progress">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-5">
            Progresso do Pedido
          </h2>
          <OrderProgressBar status={order?.status || "PENDING"} />
        </Card>

        {/* Lista de Itens */}
        <Card id="order-items">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Itens do Pedido
            </h2>
            <span className="text-xs text-brand font-bold">
              {readyOrDelivered}/{totalItems} prontos
            </span>
          </div>

          {items.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">
              Nenhum item encontrado neste pedido.
            </p>
          ) : (
            <div className="space-y-2.5">
              {items.map((item) => (
                <OrderItemCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </Card>

        <div className="pt-2 text-center">
          <Button
            size="lg"
            icon={MdRestaurantMenu}
            onClick={handleVoltarAoCardapio}
            className="w-full sm:w-auto"
          >
            Fazer Mais Pedidos no Cardápio
          </Button>
        </div>

        <footer className="pt-4 text-center space-y-2">
          {order?.updatedAt && (
            <p className="text-xs text-gray-400">
              Última atualização: {formatTime(order.updatedAt)}
            </p>
          )}
          <div className="flex items-center justify-center gap-2">
            {connectionStatus === "CONNECTED" ? (
              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Atualização em tempo real
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs text-amber-700 font-medium">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                {connectionStatus === "RECONNECTING"
                  ? "Reconectando..."
                  : "Desconectado"}
              </span>
            )}
          </div>
        </footer>
      </div>
    </PublicShell>
  );
}
