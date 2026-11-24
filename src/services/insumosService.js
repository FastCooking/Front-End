import { API_BASE as BASE_URL } from "../config/api";
import { fetchComAuth } from "./apiClient";

const API_URL = `${BASE_URL}/insumos`;

export async function criarInsumos(dadosInsumos) {
  const response = await fetchComAuth(API_URL, {
    method: "POST",
    body: JSON.stringify(dadosInsumos),
  });

  if (!response.ok) {
    const erro = await response.json().catch(() => ({}));
    throw new Error(erro.detail || "Erro ao criar insumo no estoque");
  }

  return response.json();
}

export async function buscarInsumos() {
  const response = await fetchComAuth(API_URL, {
    method: "GET",
  });

  if (!response.ok) {
    const erro = await response.json().catch(() => ({}));
    throw new Error(erro.detail || "Erro ao buscar insumos no estoque");
  }

  return response.json();
}

export async function atualizarInsumo(idEstoque, dadosInsumos) {
  const response = await fetchComAuth(`${API_URL}/${idEstoque}`, {
    method: "PUT",
    body: JSON.stringify(dadosInsumos),
  });

  if (!response.ok) {
    const erro = await response.json().catch(() => ({}));
    throw new Error(erro.detail || "Erro ao atualizar insumo no estoque");
  }

  return response.json();
}

export async function excluirInsumo(idEstoque) {
  const response = await fetchComAuth(`${API_URL}/${idEstoque}`, {
    method: "DELETE",
  });

  if (!response.ok && response.status !== 204) {
    const erro = await response.json().catch(() => ({}));
    throw new Error(erro.detail || "Erro ao excluir insumo do estoque");
  }
}
