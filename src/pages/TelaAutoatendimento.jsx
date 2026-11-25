import { useEffect, useMemo, useState } from "react";
import {
  MdAccessTime,
  MdAddCircleOutline,
  MdArrowForward,
  MdCheckCircle,
  MdDelete,
  MdHelpOutline,
  MdNotificationsActive,
  MdRefresh,
  MdRestaurantMenu,
  MdSend,
  MdShoppingBag,
  MdTableBar,
  MdTimeline,
} from "react-icons/md";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import CampoPesquisa from "../components/cardapio/CampoPesquisa";
import FiltroCategorias from "../components/cardapio/FiltroCategorias";
import GridProdutos from "../components/cardapio/GridProdutos";
import ModalDetalhesProduto from "../components/cardapio/ModalDetalhesProduto";
import PublicShell from "../components/layout/PublicShell";
import { Button, Modal, Spinner, useToast } from "../components/ui";
import { PRODUTOS_MOCK } from "../data/produtosMock";
import { listarItensCardapio } from "../services/cardapioService";
import {
  abrirMesa,
  adicionarItensAoPedido,
  chamarGarcom,
  criarPedido,
  listarMesas,
  obterPedidoAtivoMesa,
} from "../services/pedidoService";
import { obterRestaurantePublico } from "../services/restauranteService";

const MESA_STORAGE_KEY = "fastcooking_mesa_cliente";

function salvarSessaoMesa(dados) {
  try {
    if (!dados || !dados.idMesa) return;
    const anterior = recuperarSessaoMesa() || {};
    sessionStorage.setItem(
      MESA_STORAGE_KEY,
      JSON.stringify({ ...anterior, ...dados })
    );
  } catch {
    // Ignora falha de storage
  }
}

function recuperarSessaoMesa() {
  try {
    const raw = sessionStorage.getItem(MESA_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function isUuid(val) {
  return (
    typeof val === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      val.trim()
    )
  );
}

const PASSOS_INSTRUCOES = [
  {
    icon: MdRestaurantMenu,
    tone: "neutral",
    titulo: "1. Escolha seus itens",
    texto:
      "Navegue pelas categorias ou use a busca para ver fotos, preços e detalhes.",
  },
  {
    icon: MdAddCircleOutline,
    tone: "neutral",
    titulo: "2. Monte seu pedido",
    texto:
      "Personalize retirando ingredientes ou adicionando observações ao prato.",
  },
  {
    icon: MdSend,
    tone: "neutral",
    titulo: "3. Envie para a cozinha",
    texto:
      "Abra 'Meu Pedido', confira os itens e envie direto para a equipe de preparo.",
  },
  {
    icon: MdTimeline,
    tone: "neutral",
    titulo: "4. Acompanhe em tempo real",
    texto:
      "Em 'Acompanhar Pedidos', veja cada etapa até a entrega na sua mesa.",
  },
  {
    icon: MdAccessTime,
    tone: "danger",
    titulo: "5. Limite para o 1º pedido",
    texto:
      "Você tem até 10 minutos para o primeiro pedido. Após o 1º envio, a mesa fica livre de limite.",
  },
  {
    icon: MdNotificationsActive,
    tone: "gold",
    titulo: "6. Ajuda ou Fechar Mesa",
    texto:
      "Toque em 'Chamar Garçom' a qualquer momento para suporte ou fechar a conta.",
  },
];

function recuperarRestauranteUsuarioLogado() {
  try {
    const raw = localStorage.getItem("user");
    const parsed = raw ? JSON.parse(raw) : null;
    if (parsed?.idRestaurante) return String(parsed.idRestaurante);
  } catch {
    // ignore
  }
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "="
    );
    const payload = JSON.parse(atob(padded));
    return payload?.idRestaurante ? String(payload.idRestaurante) : null;
  } catch {
    return null;
  }
}

export default function TelaAutoatendimento() {
  const [searchParams] = useSearchParams();
  const { idMesa: idMesaParam } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const idMesaQuery = searchParams.get("idMesa") || idMesaParam;
  const mesaQuery = searchParams.get("mesa");
  const numMesaQuery =
    searchParams.get("numMesa") || searchParams.get("numero");
  const idRestauranteQuery =
    searchParams.get("idRestaurante") || searchParams.get("restaurante");
  const sessaoIdQuery =
    searchParams.get("sessao_id") || searchParams.get("sessao");

  const temMesaNaUrl = Boolean(idMesaQuery || mesaQuery || numMesaQuery);
  const storageInicial = recuperarSessaoMesa();
  const usarStorageMesa =
    !idRestauranteQuery ||
    temMesaNaUrl ||
    String(storageInicial?.idRestaurante || "") === String(idRestauranteQuery);
  const storageValido = usarStorageMesa ? storageInicial : null;
  const mesaQueryNumerica =
    mesaQuery !== null && mesaQuery !== "" && !isNaN(Number(mesaQuery))
      ? mesaQuery
      : null;

  const [mesaInfo, setMesaInfo] = useState({
    numero:
      numMesaQuery ||
      mesaQueryNumerica ||
      (temMesaNaUrl ? storageValido?.numero || null : null),
    idMesa: isUuid(idMesaQuery)
      ? idMesaQuery
      : isUuid(mesaQuery)
      ? mesaQuery
      : temMesaNaUrl
      ? storageValido?.idMesa || null
      : null,
    idRestaurante:
      idRestauranteQuery ||
      storageValido?.idRestaurante ||
      recuperarRestauranteUsuarioLogado() ||
      null,
    sessao_id: sessaoIdQuery || storageValido?.sessao_id || null,
    idPedidoAtivo: temMesaNaUrl ? storageValido?.idPedidoAtivo || null : null,
  });

  const [produtos, setProdutos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState("Todos");
  const [termoBusca, setTermoBusca] = useState("");
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [nomeRestaurante, setNomeRestaurante] = useState("");
  const [modalInstrucoes, setModalInstrucoes] = useState(false);
  const [pedidoAtivoInfo, setPedidoAtivoInfo] = useState(null);

  const [tempoRestante, setTempoRestante] = useState(600);
  const [mesaExpiradaModal, setMesaExpiradaModal] = useState(false);
  const [reabrindoMesa, setReabrindoMesa] = useState(false);

  const [carrinho, setCarrinho] = useState([]);
  const [exibirResumoPedido, setExibirResumoPedido] = useState(false);
  const [enviandoPedido, setEnviandoPedido] = useState(false);
  const [chamandoGarcom, setChamandoGarcom] = useState(false);

  const temPedidoComItens = useMemo(() => {
    if (!pedidoAtivoInfo || !pedidoAtivoInfo.idPedido) return false;
    const itens = pedidoAtivoInfo.itens || [];
    return itens.some((i) => i.status !== "Cancelado");
  }, [pedidoAtivoInfo]);

  const formatarTempo = (segundos) => {
    const min = Math.floor(segundos / 60);
    const sec = segundos % 60;
    return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  useEffect(() => {
    let ativo = true;

    async function inicializar() {
      try {
        setCarregando(true);
        const storageMesa = recuperarSessaoMesa();
        const temMesaUrl = Boolean(idMesaQuery || mesaQuery || numMesaQuery);
        const podeUsarStorage =
          !idRestauranteQuery ||
          temMesaUrl ||
          String(storageMesa?.idRestaurante || "") ===
            String(idRestauranteQuery);
        const storageEfetivo = podeUsarStorage ? storageMesa : null;
        const mesaNumUrl =
          mesaQuery !== null && mesaQuery !== "" && !isNaN(Number(mesaQuery))
            ? mesaQuery
            : null;

        let idRest =
          idRestauranteQuery ||
          storageEfetivo?.idRestaurante ||
          recuperarRestauranteUsuarioLogado() ||
          null;
        let idSessao = sessaoIdQuery || storageEfetivo?.sessao_id || null;
        let idPedAtivo = temMesaUrl
          ? storageEfetivo?.idPedidoAtivo || null
          : null;
        let numMesa =
          numMesaQuery ||
          mesaNumUrl ||
          (temMesaUrl ? storageEfetivo?.numero || null : null);
        let targetIdMesa = isUuid(idMesaQuery)
          ? idMesaQuery
          : isUuid(mesaQuery)
          ? mesaQuery
          : temMesaUrl
          ? storageEfetivo?.idMesa || null
          : null;
        let nomeRest = null;

        if (!targetIdMesa && numMesa && idRest) {
          const listaMesas = await listarMesas(idRest).catch(() => []);
          if (Array.isArray(listaMesas)) {
            const mesaEncontrada = listaMesas.find(
              (m) => String(m.numero) === String(numMesa)
            );
            if (mesaEncontrada) {
              targetIdMesa = mesaEncontrada.idMesa;
              numMesa = mesaEncontrada.numero;
            }
          }
        }

        if (targetIdMesa) {
          const mesaRes = await abrirMesa(targetIdMesa).catch(() => null);

          if (mesaRes) {
            idRest = mesaRes.idRestaurante || idRest;
            idSessao = mesaRes.idSessao || idSessao;
            idPedAtivo = mesaRes.idPedidoAtivo || idPedAtivo;
            numMesa = mesaRes.numero || numMesa;
            if (mesaRes.nomeRestaurante) {
              nomeRest = mesaRes.nomeRestaurante;
            }
          }

          const comandaAtiva = await obterPedidoAtivoMesa(targetIdMesa).catch(
            () => null
          );
          const idPed =
            comandaAtiva?.idPedido || comandaAtiva?.pedido?.idPedido;
          const statusPed =
            comandaAtiva?.status || comandaAtiva?.pedido?.status;
          const itensValidos = (comandaAtiva?.itens || []).filter(
            (i) => i.status !== "Cancelado"
          );

          if (
            comandaAtiva &&
            idPed &&
            statusPed !== "Fechado" &&
            statusPed !== "Cancelado"
          ) {
            idPedAtivo = idPed;
            if (ativo && itensValidos.length > 0) {
              setPedidoAtivoInfo({
                ...comandaAtiva,
                idPedido: idPed,
                status: statusPed,
                itens: comandaAtiva.itens || [],
              });
            } else if (ativo) {
              setPedidoAtivoInfo(null);
            }
          } else {
            idPedAtivo = null;
            if (ativo) setPedidoAtivoInfo(null);
          }
        }

        if (idRest && !nomeRest) {
          const dadosRest = await obterRestaurantePublico(idRest).catch(
            () => null
          );
          if (dadosRest && dadosRest.nome) {
            nomeRest = dadosRest.nome;
          }
        }

        if (ativo) {
          if (nomeRest) setNomeRestaurante(nomeRest);
          const infoAtualizada = {
            numero: numMesa,
            idMesa: targetIdMesa,
            idRestaurante: idRest,
            sessao_id: idSessao || `sessao-${Date.now()}`,
            idPedidoAtivo: idPedAtivo,
          };
          setMesaInfo(infoAtualizada);
          if (targetIdMesa) {
            salvarSessaoMesa(infoAtualizada);
          }
        }

        if (idRest) {
          try {
            const cardapioData = await listarItensCardapio(idRest);
            if (ativo && Array.isArray(cardapioData)) {
              const itensTratados = cardapioData
                .filter((item) => item.disponivel !== false)
                .map((item) => ({
                  id: item.id || item.idCardapio,
                  idCardapio: item.idCardapio || item.id,
                  nome: item.nome,
                  preco: Number(item.preco) || 0,
                  categoria: item.categoria || "Geral",
                  descricao: item.descricao || "",
                  imagem:
                    item.pathImage ||
                    item.imagemUrl ||
                    item.imagem_url ||
                    item.imagem ||
                    "",
                  disponivel: true,
                  ingredientes: Array.isArray(item.ingredientes)
                    ? item.ingredientes
                    : item.descricao
                    ? item.descricao
                        .split(",")
                        .map((s) => s.trim())
                        .filter((s) => s.length > 2 && s.length < 35)
                    : [],
                }));
              setProdutos(itensTratados);
              return;
            }
          } catch {
            // Usa catálogo base se API falhar
          }
        }

        if (ativo) {
          setProdutos(PRODUTOS_MOCK);
        }
      } catch (err) {
        if (ativo) {
          toast.error(err.message || "Erro ao carregar cardápio.");
          setProdutos(PRODUTOS_MOCK);
        }
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    inicializar();

    return () => {
      ativo = false;
    };
  }, [
    idMesaQuery,
    mesaQuery,
    numMesaQuery,
    idRestauranteQuery,
    sessaoIdQuery,
    toast,
  ]);

  useEffect(() => {
    if (temPedidoComItens || mesaExpiradaModal || !mesaInfo.idMesa) {
      return;
    }

    const timerId = setInterval(() => {
      setTempoRestante((prev) => {
        if (prev <= 1) {
          clearInterval(timerId);
          setMesaExpiradaModal(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerId);
  }, [temPedidoComItens, mesaExpiradaModal, mesaInfo.idMesa]);

  useEffect(() => {
    if (!mesaInfo.idMesa) return;
    let ativo = true;

    async function sincronizarComanda() {
      try {
        const comanda = await obterPedidoAtivoMesa(mesaInfo.idMesa).catch(
          () => null
        );
        if (!ativo) return;
        const idPed = comanda?.idPedido || comanda?.pedido?.idPedido;
        const statusPed = comanda?.status || comanda?.pedido?.status;
        const itensValidos = (comanda?.itens || []).filter(
          (i) => i.status !== "Cancelado"
        );

        if (
          comanda &&
          idPed &&
          statusPed !== "Fechado" &&
          statusPed !== "Cancelado"
        ) {
          setMesaInfo((prev) => ({ ...prev, idPedidoAtivo: idPed }));
          salvarSessaoMesa({ idMesa: mesaInfo.idMesa, idPedidoAtivo: idPed });
          if (itensValidos.length > 0) {
            setPedidoAtivoInfo({
              ...comanda,
              idPedido: idPed,
              status: statusPed,
              itens: comanda.itens || [],
            });
          } else {
            setPedidoAtivoInfo(null);
          }
        } else {
          setPedidoAtivoInfo(null);
          setMesaInfo((prev) => ({ ...prev, idPedidoAtivo: null }));
          salvarSessaoMesa({ idMesa: mesaInfo.idMesa, idPedidoAtivo: null });
        }
      } catch {
        // Silencia erro de polling
      }
    }

    const intervalId = setInterval(sincronizarComanda, 8000);
    return () => {
      ativo = false;
      clearInterval(intervalId);
    };
  }, [mesaInfo.idMesa]);

  async function handleReabrirMesa() {
    if (!mesaInfo.idMesa) {
      setMesaExpiradaModal(false);
      return;
    }
    setReabrindoMesa(true);
    try {
      await abrirMesa(mesaInfo.idMesa);
      setTempoRestante(600);
      setMesaExpiradaModal(false);
      toast.success(
        "Mesa reaberta! Você tem 10 minutos para realizar seu primeiro pedido."
      );

      const comanda = await obterPedidoAtivoMesa(mesaInfo.idMesa).catch(
        () => null
      );
      const idPed = comanda?.idPedido || comanda?.pedido?.idPedido;
      const statusPed = comanda?.status || comanda?.pedido?.status;
      const itensValidos = (comanda?.itens || []).filter(
        (i) => i.status !== "Cancelado"
      );
      if (
        comanda &&
        idPed &&
        statusPed !== "Fechado" &&
        statusPed !== "Cancelado" &&
        itensValidos.length > 0
      ) {
        setPedidoAtivoInfo({
          ...comanda,
          idPedido: idPed,
          status: statusPed,
          itens: comanda.itens || [],
        });
      }
    } catch (err) {
      toast.error(
        err.message ||
          "Não foi possível reabrir a mesa. Tente novamente ou chame o garçom."
      );
    } finally {
      setReabrindoMesa(false);
    }
  }

  const categoriasDisponiveis = useMemo(() => {
    const cats = new Set(produtos.map((p) => p.categoria).filter(Boolean));
    return ["Todos", ...Array.from(cats)];
  }, [produtos]);

  const produtosFiltrados = useMemo(
    () =>
      produtos.filter((produto) => {
        const atendeCategoria =
          categoriaSelecionada === "Todos" ||
          produto.categoria === categoriaSelecionada;
        const atendeBusca = produto.nome
          .toLowerCase()
          .includes(termoBusca.toLowerCase().trim());
        return atendeCategoria && atendeBusca;
      }),
    [produtos, categoriaSelecionada, termoBusca]
  );

  async function handleChamarGarcom() {
    if (!mesaInfo.idMesa) {
      toast.warning(
        "Para chamar o garçom, escaneie o QR Code localizado na sua mesa."
      );
      return;
    }

    setChamandoGarcom(true);
    try {
      await chamarGarcom(mesaInfo.idMesa);
      toast.success(
        "Garçom chamado! A equipe foi notificada e já está a caminho."
      );
    } catch (err) {
      toast.error(err.message || "Erro ao chamar garçom.");
    } finally {
      setChamandoGarcom(false);
    }
  }

  const handleAdicionarAoPedido = (itemPedido) => {
    setCarrinho((prev) => [...prev, itemPedido]);
  };

  const handleRemoverDoCarrinho = (indexParaRemover) => {
    setCarrinho((prev) =>
      prev.filter((_, index) => index !== indexParaRemover)
    );
  };

  const totalItensPedido = carrinho.reduce(
    (total, item) => total + item.quantidade,
    0
  );

  const valorTotalPedido = carrinho.reduce(
    (total, item) => total + (item.produto.preco || 0) * item.quantidade,
    0
  );

  async function handleFinalizarPedido() {
    if (carrinho.length === 0) return;

    if (!mesaInfo.idMesa) {
      toast.warning(
        "Mesa não identificada. Aponte a câmera para o QR Code da sua mesa para enviar o pedido."
      );
      return;
    }

    setEnviandoPedido(true);

    try {
      const itensFormatados = carrinho.map((i) => {
        const obsPartes = [];
        if (i.ingredientesRemovidos && i.ingredientesRemovidos.length > 0) {
          obsPartes.push(`Sem: ${i.ingredientesRemovidos.join(", ")}`);
        }
        if (i.observacao) {
          obsPartes.push(i.observacao);
        }

        return {
          idCardapio: i.produto.idCardapio || i.produto.id,
          quantidade: i.quantidade,
          observacao: obsPartes.length > 0 ? obsPartes.join(" | ") : null,
        };
      });

      let pedidoId = mesaInfo.idPedidoAtivo;

      if (pedidoId) {
        await adicionarItensAoPedido(pedidoId, itensFormatados);
      } else {
        const res = await criarPedido({
          idMesa: mesaInfo.idMesa,
          sessao_id: mesaInfo.sessao_id,
          itens: itensFormatados,
        });
        pedidoId = res.pedido?.idPedido || res.idPedido;
      }

      setCarrinho([]);
      setExibirResumoPedido(false);
      toast.success(
        "Pedido enviado com sucesso para a cozinha! Redirecionando..."
      );
      setMesaInfo((prev) => ({ ...prev, idPedidoAtivo: pedidoId }));
      salvarSessaoMesa({
        idMesa: mesaInfo.idMesa,
        idPedidoAtivo: pedidoId,
        idRestaurante: mesaInfo.idRestaurante,
        numero: mesaInfo.numero,
      });

      const p = new URLSearchParams();
      if (mesaInfo.idMesa) p.set("idMesa", mesaInfo.idMesa);
      if (mesaInfo.idRestaurante) p.set("idRestaurante", mesaInfo.idRestaurante);
      if (mesaInfo.numero) p.set("mesa", mesaInfo.numero);

      setTimeout(() => {
        navigate(`/tracking/${pedidoId}?${p.toString()}`);
      }, 900);
    } catch (err) {
      toast.error(
        err.message || "Erro ao finalizar pedido. Tente novamente."
      );
    } finally {
      setEnviandoPedido(false);
    }
  }

  return (
    <PublicShell
      title={nomeRestaurante || "Cardápio"}
      subtitle="Autoatendimento"
      onBack={() => navigate("/")}
      backTitle="Voltar ao início"
      badge={
        mesaInfo.numero ? (
          <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-bold text-gold bg-gold/15 px-2 py-0.5 rounded-md">
            <MdTableBar size={13} /> Mesa {mesaInfo.numero}
          </span>
        ) : null
      }
      actions={
        <>
          <button
            type="button"
            onClick={() => setModalInstrucoes(true)}
            className="p-2 sm:p-2.5 rounded-xl bg-white border border-gray-200 text-gray-600 hover:text-brand hover:border-brand shadow-xs transition-colors cursor-pointer shrink-0"
            title="Como funciona o autoatendimento"
            aria-label="Instruções de uso"
          >
            <MdHelpOutline size={18} className="sm:w-5 sm:h-5" />
          </button>

          {mesaInfo.idMesa && (
            <Button
              variant="gold"
              size="sm"
              icon={MdNotificationsActive}
              loading={chamandoGarcom}
              onClick={handleChamarGarcom}
              title="Chamar garçom para a sua mesa"
            >
              <span className="hidden sm:inline">Chamar Garçom</span>
              <span className="sm:hidden text-xs">Garçom</span>
            </Button>
          )}

          <button
            type="button"
            onClick={() => setExibirResumoPedido(true)}
            className="relative flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-brand-soft text-brand hover:bg-brand/15 rounded-xl transition-colors cursor-pointer font-semibold text-xs sm:text-sm shrink-0"
            title="Visualizar itens do meu pedido"
          >
            <MdShoppingBag size={18} className="sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Meu Pedido</span>
            {totalItensPedido > 0 && (
              <span className="bg-brand text-white text-[11px] font-extrabold min-w-5 h-5 px-1 rounded-full flex items-center justify-center">
                {totalItensPedido}
              </span>
            )}
          </button>
        </>
      }
      subHeader={
        <div className="space-y-3">
          {mesaInfo.idMesa && !temPedidoComItens && (
            <div
              className={`flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-bold transition-colors shadow-xs ${
                tempoRestante <= 120
                  ? "bg-red-600 text-white animate-pulse"
                  : tempoRestante <= 300
                  ? "bg-amber-500 text-white"
                  : "bg-amber-100/90 text-amber-900 border border-amber-300/80"
              }`}
              title="Tempo limite de 10 minutos para o 1º pedido nesta mesa"
            >
              <div className="flex items-center gap-1.5">
                <MdAccessTime size={16} />
                <span className="hidden xs:inline">
                  Tempo para o 1º pedido nesta mesa:
                </span>
                <span className="xs:hidden">Tempo p/ 1º pedido:</span>
              </div>
              <span className="font-mono font-extrabold px-2 py-0.5 rounded-md bg-black/10">
                {formatarTempo(tempoRestante)}
              </span>
            </div>
          )}

          {pedidoAtivoInfo && (
            <div className="bg-brand-soft border border-gold/40 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xs animate-fade-in">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gold text-white flex items-center justify-center font-bold shrink-0">
                  <MdTimeline size={20} />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-gray-900">
                    Você possui um pedido em andamento!
                  </p>
                  <p className="text-[11px] text-gray-600">
                    {
                      (pedidoAtivoInfo.itens || []).filter(
                        (i) => i.status !== "Cancelado"
                      ).length
                    }{" "}
                    itens na comanda • Status:{" "}
                    <strong className="text-brand">
                      {pedidoAtivoInfo.status}
                    </strong>
                  </p>
                </div>
              </div>

              <Button
                size="sm"
                onClick={() => {
                  const p = new URLSearchParams();
                  if (mesaInfo.idMesa) p.set("idMesa", mesaInfo.idMesa);
                  if (mesaInfo.idRestaurante)
                    p.set("idRestaurante", mesaInfo.idRestaurante);
                  if (mesaInfo.numero) p.set("mesa", mesaInfo.numero);
                  navigate(
                    `/tracking/${pedidoAtivoInfo.idPedido}?${p.toString()}`
                  );
                }}
              >
                <span>Acompanhar Pedidos</span>
                <MdArrowForward size={16} />
              </Button>
            </div>
          )}

          <CampoPesquisa valor={termoBusca} onChange={setTermoBusca} />

          <FiltroCategorias
            categorias={categoriasDisponiveis}
            categoriaSelecionada={categoriaSelecionada}
            onSelecionarCategoria={setCategoriaSelecionada}
          />
        </div>
      }
    >
      <div className="flex items-center justify-between mb-4 px-1">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          {produtosFiltrados.length}{" "}
          {produtosFiltrados.length === 1
            ? "produto encontrado"
            : "produtos encontrados"}
        </p>
      </div>

      {carregando ? (
        <div className="py-20 flex justify-center">
          <Spinner size="lg" label="Carregando opções do cardápio..." />
        </div>
      ) : (
        <GridProdutos
          produtos={produtosFiltrados}
          onSelectProduto={setProdutoSelecionado}
          termoBusca={termoBusca}
          categoriaSelecionada={categoriaSelecionada}
        />
      )}

      {produtoSelecionado && (
        <ModalDetalhesProduto
          produto={produtoSelecionado}
          onClose={() => setProdutoSelecionado(null)}
          onAdicionarAoPedido={handleAdicionarAoPedido}
        />
      )}

      {/* Barra Flutuante Inferior do Carrinho */}
      {carrinho.length > 0 && !exibirResumoPedido && (
        <div className="fixed bottom-4 left-4 right-4 max-w-xl mx-auto z-30 animate-fade-in">
          <button
            type="button"
            onClick={() => setExibirResumoPedido(true)}
            className="w-full bg-brand hover:bg-brand-dark text-white px-6 py-4 rounded-3xl shadow-xl flex items-center justify-between gap-4 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center font-bold text-lg">
                {totalItensPedido}
              </div>
              <div className="text-left">
                <p className="text-xs text-white/80 font-medium">
                  Ver pedido atual
                </p>
                <p className="text-sm font-bold">
                  {carrinho.length}{" "}
                  {carrinho.length === 1
                    ? "item diferente"
                    : "itens diferentes"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-lg font-extrabold">
                {valorTotalPedido.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </span>
              <span className="bg-white text-brand text-xs font-bold px-3 py-1.5 rounded-xl">
                Ver detalhes
              </span>
            </div>
          </button>
        </div>
      )}

      {/* Modal Resumo do Pedido Atual */}
      {exibirResumoPedido && (
        <Modal
          open
          onClose={() => setExibirResumoPedido(false)}
          title="Seu Pedido"
          subtitle={mesaInfo.numero ? `Mesa ${mesaInfo.numero}` : undefined}
          icon={MdShoppingBag}
          size="lg"
          footer={
            carrinho.length > 0 ? (
              <div className="w-full space-y-3">
                <div className="flex justify-between items-center text-base font-extrabold text-gray-900">
                  <span>Total do Pedido:</span>
                  <span className="text-brand text-xl">
                    {valorTotalPedido.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </span>
                </div>
                <div className="flex gap-2.5">
                  <Button
                    variant="secondary"
                    onClick={() => setExibirResumoPedido(false)}
                    className="flex-1"
                  >
                    Continuar Escolhendo
                  </Button>
                  <Button
                    icon={MdCheckCircle}
                    loading={enviandoPedido}
                    onClick={handleFinalizarPedido}
                    className="flex-1"
                  >
                    Finalizar Pedido
                  </Button>
                </div>
              </div>
            ) : null
          }
        >
          {carrinho.length === 0 ? (
            <p className="text-center text-gray-500 py-8 text-sm">
              Seu pedido está vazio. Selecione um item do cardápio!
            </p>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {carrinho.map((item, index) => (
                <div
                  key={index}
                  className="p-3.5 bg-surface rounded-2xl border border-gray-200/80 flex items-start justify-between gap-3"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-brand">
                        {item.quantidade}x
                      </span>
                      <span className="font-bold text-sm text-gray-900">
                        {item.produto.nome}
                      </span>
                    </div>
                    <p className="text-xs text-gold font-semibold">
                      {(item.produto.preco * item.quantidade).toLocaleString(
                        "pt-BR",
                        {
                          style: "currency",
                          currency: "BRL",
                        }
                      )}
                    </p>

                    {item.ingredientesRemovidos &&
                      item.ingredientesRemovidos.length > 0 && (
                        <div className="mt-1 text-[11px] text-red-700 bg-red-50 p-1.5 rounded-lg border border-red-100">
                          <span className="font-bold">Sem:</span>{" "}
                          {item.ingredientesRemovidos.join(", ")}
                        </div>
                      )}

                    {item.observacao && (
                      <div className="mt-1 text-[11px] text-gray-600 italic">
                        Obs: {item.observacao}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoverDoCarrinho(index)}
                    className="text-gray-400 hover:text-red-600 p-1.5 rounded-xl hover:bg-red-50 transition-colors cursor-pointer"
                    title="Remover item"
                  >
                    <MdDelete size={19} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}

      {/* Modal de Instruções do Autoatendimento */}
      {modalInstrucoes && (
        <Modal
          open
          onClose={() => setModalInstrucoes(false)}
          title="Instruções de Autoatendimento"
          subtitle="Como funciona o seu pedido digital"
          icon={MdHelpOutline}
          size="2xl"
          footer={
            <Button
              onClick={() => setModalInstrucoes(false)}
              className="w-full"
            >
              Entendi, vamos aos pedidos!
            </Button>
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs sm:text-sm text-gray-700">
            {PASSOS_INSTRUCOES.map((passo) => {
              const Icon = passo.icon;
              const bgClass =
                passo.tone === "danger"
                  ? "bg-red-50/80 border-red-200 text-red-950"
                  : passo.tone === "gold"
                  ? "bg-amber-50/80 border-amber-300 text-amber-950"
                  : "bg-surface border-gray-200/80 text-gray-800";
              const iconBg =
                passo.tone === "danger"
                  ? "bg-red-100 text-red-700"
                  : passo.tone === "gold"
                  ? "bg-amber-100 text-amber-800"
                  : "bg-brand-soft text-brand";

              return (
                <div
                  key={passo.titulo}
                  className={`flex items-start gap-2.5 p-3.5 rounded-2xl border ${bgClass}`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${iconBg}`}
                  >
                    <Icon size={18} />
                  </div>
                  <div>
                    <strong className="block font-bold text-xs sm:text-sm mb-0.5">
                      {passo.titulo}
                    </strong>
                    <span className="text-[11px] sm:text-xs opacity-85 leading-snug block">
                      {passo.texto}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </Modal>
      )}

      {/* Modal de Mesa Encerrada por Inatividade */}
      {mesaExpiradaModal && (
        <Modal
          open
          closeOnBackdrop={false}
          title="Mesa Encerrada por Inatividade"
          icon={MdAccessTime}
          size="sm"
          footer={
            <Button
              icon={MdRefresh}
              loading={reabrindoMesa}
              onClick={handleReabrirMesa}
              className="w-full"
            >
              Reabrir Mesa e Fazer Pedido
            </Button>
          }
        >
          <div className="space-y-3 text-xs text-gray-600 leading-relaxed">
            <p>
              O tempo limite de <strong>10 minutos</strong> para realizar o
              primeiro pedido nesta mesa foi atingido e a sessão foi fechada
              automaticamente.
            </p>
            <p className="text-amber-800 bg-amber-50 p-3 rounded-xl border border-amber-200 font-medium">
              Caso ainda esteja no local, toque no botão abaixo para{" "}
              <strong>reabrir a mesa</strong> e continuar escolhendo seus itens.
            </p>
          </div>
        </Modal>
      )}

      <footer className="mt-16 text-center text-xs text-gray-400 py-6 border-t border-gray-200/60">
        <p className="font-medium">
          Powered by <span className="font-bold text-brand">FastCooking</span>
        </p>
      </footer>
    </PublicShell>
  );
}
