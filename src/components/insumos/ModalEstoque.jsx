import { useState } from "react";
import { MdInventory } from "react-icons/md";
import { atualizarInsumo, criarInsumos } from "../../services/insumosService";
import { Button, Field, Input, Modal, Select } from "../ui";

const UNIDADES = [
  { label: "Quilograma (kg)", value: "kg" },
  { label: "Grama (g)", value: "g" },
  { label: "Litro (l)", value: "l" },
  { label: "Mililitro (ml)", value: "ml" },
  { label: "Unidade (un)", value: "un" },
  { label: "Pacote (pct)", value: "pct" },
  { label: "Caixa (cx)", value: "cx" },
];

const MAPA_UNIDADES = {
  kg: "kg",
  quilo: "kg",
  quilograma: "kg",
  quilogramas: "kg",
  g: "g",
  gr: "g",
  grama: "g",
  gramas: "g",
  l: "l",
  lt: "l",
  litro: "l",
  litros: "l",
  ml: "ml",
  mililitro: "ml",
  mililitros: "ml",
  un: "un",
  und: "un",
  unid: "un",
  unidade: "un",
  unidades: "un",
  pct: "pct",
  pacote: "pct",
  pacotes: "pct",
  cx: "cx",
  caixa: "cx",
  caixas: "cx",
};

function normalizarUnidade(valor) {
  if (!valor) return "kg";
  const limpo = String(valor).trim().toLowerCase();
  return MAPA_UNIDADES[limpo] || limpo;
}

function ModalEstoque({ item, idRestaurante, onClose, onSuccess }) {
  const [nome, setNome] = useState(item?.nome || "");
  const [quantidadeEmEstoque, setQuantidadeEmEstoque] = useState(
    item?.quantidadeEmEstoque !== undefined && item?.quantidadeEmEstoque !== null
      ? String(item.quantidadeEmEstoque)
      : ""
  );
  const [quantidadeMinima, setQuantidadeMinima] = useState(
    item?.quantidadeMinima !== undefined && item?.quantidadeMinima !== null
      ? String(item.quantidadeMinima)
      : ""
  );
  const [unidadeMedida, setUnidadeMedida] = useState(
    normalizarUnidade(item?.unidadeMedida || item?.unidade)
  );

  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  const [prevItem, setPrevItem] = useState(item);
  if (item !== prevItem) {
    setPrevItem(item);
    if (item) {
      setNome(item.nome || "");
      setQuantidadeEmEstoque(
        item.quantidadeEmEstoque !== undefined && item.quantidadeEmEstoque !== null
          ? String(item.quantidadeEmEstoque)
          : ""
      );
      setQuantidadeMinima(
        item.quantidadeMinima !== undefined && item.quantidadeMinima !== null
          ? String(item.quantidadeMinima)
          : ""
      );
      setUnidadeMedida(normalizarUnidade(item.unidadeMedida || item.unidade));
    } else {
      setNome("");
      setQuantidadeEmEstoque("");
      setQuantidadeMinima("");
      setUnidadeMedida("kg");
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");

    if (
      !nome.trim() ||
      quantidadeEmEstoque === "" ||
      quantidadeMinima === "" ||
      !unidadeMedida
    ) {
      setErro("Preencha todos os campos marcados com *.");
      return;
    }

    const qtdEstoque = parseFloat(quantidadeEmEstoque);
    const qtdMin = parseFloat(quantidadeMinima);

    if (isNaN(qtdEstoque) || qtdEstoque < 0) {
      setErro("A quantidade em estoque não pode ser negativa.");
      return;
    }

    if (isNaN(qtdMin) || qtdMin < 0) {
      setErro("A quantidade mínima não pode ser negativa.");
      return;
    }

    setCarregando(true);

    try {
      const dadosEstoque = {
        nome: nome.trim(),
        quantidadeEmEstoque: qtdEstoque,
        quantidadeMinima: qtdMin,
        unidadeMedida,
        idRestaurante: idRestaurante || item?.idRestaurante,
      };

      if (item && (item.idEstoque || item.id)) {
        await atualizarInsumo(item.idEstoque || item.id, dadosEstoque);
      } else {
        await criarInsumos(dadosEstoque);
      }

      onSuccess();
    } catch (err) {
      setErro(err.message || "Não foi possível salvar o item no estoque.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={item ? "Editar Item do Estoque" : "Novo Item no Estoque"}
      icon={MdInventory}
      size="lg"
    >
      {erro && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-xl mb-4 text-xs sm:text-sm font-medium">
          {erro}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Nome do Item no Estoque" required>
          <Input
            type="text"
            required
            maxLength={150}
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex: Queijo Muçarela Ralado"
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Quantidade Atual" required>
            <Input
              type="number"
              required
              min="0"
              step="0.001"
              value={quantidadeEmEstoque}
              onChange={(e) => setQuantidadeEmEstoque(e.target.value)}
              placeholder="0"
            />
          </Field>

          <Field label="Quantidade Mínima (Alerta)" required>
            <Input
              type="number"
              required
              min="0"
              step="0.001"
              value={quantidadeMinima}
              onChange={(e) => setQuantidadeMinima(e.target.value)}
              placeholder="0"
            />
          </Field>
        </div>

        <Field label="Unidade de Medida" required>
          <Select
            value={unidadeMedida}
            onChange={(e) => setUnidadeMedida(e.target.value)}
          >
            {UNIDADES.map((u) => (
              <option key={u.value} value={u.value}>
                {u.label}
              </option>
            ))}
          </Select>
        </Field>

        <div className="flex justify-end gap-2.5 pt-4 border-t border-gray-100">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={carregando}>
            {item ? "Salvar Alterações" : "Cadastrar no Estoque"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default ModalEstoque;
