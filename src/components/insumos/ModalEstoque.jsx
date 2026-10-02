import { useState } from "react";
import { MdInventory } from "react-icons/md";
import { criarInsumos, atualizarInsumo } from "../../services/insumosService";

function ModalEstoque({ item, onClose, onSuccess }) {
  const [nome, setNome] = useState("");
  const [quantidadeEmEstoque, setQuantidadeEmEstoque] = useState("");
  const [quantidadeMinima, setQuantidadeMinima] = useState("");
  const [unidadeMedida, setUnidadeMedida] = useState("kg");

  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  const UNIDADES = [
    { label: "Quilograma (kg)", value: "kg" },
    { label: "Grama (g)", value: "g" },
    { label: "Litro (l)", value: "l" },
    { label: "Mililitro (ml)", value: "ml" },
    { label: "Unidade (un)", value: "un" },
    { label: "Pacote (pct)", value: "pct" },
    { label: "Caixa (cx)", value: "cx" },
  ];

  const [prevItem, setPrevItem] = useState(item);
  if (item !== prevItem) {
    setPrevItem(item);
    if (item) {
      setNome(item.nome || "");
      setQuantidadeEmEstoque(item.quantidadeEmEstoque ? String(item.quantidadeEmEstoque) : "");
      setQuantidadeMinima(item.quantidadeMinima ? String(item.quantidadeMinima) : "");
      setUnidadeMedida(item.unidadeMedida || "kg");
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

    if (!nome.trim() || quantidadeEmEstoque === "" || quantidadeMinima === "" || !unidadeMedida) {
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
      };

      if (item && (item.idEstoque || item.id)) {
        await atualizarInsumo(item.idEstoque || item.id, dadosEstoque);
      } else {
        await criarInsumos(dadosEstoque);
      }

      onSuccess();
    } catch (err) {
      console.error("Erro ao salvar item no estoque:", err);
      setErro(err.message || "Não foi possível salvar o item no estoque.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 md:p-8">
        <div className="flex justify-between items-center mb-4 border-b pb-3 border-[#B78A10]/30">
          <h2 className="text-xl font-bold text-[#9C1C0E] flex items-center gap-2">
            <MdInventory size={24} />
            {item ? "Editar Item do Estoque" : "Novo Item no Estoque"}
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Nome do Item no Estoque <span className="text-[#9C1C0E]">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={150}
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Queijo Muçarela Ralado"
              className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:border-[#9C1C0E] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Quantidade Atual <span className="text-[#9C1C0E]">*</span>
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.001"
                value={quantidadeEmEstoque}
                onChange={(e) => setQuantidadeEmEstoque(e.target.value)}
                placeholder="0"
                className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:border-[#9C1C0E] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Quantidade Mínima (Alerta) <span className="text-[#9C1C0E]">*</span>
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.001"
                value={quantidadeMinima}
                onChange={(e) => setQuantidadeMinima(e.target.value)}
                placeholder="0"
                className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:border-[#9C1C0E] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Unidade de Medida <span className="text-[#9C1C0E]">*</span>
            </label>
            <select
              value={unidadeMedida}
              onChange={(e) => setUnidadeMedida(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:border-[#9C1C0E] focus:outline-none bg-white"
            >
              {UNIDADES.map((u) => (
                <option key={u.value} value={u.value}>
                  {u.label}
                </option>
              ))}
            </select>
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
              {carregando ? "Salvando..." : item ? "Salvar Alterações" : "Cadastrar no Estoque"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ModalEstoque;
