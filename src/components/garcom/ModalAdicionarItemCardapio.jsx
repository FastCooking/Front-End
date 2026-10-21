import React, { useState, useEffect, useMemo } from 'react';
import { MdClose, MdSearch, MdAdd, MdRemove, MdRestaurantMenu, MdCheck } from 'react-icons/md';
import { listarItensCardapio } from '../../services/cardapioService';

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
  const [busca, setBusca] = useState('');
  const [categoriaAtiva, setCategoriaAtiva] = useState('Todas');
  const [itemSelecionado, setItemSelecionado] = useState(null);
  const [quantidade, setQuantidade] = useState(1);
  const [observacao, setObservacao] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    if (!aberto || !idRestaurante) return;
    async function carregar() {
      setCarregando(true);
      setErro(null);
      try {
        const itens = await listarItensCardapio(idRestaurante);
        setCardapio(itens.filter((i) => i.disponivel !== false));
      } catch (err) {
        setErro('Erro ao carregar cardápio: ' + (err.message || ''));
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, [aberto, idRestaurante]);

  const categorias = useMemo(() => {
    const setCat = new Set(cardapio.map((c) => c.categoria || 'Outros'));
    return ['Todas', ...Array.from(setCat)];
  }, [cardapio]);

  const itensFiltrados = useMemo(() => {
    return cardapio.filter((item) => {
      const matchBusca = (item.nome || '').toLowerCase().includes(busca.toLowerCase());
      const matchCat = categoriaAtiva === 'Todas' || item.categoria === categoriaAtiva;
      return matchBusca && matchCat;
    });
  }, [cardapio, busca, categoriaAtiva]);

  function handleSelecionarItem(item) {
    setItemSelecionado(item);
    setQuantidade(1);
    setObservacao('');
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
      setErro(err.message || 'Erro ao adicionar item.');
    } finally {
      setSalvando(false);
    }
  }

  if (!aberto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-[Poppins]">
      <div className="bg-[#FAF6F3] rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-gray-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
              <span className="p-2 bg-[#9C1C0E]/10 text-[#9C1C0E] rounded-xl">
                <MdRestaurantMenu size={20} />
              </span>
              Incluir Itens — Mesa #{mesa?.numero}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Selecione itens do cardápio para adicionar à comanda
            </p>
          </div>
          <button
            onClick={onFechar}
            className="text-gray-400 hover:text-gray-700 p-1 rounded-xl hover:bg-gray-200/60 transition-colors cursor-pointer"
          >
            <MdClose size={22} />
          </button>
        </div>

        {erro && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl">
            {erro}
          </div>
        )}

        {/* Busca e Categorias */}
        <div className="py-3 space-y-3">
          <div className="relative">
            <MdSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar item do cardápio..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:border-[#9C1C0E]"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categorias.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoriaAtiva(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                  categoriaAtiva === cat
                    ? 'bg-[#9C1C0E] text-white shadow-xs'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Lista de Itens do Cardápio */}
        <div className="flex-1 overflow-y-auto py-2 space-y-2 pr-1">
          {carregando ? (
            <div className="py-12 flex flex-col items-center justify-center text-gray-400 text-xs">
              <span className="w-8 h-8 border-3 border-[#9C1C0E] border-t-transparent rounded-full animate-spin mb-2" />
              Carregando cardápio...
            </div>
          ) : itensFiltrados.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-xs">
              Nenhum item encontrado.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {itensFiltrados.map((item) => {
                const isSelected = itemSelecionado?.idCardapio === item.idCardapio;
                return (
                  <div
                    key={item.idCardapio}
                    onClick={() => handleSelecionarItem(item)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-[#9C1C0E]/5 border-[#9C1C0E] shadow-xs ring-1 ring-[#9C1C0E]'
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-bold text-xs sm:text-sm text-gray-900 leading-tight">
                          {item.nome}
                        </h4>
                        <span className="text-xs font-extrabold text-[#9C1C0E] shrink-0">
                          R$ {Number(item.preco || 0).toFixed(2)}
                        </span>
                      </div>
                      {item.descricao && (
                        <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">
                          {item.descricao}
                        </p>
                      )}
                    </div>
                    <div className="mt-2.5 flex items-center justify-between text-[11px] text-gray-400">
                      <span className="bg-gray-100 px-2 py-0.5 rounded-md font-medium text-gray-600">
                        {item.categoria || 'Geral'}
                      </span>
                      {isSelected && (
                        <span className="text-[#9C1C0E] font-bold flex items-center gap-1">
                          <MdCheck size={14} /> Selecionado
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Painel Inferior de Quantidade e Observações */}
        {itemSelecionado && (
          <div className="mt-3 p-4 bg-white rounded-2xl border border-gray-200 shadow-sm animate-fade-in space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-gray-500 font-medium">Item a adicionar:</span>
                <p className="font-black text-sm text-gray-900">{itemSelecionado.nome}</p>
              </div>

              {/* Controle de Quantidade */}
              <div className="flex items-center gap-2 bg-[#FAF6F3] p-1 rounded-2xl border border-gray-200">
                <button
                  type="button"
                  onClick={() => setQuantidade((q) => Math.max(1, q - 1))}
                  className="w-8 h-8 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-700 hover:text-[#9C1C0E] cursor-pointer"
                >
                  <MdRemove size={16} />
                </button>
                <span className="font-black text-sm text-gray-900 w-6 text-center">
                  {quantidade}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantidade((q) => q + 1)}
                  className="w-8 h-8 rounded-xl bg-[#9C1C0E] text-white flex items-center justify-center hover:bg-[#7a160b] cursor-pointer"
                >
                  <MdAdd size={16} />
                </button>
              </div>
            </div>

            <input
              type="text"
              placeholder="Observação (ex: sem cebola, ponto da carne...)"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              className="w-full px-3 py-2 bg-[#FAF6F3] border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#9C1C0E]"
            />

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-gray-600 font-medium">
                Subtotal:{' '}
                <strong className="text-sm font-black text-[#9C1C0E]">
                  R$ {(Number(itemSelecionado.preco || 0) * quantidade).toFixed(2)}
                </strong>
              </span>

              <button
                type="button"
                onClick={handleConfirmarAdicao}
                disabled={salvando}
                className="px-5 py-2.5 bg-[#9C1C0E] hover:bg-[#7a160b] text-white text-xs sm:text-sm font-bold rounded-2xl shadow-md transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                {salvando && (
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                Confirmar e Adicionar à Mesa
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
