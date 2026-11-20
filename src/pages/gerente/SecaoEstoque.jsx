import { useMemo, useState } from "react";
import {
  MdAdd,
  MdDelete,
  MdEdit,
  MdInventory,
  MdListAlt,
  MdReceipt,
  MdSearch,
  MdWarning,
} from "react-icons/md";
import FormularioFichaTec from "../../components/insumos/FormularioFichaTec";
import ModalEstoque from "../../components/insumos/ModalEstoque";
import {
  Badge,
  Button,
  DataTable,
  Input,
  PageHeader,
  Pills,
  useConfirm,
  useToast,
} from "../../components/ui";
import { excluirInsumo } from "../../services/insumosService";

export default function SecaoEstoque({
  itensEstoque,
  carregando,
  idRestauranteGerente,
  onRecarregar,
}) {
  const toast = useToast();
  const confirm = useConfirm();

  const [abaEstoque, setAbaEstoque] = useState("lista");
  const [buscaEstoque, setBuscaEstoque] = useState("");
  const [modalEstoque, setModalEstoque] = useState(false);
  const [itemEdicao, setItemEdicao] = useState(null);

  const itensFiltrados = useMemo(
    () =>
      itensEstoque.filter((item) => {
        if (buscaEstoque.trim()) {
          const termo = buscaEstoque.toLowerCase().trim();
          return item.nome?.toLowerCase().includes(termo);
        }
        return true;
      }),
    [itensEstoque, buscaEstoque]
  );

  async function handleExcluirEstoque(insumo) {
    const id = insumo.idEstoque || insumo.id;
    const ok = await confirm({
      title: "Remover Item do Estoque",
      message: `Deseja realmente remover o item "${insumo.nome}" do estoque?`,
      confirmText: "Remover Item",
      tone: "danger",
    });
    if (!ok) return;

    try {
      await excluirInsumo(id);
      toast.success(`Item "${insumo.nome}" removido do estoque!`);
      onRecarregar();
    } catch (err) {
      toast.error(err.message || "Erro ao remover insumo.");
    }
  }

  const colunas = [
    {
      key: "nome",
      header: "Nome do Insumo / Estoque",
      cellClassName: "font-semibold text-gray-900",
    },
    {
      key: "quantidadeEmEstoque",
      header: "Quantidade Atual",
      render: (insumo) => (
        <span className="font-mono text-sm">
          {insumo.quantidadeEmEstoque} {insumo.unidadeMedida}
        </span>
      ),
    },
    {
      key: "quantidadeMinima",
      header: "Qtd. Mínima",
      render: (insumo) => (
        <span className="font-mono text-sm text-gray-600">
          {insumo.quantidadeMinima} {insumo.unidadeMedida}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status de Estoque",
      render: (insumo) => {
        const estoqueBaixo =
          Number(insumo.quantidadeEmEstoque) <=
          Number(insumo.quantidadeMinima);
        return estoqueBaixo ? (
          <Badge tone="danger" icon={MdWarning}>
            Estoque Baixo
          </Badge>
        ) : (
          <Badge tone="success">Normal</Badge>
        );
      },
    },
    {
      key: "acoes",
      header: "Ações",
      align: "right",
      render: (insumo) => (
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => {
              setItemEdicao(insumo);
              setModalEstoque(true);
            }}
            className="p-1.5 rounded-xl text-gray-600 hover:text-brand hover:bg-brand-soft transition-colors cursor-pointer"
            title="Editar Item de Estoque"
          >
            <MdEdit size={18} />
          </button>

          <button
            type="button"
            onClick={() => handleExcluirEstoque(insumo)}
            className="p-1.5 rounded-xl text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
            title="Excluir Item de Estoque"
          >
            <MdDelete size={18} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Estoque & Fichas Técnicas"
        icon={MdInventory}
        actions={
          abaEstoque === "lista" ? (
            <Button
              icon={MdAdd}
              onClick={() => {
                setItemEdicao(null);
                setModalEstoque(true);
              }}
            >
              Novo Insumo
            </Button>
          ) : null
        }
      />

      <Pills
        items={[
          { value: "lista", label: "Itens do Estoque", icon: MdListAlt },
          { value: "ficha", label: "Atribuir Ficha Técnica", icon: MdReceipt },
        ]}
        value={abaEstoque}
        onChange={setAbaEstoque}
      />

      {abaEstoque === "lista" ? (
        <div className="space-y-4">
          <div className="relative max-w-md">
            <MdSearch
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              size={19}
            />
            <Input
              type="text"
              placeholder="Buscar item no estoque..."
              value={buscaEstoque}
              onChange={(e) => setBuscaEstoque(e.target.value)}
              className="pl-10"
            />
          </div>

          <DataTable
            columns={colunas}
            rows={itensFiltrados}
            rowKey={(ins, idx) => ins.idEstoque || ins.id || idx}
            loading={carregando}
            loadingLabel="Carregando itens de estoque..."
            emptyIcon={MdInventory}
            emptyTitle="Nenhum item encontrado no estoque"
            emptyDescription="Cadastre ingredientes para acompanhar o saldo disponível."
          />
        </div>
      ) : (
        <FormularioFichaTec idRestaurante={idRestauranteGerente} />
      )}

      {modalEstoque && (
        <ModalEstoque
          item={itemEdicao}
          idRestaurante={idRestauranteGerente}
          onClose={() => {
            setModalEstoque(false);
            setItemEdicao(null);
          }}
          onSuccess={() => {
            setModalEstoque(false);
            setItemEdicao(null);
            toast.success("Item de estoque salvo com sucesso!");
            onRecarregar();
          }}
        />
      )}
    </div>
  );
}
