/**
 * ─── Mock WebSocket Server — Simula o KDS para testar o Order Tracking ──────
 *
 * Uso:   node mock-ws-server.js
 * Porta: 8000 (mesma do VITE_API_URL)
 *
 * Ao conectar em ws://localhost:8000/ws/tracking/:orderId:
 *   1. Envia ORDER_UPDATE com snapshot completo do pedido
 *   2. A cada ~4s atualiza um item (PENDING → IN_PREPARATION → READY → DELIVERED)
 *   3. A cada ~6s envia QUEUE_UPDATE recalculando tempo estimado
 *   4. Quando todos os itens estão DELIVERED, envia ORDER_UPDATE final com status DELIVERED
 *
 * Se o orderId for "invalido" ou "404", fecha com código 4404 (pedido não encontrado).
 */

import { WebSocketServer } from 'ws';
import http from 'http';

const PORT = 8000;

// ─── Dados mockados ─────────────────────────────────────────────────────────

function createMockOrder(orderId) {
  return {
    id: orderId,
    customerName: 'Carlos',
    tableNumber: 7,
    status: 'PENDING',
    estimatedMinutesMin: 25,
    estimatedMinutesMax: 35,
    queuePosition: 4,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    items: [
      {
        id: 'item-1',
        name: 'Filé Mignon ao Molho Madeira',
        quantity: 1,
        notes: 'Ponto médio, sem cebola',
        status: 'PENDING',
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
        status: 'PENDING',
      },
      {
        id: 'item-4',
        name: 'Pudim de Leite Condensado',
        quantity: 1,
        notes: null,
        status: 'PENDING',
      },
    ],
  };
}

const STATUS_FLOW = ['PENDING', 'IN_PREPARATION', 'READY', 'DELIVERED'];

function nextStatus(current) {
  const idx = STATUS_FLOW.indexOf(current);
  if (idx < 0 || idx >= STATUS_FLOW.length - 1) return current;
  return STATUS_FLOW[idx + 1];
}

function deriveOrderStatus(items) {
  if (items.every((it) => it.status === 'DELIVERED')) return 'DELIVERED';
  if (items.every((it) => it.status === 'READY' || it.status === 'DELIVERED')) return 'READY';
  if (items.some((it) => it.status === 'IN_PREPARATION' || it.status === 'READY')) return 'IN_PREPARATION';
  return 'PENDING';
}

// ─── Servidor HTTP + WebSocket ──────────────────────────────────────────────

const server = http.createServer((req, res) => {
  // Resposta para requests HTTP normais (health check)
  res.writeHead(200, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(JSON.stringify({ status: 'ok', message: 'Mock WebSocket Server rodando' }));
});

const wss = new WebSocketServer({ server });

wss.on('connection', (ws, req) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathParts = url.pathname.split('/').filter(Boolean);

  // Espera: /ws/tracking/:orderId
  const orderId = pathParts.length >= 3 ? pathParts[2] : null;

  console.log(`\n🔌 Nova conexão — orderId: ${orderId || '(vazio)'}`);

  // Simula pedido não encontrado
  if (!orderId || orderId === 'invalido' || orderId === '404') {
    console.log('   ❌ Pedido não encontrado, fechando com 4404');
    ws.close(4404, 'Pedido não encontrado');
    return;
  }

  // Cria pedido mock
  const order = createMockOrder(orderId);
  const timers = [];

  // 1. Envia snapshot completo imediatamente
  const snapshot = { type: 'ORDER_UPDATE', order: { ...order } };
  ws.send(JSON.stringify(snapshot));
  console.log('   📤 ORDER_UPDATE (snapshot inicial)');

  // 2. Simula progressão dos itens a cada 4 segundos
  let itemIndex = 0;
  const itemTimer = setInterval(() => {
    if (ws.readyState !== ws.OPEN) return;

    // Encontra o próximo item que ainda não está DELIVERED
    let found = false;
    for (let tries = 0; tries < order.items.length; tries++) {
      const item = order.items[itemIndex % order.items.length];
      if (item.status !== 'DELIVERED') {
        item.status = nextStatus(item.status);
        item.updatedAt = new Date().toISOString();

        const itemUpdate = { type: 'ITEM_UPDATE', item: { ...item } };
        ws.send(JSON.stringify(itemUpdate));
        console.log(`   📤 ITEM_UPDATE: "${item.name}" → ${item.status}`);

        // Atualiza status geral
        order.status = deriveOrderStatus(order.items);
        order.updatedAt = new Date().toISOString();

        found = true;
        itemIndex++;
        break;
      }
      itemIndex++;
    }

    // Se todos os itens estão DELIVERED, envia ORDER_UPDATE final
    if (!found || order.items.every((it) => it.status === 'DELIVERED')) {
      order.status = 'DELIVERED';
      order.updatedAt = new Date().toISOString();
      order.estimatedMinutesMin = 0;
      order.estimatedMinutesMax = 0;
      order.queuePosition = 0;

      const finalUpdate = { type: 'ORDER_UPDATE', order: { ...order, items: [...order.items] } };
      ws.send(JSON.stringify(finalUpdate));
      console.log('   🎉 ORDER_UPDATE: Pedido DELIVERED (completo!)');
      clearInterval(itemTimer);
    }
  }, 4000);
  timers.push(itemTimer);

  // 3. Simula atualização de fila a cada 6 segundos
  const queueTimer = setInterval(() => {
    if (ws.readyState !== ws.OPEN || order.status === 'DELIVERED') {
      clearInterval(queueTimer);
      return;
    }

    queueTick++;
    const newMin = Math.max(5, order.estimatedMinutesMin - 3);
    const newMax = Math.max(8, order.estimatedMinutesMax - 4);
    const newPos = Math.max(1, order.queuePosition - 1);

    order.estimatedMinutesMin = newMin;
    order.estimatedMinutesMax = newMax;
    order.queuePosition = newPos;

    const queueUpdate = {
      type: 'QUEUE_UPDATE',
      queue: {
        estimatedMinutesMin: newMin,
        estimatedMinutesMax: newMax,
        position: newPos,
      },
    };
    ws.send(JSON.stringify(queueUpdate));
    console.log(`   📤 QUEUE_UPDATE: ${newMin}-${newMax}min, posição ${newPos}`);
  }, 6000);
  timers.push(queueTimer);

  // Cleanup quando o cliente desconecta
  ws.on('close', () => {
    console.log(`   🔌 Conexão fechada — orderId: ${orderId}`);
    timers.forEach(clearInterval);
  });

  ws.on('error', (err) => {
    console.error(`   ⚠️  Erro na conexão:`, err.message);
    timers.forEach(clearInterval);
  });
});

server.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║   🍳 FastCooking — Mock WebSocket Server                    ║');
  console.log(`║   Rodando em: http://localhost:${PORT}                        ║`);
  console.log('║                                                              ║');
  console.log('║   WebSocket:  ws://localhost:8000/ws/tracking/:orderId       ║');
  console.log('║                                                              ║');
  console.log('║   Teste:   http://localhost:5173/tracking/pedido-123         ║');
  console.log('║   Erro:    http://localhost:5173/tracking/invalido           ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');
});
