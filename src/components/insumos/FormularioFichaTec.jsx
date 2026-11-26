import { useEffect, useState } from "react";
import { MdAdd, MdDelete, MdMenuBook } from "react-icons/md";
import { listarItensCardapio } from "../../services/cardapioService.js";
import {
  atualizarFichaTecnicaPorCardapio,
  buscarFichaTecnicaCompleta,
  criarFichaTecnica,
} from "../../services/fichaTecnicaService.js";
import { buscarInsumos } from "../../services/insumosService.js";
import { Button, Card, Field, Input, Select, useToast } from "../ui";

function FormularioFichaTec({ idRestaurante }) {
  const [idCardapio, setIdCardapio] = useState("");
  const [insumoDaFicha, setInsumoDaFicha] = useState([]);
  const [carregandoFicha, setCarregandoFicha] = useState(false);

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

  useEffect(() => {
    let ativo = true;
    async function carregarFichaDoPrato() {
      if (!idCardapio) {
        setInsumoDaFicha([]);
        return;
      }
      setCarregandoFicha(true);
      try {
        const ficha = await buscarFichaTecnicaCompleta(idCardapio);
        if (!ativo) return;
        if (ficha && Array.isArray(ficha.insumos) && ficha.insumos.length > 0) {
          setInsumoDaFicha(
            ficha.insumos.map((i) => ({
              idInsumo: String(i.idEstoque || i.id || ""),
              nome: i.nome || "",
              unidadeMedida: i.unidadeMedida || "UN",
              quantidadeNecessaria: String(
                i.quantidadeNecessaria ?? i.quantidade ?? ""
              ),
            }))
          );
        } else {
          setInsumoDaFicha([]);
        }
      } catch {
        if (ativo) setInsumoDaFicha([]);
      } finally {
        if (ativo) setCarregandoFicha(false);
      }
    }
    carregarFichaDoPrato();
    return () => {
      ativo = false;
    };
  }, [idCardapio]);

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

      try {
        await atualizarFichaTecnicaPorCardapio(idCardapio, fichaTecnica);
      } catch {
        await criarFichaTecnica(fichaTecnica);
      }
      toast.success("Ficha técnica salva com sucesso!");
    } catch (erro) {
      toast.error(erro?.message || "Erro ao salvar ficha técnica.");
    } finally {
      setSalvando(false);
    }
  }

  function addLinha() {
    setInsumoDaFicha([
      ...insumoDaFicha,
      { idInsumo: "", nome: "", unidadeMedida: "UN", quantidadeNecessaria: "" },
    ]);
  }

  function removeLinha(indice) {
    setInsumoDaFicha(insumoDaFicha.filter((_, i) => i !== indice));
  }

  function atualizarLinha(indice, campo, valor) {
    setInsumoDaFicha(
      insumoDaFicha.map((item, i) => {
        if (i !== indice) return item;
        if (campo === "idInsumo") {
          const encontrado = insumosDisponiveis.find(
            (ins) => String(ins.idEstoque || ins.id) === String(valor)
          );
          return {
            ...item,
            idInsumo: valor,
            nome: encontrado?.nome || item.nome || "",
            unidadeMedida: encontrado?.unidadeMedida || item.unidadeMedida || "UN",
          };
        }
        return { ...item, [campo]: valor };
      })
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-gray-100">
        <div className="w-9 h-9 rounded-xl bg-brand-soft text-brand flex items-center justify-center shrink-0">
          <MdMenuBook size={20} />
        </div>
        <div>
          <h3 className="text-sm sm:text-base font-bold text-gray-900">
            Vincular Ficha Técnica ao Prato
          </h3>
          <p className="text-xs text-gray-500">
            Defina a baixa automática de estoque quando o prato ficar pronto
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
              {itensCardapio.map((item) => {
                const idItem = String(item.idCardapio || item.id);
                return (
                  <option key={idItem} value={idItem}>
                    {item.nome} (R$ {Number(item.preco).toFixed(2)})
                  </option>
                );
              })}
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

          {insumoDaFicha.length > 0 && (
            <div className="grid grid-cols-[minmax(0,1fr)_96px_36px] gap-2 px-2.5 text-[11px] font-semibold text-gray-500">
              <span>Item do Estoque (Insumo)</span>
              <span>Quantidade</span>
              <span />
            </div>
          )}

          {carregandoFicha ? (
            <p className="text-xs text-gray-500 text-center py-4 bg-surface rounded-xl border border-gray-200">
              Carregando insumos atribuídos ao prato...
            </p>
          ) : (
            insumoDaFicha.map((item, index) => {
              const insumoNaLista = insumosDisponiveis.some(
                (ins) =>
                  String(ins.idEstoque || ins.id) === String(item.idInsumo)
              );
              return (
                <div
                  key={index}
                  className="grid grid-cols-[minmax(0,1fr)_96px_36px] gap-2 items-center bg-surface border border-gray-200/80 rounded-xl p-2.5"
                >
                  {insumosDisponiveis.length > 0 || item.idInsumo ? (
                    <Select
                      value={item.idInsumo}
                      onChange={(e) =>
                        atualizarLinha(index, "idInsumo", e.target.value)
                      }
                      className="w-full min-w-0 py-2 px-3 text-xs truncate"
                      required
                    >
                      <option value="">Selecione um insumo...</option>
                      {!insumoNaLista && item.idInsumo && (
                        <option value={item.idInsumo}>
                          {item.nome ||
                            `Insumo #${String(item.idInsumo).slice(0, 8)}`}{" "}
                          ({item.unidadeMedida || "UN"})
                        </option>
                      )}
                      {insumosDisponiveis.map((ins) => (
                        <option
                          key={ins.idEstoque || ins.id}
                          value={String(ins.idEstoque || ins.id)}
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
                      className="w-full min-w-0 py-2 px-3 text-xs"
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
                      atualizarLinha(
                        index,
                        "quantidadeNecessaria",
                        e.target.value
                      )
                    }
                    className="w-24 py-2 px-2.5 text-xs text-center"
                    required
                  />

                  <button
                    type="button"
                    onClick={() => removeLinha(index)}
                    className="p-1.5 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer shrink-0 flex items-center justify-center"
                    title="Remover insumo"
                  >
                    <MdDelete size={18} />
                  </button>
                </div>
              );
            })
          )}

          {!carregandoFicha && insumoDaFicha.length === 0 && (
            <p className="text-xs text-gray-500 text-center py-4 bg-surface rounded-xl border border-dashed border-gray-200">
              Clique em &ldquo;Adicionar Insumo&rdquo; para compor a ficha
              técnica.
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
