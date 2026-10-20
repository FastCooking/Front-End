import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  MdShoppingBag,
  MdArrowBack,
  MdDelete,
  MdClose,
  MdCheckCircle,
  MdNotificationsActive,
  MdTableBar,
  MdWarning,
  MdHelpOutline,
  MdTimeline,
  MdAccessTime,
  MdRefresh,
  MdLaunch,
} from "react-icons/md";

import { listarItensCardapio } from "../services/cardapioService";
import {
  abrirMesa,
  criarPedido,
  adicionarItensAoPedido,
  chamarGarcom,
  obterPedidoAtivoMesa,
  listarMesas,
} from "../services/pedidoService";
import { obterRestaurantePublico } from "../services/restauranteService";
import { PRODUTOS_MOCK } from "../data/produtosMock";

import CampoPesquisa from "../components/cardapio/CampoPesquisa";
import FiltroCategorias from "../components/cardapio/FiltroCategorias";
import GridProdutos from "../components/cardapio/GridProdutos";
import ModalDetalhesProduto from "../components/cardapio/ModalDetalhesProduto";

const MESA_STORAGE_KEY = "fastcooking_mesa_cliente";

function salvarSessaoMesa(dados) {
  try {
    if (!dados || !dados.idMesa) return;
    const anterior = recuperarSessaoMesa() || {};
    sessionStorage.setItem(MESA_STORAGE_KEY, JSON.stringify({ ...anterior, ...dados }));
  } catch (e) {
    console.warn("Falha ao salvar sessão da mesa no storage:", e);
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
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val.trim())
  );
}

export default function TelaAutoatendimento() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const idMesaQuery = searchParams.get("idMesa");
  const mesaQuery = searchParams.get("mesa");
  const numMesaQuery = searchParams.get("numMesa") || searchParams.get("numero");
  const idRestauranteQuery = searchParams.get("idRestaurante") || searchParams.get("restaurante");
  const sessaoIdQuery = searchParams.get("sessao_id") || searchParams.get("sessao");

  const storageInicial = recuperarSessaoMesa();

  // Mesa & Session info
  const [mesaInfo, setMesaInfo] = useState({
    numero: numMesaQuery || (!isNaN(mesaQuery) ? mesaQuery : storageInicial?.numero || null),
    idMesa: isUuid(idMesaQuery)
      ? idMesaQuery
      : isUuid(mesaQuery)
      ? mesaQuery
      : storageInicial?.idMesa || null,
    idRestaurante: idRestauranteQuery || storageInicial?.idRestaurante || null,
    sessao_id: sessaoIdQuery || storageInicial?.sessao_id || null,
    idPedidoAtivo: storageInicial?.idPedidoAtivo || null,
  });

  // State
  const [produtos, setProdutos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState("Todos");
  const [termoBusca, setTermoBusca] = useState("");
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [nomeRestaurante, setNomeRestaurante] = useState("");
  const [modalInstrucoes, setModalInstrucoes] = useState(false);
  const [pedidoAtivoInfo, setPedidoAtivoInfo] = useState(null);

  // Timer de 10 minutos (600s) para o primeiro pedido e aviso de expiração
  const [tempoRestante, setTempoRestante] = useState(600);
  const [mesaExpiradaModal, setMesaExpiradaModal] = useState(false);
  const [reabrindoMesa, setReabrindoMesa] = useState(false);

  // Cart / Order state
  const [carrinho, setCarrinho] = useState([]);
  const [exibirResumoPedido, setExibirResumoPedido] = useState(false);
  const [enviandoPedido, setEnviandoPedido] = useState(false);
  const [chamandoGarcom, setChamandoGarcom] = useState(false);
  const [msgSucesso, setMsgSucesso] = useState(null);
  const [erro, setErro] = useState(null);

  // Verifica se a mesa já possui algum pedido ativo com itens (não cancelados)
  const temPedidoComItens = useMemo(() => {
    if (!pedidoAtivoInfo || !pedidoAtivoInfo.idPedido) return false;
    const itens = pedidoAtivoInfo.itens || [];
    return itens.some((i) => i.status !== "Cancelado");
  }, [pedidoAtivoInfo]);

  // Formatar tempo mm:ss
  const formatarTempo = (segundos) => {
    const min = Math.floor(segundos / 60);
    const sec = segundos % 60;
    return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  // 1. Initialize table & load products from API
  useEffect(() => {
    let ativo = true;

    async function inicializar() {
      try {
        setCarregando(true);
        const storageMesa = recuperarSessaoMesa();
        let idRest = idRestauranteQuery || storageMesa?.idRestaurante || null;
        let idSessao = sessaoIdQuery || storageMesa?.sessao_id || null;
        let idPedAtivo = storageMesa?.idPedidoAtivo || null;
        let numMesa = numMesaQuery || (!isNaN(mesaQuery) ? mesaQuery : storageMesa?.numero || null);
        let targetIdMesa = isUuid(idMesaQuery)
          ? idMesaQuery
          : isUuid(mesaQuery)
          ? mesaQuery
          : storageMesa?.idMesa || null;
        let nomeRest = null;

        // Se temos número da mesa e idRestaurante mas não o UUID da mesa, busca nas mesas cadastradas
        if (!targetIdMesa && numMesa && idRest) {
          const listaMesas = await listarMesas(idRest).catch(() => []);
          if (Array.isArray(listaMesas)) {
            const mesaEncontrada = listaMesas.find((m) => String(m.numero) === String(numMesa));
            if (mesaEncontrada) {
              targetIdMesa = mesaEncontrada.idMesa;
              numMesa = mesaEncontrada.numero;
            }
          }
        }

        // Auto-open table if targetIdMesa exists
        if (targetIdMesa) {
          const mesaRes = await abrirMesa(targetIdMesa).catch((err) => {
            console.warn("Não foi possível auto-abrir mesa:", err);
            return null;
          });

          if (mesaRes) {
            idRest = mesaRes.idRestaurante || idRest;
            idSessao = mesaRes.idSessao || idSessao;
            idPedAtivo = mesaRes.idPedidoAtivo || idPedAtivo;
            numMesa = mesaRes.numero || numMesa;
            if (mesaRes.nomeRestaurante) {
              nomeRest = mesaRes.nomeRestaurante;
            }
          }

          // Busca pedido/comanda ativo na mesa para o acompanhamento
          const comandaAtiva = await obterPedidoAtivoMesa(targetIdMesa).catch(() => null);
          const idPed = comandaAtiva?.idPedido || comandaAtiva?.pedido?.idPedido;
          const statusPed = comandaAtiva?.status || comandaAtiva?.pedido?.status;
          const itensValidos = (comandaAtiva?.itens || []).filter((i) => i.status !== "Cancelado");

          if (ativo && comandaAtiva && idPed && statusPed !== "Fechado" && statusPed !== "Cancelado" && itensValidos.length > 0) {
            setPedidoAtivoInfo({
              ...comandaAtiva,
              idPedido: idPed,
              status: statusPed,
              itens: comandaAtiva.itens || [],
            });
            if (!idPedAtivo) idPedAtivo = idPed;
          }
        }

        // Se ainda não temos o nome do restaurante, busca dados públicos do restaurante
        if (idRest && !nomeRest) {
          const dadosRest = await obterRestaurantePublico(idRest).catch(() => null);
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

        // Fetch products for restaurant if idRestaurante is present
        if (idRest) {
          try {
            const cardapioData = await listarItensCardapio(idRest);
            if (ativo && Array.isArray(cardapioData) && cardapioData.length > 0) {
              const itensTratados = cardapioData
                .filter((item) => item.disponivel !== false)
                .map((item) => ({
                  id: item.id || item.idCardapio,
                  idCardapio: item.idCardapio || item.id,
                  nome: item.nome,
                  preco: Number(item.preco) || 0,
                  categoria: item.categoria || "Geral",
                  descricao: item.descricao || "",
                  imagem: item.pathImage || item.imagemUrl || item.imagem_url || item.imagem || "",
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
          } catch (errApi) {
            console.warn("Erro ao buscar cardápio da API, usando catálogo base:", errApi);
          }
        }

        // Fallback to PRODUTOS_MOCK if no restaurant specified or empty
        if (ativo) {
          setProdutos(PRODUTOS_MOCK);
        }
      } catch (err) {
        if (ativo) {
          setErro(err.message || "Erro ao carregar cardápio.");
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
  }, [idMesaQuery, mesaQuery, numMesaQuery, idRestauranteQuery, sessaoIdQuery]);

  // Contagem regressiva de 10 minutos (600s) para inatividade antes do 1º pedido
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

  // Polling periódico para manter sincronizado o pedido ativo/tracking da mesa
  useEffect(() => {
    if (!mesaInfo.idMesa) return;
    let ativo = true;

    async function sincronizarComanda() {
      try {
        const comanda = await obterPedidoAtivoMesa(mesaInfo.idMesa).catch(() => null);
        if (!ativo) return;
        const idPed = comanda?.idPedido || comanda?.pedido?.idPedido;
        const statusPed = comanda?.status || comanda?.pedido?.status;
        const itensValidos = (comanda?.itens || []).filter((i) => i.status !== "Cancelado");

        if (comanda && idPed && statusPed !== "Fechado" && statusPed !== "Cancelado" && itensValidos.length > 0) {
          setPedidoAtivoInfo({
            ...comanda,
            idPedido: idPed,
            status: statusPed,
            itens: comanda.itens || [],
          });
          setMesaInfo((prev) => ({ ...prev, idPedidoAtivo: idPed }));
          salvarSessaoMesa({ idMesa: mesaInfo.idMesa, idPedidoAtivo: idPed });
        }
      } catch (err) {
        console.warn("Erro ao sincronizar comanda da mesa:", err);
      }
    }

    const intervalId = setInterval(sincronizarComanda, 8000);
    return () => {
      ativo = false;
      clearInterval(intervalId);
    };
  }, [mesaInfo.idMesa]);

  // Reabrir mesa caso tenha expirado por inatividade
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
      setMsgSucesso("Mesa reaberta com sucesso! Você tem 10 minutos para realizar o seu primeiro pedido.");
      setTimeout(() => setMsgSucesso(null), 6000);

      // Atualiza dados da mesa
      const comanda = await obterPedidoAtivoMesa(mesaInfo.idMesa).catch(() => null);
      const idPed = comanda?.idPedido || comanda?.pedido?.idPedido;
      const statusPed = comanda?.status || comanda?.pedido?.status;
      const itensValidos = (comanda?.itens || []).filter((i) => i.status !== "Cancelado");
      if (comanda && idPed && statusPed !== "Fechado" && statusPed !== "Cancelado" && itensValidos.length > 0) {
        setPedidoAtivoInfo({
          ...comanda,
          idPedido: idPed,
          status: statusPed,
          itens: comanda.itens || [],
        });
      }
    } catch (err) {
      setErro(err.message || "Não foi possível reabrir a mesa. Tente novamente ou chame o garçom.");
    } finally {
      setReabrindoMesa(false);
    }
  }

  // Compute available categories dynamically
  const categoriasDisponiveis = useMemo(() => {
    const cats = new Set(produtos.map((p) => p.categoria).filter(Boolean));
    return ["Todos", ...Array.from(cats)];
  }, [produtos]);

  // Real-time filtering logic
  const produtosFiltrados = useMemo(() => {
    return produtos.filter((produto) => {
      const atendeCategoria =
        categoriaSelecionada === "Todos" || produto.categoria === categoriaSelecionada;

      const atendeBusca = produto.nome
        .toLowerCase()
        .includes(termoBusca.toLowerCase().trim());

      return atendeCategoria && atendeBusca;
    });
  }, [produtos, categoriaSelecionada, termoBusca]);

  // Chamar Garçom
  async function handleChamarGarcom() {
    if (!mesaInfo.idMesa) {
      alert("Para chamar o garçom, escaneie o QR Code localizado na sua mesa.");
      return;
    }

    setChamandoGarcom(true);
    try {
      await chamarGarcom(mesaInfo.idMesa);
      setMsgSucesso("🛎️ Garçom chamado! A equipe foi notificada e já está a caminho.");
      setTimeout(() => setMsgSucesso(null), 5000);
    } catch (err) {
      setErro(err.message || "Erro ao chamar garçom.");
      setTimeout(() => setErro(null), 5000);
    } finally {
      setChamandoGarcom(false);
    }
  }

  // Handle adding item to order
  const handleAdicionarAoPedido = (itemPedido) => {
    setCarrinho((prev) => [...prev, itemPedido]);
  };

  // Remove item from order
  const handleRemoverDoCarrinho = (indexParaRemover) => {
    setCarrinho((prev) => prev.filter((_, index) => index !== indexParaRemover));
  };

  // Total item count in order
  const totalItensPedido = carrinho.reduce(
    (total, item) => total + item.quantidade,
    0
  );

  // Total price of order
  const valorTotalPedido = carrinho.reduce(
    (total, item) => total + (item.produto.preco || 0) * item.quantidade,
    0
  );

  // Submit Order to Backend API
  async function handleFinalizarPedido() {
    if (carrinho.length === 0) return;

    if (!mesaInfo.idMesa) {
      alert(
        "Mesa não identificada. Por favor, aponte a câmera para o QR Code da sua mesa para enviar o pedido diretamente para a cozinha."
      );
      return;
    }

    setEnviandoPedido(true);
    setErro(null);

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
        // Já tem comanda/pedido ativo na mesa -> anexa itens à comanda
        await adicionarItensAoPedido(pedidoId, itensFormatados);
      } else {
        // Cria novo pedido para a mesa
        const res = await criarPedido({
          idMesa: mesaInfo.idMesa,
          sessao_id: mesaInfo.sessao_id,
          itens: itensFormatados,
        });
        pedidoId = res.pedido?.idPedido || res.idPedido;
      }

      setCarrinho([]);
      setExibirResumoPedido(false);
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
      navigate(`/tracking/${pedidoId}?${p.toString()}`);
    } catch (err) {
      setErro(err.message || "Erro ao finalizar pedido. Tente novamente.");
    } finally {
      setEnviandoPedido(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF6F3] font-[Poppins] text-gray-800 pb-28">
      {/* ─── Sticky Top Header Container ────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-[#FAF6F3]/95 backdrop-blur-md border-b border-gray-200/80 shadow-xs pt-3 pb-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
          {/* Feedback Messages */}
          {msgSucesso && (
            <div className="bg-emerald-600 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-xl flex items-center justify-between shadow-md animate-fade-in">
              <span>{msgSucesso}</span>
              <button onClick={() => setMsgSucesso(null)} className="cursor-pointer">
                <MdClose size={18} />
              </button>
            </div>
          )}

          {erro && (
            <div className="bg-red-600 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-xl flex items-center justify-between shadow-md animate-fade-in">
              <span className="flex items-center gap-1.5">
                <MdWarning size={18} /> {erro}
              </span>
              <button onClick={() => setErro(null)} className="cursor-pointer">
                <MdClose size={18} />
              </button>
            </div>
          )}

          {/* Top Bar with Restaurant / Table Info & Actions */}
          <div className="flex items-center justify-between gap-2 sm:gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <button
                onClick={() => navigate("/")}
                className="p-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-white/80 transition-all cursor-pointer shrink-0"
                title="Voltar ao início"
              >
                <MdArrowBack size={20} className="sm:w-[22px] sm:h-[22px]" />
              </button>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-2xl font-black text-[#9C1C0E] tracking-tight leading-tight truncate max-w-[130px] xs:max-w-[180px] sm:max-w-xs md:max-w-md">
                  {nomeRestaurante || "Cardápio"}
                </h1>
                {mesaInfo.numero ? (
                  <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-bold text-[#B78A10] bg-[#B78A10]/15 px-2 py-0.5 rounded-md shrink-0">
                    <MdTableBar size={13} /> Mesa {mesaInfo.numero}
                  </span>
                ) : (
                  <span className="text-[11px] text-gray-400 block truncate">Autoatendimento</span>
                )}
              </div>
            </div>

            {/* Actions: Instruções + Chamar Garçom + Meu Pedido */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Botão de Instruções */}
              <button
                onClick={() => setModalInstrucoes(true)}
                className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-white border border-gray-200 text-gray-600 hover:text-[#9C1C0E] hover:border-[#9C1C0E] shadow-xs transition-all cursor-pointer shrink-0"
                title="Como funciona o autoatendimento"
                aria-label="Instruções de uso"
              >
                <MdHelpOutline size={18} className="sm:w-5 sm:h-5" />
              </button>

              {mesaInfo.idMesa && (
                <button
                  onClick={handleChamarGarcom}
                  disabled={chamandoGarcom}
                  className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs sm:text-sm font-bold rounded-xl sm:rounded-2xl shadow-xs transition-all cursor-pointer disabled:opacity-50 shrink-0"
                  title="Chamar garçom para a sua mesa"
                >
                  <MdNotificationsActive size={17} className={chamandoGarcom ? "animate-spin" : ""} />
                  <span className="hidden sm:inline">{chamandoGarcom ? "Chamando..." : "Chamar Garçom"}</span>
                  <span className="sm:hidden text-xs">{chamandoGarcom ? "..." : "Garçom"}</span>
                </button>
              )}

              {/* Cart Icon Badge */}
              <button
                onClick={() => setExibirResumoPedido(true)}
                className="relative flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 bg-[#9C1C0E]/10 text-[#9C1C0E] hover:bg-[#9C1C0E]/20 rounded-xl sm:rounded-2xl transition-all cursor-pointer font-semibold text-xs sm:text-sm shrink-0"
                title="Visualizar itens do meu pedido"
              >
                <MdShoppingBag size={18} className="sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Meu Pedido</span>
                {totalItensPedido > 0 && (
                  <span className="bg-[#9C1C0E] text-white text-[11px] font-extrabold min-w-5 h-5 px-1 rounded-full flex items-center justify-center animate-pulse">
                    {totalItensPedido}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Faixa Dedicada para Timer de Inatividade do 1º Pedido (não ocupa nem quebra a topbar) */}
          {mesaInfo.idMesa && !temPedidoComItens && (
            <div
              className={`flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
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
                <span className="hidden xs:inline">Tempo para o 1º pedido nesta mesa:</span>
                <span className="xs:hidden">Tempo p/ 1º pedido:</span>
              </div>
              <span className="font-mono font-extrabold px-2 py-0.5 rounded-md bg-black/10">
                {formatarTempo(tempoRestante)}
              </span>
            </div>
          )}

          {/* Active Order Tracking Banner (Responsivo para celular e desktop) */}
          {pedidoAtivoInfo && (
            <div className="bg-gradient-to-r from-amber-500/15 via-[#B78A10]/15 to-amber-500/10 border border-amber-300/80 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xs animate-fade-in">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
                  <MdTimeline size={22} />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-gray-900">
                    Você possui um pedido em andamento!
                  </p>
                  <p className="text-[11px] text-gray-600">
                    {(pedidoAtivoInfo.itens || []).filter((i) => i.status !== "Cancelado").length} itens na comanda • Status:{" "}
                    <strong className="text-[#9C1C0E]">{pedidoAtivoInfo.status}</strong>
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  const p = new URLSearchParams();
                  if (mesaInfo.idMesa) p.set("idMesa", mesaInfo.idMesa);
                  if (mesaInfo.idRestaurante) p.set("idRestaurante", mesaInfo.idRestaurante);
                  if (mesaInfo.numero) p.set("mesa", mesaInfo.numero);
                  navigate(`/tracking/${pedidoAtivoInfo.idPedido}?${p.toString()}`);
                }}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#9C1C0E] hover:bg-[#7a160b] text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all cursor-pointer w-full sm:w-auto"
              >
                <span>Acompanhar Pedidos</span>
                <span>➔</span>
              </button>
            </div>
          )}

          {/* Search bar */}
          <CampoPesquisa valor={termoBusca} onChange={setTermoBusca} />

          {/* Category Filter Pills */}
          <FiltroCategorias
            categorias={categoriasDisponiveis}
            categoriaSelecionada={categoriaSelecionada}
            onSelecionarCategoria={setCategoriaSelecionada}
          />
        </div>
      </header>

      {/* ─── Main Content Container ───────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Results Info */}
        <div className="flex items-center justify-between mb-4 px-1">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            {produtosFiltrados.length}{" "}
            {produtosFiltrados.length === 1 ? "produto encontrado" : "produtos encontrados"}
          </p>
        </div>

        {/* Loading Spinner */}
        {carregando ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-10 h-10 border-4 border-[#9C1C0E] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-gray-500 font-medium">
              Carregando opções do cardápio...
            </span>
          </div>
        ) : (
          /* Responsive Product Grid */
          <GridProdutos
            produtos={produtosFiltrados}
            onSelectProduto={setProdutoSelecionado}
            termoBusca={termoBusca}
            categoriaSelecionada={categoriaSelecionada}
          />
        )}
      </main>

      {/* ─── Modal Screen 2: Item Details & Order Customization ───── */}
      {produtoSelecionado && (
        <ModalDetalhesProduto
          produto={produtoSelecionado}
          onClose={() => setProdutoSelecionado(null)}
          onAdicionarAoPedido={handleAdicionarAoPedido}
        />
      )}

      {/* ─── Floating Order Summary Drawer / Bar ──────────────────── */}
      {carrinho.length > 0 && !exibirResumoPedido && (
        <div className="fixed bottom-4 left-4 right-4 max-w-xl mx-auto z-30 animate-fade-in">
          <button
            onClick={() => setExibirResumoPedido(true)}
            className="w-full bg-[#9C1C0E] hover:bg-[#7a160b] text-white px-6 py-4 rounded-3xl shadow-2xl flex items-center justify-between gap-4 transition-all cursor-pointer transform hover:-translate-y-0.5"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center font-bold text-lg">
                {totalItensPedido}
              </div>
              <div className="text-left">
                <p className="text-xs text-white/80 font-medium">Ver pedido atual</p>
                <p className="text-sm font-bold">
                  {carrinho.length} {carrinho.length === 1 ? "item diferente" : "itens diferentes"}
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
              <span className="bg-white text-[#9C1C0E] text-xs font-bold px-3 py-1.5 rounded-xl">
                Ver detalhes
              </span>
            </div>
          </button>
        </div>
      )}

      {/* ─── Modal Resumo do Pedido Atual ─────────────────────────── */}
      {exibirResumoPedido && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden my-auto p-6 space-y-6 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center border-b pb-4 border-gray-100">
              <div className="flex items-center gap-2">
                <MdShoppingBag size={24} className="text-[#9C1C0E]" />
                <div>
                  <h3 className="text-lg font-bold text-gray-900 leading-tight">Seu Pedido</h3>
                  {mesaInfo.numero && (
                    <span className="text-xs text-gray-500 font-medium">
                      Mesa {mesaInfo.numero}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setExibirResumoPedido(false)}
                className="text-gray-400 hover:text-gray-700 p-1 cursor-pointer"
              >
                <MdClose size={24} />
              </button>
            </div>

            {carrinho.length === 0 ? (
              <p className="text-center text-gray-500 py-8 text-sm">
                Seu pedido está vazio. Selecione um item do cardápio!
              </p>
            ) : (
              <div className="space-y-4 overflow-y-auto pr-1 flex-1">
                {carrinho.map((item, index) => (
                  <div
                    key={index}
                    className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-start justify-between gap-3"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#9C1C0E]">
                          {item.quantidade}x
                        </span>
                        <span className="font-bold text-sm text-gray-900">
                          {item.produto.nome}
                        </span>
                      </div>
                      <p className="text-xs text-[#B78A10] font-semibold">
                        {(item.produto.preco * item.quantidade).toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </p>

                      {/* Removed ingredients */}
                      {item.ingredientesRemovidos && item.ingredientesRemovidos.length > 0 && (
                        <div className="mt-1 text-[11px] text-red-600 bg-red-50 p-1.5 rounded-lg border border-red-100">
                          <span className="font-bold">Sem:</span>{" "}
                          {item.ingredientesRemovidos.join(", ")}
                        </div>
                      )}

                      {/* Observation */}
                      {item.observacao && (
                        <div className="mt-1 text-[11px] text-gray-600 italic">
                          Obs: {item.observacao}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoverDoCarrinho(index)}
                      className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                      title="Remover item"
                    >
                      <MdDelete size={20} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {carrinho.length > 0 && (
              <div className="border-t pt-4 border-gray-100 space-y-4 shrink-0">
                <div className="flex justify-between items-center text-base font-extrabold text-gray-900">
                  <span>Total do Pedido:</span>
                  <span className="text-[#9C1C0E] text-xl">
                    {valorTotalPedido.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </span>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setExibirResumoPedido(false)}
                    className="flex-1 py-3 px-4 border border-gray-300 rounded-2xl text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer text-center"
                  >
                    Continuar Escolhendo
                  </button>
                  <button
                    onClick={handleFinalizarPedido}
                    disabled={enviandoPedido}
                    className="flex-1 py-3 px-4 bg-[#9C1C0E] hover:bg-[#7a160b] text-white rounded-2xl text-sm font-bold shadow-lg shadow-[#9C1C0E]/20 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <MdCheckCircle size={18} />
                    <span>{enviandoPedido ? "Enviando Pedido..." : "Finalizar Pedido"}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Footer: Powered by FastCooking ─── */}
      <footer className="mt-16 text-center text-xs text-gray-400 py-6 border-t border-gray-200/60">
        <p className="font-medium">
          Powered by <span className="font-bold text-[#9C1C0E]">FastCooking</span>
        </p>
      </footer>

      {/* ─── Modal de Instruções do Autoatendimento (Design Flexível e Responsivo) ─── */}
      {modalInstrucoes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-hidden">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col animate-fade-in border border-gray-100">
            {/* Header fixo no topo do modal */}
            <div className="flex justify-between items-center px-4 sm:px-6 py-3.5 sm:py-4 border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[#9C1C0E]/10 text-[#9C1C0E] flex items-center justify-center font-bold shrink-0">
                  <MdHelpOutline size={22} />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-extrabold text-gray-900 leading-tight">
                    Instruções de Autoatendimento
                  </h2>
                  <p className="text-[11px] sm:text-xs text-gray-500">Como funciona o seu pedido digital</p>
                </div>
              </div>
              <button
                onClick={() => setModalInstrucoes(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors text-2xl font-bold cursor-pointer"
                aria-label="Fechar instruções"
              >
                &times;
              </button>
            </div>

            {/* Conteúdo flexível com grid responsivo sem estourar altura */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3 text-xs sm:text-sm text-gray-700">
                <div className="flex items-start gap-2.5 bg-stone-50 p-3 rounded-2xl border border-stone-200/60">
                  <span className="text-lg shrink-0 mt-0.5">🍽️</span>
                  <div>
                    <strong className="text-gray-900 block font-bold text-xs sm:text-sm mb-0.5">1. Escolha seus itens</strong>
                    <span className="text-[11px] sm:text-xs text-gray-600 leading-snug block">Navegue pelas categorias ou use a busca para fotos, preços e detalhes.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 bg-stone-50 p-3 rounded-2xl border border-stone-200/60">
                  <span className="text-lg shrink-0 mt-0.5">➕</span>
                  <div>
                    <strong className="text-gray-900 block font-bold text-xs sm:text-sm mb-0.5">2. Monte seu pedido</strong>
                    <span className="text-[11px] sm:text-xs text-gray-600 leading-snug block">Personalize retirando ingredientes ou adicionando observações ao prato.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 bg-stone-50 p-3 rounded-2xl border border-stone-200/60">
                  <span className="text-lg shrink-0 mt-0.5">🚀</span>
                  <div>
                    <strong className="text-gray-900 block font-bold text-xs sm:text-sm mb-0.5">3. Envie para a cozinha</strong>
                    <span className="text-[11px] sm:text-xs text-gray-600 leading-snug block">Abra "Meu Pedido", confira e envie direto para a equipe de preparo.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 bg-stone-50 p-3 rounded-2xl border border-stone-200/60">
                  <span className="text-lg shrink-0 mt-0.5">⏱️</span>
                  <div>
                    <strong className="text-gray-900 block font-bold text-xs sm:text-sm mb-0.5">4. Acompanhe em tempo real</strong>
                    <span className="text-[11px] sm:text-xs text-gray-600 leading-snug block">Em "Acompanhar Pedidos", veja cada item até a entrega na mesa.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 bg-red-50/80 p-3 rounded-2xl border border-red-200 text-red-950">
                  <span className="text-lg shrink-0 mt-0.5">⏳</span>
                  <div>
                    <strong className="text-red-950 block font-bold text-xs sm:text-sm mb-0.5">5. Limite para o 1º pedido</strong>
                    <span className="text-[11px] sm:text-xs text-red-900 leading-snug block">
                      Você tem até <strong>10 minutos</strong> para o primeiro pedido. Após o 1º envio, a mesa fica livre de limite!
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 bg-amber-50/80 p-3 rounded-2xl border border-amber-300 text-amber-950">
                  <span className="text-lg shrink-0 mt-0.5">🛎️</span>
                  <div>
                    <strong className="text-amber-950 block font-bold text-xs sm:text-sm mb-0.5">6. Ajuda ou Fechar Mesa</strong>
                    <span className="text-[11px] sm:text-xs text-amber-900 leading-snug block">
                      Toque em <strong>"Chamar Garçom"</strong> a qualquer momento para suporte ou fechar a conta.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer fixo com botão de fechar */}
            <div className="px-4 sm:px-6 py-3 bg-gray-50/80 border-t border-gray-100 rounded-b-3xl shrink-0">
              <button
                onClick={() => setModalInstrucoes(false)}
                className="w-full py-2.5 sm:py-3 bg-[#9C1C0E] hover:bg-[#7a160b] text-white font-bold text-xs sm:text-sm rounded-xl sm:rounded-2xl shadow-md transition-all cursor-pointer"
              >
                Entendi, vamos aos pedidos!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal de Mesa Encerrada por Inatividade ─── */}
      {mesaExpiradaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 text-center space-y-4 animate-fade-in border border-gray-100">
            <div className="w-16 h-16 rounded-full bg-red-100 text-[#9C1C0E] flex items-center justify-center mx-auto shadow-inner">
              <MdAccessTime size={36} />
            </div>
            <h3 className="text-lg font-black text-gray-900 leading-tight">
              Mesa Encerrada por Inatividade
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              O tempo limite de <strong>10 minutos</strong> para realizar o primeiro pedido nesta mesa foi atingido e a sessão foi fechada automaticamente para liberar o atendimento.
            </p>
            <p className="text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200 font-medium">
              Caso ainda esteja no local, toque no botão abaixo para <strong>reabrir a mesa</strong> e continuar escolhendo seus itens no cardápio.
            </p>

            <button
              onClick={handleReabrirMesa}
              disabled={reabrindoMesa}
              className="w-full py-3.5 px-4 bg-[#9C1C0E] hover:bg-[#7a160b] text-white font-bold text-sm rounded-2xl shadow-lg shadow-[#9C1C0E]/20 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <MdRefresh size={20} className={reabrindoMesa ? "animate-spin" : ""} />
              <span>{reabrindoMesa ? "Reabrindo Mesa..." : "Reabrir Mesa e Fazer Pedido"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
