const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/+$/, '');

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function criarPedido(payload) {
  const response = await fetch(`${BASE_URL}/pedidos`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Erro ao criar pedido.');
  }

  return response.json();
}

export async function adicionarItensAoPedido(idPedido, itens) {
  const response = await fetch(`${BASE_URL}/pedidos/${idPedido}/itens`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(itens),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Erro ao adicionar itens ao pedido.');
  }

  return response.json();
}

export async function obterPedido(idPedido) {
  const response = await fetch(`${BASE_URL}/pedidos/${idPedido}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Erro ao obter pedido.');
  }

  return response.json();
}

export async function listarPedidos(params = {}) {
  const query = new URLSearchParams();
  if (params.idRestaurante) query.set('idRestaurante', params.idRestaurante);
  if (params.status) query.set('status', params.status);
  if (params.tipo) query.set('tipo', params.tipo);

  const queryString = query.toString() ? `?${query.toString()}` : '';
  const response = await fetch(`${BASE_URL}/pedidos${queryString}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Erro ao listar pedidos.');
  }

  return response.json();
}

export async function obterTrackingPedido(idPedido) {
  const response = await fetch(`${BASE_URL}/pedidos/${idPedido}/tracking`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Erro ao obter tracking do pedido.');
  }

  return response.json();
}

export async function alterarStatusItem(idItemPedido, status) {
  const response = await fetch(`${BASE_URL}/pedidos/itens/${idItemPedido}/status`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Erro ao alterar status do item.');
  }

  return response.json();
}

export async function liberarSobremesa(idItemPedido) {
  const response = await fetch(`${BASE_URL}/pedidos/itens/${idItemPedido}/liberar-sobremesa`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Erro ao liberar sobremesa.');
  }

  return response.json();
}

export async function obterFilaKds() {
  const response = await fetch(`${BASE_URL}/pedidos/kds/fila`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Erro ao obter fila do KDS.');
  }

  return response.json();
}

export async function abrirMesa(idMesa) {
  const response = await fetch(`${BASE_URL}/mesas/${idMesa}/abrir`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Erro ao abrir mesa.');
  }

  return response.json();
}

export async function listarMesas(idRestaurante) {
  const query = idRestaurante ? `?idRestaurante=${idRestaurante}` : '';
  const response = await fetch(`${BASE_URL}/mesas${query}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Erro ao listar mesas.');
  }

  return response.json();
}

export async function cancelarItemPedido(idItemPedido) {
  const response = await fetch(`${BASE_URL}/pedidos/itens/${idItemPedido}/cancelar`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Erro ao cancelar item do pedido.');
  }

  return response.json();
}

export async function chamarGarcom(idMesa) {
  const response = await fetch(`${BASE_URL}/mesas/${idMesa}/chamar-garcom`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Erro ao chamar garçom.');
  }

  return response.json();
}

export async function atenderChamadoMesa(idMesa) {
  const response = await fetch(`${BASE_URL}/mesas/${idMesa}/atender-chamado`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Erro ao atender chamado da mesa.');
  }

  return response.json();
}

export async function obterChamadosAtivos(idRestaurante) {
  const response = await fetch(`${BASE_URL}/mesas/chamados/ativos?idRestaurante=${idRestaurante}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Erro ao obter chamados ativos.');
  }

  return response.json();
}

export async function obterPedidoAtivoMesa(idMesa) {
  const response = await fetch(`${BASE_URL}/mesas/${idMesa}/pedido-ativo`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Erro ao obter comanda ativa da mesa.');
  }

  return response.json();
}

export async function registrarPagamento(idPedido, formaPagamento = 'Cartão de Crédito', valor = null) {
  const payload = { formaPagamento };
  if (valor !== null && valor !== undefined) {
    payload.valor = Number(valor);
  }
  const response = await fetch(`${BASE_URL}/pedidos/${idPedido}/pagamento`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Erro ao registrar pagamento.');
  }

  return response.json();
}

