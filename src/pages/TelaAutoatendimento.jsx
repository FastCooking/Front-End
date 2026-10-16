import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { listarItensCardapio } from '../services/cardapioService';
import { abrirMesa, criarPedido, adicionarItensAoPedido, chamarGarcom } from '../services/pedidoService';
import logo from '../assets/fast cooking logo.png';

export default function TelaAutoatendimento() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const idMesaParam = searchParams.get('idMesa') || searchParams.get('mesa');
  const idRestauranteParam = searchParams.get('idRestaurante') || searchParams.get('restaurante');
  const sessaoIdParam = searchParams.get('sessao_id') || searchParams.get('sessao');

  const [mesaInfo, setMesaInfo] = useState({
    numero: null,
    idMesa: idMesaParam,
    idRestaurante: idRestauranteParam,
    sessao_id: sessaoIdParam,
    idPedidoAtivo: null,
  });

  const [itensCardapio, setItensCardapio] = useState([]);
  const [categoriaAtiva, setCategoriaAtiva] = useState('Todos');
  const [carrinho, setCarrinho] = useState([]);
  const [isCarrinhoAberto, setIsCarrinhoAberto] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [enviandoPedido, setEnviandoPedido] = useState(false);
  const [chamandoGarcom, setChamandoGarcom] = useState(false);
  const [msgSucesso, setMsgSucesso] = useState(null);
  const [erro, setErro] = useState(null);

  async function handleChamarGarcom() {
    if (!mesaInfo.idMesa) {
      alert('Identificação da mesa não encontrada para chamar o garçom.');
      return;
    }
    setChamandoGarcom(true);
    try {
      await chamarGarcom(mesaInfo.idMesa);
      setMsgSucesso('🛎️ Garçom chamado! Nossa equipe já foi notificada e está vindo até a sua mesa.');
      setTimeout(() => setMsgSucesso(null), 6000);
    } catch (err) {
      setErro(err.message || 'Erro ao chamar garçom.');
    } finally {
      setChamandoGarcom(false);
    }
  }

  // Inicializa mesa e sessão
  useEffect(() => {
    async function inicializar() {
      try {
        setCarregando(true);
        let idRest = idRestauranteParam;
        let idSessao = sessaoIdParam;
        let idPedAtivo = null;
        let numMesa = null;

        if (idMesaParam) {
          const mesaRes = await abrirMesa(idMesaParam).catch((err) => {
            console.warn('Não foi possível auto-abrir mesa:', err);
            return null;
          });

          if (mesaRes) {
            idRest = mesaRes.idRestaurante || idRest;
            idSessao = mesaRes.idSessao || idSessao;
            idPedAtivo = mesaRes.idPedidoAtivo;
            numMesa = mesaRes.numero;
          }
        }

        setMesaInfo({
          numero: numMesa,
          idMesa: idMesaParam,
          idRestaurante: idRest,
          sessao_id: idSessao || `sessao-${Date.now()}`,
          idPedidoAtivo: idPedAtivo,
        });

        if (idRest) {
          const cardapioData = await listarItensCardapio(idRest);
          setItensCardapio(cardapioData.filter((i) => i.disponivel));
        }
      } catch (err) {
        setErro(err.message || 'Erro ao carregar cardápio.');
      } finally {
        setCarregando(false);
      }
    }

    inicializar();
  }, [idMesaParam, idRestauranteParam, sessaoIdParam]);

  const categorias = ['Todos', ...new Set(itensCardapio.map((i) => i.categoria).filter(Boolean))];

  const itensFiltrados = categoriaAtiva === 'Todos'
    ? itensCardapio
    : itensCardapio.filter((i) => i.categoria === categoriaAtiva);

  function adicionarAoCarrinho(item) {
    setCarrinho((prev) => {
      const existente = prev.find((i) => i.idCardapio === item.idCardapio);
      if (existente) {
        return prev.map((i) =>
          i.idCardapio === item.idCardapio
            ? { ...i, quantidade: i.quantidade + 1 }
            : i
        );
      }
      return [...prev, { ...item, quantidade: 1, observacao: '' }];
    });
  }

  function alterarQuantidade(idCardapio, delta) {
    setCarrinho((prev) =>
      prev
        .map((i) => {
          if (i.idCardapio === idCardapio) {
            const novaQtd = i.quantidade + delta;
            return novaQtd > 0 ? { ...i, quantidade: novaQtd } : null;
          }
          return i;
        })
        .filter(Boolean)
    );
  }

  function atualizarObservacao(idCardapio, observacao) {
    setCarrinho((prev) =>
      prev.map((i) =>
        i.idCardapio === idCardapio ? { ...i, observacao } : i
      )
    );
  }

  const totalCarrinho = carrinho.reduce((acc, i) => acc + (Number(i.preco) || 0) * i.quantidade, 0);
  const totalItens = carrinho.reduce((acc, i) => acc + i.quantidade, 0);

  async function finalizarPedido() {
    if (carrinho.length === 0) return;
    if (!mesaInfo.idMesa) {
      alert('Mesa não informada. Por favor, escaneie novamente o QR Code da sua mesa.');
      return;
    }

    setEnviandoPedido(true);
    setErro(null);

    try {
      const itensFormatados = carrinho.map((i) => ({
        idCardapio: i.idCardapio,
        quantidade: i.quantidade,
        observacao: i.observacao ? i.observacao.trim() : null,
      }));

      let pedidoId = mesaInfo.idPedidoAtivo;

      if (pedidoId) {
        // Já tem comanda/pedido ativo na mesa -> anexa itens à comanda compartilhada
        await adicionarItensAoPedido(pedidoId, itensFormatados);
      } else {
        // Cria novo pedido para a mesa
        const res = await criarPedido({
          idMesa: mesaInfo.idMesa,
          sessao_id: mesaInfo.sessao_id,
          itens: itensFormatados,
        });
        pedidoId = res.pedido?.idPedido || res.idPedido;
      }

      setCarrinho([]);
      setIsCarrinhoAberto(false);
      navigate(`/tracking/${pedidoId}`);
    } catch (err) {
      setErro(err.message || 'Erro ao enviar pedido.');
    } finally {
      setEnviandoPedido(false);
    }
  }

  const BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

  function getImagemUrl(path) {
    if (!path) return null;
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
      return path;
    }
    return `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 pb-28">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md shadow-sm border-b border-stone-200 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="FastCooking Logo" className="h-10 w-auto object-contain" />
            <div>
              <h1 className="text-lg font-bold text-[#b84226]">FastCooking Cardápio</h1>
              <p className="text-xs text-stone-500">
                {mesaInfo.numero ? `Mesa ${mesaInfo.numero}` : 'Autoatendimento Digital'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {mesaInfo.idMesa && (
              <button
                onClick={handleChamarGarcom}
                disabled={chamandoGarcom}
                className="bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm transition-all"
                title="Solicitar a presença do garçom nesta mesa"
              >
                <span>🛎️</span>
                <span>{chamandoGarcom ? 'Chamando...' : 'Chamar Garçom'}</span>
              </button>
            )}

            {mesaInfo.numero && (
              <span className="bg-[#b84226]/10 text-[#b84226] text-xs font-bold px-3 py-1 rounded-full">
                Mesa #{mesaInfo.numero}
              </span>
            )}
          </div>
        </div>

        {msgSucesso && (
          <div className="max-w-4xl mx-auto mt-2 p-2.5 bg-emerald-600 text-white text-xs font-extrabold rounded-lg flex items-center justify-between shadow-md animate-bounce">
            <span>{msgSucesso}</span>
            <button onClick={() => setMsgSucesso(null)} className="ml-2 bg-emerald-800 px-2 py-0.5 rounded text-[10px]">✕</button>
          </div>
        )}
      </header>

      {/* Categorias Tabs */}
      <div className="sticky top-[61px] z-20 bg-white border-b border-stone-200 px-4 py-2.5 shadow-xs">
        <div className="max-w-4xl mx-auto flex gap-2 overflow-x-auto no-scrollbar">
          {categorias.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoriaAtiva(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                categoriaAtiva === cat
                  ? 'bg-[#b84226] text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-4">
        {erro && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 text-sm rounded-lg flex justify-between items-center">
            <span>{erro}</span>
            <button onClick={() => setErro(null)} className="font-bold ml-2">✕</button>
          </div>
        )}

        {carregando ? (
          <div className="flex flex-col items-center justify-center py-20 text-stone-400">
            <div className="w-10 h-10 border-4 border-[#b84226] border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-sm">Carregando cardápio...</p>
          </div>
        ) : itensFiltrados.length === 0 ? (
          <div className="text-center py-20 text-stone-400">
            <p className="text-lg font-medium">Nenhum item disponível nesta categoria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {itensFiltrados.map((item) => {
              const imgUrl = getImagemUrl(item.pathImage);
              const noCarrinho = carrinho.find((c) => c.idCardapio === item.idCardapio);

              return (
                <div
                  key={item.idCardapio}
                  className="bg-white rounded-xl shadow-xs border border-stone-200 p-4 flex gap-4 transition-all hover:shadow-md hover:border-stone-300"
                >
                  {/* Foto do item */}
                  <div className="w-24 h-24 rounded-lg bg-stone-100 flex-shrink-0 overflow-hidden relative border border-stone-100">
                    {imgUrl ? (
                      <img
                        src={imgUrl}
                        alt={item.nome}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-stone-300 text-2xl font-bold">
                        🍽️
                      </div>
                    )}
                  </div>

                  {/* Informações */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-stone-900 text-base leading-tight">{item.nome}</h3>
                      {item.descricao && (
                        <p className="text-xs text-stone-500 mt-1 line-clamp-2">{item.descricao}</p>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-base font-extrabold text-[#b84226]">
                        R$ {Number(item.preco).toFixed(2).replace('.', ',')}
                      </span>

                      {noCarrinho ? (
                        <div className="flex items-center gap-2 bg-stone-100 rounded-full px-2 py-0.5 border border-stone-200">
                          <button
                            onClick={() => alterarQuantidade(item.idCardapio, -1)}
                            className="w-6 h-6 flex items-center justify-center font-bold text-stone-600 hover:text-black"
                          >
                            -
                          </button>
                          <span className="text-xs font-bold w-4 text-center">{noCarrinho.quantidade}</span>
                          <button
                            onClick={() => alterarQuantidade(item.idCardapio, 1)}
                            className="w-6 h-6 flex items-center justify-center font-bold text-stone-600 hover:text-black"
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => adicionarAoCarrinho(item)}
                          className="bg-[#b84226] hover:bg-[#9c351c] text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-xs transition-colors"
                        >
                          + Adicionar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Floating Bottom Cart Bar */}
      {totalItens > 0 && !isCarrinhoAberto && (
        <div className="fixed bottom-4 inset-x-4 max-w-4xl mx-auto z-40">
          <button
            onClick={() => setIsCarrinhoAberto(true)}
            className="w-full bg-[#b84226] text-white p-4 rounded-2xl shadow-xl flex items-center justify-between transition-transform active:scale-98"
          >
            <div className="flex items-center gap-3">
              <span className="bg-white/20 text-white font-bold text-xs px-2.5 py-1 rounded-full">
                {totalItens} {totalItens === 1 ? 'item' : 'itens'}
              </span>
              <span className="font-semibold text-sm">Ver Comanda / Carrinho</span>
            </div>
            <span className="font-extrabold text-base">
              R$ {totalCarrinho.toFixed(2).replace('.', ',')}
            </span>
          </button>
        </div>
      )}

      {/* Cart Drawer Modal */}
      {isCarrinhoAberto && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-md h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-4 border-b border-stone-200 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-lg text-stone-900">Seu Pedido</h2>
                <p className="text-xs text-stone-500">
                  {mesaInfo.numero ? `Comanda da Mesa #${mesaInfo.numero}` : 'Itens selecionados'}
                </p>
              </div>
              <button
                onClick={() => setIsCarrinhoAberto(false)}
                className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-600 hover:bg-stone-200"
              >
                ✕
              </button>
            </div>

            {/* List of items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {carrinho.map((item) => (
                <div key={item.idCardapio} className="border-b border-stone-100 pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-stone-900 text-sm">{item.nome}</h4>
                      <span className="text-xs text-stone-500">
                        R$ {Number(item.preco).toFixed(2).replace('.', ',')} un.
                      </span>
                    </div>
                    <div className="flex items-center gap-2 bg-stone-100 rounded-full px-2 py-0.5">
                      <button
                        onClick={() => alterarQuantidade(item.idCardapio, -1)}
                        className="w-5 h-5 flex items-center justify-center font-bold text-stone-600"
                      >
                        -
                      </button>
                      <span className="text-xs font-bold w-4 text-center">{item.quantidade}</span>
                      <button
                        onClick={() => alterarQuantidade(item.idCardapio, 1)}
                        className="w-5 h-5 flex items-center justify-center font-bold text-stone-600"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <input
                    type="text"
                    placeholder="Observação (ex: sem cebola, ponto da carne...)"
                    value={item.observacao || ''}
                    onChange={(e) => atualizarObservacao(item.idCardapio, e.target.value)}
                    className="w-full mt-2 text-xs p-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-[#b84226]"
                  />
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-stone-200 bg-stone-50">
              <div className="flex justify-between items-center mb-4">
                <span className="text-stone-600 text-sm font-medium">Total do Pedido:</span>
                <span className="text-xl font-extrabold text-[#b84226]">
                  R$ {totalCarrinho.toFixed(2).replace('.', ',')}
                </span>
              </div>

              <button
                onClick={finalizarPedido}
                disabled={enviandoPedido || carrinho.length === 0}
                className="w-full bg-[#b84226] hover:bg-[#9c351c] disabled:opacity-50 text-white font-bold py-3.5 px-4 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
              >
                {enviandoPedido ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Enviando à Cozinha...</span>
                  </>
                ) : (
                  <span>Confirmar e Enviar Pedido</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
