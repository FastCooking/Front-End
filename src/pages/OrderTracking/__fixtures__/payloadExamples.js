/**
 * ─── Contrato de Payload WebSocket — Exemplos para Testes ───────────────────
 *
 * Endpoint: ws://<host>/ws/tracking/:orderId
 *
 * O servidor deve enviar mensagens JSON ao frontend nos formatos abaixo.
 * Cada mensagem deve conter obrigatoriamente o campo `type`.
 */

// ────────────────────────────────────────────────────────────────────────────
// 1. ORDER_UPDATE — Snapshot completo do pedido (enviado no handshake e em
//    mudanças de status geral)
// ────────────────────────────────────────────────────────────────────────────
export const ORDER_UPDATE_EXAMPLE = {
  type: 'ORDER_UPDATE',
  order: {
    id: '4f2a7c01',
    customerName: 'Carlos',
    tableNumber: 7,
    status: 'IN_PREPARATION',
    estimatedMinutesMin: 25,
    estimatedMinutesMax: 35,
    queuePosition: 3,
    createdAt: '2026-10-01T15:00:00-03:00',
    updatedAt: '2026-10-01T15:05:30-03:00',
    items: [
      {
        id: 'item-1',
        name: 'Filé Mignon ao Molho Madeira',
        quantity: 1,
        notes: 'Ponto médio, sem cebola',
        status: 'IN_PREPARATION',
      },
      {
        id: 'item-2',
        name: 'Risoto de Camarão',
        quantity: 1,
        notes: null,
        status: 'PENDING',
      },
      {
        id: 'item-3',
        name: 'Suco de Laranja Natural',
        quantity: 2,
        notes: 'Sem açúcar',
        status: 'READY',
      },
      {
        id: 'item-4',
        name: 'Pudim de Leite',
        quantity: 1,
        notes: null,
        status: 'PENDING',
      },
    ],
  },
};

// ────────────────────────────────────────────────────────────────────────────
// 2. ITEM_UPDATE — Atualização parcial de um item individual
// ────────────────────────────────────────────────────────────────────────────
export const ITEM_UPDATE_EXAMPLE = {
  type: 'ITEM_UPDATE',
  item: {
    id: 'item-2',
    name: 'Risoto de Camarão',
    quantity: 1,
    notes: null,
    status: 'IN_PREPARATION', // mudou de PENDING → IN_PREPARATION
  },
};

// ────────────────────────────────────────────────────────────────────────────
// 3. QUEUE_UPDATE — Atualização de estimativa de tempo (enviado
//    periodicamente ou quando a fila do KDS muda)
// ────────────────────────────────────────────────────────────────────────────
export const QUEUE_UPDATE_EXAMPLE = {
  type: 'QUEUE_UPDATE',
  queue: {
    estimatedMinutesMin: 15,
    estimatedMinutesMax: 20,
    position: 1,
  },
};

// ────────────────────────────────────────────────────────────────────────────
// 4. ERROR — Mensagem de erro do servidor
// ────────────────────────────────────────────────────────────────────────────
export const ERROR_EXAMPLE = {
  type: 'ERROR',
  message: 'Pedido não encontrado.',
};

// ────────────────────────────────────────────────────────────────────────────
// Códigos de fechamento customizados
// ────────────────────────────────────────────────────────────────────────────
// 4404 — Pedido não encontrado (o front trata como erro final, sem reconexão)
// 1000 — Fechamento normal
// Qualquer outro — dispara reconexão automática com backoff
