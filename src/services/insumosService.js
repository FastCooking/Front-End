const BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
const API_URL = `${BASE_URL}/insumos`;

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function criarInsumos(dadosInsumos) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(dadosInsumos),
  });

  if (!response.ok) {
    const erro = await response.json().catch(() => ({}));
    throw new Error(erro.detail || 'Erro ao criar insumo no estoque');
  }

  return response.json();
}

export async function buscarInsumos() {
  const response = await fetch(API_URL, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const erro = await response.json().catch(() => ({}));
    throw new Error(erro.detail || 'Erro ao buscar insumos no estoque');
  }

  return response.json();
}

export async function atualizarInsumo(idEstoque, dadosInsumos) {
  const response = await fetch(`${API_URL}/${idEstoque}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(dadosInsumos),
  });

  if (!response.ok) {
    const erro = await response.json().catch(() => ({}));
    throw new Error(erro.detail || 'Erro ao atualizar insumo no estoque');
  }

  return response.json();
}

export async function excluirInsumo(idEstoque) {
  const response = await fetch(`${API_URL}/${idEstoque}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!response.ok && response.status !== 204) {
    const erro = await response.json().catch(() => ({}));
    throw new Error(erro.detail || 'Erro ao excluir insumo do estoque');
  }
}