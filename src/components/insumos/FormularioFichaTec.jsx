import { useEffect, useState } from "react";
import { MdAdd, MdDelete, MdMenuBook } from "react-icons/md";
import { listarItensCardapio } from "../../services/cardapioService.js";
import { criarFichaTecnica } from "../../services/fichaTecnicaService.js";
import { buscarInsumos } from "../../services/insumosService.js";
import { Button, Card, Field, Input, Select, useToast } from "../ui";

function FormularioFichaTec({ idRestaurante }) {
  const [idCardapio, setIdCardapio] = useState("");
  const [insumoDaFicha, setInsumoDaFicha] = useState([]);

  const [itensCardapio, setItensCardapio] = useState([]);
  const [insumosDisponiveis, setInsumosDisponiveis] = useState([]);
  const [salvando, setSalvando] = useState(false);
  const toast = useToast();

  useEffect(() => {
    let ativo = true;
    async function carregarDados() {
      try {
        const [cardapioData, insumosData] = await Promise.all([
          listarItensCardapio(idRestaurante).catch(() => []),
          buscarInsumos().catch(() => []),
        ]);
        if (!ativo) return;
        setItensCardapio(cardapioData || []);
        setInsumosDisponiveis(insumosData || []);
      } catch {
        // Silencia erro inicial de carga opcional
      }
    }
    carregarDados();
    return () => {
      ativo = false;
    };
  }, [idRestaurante]);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!idCardapio) {
      toast.warning("Selecione um prato do cardápio.");
      return;
    }

    if (insumoDaFicha.length === 0) {
      toast.warning("Adicione ao menos um insumo à ficha técnica.");
      return;
    }

    try {
      setSalvando(true);
      const fichaTecnica = {
        idCardapio: String(idCardapio),
        insumos: insumoDaFicha.map((item) => ({
          idEstoque: String(item.idInsumo),
          quantidadeNecessaria: parseFloat(item.quantidadeNecessaria),
        })),
      };

      await criarFichaTecnica(fichaTecnica);
      toast.success("Ficha técnica salva com sucesso!");
      setIdCardapio("");
      setInsumoDaFicha([]);
    } catch (erro) {
      toast.error(erro?.message || "Erro ao salvar ficha técnica.");
    } finally {
      setSalvando(false);
    }
  }

  function addLinha() {
    setInsumoDaFicha([
      ...insumoDaFicha,
      { idInsumo: "", quantidadeNecessaria: "" },
    ]);
  }

  function removeLinha(indice) {
    setInsumoDaFicha(insumoDaFicha.filter((_, i) => i !== indice));
  }

  function atualizarLinha(indice, campo, valor) {
    setInsumoDaFicha(
      insumoDaFicha.map((item, i) =>
        i === indice ? { ...item, [campo]: valor } : item
      )
    );
  }

  return (
    <Card className="w-full max-w-xl mx-auto">
      <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-gray-100">
        <div className="w-9 h-9 rounded-xl bg-brand-soft text-brand flex items-center justify-center shrink-0">
          <MdMenuBook size={20} />
        </div>
        <div>
          <h3 className="text-sm sm:text-base font-bold text-gray-900">
            Vincular Ficha Técnica ao Prato
          </h3>
          <p className="text-xs text-gray-500">
            Defina a baixa automática de estoque por item vendido
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Prato do Cardápio" required htmlFor="idCardapio">
          {itensCardapio.length > 0 ? (
            <Select
              id="idCardapio"
              value={idCardapio}
              onChange={(e) => setIdCardapio(e.target.value)}
              required
            >
              <option value="">Selecione um prato...</option>
              {itensCardapio.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nome} (R$ {Number(item.preco).toFixed(2)})
                </option>
              ))}
            </Select>
          ) : (
            <Input
              id="idCardapio"
              type="text"
              placeholder="ID do Cardápio"
              value={idCardapio}
              onChange={(e) => setIdCardapio(e.target.value)}
              required
            />
          )}
        </Field>

        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-700">
              Insumos da Receita <span className="text-brand">*</span>
            </span>
            <Button
              type="button"
              variant="soft"
              size="xs"
              icon={MdAdd}
              onClick={addLinha}
            >
              Adicionar Insumo
            </Button>
          </div>

          {insumoDaFicha.map((item, index) => (
            <div
              key={index}
              className="flex gap-2 items-center bg-surface border border-gray-200/80 rounded-xl p-2.5"
            >
              {insumosDisponiveis.length > 0 ? (
                <Select
                  value={item.idInsumo}
                  onChange={(e) =>
                    atualizarLinha(index, "idInsumo", e.target.value)
                  }
                  className="flex-1 min-w-0 py-2 text-xs"
                  required
                >
                  <option value="">Selecione um insumo...</option>
                  {insumosDisponiveis.map((ins) => (
                    <option
                      key={ins.idEstoque || ins.id}
                      value={ins.idEstoque || ins.id}
                    >
                      {ins.nome} ({ins.unidadeMedida})
                    </option>
                  ))}
                </Select>
              ) : (
                <Input
                  type="text"
                  placeholder="ID do Insumo"
                  value={item.idInsumo}
                  onChange={(e) =>
                    atualizarLinha(index, "idInsumo", e.target.value)
                  }
                  className="flex-1 min-w-0 py-2 text-xs"
                  required
                />
              )}

              <Input
                type="number"
                step="0.001"
                min="0.001"
                placeholder="Qtd."
                value={item.quantidadeNecessaria}
                onChange={(e) =>
                  atualizarLinha(index, "quantidadeNecessaria", e.target.value)
                }
                className="w-28 min-w-0 py-2 text-xs"
                required
              />

              <button
                type="button"
                onClick={() => removeLinha(index)}
                className="p-1.5 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer shrink-0"
                title="Remover insumo"
              >
                <MdDelete size={18} />
              </button>
            </div>
          ))}

          {insumoDaFicha.length === 0 && (
            <p className="text-xs text-gray-500 text-center py-4 bg-surface rounded-xl border border-dashed border-gray-200">
              Clique em &ldquo;Adicionar Insumo&rdquo; para compor a ficha técnica.
            </p>
          )}
        </div>

        <div className="pt-2 flex justify-end">
          <Button type="submit" loading={salvando}>
            Salvar Ficha Técnica
          </Button>
        </div>
      </form>
    </Card>
  );
}

export default FormularioFichaTec;
