import { useState } from "react";
import { MdAdd } from "react-icons/md";
import { criarInsumos } from "../../services/insumosService.js";
import { Button, Card, Field, Input, PageHeader, Select, useToast } from "../ui";

function FormularioInsumo() {
  const [nome, setNome] = useState("");
  const [quantidadeEmEstoque, setQuantidadeEmEstoque] = useState("");
  const [quantidadeMinima, setQuantidadeMinima] = useState("");
  const [unidadeMedida, setUnidadeMedida] = useState("");
  const [salvando, setSalvando] = useState(false);
  const toast = useToast();

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      setSalvando(true);
      const dadosConvertidos = {
        nome: nome.trim(),
        quantidadeEmEstoque: parseFloat(quantidadeEmEstoque),
        quantidadeMinima: parseFloat(quantidadeMinima),
        unidadeMedida,
      };

      await criarInsumos(dadosConvertidos);
      toast.success("Insumo cadastrado com sucesso!");
      setNome("");
      setQuantidadeEmEstoque("");
      setQuantidadeMinima("");
      setUnidadeMedida("");
    } catch (error) {
      toast.error(error?.message || "Erro ao cadastrar insumo.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-5">
      <PageHeader
        title="Novo Insumo de Estoque"
        subtitle="Cadastre ingredientes e defina o limite mínimo para alerta"
      />
      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Nome do Insumo" required htmlFor="nome">
            <Input
              id="nome"
              type="text"
              placeholder="Ex: Farinha de Trigo"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Quantidade em Estoque" required htmlFor="quantidadeEmEstoque">
              <Input
                id="quantidadeEmEstoque"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={quantidadeEmEstoque}
                onChange={(e) => setQuantidadeEmEstoque(e.target.value)}
                required
              />
            </Field>

            <Field label="Quantidade Mínima" required htmlFor="quantidadeMinima">
              <Input
                id="quantidadeMinima"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={quantidadeMinima}
                onChange={(e) => setQuantidadeMinima(e.target.value)}
                required
              />
            </Field>
          </div>

          <Field label="Unidade de Medida" required htmlFor="unidadeMedida">
            <Select
              id="unidadeMedida"
              value={unidadeMedida}
              onChange={(e) => setUnidadeMedida(e.target.value)}
              required
            >
              <option value="">Selecione...</option>
              <option value="kg">Quilograma (kg)</option>
              <option value="g">Grama (g)</option>
              <option value="l">Litro (l)</option>
              <option value="ml">Mililitro (ml)</option>
              <option value="un">Unidade (un)</option>
            </Select>
          </Field>

          <div className="pt-2 flex justify-end">
            <Button type="submit" loading={salvando} icon={MdAdd}>
              Cadastrar Insumo
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default FormularioInsumo;
