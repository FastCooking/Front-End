import { useState } from "react";
import {
  MdArrowBack,
  MdAdd,
  MdRemove,
  MdCheck,
  MdClose,
  MdCheckCircle,
  MdRemoveCircleOutline
} from "react-icons/md";

function ModalDetalhesProduto({ produto, onClose, onAdicionarAoPedido }) {
  if (!produto) return null;

  // Counter initialized at 1
  const [quantidade, setQuantidade] = useState(1);

  // State to track included ingredients (Map ingredientName -> boolean)
  const [ingredientesEstado, setIngredientesEstado] = useState(() => {
    const inicial = {};
    (produto.ingredientes || []).forEach((ing) => {
      inicial[ing] = true; // all included by default
    });
    return inicial;
  });

  const [adicionadoSucesso, setAdicionadoSucesso] = useState(false);

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

  const handleAdicionar = () => {
    const itemPedido = {
      produto,
      quantidade,
      ingredientesManter: (produto.ingredientes || []).filter((ing) => ingredientesEstado[ing]),
      ingredientesRemovidos,
    };

    if (onAdicionarAoPedido) {
      onAdicionarAoPedido(itemPedido);
    }

    setAdicionadoSucesso(true);
    setTimeout(() => {
      setAdicionadoSucesso(false);
      onClose();
    }, 1500);
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
          <div className="relative h-64 sm:h-80 w-full overflow-hidden bg-gray-100">
            <img
              src={produto.imagem}
              alt={produto.nome}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

            {/* Voltar button top left */}
            <button
              onClick={onClose}
              className="absolute top-4 left-4 bg-white/90 hover:bg-white text-gray-800 p-2.5 rounded-full shadow-md backdrop-blur-md transition-all cursor-pointer flex items-center justify-center gap-1"
              title="Voltar"
            >
              <MdArrowBack size={22} />
              <span className="text-xs font-semibold pr-1 hidden sm:inline">Voltar</span>
            </button>

            {/* Category Badge top right */}
            <span className="absolute top-4 right-4 bg-[#9C1C0E] text-white text-xs font-bold px-3.5 py-1.5 rounded-full shadow-md">
              {produto.categoria}
            </span>

            {/* Product Name & Price overlay on image bottom */}
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {produto.nome}
              </h2>
              <p className="text-xl sm:text-2xl font-bold text-[#B78A10] mt-1 drop-shadow-md">
                {precoFormatado}
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Body Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* Descrição */}
          <div>
            <h3 className="text-xs font-bold text-[#9C1C0E] uppercase tracking-wider mb-1.5">
              Descrição
            </h3>
            <p className="text-gray-700 text-sm sm:text-base leading-relaxed">
              {produto.descricao}
            </p>
          </div>

          {/* Personalização do Pedido / Lista de Ingredientes */}
          {produto.ingredientes && produto.ingredientes.length > 0 && (
            <div className="space-y-4 pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                  Personalização do Pedido
                </h3>
                <span className="text-xs text-gray-500">
                  Clique para remover ingredientes
                </span>
              </div>

              {/* Interactive Ingredient List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {produto.ingredientes.map((ingrediente) => {
                  const estaPresente = ingredientesEstado[ingrediente];
                  return (
                    <button
                      key={ingrediente}
                      type="button"
                      onClick={() => handleToggleIngrediente(ingrediente)}
                      className={`flex items-center justify-between p-3 rounded-xl border text-sm font-medium transition-all duration-200 cursor-pointer ${
                        estaPresente
                          ? "bg-white border-gray-200 text-gray-800 hover:border-[#9C1C0E]/40"
                          : "bg-red-50/60 border-red-200 text-red-700 line-through opacity-75"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                            estaPresente
                              ? "bg-[#9C1C0E] text-white"
                              : "bg-red-200 text-red-600"
                          }`}
                        >
                          {estaPresente ? <MdCheck size={14} /> : <MdClose size={14} />}
                        </div>
                        <span>{ingrediente}</span>
                      </div>
                      <span className="text-xs text-gray-400">
                        {estaPresente ? "Remover" : "Restaurar"}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Seção Ingredientes Removidos */}
              {ingredientesRemovidos.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mt-4 animate-fade-in">
                  <div className="flex items-center gap-2 text-red-800 font-semibold text-xs uppercase tracking-wider mb-2">
                    <MdRemoveCircleOutline size={18} className="text-red-600" />
                    <span>Ingredientes removidos:</span>
                  </div>
                  <ul className="flex flex-wrap gap-2">
                    {ingredientesRemovidos.map((ing) => (
                      <li
                        key={ing}
                        className="bg-red-100 text-red-800 text-xs font-medium px-3 py-1 rounded-lg border border-red-200 flex items-center gap-1.5"
                      >
                        <span>• {ing}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions (Contador + Botões Voltar & Adicionar) */}
        <div className="p-4 sm:p-5 bg-gray-50 border-t border-gray-100 shrink-0 space-y-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Quantity Counter initialized at 1 */}
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
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-5 py-3 rounded-2xl border border-gray-300 text-gray-700 font-semibold text-sm hover:bg-gray-100 transition-colors cursor-pointer text-center"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleAdicionar}
                className="flex-1 sm:flex-none px-6 py-3 rounded-2xl bg-[#9C1C0E] hover:bg-[#7a160b] text-white font-bold text-sm shadow-lg shadow-[#9C1C0E]/25 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Adicionar ao Pedido</span>
                <span className="bg-white/20 px-2 py-0.5 rounded-md text-xs font-extrabold">
                  {precoTotal}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ModalDetalhesProduto;
