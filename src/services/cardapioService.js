const BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
const API_URL = `${BASE_URL}/cardapio`;

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function listarItensCardapio() {
  const resposta = await fetch(API_URL);
  if (!resposta.ok) throw new Error("Erro ao buscar itens do cardápio");
  return resposta.json();
}

export async function criarItemCardapio(item) {
  const resposta = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify(item),
  });
  if (!resposta.ok) throw new Error("Erro ao criar item do cardápio");
  return resposta.json();
}

export async function atualizarItemCardapio(id, item) {
  const resposta = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify(item),
  });
  if (!resposta.ok) throw new Error("Erro ao atualizar item do cardápio");
  return resposta.json();
}

export async function alternarDisponibilidade(id, disponivel) {
  const resposta = await fetch(`${API_URL}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify({ disponivel }),
  });
  if (!resposta.ok) throw new Error("Erro ao atualizar disponibilidade");
  return resposta.json();
}

export async function excluirItemCardapio(id) {
  const resposta = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
    headers: { ...getAuthHeaders() },
  });
  if (!resposta.ok) throw new Error("Erro ao excluir item do cardápio");
}
