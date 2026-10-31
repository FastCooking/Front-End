import React, { useState, useEffect, useMemo } from 'react';
import { MdClose, MdSearch, MdAdd, MdRemove, MdRestaurantMenu, MdCheck, MdTimer } from 'react-icons/md';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/60 backdrop-blur-xs font-[Poppins]">
      <div className="bg-[#FAF6F3] rounded-3xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl border border-gray-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-gray-200">
          <div className="min-w-0 pr-2">
            <h3 className="text-base sm:text-lg font-black text-gray-900 tracking-tight flex items-center gap-2 truncate">
              <span className="p-1.5 sm:p-2 bg-[#9C1C0E]/10 text-[#9C1C0E] rounded-xl shrink-0">
                <MdRestaurantMenu size={18} />
              </span>
              <span>Incluir Itens — Mesa #{mesa?.numero}</span>
            </h3>
            <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5 truncate">
              Selecione itens do cardápio para adicionar à comanda
            </p>
          </div>
          <button
            onClick={onFechar}
            className="text-gray-400 hover:text-gray-700 p-1.5 rounded-xl hover:bg-gray-200/60 transition-colors cursor-pointer shrink-0"
          >
            <MdClose size={20} />
          </button>
        </div>

        {erro && (
          <div className="mt-2.5 p-2.5 sm:p-3 bg-red-50 border border-red-200 text-[#9C1C0E] text-xs rounded-2xl font-medium">
            {erro}
          </div>
        )}

        {/* Busca e Categorias */}
        <div className="py-2.5 sm:py-3 space-y-2.5">
          <div className="relative">
            <MdSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar item pelo nome..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:border-[#9C1C0E] transition-all"
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

        {/* Lista de Itens do Cardápio com layout mobile respirável */}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
              {itensFiltrados.map((item) => {
                const isSelected = itemSelecionado?.idCardapio === item.idCardapio;
                return (
                  <div
                    key={item.idCardapio}
                    onClick={() => handleSelecionarItem(item)}
                    className={`p-3 sm:p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-[#9C1C0E]/5 border-[#9C1C0E] shadow-xs ring-2 ring-[#9C1C0E]/20'
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div>
                      {/* Linha superior: Nome com espaço livre para não espremer */}
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-bold text-xs sm:text-sm text-gray-900 leading-snug break-words flex-1">
                          {item.nome}
                        </h4>
                        <span className="text-xs sm:text-sm font-black text-[#9C1C0E] shrink-0 bg-[#9C1C0E]/5 px-2 py-0.5 rounded-lg">
                          R$ {Number(item.preco || 0).toFixed(2)}
                        </span>
                      </div>
                      {item.descricao && (
                        <p className="text-[11px] text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                          {item.descricao}
                        </p>
                      )}
                    </div>

                    {/* Linha inferior: Categoria, tempo de preparo e status selecionado */}
                    <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="bg-gray-100 px-2 py-0.5 rounded-md font-medium text-gray-600">
                          {item.categoria || 'Geral'}
                        </span>
                        {item.tempoPreparo && (
                          <span className="inline-flex items-center gap-1 text-gray-500 bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded-md font-medium">
                            <MdTimer size={12} /> {item.tempoPreparo} min
                          </span>
                        )}
                      </div>
                      {isSelected ? (
                        <span className="text-[#9C1C0E] font-bold flex items-center gap-1 shrink-0">
                          <MdCheck size={14} /> Selecionado
                        </span>
                      ) : (
                        <span className="text-gray-400 text-[10px] hover:text-[#9C1C0E]">
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

        {/* Painel Inferior de Quantidade e Observações */}
        {itemSelecionado && (
          <div className="mt-2.5 p-3.5 sm:p-4 bg-white rounded-2xl border border-gray-200 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <span className="text-[11px] text-gray-500 font-medium block">Item selecionado:</span>
                <p className="font-bold text-xs sm:text-sm text-gray-900 truncate">{itemSelecionado.nome}</p>
              </div>

              {/* Controle de Quantidade */}
              <div className="flex items-center gap-1.5 bg-[#FAF6F3] p-1 rounded-2xl border border-gray-200 shrink-0">
                <button
                  type="button"
                  onClick={() => setQuantidade((q) => Math.max(1, q - 1))}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-700 hover:text-[#9C1C0E] cursor-pointer"
                >
                  <MdRemove size={15} />
                </button>
                <span className="font-black text-xs sm:text-sm text-gray-900 w-5 text-center">
                  {quantidade}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantidade((q) => q + 1)}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#9C1C0E] text-white flex items-center justify-center hover:bg-[#7a160b] cursor-pointer"
                >
                  <MdAdd size={15} />
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
              <div className="text-xs text-gray-600">
                Total item:{' '}
                <strong className="text-gray-900">
                  R$ {(Number(itemSelecionado.preco || 0) * quantidade).toFixed(2)}
                </strong>
              </div>
              <button
                type="button"
                onClick={handleConfirmarAdicao}
                disabled={salvando}
                className="bg-[#9C1C0E] hover:bg-[#7a160b] text-white text-xs sm:text-sm font-bold px-4 py-2 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {salvando ? 'Adicionando...' : 'Confirmar Inclusão'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
