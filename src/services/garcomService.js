// Serviço com as regras de negócio do Módulo Garçom (RF06, RF07, RF08, RF19)
import {
  obterPedidosStorage,
  salvarPedidosStorage,
  subscreverMudancasPedidos,
} from "./pedidosStorage.js";

export { subscreverMudancasPedidos };

/**
 * Retorna os itens categorizados para a visão do garçom
 * @param {string} garcomId - Identificador do garçom logado (ex: email)
 */
export async function buscarPedidosGarcom(garcomId = "garcom@test.com") {
  return new Promise((resolve) => {
    setTimeout(() => {
      const todos = obterPedidosStorage();

      // Pedidos prontos para serem assumidos por qualquer garçom disponível
      const prontos = todos.filter((item) => item.status === "pronto");

      // Pedidos assumidos pelo garçom atual e que ainda estão em trânsito/entrega
      const minhasEntregas = todos.filter(
        (item) => item.status === "em_entrega" && item.garcomResponsavel === garcomId
      );

      // Pedidos assumidos por outros garçons
      const entregasOutros = todos.filter(
        (item) => item.status === "em_entrega" && item.garcomResponsavel !== garcomId
      );

      // Pedidos já entregues (histórico)
      const entregues = todos.filter((item) => item.status === "entregue");

      // Regra RF08: O garçom só pode assumir entrega se tiver ZERO entregas pendentes
      const podeAssumir = minhasEntregas.length === 0;

      resolve({
        prontos,
        minhasEntregas,
        entregasOutros,
        entregues,
        podeAssumir,
        totalProntos: prontos.length,
        totalPendentesGarcom: minhasEntregas.length,
      });
    }, 150);
  });
}

/**
 * Regra RF08: Qualquer garçom sem entregas pendentes pode assumir a entrega de um item pronto.
 * Se o garçom possuir entregas pendentes, o sistema recusa a ação.
 */
export async function assumirEntrega(idItemPedido, garcomId = "garcom@test.com", garcomNome = "Garçom João") {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const todos = obterPedidosStorage();

      // Validação da regra RF08: zero pendências
      const entregasPendentes = todos.filter(
        (item) => item.status === "em_entrega" && item.garcomResponsavel === garcomId
      );

      if (entregasPendentes.length > 0) {
        return reject(
          new Error(
            "Regra RF08: Você já possui uma entrega em andamento. Conclua a entrega atual antes de assumir um novo pedido."
          )
        );
      }

      // Localiza o item a ser assumido
      const index = todos.findIndex((item) => item.idItemPedido === idItemPedido);
      if (index === -1) {
        return reject(new Error("Item do pedido não encontrado."));
      }

      const item = todos[index];

      if (item.status !== "pronto") {
        return reject(
          new Error("Este item não está mais disponível para entrega (pode ter sido assumido por outro garçom).")
        );
      }

      // Atualiza o item para em_entrega vinculado ao garçom atual
      const itemAtualizado = {
        ...item,
        status: "em_entrega",
        garcomResponsavel: garcomId,
        garcomNome: garcomNome,
        horarioAssumido: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      todos[index] = itemAtualizado;
      salvarPedidosStorage(todos);

      resolve({
        sucesso: true,
        mensagem: `Entrega da Mesa ${itemAtualizado.mesa} assumida com sucesso!`,
        item: itemAtualizado,
      });
    }, 200);
  });
}

/**
 * Garçom marca o item como "entregue" após realizá-lo na mesa (RF08, RF19).
 * Isso zera a pendência do garçom, tornando-o disponível novamente.
 */
export async function marcarComoEntregue(idItemPedido, garcomId = "garcom@test.com") {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const todos = obterPedidosStorage();
      const index = todos.findIndex((item) => item.idItemPedido === idItemPedido);

      if (index === -1) {
        return reject(new Error("Item do pedido não encontrado."));
      }

      const item = todos[index];

      const itemAtualizado = {
        ...item,
        status: "entregue",
        garcomEntregador: garcomId,
        horarioEntregue: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      todos[index] = itemAtualizado;
      salvarPedidosStorage(todos);

      resolve({
        sucesso: true,
        mensagem: `Pedido entregue com sucesso na Mesa ${itemAtualizado.mesa}!`,
        item: itemAtualizado,
      });
    }, 200);
  });
}

/**
 * Simula um novo item que acabou de ficar pronto na cozinha/bar (dispara RF06).
 */
export function simularNovoPedidoPronto(customData = {}) {
  const todos = obterPedidosStorage();
  const novoId = Date.now();

  const exemplos = [
    {
      nomeItem: "Picanha na Brasa com Fritas",
      categoria: "Prato Principal",
      mesa: 5,
      quantidade: 1,
      observacoes: "Ponto da carne: ao ponto para mal. Farofa à parte.",
    },
    {
      nomeItem: "Caipirinha de Limão",
      categoria: "Bebidas",
      mesa: 3,
      quantidade: 2,
      observacoes: "Pouco açúcar e gelo filtrado.",
    },
    {
      nomeItem: "Salada Caesar Especial",
      categoria: "Entrada",
      mesa: 8,
      quantidade: 1,
      observacoes: "Molho servido à parte, sem croutons.",
    },
    {
      nomeItem: "Petit Gâteau com Sorvete",
      categoria: "Sobremesa",
      mesa: 1,
      quantidade: 1,
      observacoes: "Sobremesa liberada pelo garçom.",
    },
  ];

  const sorteio = exemplos[Math.floor(Math.random() * exemplos.length)];

  const novoItem = {
    idItemPedido: novoId,
    pedidoId: `PED-${Math.floor(100 + Math.random() * 900)}`,
    nomeItem: customData.nomeItem || sorteio.nomeItem,
    categoria: customData.categoria || sorteio.categoria,
    mesa: customData.mesa || sorteio.mesa,
    quantidade: customData.quantidade || sorteio.quantidade,
    status: "pronto",
    tempoEsperaMin: Math.floor(2 + Math.random() * 10),
    observacoes: customData.observacoes || sorteio.observacoes,
    horarioPedido: new Date(Date.now() - 15 * 60000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    horarioPronto: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    garcomResponsavel: null,
    pontuacaoPrioridade: 2.5,
  };

  todos.unshift(novoItem);
  salvarPedidosStorage(todos);

  return novoItem;
}

/**
 * Síntese de Alerta Sonoro usando Web Audio API (RF06).
 * Produz um toque duplo harmônico agradável (chime de restaurante).
 */
export function tocarAlertaSonoro() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const t = ctx.currentTime;

    // Primeiro tom (Mi5 / 659 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(659.25, t);
    gain1.gain.setValueAtTime(0.2, t);
    gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(t);
    osc1.stop(t + 0.35);

    // Segundo tom mais agudo (Lá5 / 880 Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(880, t + 0.15);
    gain2.gain.setValueAtTime(0.25, t + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.65);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(t + 0.15);
    osc2.stop(t + 0.65);

    // Vibração em dispositivos móveis compatíveis
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }
  } catch (erro) {
    console.warn("Alerta sonoro não pôde ser reproduzido:", erro);
  }
}
