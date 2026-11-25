/**
 * ─── Order Tracking — Type Definitions (JSDoc) ──────────────────────────────
 *
 * Este arquivo serve como referência central de tipos para a feature de
 * acompanhamento de pedido. As definições abaixo são consumidas via JSDoc
 * nos hooks e componentes.
 */

/**
 * Status possíveis de um item do pedido.
 * @typedef {'PENDING' | 'IN_PREPARATION' | 'READY' | 'DELIVERED'} ItemStatus
 */

/**
 * Status geral do pedido.
 * @typedef {'PENDING' | 'IN_PREPARATION' | 'READY' | 'DELIVERED' | 'CANCELLED'} OrderStatus
 */

/**
 * Item individual de um pedido.
 * @typedef {Object} OrderItem
 * @property {string|number} id        - Identificador único do item.
 * @property {string}        name      - Nome do prato/produto.
 * @property {number}        quantity  - Quantidade solicitada.
 * @property {string}        [notes]   - Observações do cliente (ex: "sem cebola").
 * @property {ItemStatus}    status    - Status atual do item.
 */

/**
 * Dados completos de um pedido.
 * @typedef {Object} Order
 * @property {string|number}  id                    - ID do pedido.
 * @property {string}         [customerName]         - Nome do cliente (se disponível).
 * @property {number|null}    [tableNumber]          - Número da mesa (null = delivery).
 * @property {OrderStatus}    status                 - Status geral do pedido.
 * @property {OrderItem[]}    items                  - Lista de itens do pedido.
 * @property {number}         estimatedMinutesMin    - Tempo estimado mínimo (minutos).
 * @property {number}         estimatedMinutesMax    - Tempo estimado máximo (minutos).
 * @property {string}         createdAt              - ISO-8601 da criação.
 * @property {string}         [updatedAt]            - ISO-8601 da última atualização.
 */

/**
 * Tipos de evento recebidos via WebSocket.
 * @typedef {'ORDER_UPDATE' | 'ITEM_UPDATE' | 'QUEUE_UPDATE' | 'ERROR'} WsEventType
 */

/**
 * Payload genérico recebido pelo WebSocket do KDS.
 * @typedef {Object} WsPayload
 * @property {WsEventType}  type       - Tipo do evento.
 * @property {Order}        [order]    - Pedido completo (em ORDER_UPDATE).
 * @property {OrderItem}    [item]     - Item atualizado (em ITEM_UPDATE).
 * @property {Object}       [queue]    - Dados da fila (em QUEUE_UPDATE).
 * @property {number}       [queue.estimatedMinutesMin]
 * @property {number}       [queue.estimatedMinutesMax]
 * @property {number}       [queue.position]
 * @property {string}       [message]  - Mensagem de erro.
 */

/**
 * Estado de conexão do WebSocket.
 * @typedef {'CONNECTING' | 'CONNECTED' | 'RECONNECTING' | 'DISCONNECTED'} ConnectionStatus
 */

// Mapeamento de status para exibição em PT-BR
export const STATUS_LABELS = {
  PENDING: 'Pendente',
  IN_PREPARATION: 'Em preparo',
  READY: 'Pronto',
  DELIVERED: 'Entregue',
  CANCELLED: 'Cancelado',
};

// Mapeamento de status para estilos visuais (Tailwind classes)
export const STATUS_STYLES = {
  PENDING: {
    bg: 'bg-gray-100',
    text: 'text-gray-600',
    dot: 'bg-gray-400',
    bgCard: 'bg-gray-50',
    border: 'border-gray-200',
  },
  IN_PREPARATION: {
    bg: 'bg-amber-100',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
    bgCard: 'bg-amber-50',
    border: 'border-amber-200',
  },
  READY: {
    bg: 'bg-emerald-100',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
    bgCard: 'bg-emerald-50',
    border: 'border-emerald-200',
  },
  DELIVERED: {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    dot: 'bg-blue-500',
    bgCard: 'bg-blue-50',
    border: 'border-blue-200',
  },
  CANCELLED: {
    bg: 'bg-red-100',
    text: 'text-red-700',
    dot: 'bg-red-500',
    bgCard: 'bg-red-50',
    border: 'border-red-200',
  },
};

// Ordem de progressão dos status (para a barra de progresso)
export const STATUS_PROGRESSION = ['PENDING', 'IN_PREPARATION', 'READY', 'DELIVERED'];
