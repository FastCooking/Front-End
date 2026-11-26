import { API_BASE as BASE_URL } from "../config/api";
import { fetchComAuth } from "./apiClient";

const API_URL = `${BASE_URL}/restaurantes`;

export async function listarRestaurantes(params = {}) {
  const query = new URLSearchParams();
  if (params.busca) query.append("busca", params.busca);
  if (params.status !== undefined && params.status !== "")
    query.append("status", params.status);
  if (params.skip !== undefined) query.append("skip", params.skip);
  if (params.limit !== undefined) query.append("limit", params.limit);

  const url = `${API_URL}${query.toString() ? `?${query.toString()}` : ""}`;
  const resposta = await fetchComAuth(url, {
    method: "GET",
  });

  if (!resposta.ok) {
    const erro = await resposta.json().catch(() => ({}));
    throw new Error(erro.detail || "Erro ao listar restaurantes");
  }

  return resposta.json();
}

export async function obterRestaurantePorId(idRestaurante) {
  const resposta = await fetchComAuth(`${API_URL}/${idRestaurante}`, {
    method: "GET",
  });

  if (!resposta.ok) {
    const erro = await resposta.json().catch(() => ({}));
    throw new Error(erro.detail || "Erro ao obter restaurante");
  }

  return resposta.json();
}

export async function obterRestaurantePublico(idRestaurante) {
  const resposta = await fetch(`${API_URL}/${idRestaurante}/publico`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!resposta.ok) {
    const erro = await resposta.json().catch(() => ({}));
    throw new Error(erro.detail || "Erro ao obter dados públicos do restaurante");
  }

  return resposta.json();
}

export async function criarRestaurante(dados) {
  const resposta = await fetchComAuth(API_URL, {
    method: "POST",
    body: JSON.stringify(dados),
  });

  if (!resposta.ok) {
    const erro = await resposta.json().catch(() => ({}));
    const msg = Array.isArray(erro.detail)
      ? erro.detail.map((e) => e.msg).join(", ")
      : erro.detail || "Erro ao criar restaurante";
    throw new Error(msg);
  }

  return resposta.json();
}

export async function criarRestauranteComUsuario(dados) {
  const resposta = await fetchComAuth(`${API_URL}/com-usuario`, {
    method: "POST",
    body: JSON.stringify(dados),
  });

  if (!resposta.ok) {
    const erro = await resposta.json().catch(() => ({}));
    const msg = Array.isArray(erro.detail)
      ? erro.detail.map((e) => e.msg).join(", ")
      : erro.detail || "Erro ao criar restaurante e usuário inicial";
    throw new Error(msg);
  }

  return resposta.json();
}

export async function atualizarRestaurante(idRestaurante, dados) {
  const resposta = await fetchComAuth(`${API_URL}/${idRestaurante}`, {
    method: "PUT",
    body: JSON.stringify(dados),
  });

  if (!resposta.ok) {
    const erro = await resposta.json().catch(() => ({}));
    const msg = Array.isArray(erro.detail)
      ? erro.detail.map((e) => e.msg).join(", ")
      : erro.detail || "Erro ao atualizar restaurante";
    throw new Error(msg);
  }

  return resposta.json();
}

export async function alterarStatusRestaurante(idRestaurante, status) {
  const resposta = await fetchComAuth(`${API_URL}/${idRestaurante}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });

  if (!resposta.ok) {
    const erro = await resposta.json().catch(() => ({}));
    throw new Error(erro.detail || "Erro ao alterar status do restaurante");
  }

  return resposta.json();
}

export async function excluirRestaurante(idRestaurante) {
  const resposta = await fetchComAuth(`${API_URL}/${idRestaurante}`, {
    method: "DELETE",
  });

  if (!resposta.ok && resposta.status !== 204) {
    const erro = await resposta.json().catch(() => ({}));
    throw new Error(erro.detail || "Erro ao remover restaurante");
  }

  return true;
}
