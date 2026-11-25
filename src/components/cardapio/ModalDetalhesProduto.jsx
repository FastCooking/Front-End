import { useState } from "react";
import {
  MdArrowBack,
  MdAdd,
  MdRemove,
  MdCheck,
  MdClose,
  MdCheckCircle,
  MdRemoveCircleOutline,
  MdRocketLaunch,
} from "react-icons/md";

function ModalDetalhesProduto({ produto, onClose, onAdicionarAoPedido, onPedirDireto }) {
  // Counter initialized at 1
  const [quantidade, setQuantidade] = useState(1);

  // State to track included ingredients (Map ingredientName -> boolean)
  const [ingredientesEstado, setIngredientesEstado] = useState(() => {
    const inicial = {};
    (produto?.ingredientes || []).forEach((ing) => {
      inicial[ing] = true; // all included by default
    });
    return inicial;
  });

  const [observacao, setObservacao] = useState("");
  const [adicionadoSucesso, setAdicionadoSucesso] = useState(false);

  if (!produto) return null;

  // Toggle ingredient state
  const handleToggleIngrediente = (nomeIngrediente) => {
    setIngredientesEstado((prev) => ({
      ...prev,
      [nomeIngrediente]: !prev[nomeIngrediente],
    }));
  };

  // Get list of removed ingredients
  const ingredientesRemovidos = (produto.ingredientes || []).filter(
    (ing) => !ingredientesEstado[ing]
  );

  const handleIncrementar = () => {
    setQuantidade((prev) => prev + 1);
  };

  const handleDecrementar = () => {
    setQuantidade((prev) => (prev > 1 ? prev - 1 : 1));
  };

  const precoFormatado = Number(produto.preco).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  const precoTotal = Number(produto.preco * quantidade).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  const rawImg = produto.imagem || produto.pathImage || produto.imagemUrl || produto.imagem_url;
  const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/+$/, "");
  const imagemSrc = rawImg
    ? (rawImg.startsWith("http://") || rawImg.startsWith("https://") || rawImg.startsWith("data:")
        ? rawImg
        : `${API_BASE}${rawImg.startsWith("/") ? "" : "/"}${rawImg}`)
    : "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80";

  const construirItemPedido = () => ({
    produto,
    quantidade,
    ingredientesManter: (produto.ingredientes || []).filter((ing) => ingredientesEstado[ing]),
    ingredientesRemovidos,
    observacao: observacao.trim() || undefined,
  });

  const handleAdicionar = () => {
    const itemPedido = construirItemPedido();
    if (onAdicionarAoPedido) {
      onAdicionarAoPedido(itemPedido);
    }
    setAdicionadoSucesso(true);
    setTimeout(() => {
      setAdicionadoSucesso(false);
      onClose();
    }, 400);
  };

  const handlePedirAgora = () => {
    const itemPedido = construirItemPedido();
    if (onPedirDireto) {
      onPedirDireto(itemPedido);
    } else if (onAdicionarAoPedido) {
      onAdicionarAoPedido(itemPedido);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden my-auto relative max-h-[92vh] flex flex-col">
        {/* Toast Feedback */}
        {adicionadoSucesso && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-emerald-600 text-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-bounce">
            <MdCheckCircle size={24} />
            <span className="font-semibold text-sm">
              {quantidade}x {produto.nome} adicionado(s) ao pedido!
            </span>
          </div>
        )}

        {/* Modal Header Bar for Mobile */}
        <div className="relative w-full shrink-0">
          {/* Large Image */}
          <div className="relative h-56 sm:h-72 w-full overflow-hidden bg-gray-100">
            <img
              src={imagemSrc}
              alt={produto.nome}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80";
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

            {/* Voltar button top left */}
            <button
              onClick={onClose}
              className="absolute top-4 left-4 bg-white/90 hover:bg-white text-gray-800 p-2.5 rounded-full shadow-md backdrop-blur-md transition-all cursor-pointer flex items-center justify-center gap-1"
              title="Voltar"
            >
              <MdArrowBack size={20} />
            </button>

            {/* Close button top right */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 bg-white/90 hover:bg-white text-gray-800 p-2.5 rounded-full shadow-md backdrop-blur-md transition-all cursor-pointer"
              title="Fechar"
            >
              <MdClose size={20} />
            </button>

            {/* Category Pill floating over image */}
            <span className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-xs text-[#9C1C0E] text-xs font-bold px-3 py-1 rounded-full shadow-xs border border-gray-100">
              {produto.categoria}
            </span>
          </div>
        </div>

        {/* Content Body: Scrollable area */}
        <div className="p-6 sm:p-8 space-y-6 overflow-y-auto flex-1">
          {/* Title & Price Header */}
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                {produto.nome}
              </h2>
              <p className="text-gray-500 text-sm mt-1 leading-relaxed">
                {produto.descricao}
              </p>
            </div>
            <span className="text-2xl font-black text-[#9C1C0E] shrink-0">
              {precoFormatado}
            </span>
          </div>

          {/* Section: Ingredients Customization */}
          {produto.ingredientes && produto.ingredientes.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Ingredientes do Prato
                </h4>
                <span className="text-xs text-gray-400">
                  Toque para remover algum ingrediente
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {produto.ingredientes.map((ingrediente) => {
                  const incluido = ingredientesEstado[ingrediente];
                  return (
                    <button
                      key={ingrediente}
                      type="button"
                      onClick={() => handleToggleIngrediente(ingrediente)}
                      className={`px-3 py-2 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition-all cursor-pointer ${
                        incluido
                          ? "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                          : "bg-red-50 text-red-600 border-red-200 line-through opacity-80"
                      }`}
                    >
                      {incluido ? (
                        <MdCheck size={14} className="text-emerald-500" />
                      ) : (
                        <MdRemoveCircleOutline size={14} className="text-red-500" />
                      )}
                      <span>{ingrediente}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section: Special Instructions / Observations */}
          <div className="space-y-2">
            <label
              htmlFor="observacao"
              className="text-xs font-bold uppercase tracking-wider text-gray-500 block"
            >
              Observações especiais para a cozinha
            </label>
            <textarea
              id="observacao"
              rows={2}
              placeholder="Ex: ponto da carne, pouco sal, molho à parte..."
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              className="w-full p-3.5 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-[#9C1C0E] focus:ring-1 focus:ring-[#9C1C0E] transition-all bg-gray-50/50"
            />
          </div>
        </div>

        {/* Modal Footer: Sticky Bottom Controls */}
        <div className="p-4 sm:p-6 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
          {/* Quantity Stepper */}
          <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-2xl border border-gray-200 shadow-xs w-full sm:w-auto justify-between sm:justify-start">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Quantidade:
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleDecrementar}
                disabled={quantidade <= 1}
                className="w-8 h-8 rounded-xl bg-gray-100 text-gray-700 flex items-center justify-center hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                title="Diminuir"
              >
                <MdRemove size={18} />
              </button>
              <span className="font-bold text-gray-900 text-lg w-6 text-center">
                {quantidade}
              </span>
              <button
                type="button"
                onClick={handleIncrementar}
                className="w-8 h-8 rounded-xl bg-gray-100 text-gray-700 flex items-center justify-center hover:bg-gray-200 transition-colors cursor-pointer"
                title="Aumentar"
              >
                <MdAdd size={18} />
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleAdicionar}
              className="px-5 py-3 rounded-2xl border border-gray-300 bg-white hover:bg-gray-100 text-gray-800 font-bold text-xs sm:text-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <span>+ Adicionar ({precoTotal})</span>
            </button>

            <button
              type="button"
              onClick={handlePedirAgora}
              className="px-6 py-3 rounded-2xl bg-[#9C1C0E] hover:bg-[#7a160b] text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-[#9C1C0E]/25 transition-all cursor-pointer flex items-center justify-center gap-2"
              title="Conclui o pedido diretamente em menos cliques"
            >
              <MdRocketLaunch size={18} />
              <span>Pedir e Enviar Agora ➔</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ModalDetalhesProduto;
