import { useState, useEffect, useMemo } from "react";
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
} from "react-icons/md";

import { listarItensCardapio } from "../services/cardapioService";
import {
  abrirMesa,
  criarPedido,
  adicionarItensAoPedido,
  chamarGarcom,
  obterPedidoAtivoMesa,
} from "../services/pedidoService";
import { obterRestaurantePublico } from "../services/restauranteService";
import { PRODUTOS_MOCK } from "../data/produtosMock";

import CampoPesquisa from "../components/cardapio/CampoPesquisa";
import FiltroCategorias from "../components/cardapio/FiltroCategorias";
import GridProdutos from "../components/cardapio/GridProdutos";
import ModalDetalhesProduto from "../components/cardapio/ModalDetalhesProduto";

export default function TelaAutoatendimento() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const idMesaParam = searchParams.get("idMesa") || searchParams.get("mesa");
  const idRestauranteParam = searchParams.get("idRestaurante") || searchParams.get("restaurante");
  const sessaoIdParam = searchParams.get("sessao_id") || searchParams.get("sessao");
  const numMesaParam = searchParams.get("numMesa") || searchParams.get("numero");

  // Mesa & Session info
  const [mesaInfo, setMesaInfo] = useState({
    numero: numMesaParam,
    idMesa: idMesaParam,
    idRestaurante: idRestauranteParam,
    sessao_id: sessaoIdParam,
    idPedidoAtivo: null,
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

  // Cart / Order state
  const [carrinho, setCarrinho] = useState([]);
  const [exibirResumoPedido, setExibirResumoPedido] = useState(false);
  const [enviandoPedido, setEnviandoPedido] = useState(false);
  const [chamandoGarcom, setChamandoGarcom] = useState(false);
  const [msgSucesso, setMsgSucesso] = useState(null);
  const [erro, setErro] = useState(null);

  // 1. Initialize table & load products from API
  useEffect(() => {
    let ativo = true;

    async function inicializar() {
      try {
        setCarregando(true);
        let idRest = idRestauranteParam;
        let idSessao = sessaoIdParam;
        let idPedAtivo = null;
        let numMesa = numMesaParam;
        let nomeRest = null;

        // Auto-open table if idMesaParam exists
        if (idMesaParam) {
          const mesaRes = await abrirMesa(idMesaParam).catch((err) => {
            console.warn("Não foi possível auto-abrir mesa:", err);
            return null;
          });

          if (mesaRes) {
            idRest = mesaRes.idRestaurante || idRest;
            idSessao = mesaRes.idSessao || idSessao;
            idPedAtivo = mesaRes.idPedidoAtivo;
            numMesa = mesaRes.numero || numMesa;
            if (mesaRes.nomeRestaurante) {
              nomeRest = mesaRes.nomeRestaurante;
            }
          }

          // Busca pedido/comanda ativo na mesa para o tracking
          const comandaAtiva = await obterPedidoAtivoMesa(idMesaParam).catch(() => null);
          if (ativo && comandaAtiva && comandaAtiva.idPedido && comandaAtiva.status !== "Fechado" && comandaAtiva.status !== "Cancelado") {
            setPedidoAtivoInfo(comandaAtiva);
            if (!idPedAtivo) idPedAtivo = comandaAtiva.idPedido;
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
          setMesaInfo({
            numero: numMesa,
            idMesa: idMesaParam,
            idRestaurante: idRest,
            sessao_id: idSessao || `sessao-${Date.now()}`,
            idPedidoAtivo: idPedAtivo,
          });
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
  }, [idMesaParam, idRestauranteParam, sessaoIdParam, numMesaParam]);

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
      navigate(`/tracking/${pedidoId}`);
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
          <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => navigate("/")}
                className="p-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-white/80 transition-all cursor-pointer"
                title="Voltar ao início"
              >
                <MdArrowBack size={22} />
              </button>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-[#9C1C0E] tracking-tight leading-tight">
                  {nomeRestaurante || "Cardápio"}
                </h1>
                {mesaInfo.numero ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-[#B78A10] bg-[#B78A10]/15 px-2.5 py-0.5 rounded-md">
                    <MdTableBar size={14} /> Mesa {mesaInfo.numero}
                  </span>
                ) : (
                  <span className="text-[11px] text-gray-400">Autoatendimento</span>
                )}
              </div>
            </div>

            {/* Actions: Instruções + Chamar Garçom + Meu Pedido */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setModalInstrucoes(true)}
                className="p-2 sm:p-2.5 rounded-2xl bg-white border border-gray-200 text-gray-600 hover:text-[#9C1C0E] hover:border-[#9C1C0E] shadow-xs transition-all cursor-pointer shrink-0"
                title="Como funciona o autoatendimento"
              >
                <MdHelpOutline size={20} />
              </button>

              {mesaInfo.idMesa && (
                <button
                  onClick={handleChamarGarcom}
                  disabled={chamandoGarcom}
                  className="flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs sm:text-sm font-bold rounded-2xl shadow-xs transition-all cursor-pointer disabled:opacity-50 shrink-0"
                  title="Chamar garçom para a sua mesa"
                >
                  <MdNotificationsActive size={18} className={chamandoGarcom ? "animate-spin" : ""} />
                  <span>{chamandoGarcom ? "Chamando..." : "Chamar Garçom"}</span>
                </button>
              )}

              {/* Cart Icon Badge */}
              <button
                onClick={() => setExibirResumoPedido(true)}
                className="relative flex items-center gap-2 px-3.5 sm:px-4 py-2 bg-[#9C1C0E]/10 text-[#9C1C0E] hover:bg-[#9C1C0E]/20 rounded-2xl transition-all cursor-pointer font-semibold text-xs sm:text-sm shrink-0"
              >
                <MdShoppingBag size={20} />
                <span className="hidden sm:inline">Meu Pedido</span>
                {totalItensPedido > 0 && (
                  <span className="bg-[#9C1C0E] text-white text-xs font-extrabold w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                    {totalItensPedido}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Active Order Tracking Banner */}
          {pedidoAtivoInfo && (
            <div className="bg-gradient-to-r from-amber-500/15 via-[#B78A10]/15 to-amber-500/10 border border-amber-300/80 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-xs animate-fade-in">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shrink-0">
                  <MdTimeline size={20} />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-gray-900">
                    Você possui um pedido em andamento!
                  </p>
                  <p className="text-[11px] text-gray-600">
                    {pedidoAtivoInfo.itens?.filter((i) => i.status !== "Cancelado").length || 0} itens na comanda • Status: <strong className="text-[#9C1C0E]">{pedidoAtivoInfo.status}</strong>
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
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#9C1C0E] hover:bg-[#7a160b] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <span>Acompanhar Preparo</span>
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

      {/* ─── Modal de Instruções do Autoatendimento ─── */}
      {modalInstrucoes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 sm:p-8 animate-fade-in">
            <div className="flex justify-between items-center mb-5 border-b pb-3 border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#9C1C0E]/10 text-[#9C1C0E] flex items-center justify-center font-bold">
                  <MdHelpOutline size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-gray-900">
                    Instruções de Autoatendimento
                  </h2>
                  <p className="text-xs text-gray-500">Como funciona o seu pedido digital</p>
                </div>
              </div>
              <button
                onClick={() => setModalInstrucoes(false)}
                className="text-gray-400 hover:text-gray-700 text-2xl font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3.5 text-xs sm:text-sm text-gray-700">
              <div className="flex items-start gap-3 bg-stone-50 p-3 rounded-2xl border border-stone-200/60">
                <span className="text-xl">🍽️</span>
                <div>
                  <strong className="text-gray-900 block font-bold mb-0.5">1. Escolha seus itens</strong>
                  <span>Navegue pelas categorias ou busque pratos e bebidas para ver fotos, preços e ingredientes.</span>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-stone-50 p-3 rounded-2xl border border-stone-200/60">
                <span className="text-xl">➕</span>
                <div>
                  <strong className="text-gray-900 block font-bold mb-0.5">2. Monte seu pedido</strong>
                  <span>Clique nos itens para personalizar observações (retirar algum ingrediente) e adicione ao carrinho.</span>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-stone-50 p-3 rounded-2xl border border-stone-200/60">
                <span className="text-xl">🚀</span>
                <div>
                  <strong className="text-gray-900 block font-bold mb-0.5">3. Envie para a cozinha</strong>
                  <span>Abra "Meu Pedido", confira os itens e finalize. O pedido é enviado em tempo real para a equipe da cozinha!</span>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-stone-50 p-3 rounded-2xl border border-stone-200/60">
                <span className="text-xl">⏱️</span>
                <div>
                  <strong className="text-gray-900 block font-bold mb-0.5">4. Acompanhe em tempo real</strong>
                  <span>Na tela de tracking, acompanhe o preparo de cada prato até a entrega na sua mesa.</span>
                </div>
              </div>

              {/* Alerta de Fechamento de Mesa e Ajuda */}
              <div className="flex items-start gap-3 bg-amber-50 p-3.5 rounded-2xl border border-amber-300 text-amber-950 shadow-xs">
                <span className="text-2xl">🛎️</span>
                <div>
                  <strong className="text-amber-950 block font-bold mb-0.5">Fechamento de Mesa e Ajuda</strong>
                  <span className="text-xs text-amber-900 leading-relaxed block">
                    Para <strong>solicitar o fechamento da conta/mesa</strong>, tirar dúvidas ou pedir ajuda com seus pedidos, basta tocar no botão <strong>"Chamar Garçom"</strong> no topo da tela a qualquer momento!
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => setModalInstrucoes(false)}
                className="w-full py-3 bg-[#9C1C0E] hover:bg-[#7a160b] text-white font-bold text-sm rounded-2xl shadow-md transition-all cursor-pointer"
              >
                Entendi, vamos aos pedidos!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
