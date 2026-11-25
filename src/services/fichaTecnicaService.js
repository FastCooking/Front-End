import { API_BASE as BASE_URL } from "../config/api";
import { fetchComAuth } from "./apiClient";

const API_URL = `${BASE_URL}/fichas-tecnica`;

export async function criarFichaTecnica(fichaTecnica) {
  const response = await fetchComAuth(API_URL, {
    method: "POST",
    body: JSON.stringify(fichaTecnica),
  });

  if (!response.ok) {
    const erro = await response.json().catch(() => ({}));
    throw new Error(erro.detail || "Erro ao criar ficha técnica");
  }

  return response.json();
}

export async function atualizarFichaTecnicaPorCardapio(
  idCardapio,
  fichaTecnica
) {
  const response = await fetchComAuth(`${API_URL}/cardapio/${idCardapio}`, {
    method: "PUT",
    body: JSON.stringify(fichaTecnica),
  });

  if (!response.ok) {
    const erro = await response.json().catch(() => ({}));
    throw new Error(erro.detail || "Erro ao atualizar ficha técnica");
  }

  return response.json();
}

export async function buscarFichaTecnicaCompleta(idCardapio) {
  const response = await fetchComAuth(
    `${API_URL}/cardapio/${idCardapio}/completa`,
    {
      method: "GET",
    }
  );

  if (!response.ok) {
    const erro = await response.json().catch(() => ({}));
    throw new Error(erro.detail || "Erro ao buscar ficha técnica completa");
  }

  return response.json();
}
