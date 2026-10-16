const BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

export function getAuthToken() {
  return localStorage.getItem('token');
}

export function getRefreshToken() {
  return localStorage.getItem('refreshToken');
}

export function getAuthHeaders() {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function renovarToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error('Nenhum refresh token disponível.');
  }

  const resposta = await fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!resposta.ok) {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('funcao');
    localStorage.removeItem('user');
    throw new Error('Sessão expirada. Faça login novamente.');
  }

  const dados = await resposta.json();
  localStorage.setItem('token', dados.access_token);
  if (dados.refresh_token) {
    localStorage.setItem('refreshToken', dados.refresh_token);
  }
  return dados;
}

/**
 * Fetch wrapper que injeta cabeçalhos de autenticação e tenta renovar o token automaticamente
 * caso receba HTTP 401.
 */
export async function fetchComAuth(url, options = {}) {
  const headers = {
    ...getAuthHeaders(),
    ...(options.headers || {}),
  };

  let resposta = await fetch(url, { ...options, headers });

  if (resposta.status === 401 && getRefreshToken()) {
    try {
      const novosDados = await renovarToken();
      const retryHeaders = {
        ...headers,
        Authorization: `Bearer ${novosDados.access_token}`,
      };
      resposta = await fetch(url, { ...options, headers: retryHeaders });
    } catch {
      return resposta;
    }
  }

  return resposta;
}
