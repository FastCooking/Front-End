import { useState, useEffect } from "react";
import { MdRestaurantMenu, MdAddPhotoAlternate, MdDelete, MdAdd } from "react-icons/md";
import {
  criarItemCardapio,
  atualizarItemCardapio,
} from "../../services/cardapioService";
import { buscarInsumos } from "../../services/insumosService";
import {
  criarFichaTecnica,
  atualizarFichaTecnicaPorCardapio,
  buscarFichaTecnicaCompleta,
} from "../../services/fichaTecnicaService";

function ModalCardapio({ item, idRestaurante, onClose, onSuccess }) {
  const [nome, setNome] = useState("");
  const [preco, setPreco] = useState("");
  const [categoria, setCategoria] = useState("Pratos Principais");
  const [descricao, setDescricao] = useState("");
  const [disponivel, setDisponivel] = useState(true);

  // Estado da foto
  const [pathImage, setPathImage] = useState("");
  const [arquivoImagem, setArquivoImagem] = useState(null);
  const [previewImagem, setPreviewImagem] = useState("");

  // Estado dos insumos (Ficha Técnica do Prato)
  const [insumosEstoque, setInsumosEstoque] = useState([]);
  const [insumosPrato, setInsumosPrato] = useState([]);

  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  const CATEGORIAS_PADRAO = [
    "Pratos Principais",
    "Entradas",
    "Sobremesas",
    "Bebidas",
    "Acompanhamentos",
    "Outros",
  ];

  const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

  // 1. Carregar Insumos de Estoque e Ficha Técnica Existente
  useEffect(() => {
    async function carregarInsumosE_Ficha() {
      try {
        const insumosData = await buscarInsumos().catch(() => []);
        setInsumosEstoque(insumosData || []);

        if (item && item.id) {
          try {
            const ficha = await buscarFichaTecnicaCompleta(item.id);
            if (ficha && Array.isArray(ficha.insumos)) {
              setInsumosPrato(
                ficha.insumos.map((i) => ({
                  idEstoque: String(i.idEstoque || i.id),
                  quantidadeNecessaria: String(i.quantidadeNecessaria || i.quantidade),
                }))
              );
            }
          } catch (e) {
            console.log("Ficha técnica não encontrada para o prato:", e.message);
          }
        }
      } catch (err) {
        console.error("Erro ao carregar insumos de estoque:", err);
      }
    }

    carregarInsumosE_Ficha();
  }, [item]);

  // 2. Preencher formulário ao editar item
  useEffect(() => {
    if (item) {
      setNome(item.nome || "");
      setPreco(item.preco ? String(item.preco) : "");
      setCategoria(item.categoria || "Pratos Principais");
      setDescricao(item.descricao || "");
      setDisponivel(item.disponivel !== undefined ? item.disponivel : true);
      setPathImage(item.pathImage || "");
      if (item.pathImage) {
        setPreviewImagem(
          item.pathImage.startsWith("http")
            ? item.pathImage
            : `${API_BASE}${item.pathImage}`
        );
      }
    }
  }, [item, API_BASE]);

  // Handler de alteração do arquivo de imagem
  function handleImageChange(e) {
    const file = e.target.files[0];
    if (file) {
      setArquivoImagem(file);
      setPreviewImagem(URL.createObjectURL(file));
    }
  }

  // Funções de manipulador de Insumos do Prato
  function addInsumoLinha() {
    setInsumosPrato([...insumosPrato, { idEstoque: "", quantidadeNecessaria: "" }]);
  }

  function removeInsumoLinha(index) {
    setInsumosPrato(insumosPrato.filter((_, i) => i !== index));
  }

  function updateInsumoLinha(index, field, value) {
    const novos = insumosPrato.map((row, i) => {
      if (i === index) {
        return { ...row, [field]: value };
      }
      return row;
    });
    setInsumosPrato(novos);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");

    if (!nome.trim() || !preco || !categoria.trim()) {
      setErro("Preencha todos os campos obrigatórios (*).");
      return;
    }

    const valorPreco = parseFloat(preco);
    if (isNaN(valorPreco) || valorPreco <= 0) {
      setErro("O preço deve ser um valor numérico positivo maior que zero.");
      return;
    }

    setCarregando(true);

    try {
      const dadosItem = {
        nome: nome.trim(),
        preco: valorPreco,
        categoria: categoria.trim(),
        descricao: descricao.trim() || null,
        pathImage: pathImage || null,
        disponivel,
      };

      if (idRestaurante) {
        dadosItem.idRestaurante = Number(idRestaurante);
      }

      let resItem;
      if (item && item.id) {
        resItem = await atualizarItemCardapio(item.id, dadosItem, arquivoImagem);
      } else {
        resItem = await criarItemCardapio(dadosItem, arquivoImagem);
      }

      const idCardapioSalvo = resItem.idCardapio || resItem.id || (item && item.id);

      // Salvar/Atualizar Insumos (Ficha Técnica) do Prato
      if (idCardapioSalvo && insumosPrato.length > 0) {
        const insumosFormatados = insumosPrato
          .filter((i) => i.idEstoque && i.quantidadeNecessaria)
          .map((i) => ({
            idEstoque: parseInt(i.idEstoque),
            quantidadeNecessaria: parseFloat(i.quantidadeNecessaria),
          }));

        if (insumosFormatados.length > 0) {
          const payloadFicha = {
            idCardapio: parseInt(idCardapioSalvo),
            insumos: insumosFormatados,
          };

          try {
            await atualizarFichaTecnicaPorCardapio(idCardapioSalvo, payloadFicha);
          } catch (e) {
            await criarFichaTecnica(payloadFicha);
          }
        }
      }

      onSuccess();
    } catch (err) {
      console.error("Erro ao salvar item do cardápio:", err);
      setErro(err.message || "Não foi possível salvar o item do cardápio.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 md:p-8 my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4 border-b pb-3 border-[#B78A10]/30">
          <h2 className="text-xl font-bold text-[#9C1C0E] flex items-center gap-2">
            <MdRestaurantMenu size={24} />
            {item ? "Editar Item do Cardápio" : "Novo Item do Cardápio"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-2xl font-bold cursor-pointer"
          >
            &times;
          </button>
        </div>

        {erro && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-lg mb-4 text-sm">
            {erro}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Upload de Imagem com compressão de 60% */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Foto do Prato / Item (Compressão automática a 60% de resolução no servidor)
            </label>
            <div className="flex items-center gap-4 border border-dashed border-gray-300 p-3 rounded-xl bg-gray-50">
              {previewImagem ? (
                <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200 shrink-0">
                  <img src={previewImagem} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setArquivoImagem(null);
                      setPreviewImagem("");
                      setPathImage("");
                    }}
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-0.5 shadow-md hover:bg-red-700"
                    title="Remover foto"
                  >
                    <MdDelete size={14} />
                  </button>
                </div>
              ) : (
                <div className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 bg-white shrink-0">
                  <MdAddPhotoAlternate size={30} />
                  <span className="text-[10px] text-center mt-1">Sem Imagem</span>
                </div>
              )}

              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#9C1C0E]/10 file:text-[#9C1C0E] hover:file:bg-[#9C1C0E]/20 cursor-pointer"
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  Formatos aceitos: JPG, PNG, WEBP. A imagem antiga será removida do servidor ao substituir.
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Nome do Item <span className="text-[#9C1C0E]">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={150}
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Lasanha Bolonhesa Especial"
              className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:border-[#9C1C0E] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Preço (R$) <span className="text-[#9C1C0E]">*</span>
              </label>
              <input
                type="number"
                required
                min="0.01"
                step="0.01"
                value={preco}
                onChange={(e) => setPreco(e.target.value)}
                placeholder="0,00"
                className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:border-[#9C1C0E] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Categoria <span className="text-[#9C1C0E]">*</span>
              </label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:border-[#9C1C0E] focus:outline-none bg-white"
              >
                {CATEGORIAS_PADRAO.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Descrição (Opcional)
            </label>
            <textarea
              rows={2}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descreva os ingredientes, modo de preparo ou acompanhamentos..."
              className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:border-[#9C1C0E] focus:outline-none"
            />
          </div>

          {/* Seção Insumos do Prato (Ficha Técnica) */}
          <div className="bg-[#F9ECE5]/60 border border-[#B78A10]/30 rounded-xl p-4 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-[#9C1C0E] uppercase tracking-wide">
                Insumos do Prato (Ingredientes do Estoque)
              </h3>
              <button
                type="button"
                onClick={addInsumoLinha}
                className="flex items-center gap-1 text-xs text-[#9C1C0E] font-semibold hover:underline cursor-pointer"
              >
                <MdAdd size={16} /> Adicionar Insumo
              </button>
            </div>

            {insumosPrato.map((row, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-white p-2 rounded-lg shadow-xs">
                <select
                  value={row.idEstoque}
                  onChange={(e) => updateInsumoLinha(idx, "idEstoque", e.target.value)}
                  className="flex-1 min-w-0 border border-gray-300 rounded-md p-1.5 text-xs bg-white focus:outline-none"
                  required
                >
                  <option value="">Selecione um insumo do estoque...</option>
                  {insumosEstoque.map((ins) => (
                    <option key={ins.idEstoque || ins.id} value={ins.idEstoque || ins.id}>
                      {ins.nome} ({ins.unidadeMedida})
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  placeholder="Qtd. Necessária"
                  value={row.quantidadeNecessaria}
                  onChange={(e) => updateInsumoLinha(idx, "quantidadeNecessaria", e.target.value)}
                  className="w-28 min-w-0 border border-gray-300 rounded-md p-1.5 text-xs focus:outline-none"
                  required
                />

                <button
                  type="button"
                  onClick={() => removeInsumoLinha(idx)}
                  className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                  title="Remover insumo"
                >
                  <MdDelete size={18} />
                </button>
              </div>
            ))}

            {insumosPrato.length === 0 && (
              <p className="text-[11px] text-gray-500 italic text-center py-2">
                Nenhum insumo vinculado a este prato ainda. Clique em "+ Adicionar Insumo" acima.
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="disponivelCheck"
              checked={disponivel}
              onChange={(e) => setDisponivel(e.target.checked)}
              className="w-4 h-4 text-[#9C1C0E] accent-[#9C1C0E] rounded cursor-pointer"
            />
            <label htmlFor="disponivelCheck" className="text-xs font-semibold text-gray-700 cursor-pointer">
              Disponível no cardápio do restaurante
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={carregando}
              className="px-6 py-2 text-sm rounded-lg bg-[#9C1C0E] text-white hover:bg-[#7a160b] font-semibold cursor-pointer disabled:opacity-50"
            >
              {carregando ? "Salvando..." : item ? "Salvar Alterações" : "Cadastrar Item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ModalCardapio;
