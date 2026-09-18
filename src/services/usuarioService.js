const BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
const API_URL = `${BASE_URL}/usuarios`;

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function listarUsuarios(params = {}) {
  const query = new URLSearchParams();
  if (params.idRestaurante) query.append('idRestaurante', params.idRestaurante);
  if (params.funcao) query.append('funcao', params.funcao);
  if (params.status !== undefined && params.status !== '') query.append('status', params.status);
  if (params.busca) query.append('busca', params.busca);
  if (params.skip !== undefined) query.append('skip', params.skip);
  if (params.limit !== undefined) query.append('limit', params.limit);

  const url = `${API_URL}${query.toString() ? `?${query.toString()}` : ''}`;
  const resposta = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!resposta.ok) {
    const erro = await resposta.json().catch(() => ({}));
    throw new Error(erro.detail || 'Erro ao listar usuários');
  }

  return resposta.json();
}

export async function obterUsuarioPorId(idUsuario) {
  const resposta = await fetch(`${API_URL}/${idUsuario}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!resposta.ok) {
    const erro = await resposta.json().catch(() => ({}));
    throw new Error(erro.detail || 'Erro ao obter usuário');
  }

  return resposta.json();
}

export async function criarUsuario(dados) {
  const resposta = await fetch(API_URL, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(dados),
  });

  if (!resposta.ok) {
    const erro = await resposta.json().catch(() => ({}));
    const msg = Array.isArray(erro.detail)
      ? erro.detail.map((e) => e.msg).join(', ')
      : erro.detail || 'Erro ao cadastrar usuário';
    throw new Error(msg);
  }

  return resposta.json();
}

export async function atualizarUsuario(idUsuario, dados) {
  const resposta = await fetch(`${API_URL}/${idUsuario}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(dados),
  });

  if (!resposta.ok) {
    const erro = await resposta.json().catch(() => ({}));
    const msg = Array.isArray(erro.detail)
      ? erro.detail.map((e) => e.msg).join(', ')
      : erro.detail || 'Erro ao atualizar usuário';
    throw new Error(msg);
  }

  return resposta.json();
}

export async function alterarStatusUsuario(idUsuario, status) {
  const resposta = await fetch(`${API_URL}/${idUsuario}/status`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ status }),
  });

  if (!resposta.ok) {
    const erro = await resposta.json().catch(() => ({}));
    throw new Error(erro.detail || 'Erro ao alterar status do usuário');
  }

  return resposta.json();
}

export async function resetarSenhaUsuario(idUsuario, novaSenha) {
  return atualizarUsuario(idUsuario, { senha: novaSenha });
}

export async function excluirUsuario(idUsuario) {
  const resposta = await fetch(`${API_URL}/${idUsuario}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!resposta.ok && resposta.status !== 204) {
    const erro = await resposta.json().catch(() => ({}));
    throw new Error(erro.detail || 'Erro ao remover usuário');
  }

  return true;
}
