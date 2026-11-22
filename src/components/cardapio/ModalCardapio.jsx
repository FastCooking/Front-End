import { useEffect, useState } from "react";
import {
  MdAdd,
  MdAddPhotoAlternate,
  MdDelete,
  MdRestaurantMenu,
} from "react-icons/md";
import { resolverImagem } from "../../config/api";
import {
  atualizarItemCardapio,
  criarItemCardapio,
} from "../../services/cardapioService";
import {
  atualizarFichaTecnicaPorCardapio,
  buscarFichaTecnicaCompleta,
  criarFichaTecnica,
} from "../../services/fichaTecnicaService";
import { buscarInsumos } from "../../services/insumosService";
import { Button, Field, Input, Modal, Select, Textarea } from "../ui";

const CATEGORIAS_PADRAO = [
  "Pratos Principais",
  "Entradas",
  "Lanches",
  "Pizzas",
  "Bebidas",
  "Sobremesas",
  "Acompanhamentos",
  "Porções",
  "Combos",
  "Outros",
];

function ModalCardapio({ item, idRestaurante, onClose, onSuccess }) {
  const itemId = item?.idCardapio || item?.id;

  const itemNome = item?.nome || item?.name || "";
  const itemPreco =
    item?.preco !== undefined && item?.preco !== null
      ? String(item.preco)
      : item?.price !== undefined && item?.price !== null
      ? String(item.price)
      : "";
  const itemTempo =
    item?.tempoPreparo !== undefined && item?.tempoPreparo !== null
      ? String(item.tempoPreparo)
      : item?.tempo_preparo !== undefined && item?.tempo_preparo !== null
      ? String(item.tempo_preparo)
      : "15";
  const itemCategoria =
    item?.categoria || item?.category || "Pratos Principais";
  const itemDescricao = item?.descricao || item?.description || "";
  const itemDisponivel =
    item?.disponivel !== undefined
      ? Boolean(item.disponivel)
      : item?.status !== undefined
      ? Boolean(item.status)
      : true;
  const itemImg =
    item?.pathImage || item?.imagemUrl || item?.imagem || item?.imagem_url || "";

  const [nome, setNome] = useState(itemNome);
  const [preco, setPreco] = useState(itemPreco);
  const [tempoPreparo, setTempoPreparo] = useState(itemTempo);
  const [categoria, setCategoria] = useState(itemCategoria);
  const [descricao, setDescricao] = useState(itemDescricao);
  const [disponivel, setDisponivel] = useState(itemDisponivel);

  const [pathImage, setPathImage] = useState(itemImg);
  const [arquivoImagem, setArquivoImagem] = useState(null);
  const [previewImagem, setPreviewImagem] = useState(
    itemImg ? resolverImagem(itemImg, "") : ""
  );

  const [insumosEstoque, setInsumosEstoque] = useState([]);
  const [insumosPrato, setInsumosPrato] = useState([]);

  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  const [prevItem, setPrevItem] = useState(item);
  if (item !== prevItem) {
    setPrevItem(item);
    if (item) {
      setNome(itemNome);
      setPreco(itemPreco);
      setTempoPreparo(itemTempo);
      setCategoria(itemCategoria);
      setDescricao(itemDescricao);
      setDisponivel(itemDisponivel);
      setPathImage(itemImg);
      setPreviewImagem(itemImg ? resolverImagem(itemImg, "") : "");
      setArquivoImagem(null);
      if (item.insumos && Array.isArray(item.insumos)) {
        setInsumosPrato(
          item.insumos.map((i) => ({
            idEstoque: String(i.idEstoque || i.id || ""),
            nome: i.nome || "",
            unidadeMedida: i.unidadeMedida || "UN",
            quantidadeNecessaria: String(
              i.quantidadeNecessaria ?? i.quantidade ?? ""
            ),
          }))
        );
      }
    } else {
      setNome("");
      setPreco("");
      setTempoPreparo("15");
      setCategoria("Pratos Principais");
      setDescricao("");
      setDisponivel(true);
      setPathImage("");
      setPreviewImagem("");
      setArquivoImagem(null);
      setInsumosPrato([]);
    }
  }

  useEffect(() => {
    let ativo = true;
    async function carregarInsumosEFicha() {
      try {
        const insumosData = await buscarInsumos().catch(() => []);
        if (!ativo) return;
        setInsumosEstoque(insumosData || []);

        if (itemId) {
          try {
            const ficha = await buscarFichaTecnicaCompleta(itemId);
            if (
              ativo &&
              ficha &&
              Array.isArray(ficha.insumos) &&
              ficha.insumos.length > 0
            ) {
              setInsumosPrato(
                ficha.insumos.map((i) => ({
                  idEstoque: String(i.idEstoque || i.id || ""),
                  nome: i.nome || "",
                  unidadeMedida: i.unidadeMedida || "UN",
                  quantidadeNecessaria: String(
                    i.quantidadeNecessaria ?? i.quantidade ?? ""
                  ),
                }))
              );
            }
          } catch {
            // Ficha técnica opcional ainda não cadastrada
          }
        }
      } catch {
        // Silencia erro de insumos
      }
    }

    carregarInsumosEFicha();
    return () => {
      ativo = false;
    };
  }, [itemId]);

  const listaCategorias = Array.from(
    new Set([...CATEGORIAS_PADRAO, categoria, itemCategoria].filter(Boolean))
  );

  function handleImageChange(e) {
    const file = e.target.files[0];
    if (file) {
      setArquivoImagem(file);
      setPreviewImagem(URL.createObjectURL(file));
    }
  }

  function addInsumoLinha() {
    setInsumosPrato([
      ...insumosPrato,
      { idEstoque: "", quantidadeNecessaria: "" },
    ]);
  }

  function removeInsumoLinha(index) {
    setInsumosPrato(insumosPrato.filter((_, i) => i !== index));
  }

  function updateInsumoLinha(index, field, value) {
    setInsumosPrato(
      insumosPrato.map((row, i) =>
        i === index ? { ...row, [field]: value } : row
      )
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");

    if (!nome.trim() || !preco || !categoria.trim() || !tempoPreparo) {
      setErro("Preencha todos os campos obrigatórios (*).");
      return;
    }

    const valorPreco = parseFloat(preco);
    if (isNaN(valorPreco) || valorPreco <= 0) {
      setErro("O preço deve ser um valor numérico positivo maior que zero.");
      return;
    }

    const valorTempo = parseInt(tempoPreparo, 10);
    if (isNaN(valorTempo) || valorTempo <= 0) {
      setErro(
        "O tempo de preparo deve ser um número inteiro em minutos maior que zero."
      );
      return;
    }

    setCarregando(true);

    try {
      const dadosItem = {
        nome: nome.trim(),
        preco: valorPreco,
        tempoPreparo: valorTempo,
        categoria: categoria.trim(),
        descricao: descricao.trim() || null,
        pathImage: pathImage || null,
        disponivel,
      };

      if (idRestaurante) {
        dadosItem.idRestaurante = String(idRestaurante);
      }

      let resItem;
      if (itemId) {
        resItem = await atualizarItemCardapio(itemId, dadosItem, arquivoImagem);
      } else {
        resItem = await criarItemCardapio(dadosItem, arquivoImagem);
      }

      const idCardapioSalvo = resItem.idCardapio || resItem.id || itemId;

      if (idCardapioSalvo && insumosPrato.length > 0) {
        const insumosFormatados = insumosPrato
          .filter((i) => i.idEstoque && i.quantidadeNecessaria)
          .map((i) => ({
            idEstoque: String(i.idEstoque),
            quantidadeNecessaria: parseFloat(i.quantidadeNecessaria),
          }));

        if (insumosFormatados.length > 0) {
          const payloadFicha = {
            idCardapio: String(idCardapioSalvo),
            insumos: insumosFormatados,
          };

          try {
            await atualizarFichaTecnicaPorCardapio(
              idCardapioSalvo,
              payloadFicha
            );
          } catch {
            await criarFichaTecnica(payloadFicha);
          }
        }
      }

      onSuccess();
    } catch (err) {
      setErro(err.message || "Não foi possível salvar o item do cardápio.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={itemId ? "Editar Item do Cardápio" : "Novo Item do Cardápio"}
      icon={MdRestaurantMenu}
      size="2xl"
    >
      {erro && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-xl mb-4 text-xs sm:text-sm font-medium">
          {erro}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Foto do Prato / Item">
          <div className="flex items-center gap-4 border border-dashed border-gray-300 p-3 rounded-2xl bg-surface">
            {previewImagem ? (
              <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200 shrink-0">
                <img
                  src={previewImagem}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setArquivoImagem(null);
                    setPreviewImagem("");
                    setPathImage("");
                  }}
                  className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-0.5 shadow-sm hover:bg-red-700 cursor-pointer"
                  title="Remover foto"
                >
                  <MdDelete size={14} />
                </button>
              </div>
            ) : (
              <div className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 bg-white shrink-0">
                <MdAddPhotoAlternate size={26} />
                <span className="text-[10px] text-center mt-1">Sem Imagem</span>
              </div>
            )}

            <div className="flex-1 min-w-0">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="block w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-3.5 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-brand-soft file:text-brand hover:file:bg-brand/15 cursor-pointer"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Formatos aceitos: JPG, PNG, WEBP.
              </p>
            </div>
          </div>
        </Field>

        <Field label="Nome do Item" required>
          <Input
            type="text"
            required
            maxLength={150}
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex: Lasanha Bolonhesa Especial"
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Preço (R$)" required>
            <Input
              type="number"
              required
              min="0.01"
              step="0.01"
              value={preco}
              onChange={(e) => setPreco(e.target.value)}
              placeholder="0,00"
            />
          </Field>

          <Field label="Tempo de Preparo (min)" required>
            <Input
              type="number"
              required
              min="1"
              step="1"
              value={tempoPreparo}
              onChange={(e) => setTempoPreparo(e.target.value)}
              placeholder="15"
            />
          </Field>

          <Field label="Categoria" required>
            <Select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
            >
              {listaCategorias.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Descrição (Opcional)">
          <Textarea
            rows={2}
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Descreva os ingredientes, modo de preparo ou acompanhamentos..."
          />
        </Field>

        <div className="bg-brand-soft/50 border border-gold/25 rounded-2xl p-4 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-brand uppercase tracking-wide">
              Insumos do Prato (Ficha Técnica)
            </h3>
            <Button
              type="button"
              variant="soft"
              size="xs"
              icon={MdAdd}
              onClick={addInsumoLinha}
            >
              Adicionar Insumo
            </Button>
          </div>

          {insumosPrato.length > 0 && (
            <div className="grid grid-cols-[minmax(0,1fr)_96px_32px] gap-2 px-2 text-[11px] font-semibold text-gray-500">
              <span>Insumo atribuído</span>
              <span>Quantidade</span>
              <span />
            </div>
          )}

          {insumosPrato.map((row, idx) => {
            const insumoJaNaLista = insumosEstoque.some(
              (ins) => String(ins.idEstoque || ins.id) === String(row.idEstoque)
            );
            return (
              <div
                key={idx}
                className="grid grid-cols-[minmax(0,1fr)_96px_32px] items-center gap-2 bg-white p-2 rounded-xl border border-gray-200/80"
              >
                <Select
                  value={row.idEstoque}
                  onChange={(e) =>
                    updateInsumoLinha(idx, "idEstoque", e.target.value)
                  }
                  className="w-full min-w-0 py-1.5 px-2.5 text-xs truncate"
                  required
                >
                  <option value="">Selecione um insumo do estoque...</option>
                  {!insumoJaNaLista && row.idEstoque && (
                    <option value={row.idEstoque}>
                      {row.nome || `Insumo #${String(row.idEstoque).slice(0, 8)}`} (
                      {row.unidadeMedida || "UN"})
                    </option>
                  )}
                  {insumosEstoque.map((ins) => (
                    <option
                      key={ins.idEstoque || ins.id}
                      value={String(ins.idEstoque || ins.id)}
                    >
                      {ins.nome} ({ins.unidadeMedida})
                    </option>
                  ))}
                </Select>

                <Input
                  type="number"
                  step="0.001"
                  min="0.001"
                  placeholder="Qtd."
                  value={row.quantidadeNecessaria}
                  onChange={(e) =>
                    updateInsumoLinha(idx, "quantidadeNecessaria", e.target.value)
                  }
                  className="w-24 py-1.5 px-2.5 text-xs text-center"
                  required
                />

                <button
                  type="button"
                  onClick={() => removeInsumoLinha(idx)}
                  className="text-gray-400 hover:text-red-600 p-1 cursor-pointer shrink-0 flex items-center justify-center"
                  title="Remover insumo"
                >
                  <MdDelete size={18} />
                </button>
              </div>
            );
          })}

          {insumosPrato.length === 0 && (
            <p className="text-xs text-gray-500 text-center py-2">
              Nenhum insumo vinculado a este prato ainda.
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="disponivelCheck"
            checked={disponivel}
            onChange={(e) => setDisponivel(e.target.checked)}
            className="w-4 h-4 accent-brand rounded cursor-pointer"
          />
          <label
            htmlFor="disponivelCheck"
            className="text-xs font-semibold text-gray-700 cursor-pointer"
          >
            Disponível no cardápio do restaurante
          </label>
        </div>

        <div className="flex justify-end gap-2.5 pt-4 border-t border-gray-100">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={carregando}>
            {itemId ? "Salvar Alterações" : "Cadastrar Item"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default ModalCardapio;
