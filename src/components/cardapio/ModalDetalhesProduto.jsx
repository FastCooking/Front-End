import { useEffect, useState } from "react";
import {
  MdAdd,
  MdArrowBack,
  MdCheck,
  MdClose,
  MdRemove,
  MdRemoveCircleOutline,
} from "react-icons/md";
import { FALLBACK_FOOD_SVG, resolverImagem } from "../../config/api";
import { Button, Textarea, useToast } from "../ui";

function ModalDetalhesProduto({ produto, onClose, onAdicionarAoPedido }) {
  const toast = useToast();
  const [quantidade, setQuantidade] = useState(1);
  const [ingredientesEstado, setIngredientesEstado] = useState(() => {
    const inicial = {};
    (produto?.ingredientes || []).forEach((ing) => {
      inicial[ing] = true;
    });
    return inicial;
  });
  const [observacao, setObservacao] = useState("");

  useEffect(() => {
    if (!produto) return;
    function handleKeyDown(e) {
      if (e.key === "Escape" && onClose) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [produto, onClose]);

  if (!produto) return null;

  const handleToggleIngrediente = (nomeIngrediente) => {
    setIngredientesEstado((prev) => ({
      ...prev,
      [nomeIngrediente]: !prev[nomeIngrediente],
    }));
  };

  const ingredientesRemovidos = (produto.ingredientes || []).filter(
    (ing) => !ingredientesEstado[ing]
  );

  const precoFormatado = Number(produto.preco).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  const precoTotal = Number(produto.preco * quantidade).toLocaleString(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    }
  );

  const rawImg =
    produto.imagem ||
    produto.pathImage ||
    produto.imagemUrl ||
    produto.imagem_url;
  const imagemSrc = resolverImagem(rawImg);

  const handleAdicionar = () => {
    const itemPedido = {
      produto,
      quantidade,
      ingredientesManter: (produto.ingredientes || []).filter(
        (ing) => ingredientesEstado[ing]
      ),
      ingredientesRemovidos,
      observacao: observacao.trim() || undefined,
    };

    if (onAdicionarAoPedido) {
      onAdicionarAoPedido(itemPedido);
    }

    toast.success(`${quantidade}x ${produto.nome} adicionado ao pedido!`);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden my-auto relative max-h-[92vh] flex flex-col border border-gray-100 animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Image */}
        <div className="relative h-60 sm:h-72 w-full overflow-hidden bg-brand-soft/40 shrink-0">
          <img
            src={imagemSrc}
            alt={produto.nome}
            width={800}
            height={600}
            className="w-full h-full object-cover"
            onError={(e) => {
              if (e.currentTarget.src !== FALLBACK_FOOD_SVG) {
                e.currentTarget.src = FALLBACK_FOOD_SVG;
              }
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 left-4 bg-white/95 hover:bg-white text-gray-800 px-3 py-2 rounded-full shadow-sm transition-colors cursor-pointer flex items-center gap-1"
            title="Voltar"
          >
            <MdArrowBack size={20} />
            <span className="text-xs font-semibold hidden sm:inline">
              Voltar
            </span>
          </button>

          <span className="absolute top-4 right-4 bg-brand text-white text-xs font-bold px-3.5 py-1.5 rounded-full shadow-xs">
            {produto.categoria}
          </span>

          <div className="absolute bottom-4 left-4 right-4 text-white">
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              {produto.nome}
            </h2>
            <p className="text-lg sm:text-xl font-bold text-amber-300 mt-0.5">
              {precoFormatado}
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {produto.descricao && (
            <div>
              <h3 className="text-xs font-bold text-brand uppercase tracking-wider mb-1">
                Descrição
              </h3>
              <p className="text-gray-700 text-sm leading-relaxed">
                {produto.descricao}
              </p>
            </div>
          )}

          {produto.ingredientes && produto.ingredientes.length > 0 && (
            <div className="space-y-3 pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide">
                  Personalização do Pedido
                </h3>
                <span className="text-xs text-gray-500">
                  Toque para remover ingredientes
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {produto.ingredientes.map((ingrediente) => {
                  const estaPresente = ingredientesEstado[ingrediente];
                  return (
                    <button
                      key={ingrediente}
                      type="button"
                      onClick={() => handleToggleIngrediente(ingrediente)}
                      className={`flex items-center justify-between p-3 rounded-xl border text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                        estaPresente
                          ? "bg-white border-gray-200 text-gray-800 hover:border-brand/40"
                          : "bg-red-50/60 border-red-200 text-red-700 line-through opacity-75"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center ${
                            estaPresente
                              ? "bg-brand text-white"
                              : "bg-red-200 text-red-600"
                          }`}
                        >
                          {estaPresente ? (
                            <MdCheck size={14} />
                          ) : (
                            <MdClose size={14} />
                          )}
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

              {ingredientesRemovidos.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-3.5">
                  <div className="flex items-center gap-2 text-red-800 font-semibold text-xs uppercase tracking-wider mb-2">
                    <MdRemoveCircleOutline size={17} className="text-red-600" />
                    <span>Ingredientes removidos:</span>
                  </div>
                  <ul className="flex flex-wrap gap-1.5">
                    {ingredientesRemovidos.map((ing) => (
                      <li
                        key={ing}
                        className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-1 rounded-lg border border-red-200"
                      >
                        • {ing}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="pt-3 border-t border-gray-100">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">
              Observações para a cozinha (opcional)
            </label>
            <Textarea
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Ex: Ponto da carne, sem gelo, molho à parte..."
              rows={2}
              maxLength={150}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-gray-50/80 border-t border-gray-100 shrink-0">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-2xl border border-gray-200 w-full sm:w-auto justify-between sm:justify-start">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Quantidade:
              </span>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() =>
                    setQuantidade((prev) => (prev > 1 ? prev - 1 : 1))
                  }
                  disabled={quantidade <= 1}
                  className="w-8 h-8 rounded-xl bg-surface text-gray-700 flex items-center justify-center hover:bg-brand-soft hover:text-brand disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  title="Diminuir"
                >
                  <MdRemove size={18} />
                </button>
                <span className="font-bold text-gray-900 text-base w-6 text-center">
                  {quantidade}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantidade((prev) => prev + 1)}
                  className="w-8 h-8 rounded-xl bg-surface text-gray-700 flex items-center justify-center hover:bg-brand-soft hover:text-brand transition-colors cursor-pointer"
                  title="Aumentar"
                >
                  <MdAdd size={18} />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <Button
                variant="secondary"
                size="lg"
                onClick={onClose}
                className="flex-1 sm:flex-none"
              >
                Voltar
              </Button>
              <Button
                size="lg"
                onClick={handleAdicionar}
                className="flex-1 sm:flex-none"
              >
                <span>Adicionar</span>
                <span className="bg-white/20 px-2 py-0.5 rounded-md text-xs font-extrabold">
                  {precoTotal}
                </span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ModalDetalhesProduto;
