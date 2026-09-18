const BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
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
    if (item.categoria) formData.append("categoria", item.categoria);
    if (item.descricao) formData.append("descricao", item.descricao);
    if (item.idRestaurante) formData.append("idRestaurante", String(item.idRestaurante));

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
    if (item.categoria) formData.append("categoria", item.categoria);
    if (item.descricao !== undefined && item.descricao !== null) {
      formData.append("descricao", item.descricao);
    }
    if (item.pathImage !== undefined) {
      formData.append("pathImage", item.pathImage || "");
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
  if (!disponivel) {
    return excluirItemCardapio(id);
  } else {
    throw new Error("Backend não possui rota para reativar um item desativado.");
  }
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
