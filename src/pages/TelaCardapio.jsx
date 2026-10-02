import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { PRODUTOS_MOCK } from "../data/produtosMock";
import CampoPesquisa from "../components/cardapio/CampoPesquisa";
import FiltroCategorias from "../components/cardapio/FiltroCategorias";
import GridProdutos from "../components/cardapio/GridProdutos";
import ModalDetalhesProduto from "../components/cardapio/ModalDetalhesProduto";
import {
  MdShoppingBag,
  MdArrowBack,
  MdDelete,
  MdClose,
  MdCheckCircle
} from "react-icons/md";

export default function TelaCardapio() {
  const navigate = useNavigate();

  // Filter & Search states
  const [categoriaSelecionada, setCategoriaSelecionada] = useState("Todos");
  const [termoBusca, setTermoBusca] = useState("");

  // Product detail modal state
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);

  // Cart / Order state
  const [carrinho, setCarrinho] = useState([]);
  const [exibirResumoPedido, setExibirResumoPedido] = useState(false);

  // Real-time filtering logic
  const produtosFiltrados = useMemo(() => {
    return PRODUTOS_MOCK.filter((produto) => {
      const atendeCategoria =
        categoriaSelecionada === "Todos" || produto.categoria === categoriaSelecionada;

      const atendeBusca = produto.nome
        .toLowerCase()
        .includes(termoBusca.toLowerCase().trim());

      return atendeCategoria && atendeBusca;
    });
  }, [categoriaSelecionada, termoBusca]);

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
    (total, item) => total + item.produto.preco * item.quantidade,
    0
  );

  return (
    <div className="min-h-screen bg-[#FAF6F3] font-[Poppins] text-gray-800 pb-24">
      {/* ─── Sticky Top Header Container (Always visible on scroll) ────── */}
      <header className="sticky top-0 z-40 bg-[#FAF6F3]/95 backdrop-blur-md border-b border-gray-200/80 shadow-xs pt-3 pb-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
          {/* Top Bar with Restaurant Name Title & Cart Icon */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/')}
                className="p-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-white/80 transition-all cursor-pointer"
                title="Voltar ao início"
              >
                <MdArrowBack size={22} />
              </button>
              {/* Restaurant Name Title instead of logo */}
              <h1 className="text-xl sm:text-2xl font-black text-[#9C1C0E] tracking-tight">
                FastCooking
              </h1>
            </div>

            {/* Cart Icon Badge */}
            <button
              onClick={() => setExibirResumoPedido(true)}
              className="relative flex items-center gap-2 px-4 py-2 bg-[#9C1C0E]/10 text-[#9C1C0E] hover:bg-[#9C1C0E]/20 rounded-2xl transition-all cursor-pointer font-semibold text-sm"
            >
              <MdShoppingBag size={22} />
              <span className="hidden sm:inline">Meu Pedido</span>
              {totalItensPedido > 0 && (
                <span className="bg-[#9C1C0E] text-white text-xs font-extrabold w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                  {totalItensPedido}
                </span>
              )}
            </button>
          </div>

          {/* Real-time Search Field & Category Filters (Sticky with header) */}
          <div className="space-y-2">
            <CampoPesquisa valor={termoBusca} onChange={setTermoBusca} />
            <FiltroCategorias
              categoriaSelecionada={categoriaSelecionada}
              onSelecionarCategoria={setCategoriaSelecionada}
            />
          </div>
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

        {/* Responsive Product Grid */}
        <GridProdutos
          produtos={produtosFiltrados}
          onSelectProduto={setProdutoSelecionado}
          termoBusca={termoBusca}
          categoriaSelecionada={categoriaSelecionada}
        />
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
        <div className="fixed bottom-4 left-4 right-4 max-w-xl mx-auto z-30">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden my-auto p-6 space-y-6">
            <div className="flex justify-between items-center border-b pb-4 border-gray-100">
              <div className="flex items-center gap-2">
                <MdShoppingBag size={24} className="text-[#9C1C0E]" />
                <h3 className="text-lg font-bold text-gray-900">Seu Pedido</h3>
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
              <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
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

                      {/* Display removed ingredients in order item */}
                      {item.ingredientesRemovidos && item.ingredientesRemovidos.length > 0 && (
                        <div className="mt-2 text-[11px] text-red-600 bg-red-50 p-2 rounded-lg border border-red-100">
                          <span className="font-bold">Sem:</span>{" "}
                          {item.ingredientesRemovidos.join(", ")}
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
              <div className="border-t pt-4 border-gray-100 space-y-4">
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
                    onClick={() => {
                      alert("Pedido finalizado com sucesso! (Modo de Simulação Frontend)");
                      setCarrinho([]);
                      setExibirResumoPedido(false);
                    }}
                    className="flex-1 py-3 px-4 bg-[#9C1C0E] hover:bg-[#7a160b] text-white rounded-2xl text-sm font-bold shadow-lg shadow-[#9C1C0E]/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <MdCheckCircle size={18} />
                    Finalizar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
