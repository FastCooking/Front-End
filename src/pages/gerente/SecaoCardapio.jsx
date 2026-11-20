import { useMemo, useState } from "react";
import {
  MdAdd,
  MdDelete,
  MdEdit,
  MdLaunch,
  MdRestaurantMenu,
  MdSearch,
  MdToggleOff,
  MdToggleOn,
} from "react-icons/md";
import ModalCardapio from "../../components/cardapio/ModalCardapio";
import {
  Badge,
  Button,
  DataTable,
  Input,
  PageHeader,
  Select,
  useConfirm,
  useToast,
} from "../../components/ui";
import { resolverImagem } from "../../config/api";
import {
  alternarDisponibilidade,
  excluirItemCardapio,
} from "../../services/cardapioService";

export default function SecaoCardapio({
  itensCardapio,
  carregando,
  idRestauranteGerente,
  onRecarregar,
}) {
  const toast = useToast();
  const confirm = useConfirm();

  const [buscaCardapio, setBuscaCardapio] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [modalCardapio, setModalCardapio] = useState(false);
  const [itemEdicao, setItemEdicao] = useState(null);
  const [itemAtualizandoId, setItemAtualizandoId] = useState(null);

  const categoriasDisponiveis = useMemo(
    () =>
      Array.from(
        new Set(itensCardapio.map((i) => i.categoria).filter(Boolean))
      ),
    [itensCardapio]
  );

  const itensFiltrados = useMemo(
    () =>
      itensCardapio.filter((item) => {
        if (buscaCardapio.trim()) {
          const termo = buscaCardapio.toLowerCase().trim();
          const bateNome = item.nome?.toLowerCase().includes(termo);
          const bateCat = item.categoria?.toLowerCase().includes(termo);
          if (!bateNome && !bateCat) return false;
        }
        if (filtroCategoria && item.categoria !== filtroCategoria) {
          return false;
        }
        return true;
      }),
    [itensCardapio, buscaCardapio, filtroCategoria]
  );

  async function handleToggleDisponibilidade(item) {
    setItemAtualizandoId(item.id);
    try {
      await alternarDisponibilidade(item.id, !item.disponivel);
      toast.success(`Disponibilidade de "${item.nome}" alterada!`);
      onRecarregar();
    } catch (err) {
      toast.error(
        err.message || "Não foi possível alterar a disponibilidade do item."
      );
    } finally {
      setItemAtualizandoId(null);
    }
  }

  async function handleExcluirCardapio(item) {
    const ok = await confirm({
      title: "Remover Item do Cardápio",
      message: `Deseja realmente desativar/remover o item "${item.nome}" do cardápio?`,
      confirmText: "Remover Item",
      tone: "danger",
    });
    if (!ok) return;

    setItemAtualizandoId(item.id);
    try {
      await excluirItemCardapio(item.id);
      toast.success(`Item "${item.nome}" removido do cardápio!`);
      onRecarregar();
    } catch (err) {
      toast.error(err.message || "Erro ao remover item do cardápio.");
    } finally {
      setItemAtualizandoId(null);
    }
  }

  const colunas = [
    {
      key: "item",
      header: "Item / Descrição",
      render: (item) => {
        const rawImg = item.pathImage || item.imagemUrl || item.imagem_url;
        const fullImgUrl = rawImg ? resolverImagem(rawImg, null) : null;
        return (
          <div className="flex items-center gap-3">
            {fullImgUrl ? (
              <img
                src={fullImgUrl}
                alt={item.nome}
                loading="lazy"
                decoding="async"
                className="w-10 h-10 object-cover rounded-xl border border-gray-200 shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-brand-soft text-brand flex items-center justify-center border border-brand/15 shrink-0">
                <MdRestaurantMenu size={20} />
              </div>
            )}
            <div className="min-w-0">
              <div className="font-semibold text-gray-900 truncate">
                {item.nome}
              </div>
              {item.descricao && (
                <div className="text-xs text-gray-500 max-w-md truncate">
                  {item.descricao}
                </div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: "categoria",
      header: "Categoria",
      render: (item) => <Badge tone="neutral">{item.categoria}</Badge>,
    },
    {
      key: "preco",
      header: "Preço",
      render: (item) => (
        <span className="text-sm font-bold text-brand">
          R$ {Number(item.preco).toFixed(2).replace(".", ",")}
        </span>
      ),
    },
    {
      key: "disponibilidade",
      header: "Disponibilidade",
      render: (item) => (
        <Badge tone={item.disponivel ? "success" : "danger"}>
          {item.disponivel ? "Disponível" : "Indisponível"}
        </Badge>
      ),
    },
    {
      key: "acoes",
      header: "Ações",
      align: "right",
      render: (item) => (
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => {
              setItemEdicao(item);
              setModalCardapio(true);
            }}
            className="p-1.5 rounded-xl text-gray-600 hover:text-brand hover:bg-brand-soft transition-colors cursor-pointer"
            title="Editar Item"
          >
            <MdEdit size={18} />
          </button>

          <button
            type="button"
            onClick={() => handleToggleDisponibilidade(item)}
            disabled={itemAtualizandoId === item.id}
            className={`p-1.5 rounded-xl transition-colors cursor-pointer disabled:opacity-50 ${
              item.disponivel
                ? "text-emerald-600 hover:text-red-600 hover:bg-red-50"
                : "text-red-600 hover:text-emerald-600 hover:bg-emerald-50"
            }`}
            title={item.disponivel ? "Desativar Item" : "Ativar Item"}
          >
            {item.disponivel ? (
              <MdToggleOn size={22} />
            ) : (
              <MdToggleOff size={22} />
            )}
          </button>

          <button
            type="button"
            onClick={() => handleExcluirCardapio(item)}
            disabled={itemAtualizandoId === item.id}
            className="p-1.5 rounded-xl text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50"
            title="Excluir Item"
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
        title="Cardápio do Restaurante"
        icon={MdRestaurantMenu}
        actions={
          <>
            <a
              href={`/cardapio?idRestaurante=${idRestauranteGerente || ""}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-1.5 bg-white border border-gray-200 text-gray-700 hover:text-brand hover:bg-brand-soft px-3.5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm shadow-xs transition-colors"
            >
              <MdLaunch size={17} />
              <span>Ver Cardápio</span>
            </a>

            <Button
              icon={MdAdd}
              onClick={() => {
                setItemEdicao(null);
                setModalCardapio(true);
              }}
            >
              Novo Item
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative sm:col-span-2">
          <MdSearch
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            size={19}
          />
          <Input
            type="text"
            placeholder="Buscar item no cardápio..."
            value={buscaCardapio}
            onChange={(e) => setBuscaCardapio(e.target.value)}
            className="pl-10"
          />
        </div>

        {categoriasDisponiveis.length > 0 && (
          <Select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
          >
            <option value="">Todas as Categorias</option>
            {categoriasDisponiveis.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </Select>
        )}
      </div>

      <DataTable
        columns={colunas}
        rows={itensFiltrados}
        rowKey={(item) => item.id}
        loading={carregando}
        loadingLabel="Carregando itens do cardápio..."
        emptyIcon={MdRestaurantMenu}
        emptyTitle="Nenhum item encontrado no cardápio"
        emptyDescription="Cadastre novos pratos ou ajuste os filtros de busca."
      />

      {modalCardapio && (
        <ModalCardapio
          key={
            itemEdicao
              ? itemEdicao.id || itemEdicao.idCardapio || "edicao"
              : "novo"
          }
          item={itemEdicao}
          idRestaurante={idRestauranteGerente}
          onClose={() => {
            setModalCardapio(false);
            setItemEdicao(null);
          }}
          onSuccess={() => {
            setModalCardapio(false);
            setItemEdicao(null);
            toast.success("Item do cardápio salvo com sucesso!");
            onRecarregar();
          }}
        />
      )}
    </div>
  );
}
