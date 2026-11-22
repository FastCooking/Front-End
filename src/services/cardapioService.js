import { API_BASE as BASE_URL } from "../config/api";
const API_URL = `${BASE_URL}/cardapio`;

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function listarItensCardapio(idRestaurante) {
  const query = idRestaurante ? `?idRestaurante=${idRestaurante}` : '';
  const resposta = await fetch(`${API_URL}${query}`);
  if (!resposta.ok) {
    const erro = await resposta.json().catch(() => ({}));
    throw new Error(erro.detail || "Erro ao buscar itens do cardápio");
  }
  const dados = await resposta.json();
  return (dados || []).map((item) => ({
    ...item,
    id: item.idCardapio ?? item.id,
    disponivel: item.status ?? item.disponivel ?? true,
  }));
}

export async function criarItemCardapio(item, arquivo = null) {
  let resposta;

  if (arquivo) {
    const formData = new FormData();
    formData.append("file", arquivo);
    if (item.nome) formData.append("nome", item.nome);
    if (item.preco !== undefined) formData.append("preco", String(item.preco));
    if (item.tempoPreparo !== undefined) formData.append("tempoPreparo", String(item.tempoPreparo));
    if (item.categoria) formData.append("categoria", item.categoria);
    if (item.descricao) formData.append("descricao", item.descricao);
    if (item.idRestaurante) formData.append("idRestaurante", String(item.idRestaurante));
    if (item.disponivel !== undefined) formData.append("status", String(item.disponivel));

    resposta = await fetch(API_URL, {
      method: "POST",
      headers: { ...getAuthHeaders() },
      body: formData,
    });
  } else {
    resposta = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify(item),
    });
  }

  if (!resposta.ok) {
    const erro = await resposta.json().catch(() => ({}));
    throw new Error(erro.detail || "Erro ao criar item do cardápio");
  }
  const dados = await resposta.json();
  return {
    ...dados,
    id: dados.idCardapio ?? dados.id,
    disponivel: dados.status ?? dados.disponivel ?? true,
  };
}

export async function atualizarItemCardapio(id, item, arquivo = null) {
  let resposta;

  if (arquivo) {
    const formData = new FormData();
    formData.append("file", arquivo);
    if (item.nome) formData.append("nome", item.nome);
    if (item.preco !== undefined) formData.append("preco", String(item.preco));
    if (item.tempoPreparo !== undefined) formData.append("tempoPreparo", String(item.tempoPreparo));
    if (item.categoria) formData.append("categoria", item.categoria);
    if (item.descricao !== undefined && item.descricao !== null) {
      formData.append("descricao", item.descricao);
    }
    if (item.pathImage !== undefined) {
      formData.append("pathImage", item.pathImage || "");
    }
    if (item.disponivel !== undefined) {
      formData.append("status", String(item.disponivel));
    }

    resposta = await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: { ...getAuthHeaders() },
      body: formData,
    });
  } else {
    resposta = await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify(item),
    });
  }

  if (!resposta.ok) {
    const erro = await resposta.json().catch(() => ({}));
    throw new Error(erro.detail || "Erro ao atualizar item do cardápio");
  }
  const dados = await resposta.json();
  return {
    ...dados,
    id: dados.idCardapio ?? dados.id,
    disponivel: dados.status ?? dados.disponivel ?? true,
  };
}

export async function alternarDisponibilidade(id, disponivel) {
  const resposta = await fetch(`${API_URL}/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify({ status: Boolean(disponivel) }),
  });

  if (!resposta.ok) {
    const erro = await resposta.json().catch(() => ({}));
    throw new Error(
      erro.detail || "Erro ao alterar disponibilidade do item do cardápio."
    );
  }

  const dados = await resposta.json();
  return {
    ...dados,
    id: dados.idCardapio ?? dados.id,
    disponivel: dados.status ?? dados.disponivel ?? Boolean(disponivel),
  };
}

export async function excluirItemCardapio(id) {
  const resposta = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
    headers: { ...getAuthHeaders() },
  });
  if (!resposta.ok) {
    const erro = await resposta.json().catch(() => ({}));
    throw new Error(erro.detail || "Erro ao desativar/excluir item do cardápio");
  }
}
