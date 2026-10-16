// Repositório compartilhado de pedidos e itens de pedidos para FastCooking
// Sincroniza KDS, Cozinha e Garçom via localStorage e CustomEvents.

const STORAGE_KEY = "fastcooking_pedidos_v1";
const EVENTO_MUDANCA = "fastcooking_pedidos_changed";

const ITENS_INICIAIS = [
  {
    idItemPedido: 101,
    pedidoId: "PED-101",
    nomeItem: "Suco de Laranja Natural",
    quantidade: 2,
    categoria: "Bebidas",
    mesa: 7,
    status: "pronto", // Pronto para retirada
    tempoEsperaMin: 3,
    observacoes: "Com gelo e sem açúcar.",
    horarioPedido: new Date(Date.now() - 10 * 60000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    horarioPronto: new Date(Date.now() - 2 * 60000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    garcomResponsavel: null,
    pontuacaoPrioridade: 3.0,
  },
  {
    idItemPedido: 102,
    pedidoId: "PED-102",
    nomeItem: "Bruschetta Tradicional",
    quantidade: 1,
    categoria: "Entrada",
    mesa: 4,
    status: "pronto", // Pronto para retirada
    tempoEsperaMin: 6,
    observacoes: "Caprichar no azeite.",
    horarioPedido: new Date(Date.now() - 15 * 60000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    horarioPronto: new Date(Date.now() - 3 * 60000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    garcomResponsavel: null,
    pontuacaoPrioridade: 2.2,
  },
  {
    idItemPedido: 103,
    pedidoId: "PED-103",
    nomeItem: "Filé ao Molho Madeira",
    quantidade: 1,
    categoria: "Prato Principal",
    mesa: 2,
    status: "em preparo",
    tempoEsperaMin: 12,
    observacoes: "Carne ao ponto para bem. Molho à parte.",
    horarioPedido: new Date(Date.now() - 18 * 60000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    garcomResponsavel: null,
    pontuacaoPrioridade: 1.5,
  },
  {
    idItemPedido: 104,
    pedidoId: "PED-104",
    nomeItem: "Mousse de Maracujá",
    quantidade: 2,
    categoria: "Sobremesa",
    mesa: 7,
    status: "pendente",
    tempoEsperaMin: 1,
    observacoes: "Aguardando liberação da sobremesa.",
    horarioPedido: new Date(Date.now() - 25 * 60000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    garcomResponsavel: null,
    pontuacaoPrioridade: 0.8,
  },
];

export function obterPedidosStorage() {
  try {
    const salvo = localStorage.getItem(STORAGE_KEY);
    if (!salvo) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ITENS_INICIAIS));
      return [...ITENS_INICIAIS];
    }
    return JSON.parse(salvo);
  } catch (e) {
    console.error("Erro ao ler pedidos do localStorage:", e);
    return [...ITENS_INICIAIS];
  }
}

export function salvarPedidosStorage(pedidos) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pedidos));
    // Dispara evento na aba atual e para outras abas
    window.dispatchEvent(new CustomEvent(EVENTO_MUDANCA, { detail: pedidos }));
  } catch (e) {
    console.error("Erro ao salvar pedidos no localStorage:", e);
  }
}

export function subscreverMudancasPedidos(callback) {
  function handleCustomEvent(e) {
    callback(e.detail || obterPedidosStorage());
  }

  function handleStorageEvent(e) {
    if (e.key === STORAGE_KEY) {
      callback(obterPedidosStorage());
    }
  }

  window.addEventListener(EVENTO_MUDANCA, handleCustomEvent);
  window.addEventListener("storage", handleStorageEvent);

  return () => {
    window.removeEventListener(EVENTO_MUDANCA, handleCustomEvent);
    window.removeEventListener("storage", handleStorageEvent);
  };
}
