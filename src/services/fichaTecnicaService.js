const BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
const API_URL = `${BASE_URL}/fichas-tecnica`;

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function criarFichaTecnica(fichaTecnica) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(fichaTecnica),
  });

  if (!response.ok) {
    const erro = await response.json().catch(() => ({}));
    throw new Error(erro.detail || 'Erro ao criar ficha técnica');
  }

  return response.json();
}

export async function atualizarFichaTecnicaPorCardapio(idCardapio, fichaTecnica) {
  const response = await fetch(`${API_URL}/cardapio/${idCardapio}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(fichaTecnica),
  });

  if (!response.ok) {
    const erro = await response.json().catch(() => ({}));
    throw new Error(erro.detail || 'Erro ao atualizar ficha técnica');
  }

  return response.json();
}

export async function buscarFichaTecnicaCompleta(idCardapio) {
  const response = await fetch(`${API_URL}/cardapio/${idCardapio}/completa`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const erro = await response.json().catch(() => ({}));
    throw new Error(erro.detail || 'Erro ao buscar ficha técnica completa');
  }

  return response.json();
}