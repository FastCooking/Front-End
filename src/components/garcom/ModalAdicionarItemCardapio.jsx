import { useEffect, useMemo, useState } from "react";
import {
  MdAdd,
  MdCheck,
  MdRemove,
  MdRestaurantMenu,
  MdSearch,
  MdTimer,
} from "react-icons/md";
import { listarItensCardapio } from "../../services/cardapioService";
import { Button, Input, Modal, Pills, Spinner } from "../ui";

export default function ModalAdicionarItemCardapio({
  aberto,
  mesa,
  idPedido,
  idRestaurante,
  onFechar,
  onItensAdicionados,
}) {
  const [cardapio, setCardapio] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [busca, setBusca] = useState("");
  const [categoriaAtiva, setCategoriaAtiva] = useState("Todas");
  const [itemSelecionado, setItemSelecionado] = useState(null);
  const [quantidade, setQuantidade] = useState(1);
  const [observacao, setObservacao] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    if (!aberto || !idRestaurante) return;
    let ativo = true;
    async function carregar() {
      setCarregando(true);
      setErro(null);
      try {
        const itens = await listarItensCardapio(idRestaurante);
        if (ativo) {
          setCardapio((itens || []).filter((i) => i.disponivel !== false));
        }
      } catch (err) {
        if (ativo) setErro("Erro ao carregar cardápio: " + (err.message || ""));
      } finally {
        if (ativo) setCarregando(false);
      }
    }
    carregar();
    return () => {
      ativo = false;
    };
  }, [aberto, idRestaurante]);

  const categorias = useMemo(() => {
    const setCat = new Set(cardapio.map((c) => c.categoria || "Outros"));
    return ["Todas", ...Array.from(setCat)];
  }, [cardapio]);

  const itensFiltrados = useMemo(() => {
    return cardapio.filter((item) => {
      const matchBusca = (item.nome || "")
        .toLowerCase()
        .includes(busca.toLowerCase());
      const matchCat =
        categoriaAtiva === "Todas" || item.categoria === categoriaAtiva;
      return matchBusca && matchCat;
    });
  }, [cardapio, busca, categoriaAtiva]);

  function handleSelecionarItem(item) {
    setItemSelecionado(item);
    setQuantidade(1);
    setObservacao("");
  }

  async function handleConfirmarAdicao() {
    if (!itemSelecionado || !idPedido) return;
    setSalvando(true);
    setErro(null);
    try {
      const payload = [
        {
          idCardapio: itemSelecionado.idCardapio,
          quantidade: Number(quantidade),
          observacao: observacao.trim() || undefined,
        },
      ];
      await onItensAdicionados(payload);
      setItemSelecionado(null);
      onFechar();
    } catch (err) {
      setErro(err.message || "Erro ao adicionar item.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal
      open={Boolean(aberto)}
      onClose={onFechar}
      title={`Incluir Itens — Mesa #${mesa?.numero || ""}`}
      subtitle="Selecione itens do cardápio para adicionar à comanda"
      icon={MdRestaurantMenu}
      size="2xl"
    >
      <div className="space-y-3">
        {erro && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
            {erro}
          </div>
        )}

        <div className="space-y-2.5">
          <div className="relative">
            <MdSearch
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <Input
              type="text"
              placeholder="Buscar item pelo nome..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-10"
            />
          </div>

          <Pills
            items={categorias}
            value={categoriaAtiva}
            onChange={setCategoriaAtiva}
          />
        </div>

        <div className="max-h-72 overflow-y-auto py-1 pr-1">
          {carregando ? (
            <div className="py-10 flex justify-center">
              <Spinner label="Carregando cardápio..." />
            </div>
          ) : itensFiltrados.length === 0 ? (
            <div className="py-10 text-center text-gray-400 text-xs">
              Nenhum item encontrado.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {itensFiltrados.map((item) => {
                const isSelected =
                  itemSelecionado?.idCardapio === item.idCardapio;
                return (
                  <div
                    key={item.idCardapio}
                    onClick={() => handleSelecionarItem(item)}
                    className={`p-3.5 rounded-2xl border transition-colors cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? "bg-brand-soft/60 border-brand ring-2 ring-brand/15"
                        : "bg-white border-gray-200 hover:border-gold/50"
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-bold text-xs sm:text-sm text-gray-900 leading-snug break-words flex-1">
                          {item.nome}
                        </h4>
                        <span className="text-xs sm:text-sm font-black text-brand shrink-0 bg-brand-soft px-2 py-0.5 rounded-lg">
                          R$ {Number(item.preco || 0).toFixed(2)}
                        </span>
                      </div>
                      {item.descricao && (
                        <p className="text-[11px] text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                          {item.descricao}
                        </p>
                      )}
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="bg-gray-100 px-2 py-0.5 rounded-md font-medium text-gray-600">
                          {item.categoria || "Geral"}
                        </span>
                        {item.tempoPreparo && (
                          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded-md font-medium">
                            <MdTimer size={12} /> {item.tempoPreparo} min
                          </span>
                        )}
                      </div>
                      {isSelected ? (
                        <span className="text-brand font-bold flex items-center gap-1 shrink-0">
                          <MdCheck size={14} /> Selecionado
                        </span>
                      ) : (
                        <span className="text-gray-400 text-[10px]">
                          Toque p/ incluir
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {itemSelecionado && (
          <div className="p-4 bg-surface rounded-2xl border border-gray-200/80 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <span className="text-[11px] text-gray-500 font-medium block">
                  Item selecionado:
                </span>
                <p className="font-bold text-xs sm:text-sm text-gray-900 truncate">
                  {itemSelecionado.nome}
                </p>
              </div>

              <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-gray-200 shrink-0">
                <button
                  type="button"
                  onClick={() => setQuantidade((q) => Math.max(1, q - 1))}
                  className="w-7 h-7 rounded-lg bg-surface flex items-center justify-center text-gray-700 hover:text-brand cursor-pointer"
                >
                  <MdRemove size={15} />
                </button>
                <span className="font-bold text-xs sm:text-sm text-gray-900 w-6 text-center">
                  {quantidade}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantidade((q) => q + 1)}
                  className="w-7 h-7 rounded-lg bg-brand text-white flex items-center justify-center hover:bg-brand-dark cursor-pointer"
                >
                  <MdAdd size={15} />
                </button>
              </div>
            </div>

            <Input
              type="text"
              placeholder="Observação (ex: sem cebola, ponto da carne...)"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
            />

            <div className="flex items-center justify-between pt-1">
              <div className="text-xs text-gray-600">
                Total item:{" "}
                <strong className="text-gray-900">
                  R$ {(Number(itemSelecionado.preco || 0) * quantidade).toFixed(2)}
                </strong>
              </div>
              <Button
                size="sm"
                onClick={handleConfirmarAdicao}
                loading={salvando}
              >
                Confirmar Inclusão
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
