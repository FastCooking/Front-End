import { useEffect, useState } from "react";
import { MdInventory2 } from "react-icons/md";
import { buscarInsumos } from "../../services/insumosService.js";
import { Badge, Card, EmptyState, PageHeader, Spinner, useToast } from "../ui";

function ListaInsumo() {
  const [insumos, setInsumos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const toast = useToast();

  useEffect(() => {
    let ativo = true;
    async function carregarInsumos() {
      try {
        setCarregando(true);
        const dados = await buscarInsumos();
        if (ativo) setInsumos(dados || []);
      } catch (erro) {
        if (ativo) toast.error(erro?.message || "Erro ao buscar insumos.");
      } finally {
        if (ativo) setCarregando(false);
      }
    }
    carregarInsumos();
    return () => {
      ativo = false;
    };
  }, [toast]);

  return (
    <div className="space-y-5">
      <PageHeader title="Insumos Cadastrados" icon={MdInventory2} />

      {carregando ? (
        <Card className="py-12 flex justify-center">
          <Spinner size="lg" label="Carregando insumos..." />
        </Card>
      ) : insumos.length === 0 ? (
        <Card>
          <EmptyState
            icon={MdInventory2}
            title="Nenhum insumo cadastrado"
            description="Cadastre ingredientes na aba de cadastro para visualizá-los aqui."
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {insumos.map((insumo, index) => {
            const estoqueBaixo =
              Number(insumo.quantidadeEmEstoque) <= Number(insumo.quantidadeMinima);

            return (
              <Card
                key={insumo.idEstoque || insumo.id || index}
                className={estoqueBaixo ? "border-red-300 bg-red-50/40" : ""}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h2 className="font-bold text-base text-gray-900 truncate">
                    {insumo.nome}
                  </h2>
                  <Badge tone={estoqueBaixo ? "danger" : "success"}>
                    {estoqueBaixo ? "Estoque Baixo" : "Normal"}
                  </Badge>
                </div>
                <div className="space-y-1 text-xs text-gray-600">
                  <p>
                    Estoque atual:{" "}
                    <strong className="text-gray-900">
                      {insumo.quantidadeEmEstoque} {insumo.unidadeMedida}
                    </strong>
                  </p>
                  <p>
                    Mínimo recomendado:{" "}
                    <strong className="text-gray-900">
                      {insumo.quantidadeMinima} {insumo.unidadeMedida}
                    </strong>
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ListaInsumo;
