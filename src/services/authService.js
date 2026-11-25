import { renovarToken, getAuthHeaders, fetchComAuth } from './apiClient';

const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/+$/, '');
const API_URL = `${BASE_URL}/auth`;

/**
 * Realiza login na API e retorna o token JWT, refresh token e dados do usuário.
 * @param {string} email
 * @param {string} senha
 * @returns {Promise<{ access_token: string, refresh_token: string, token_type: string, funcao: string, idUsuario?: string, idRestaurante?: string, nome?: string }>}
 */
export async function login(email, senha) {
    const resposta = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha }),
    });

    if (!resposta.ok) {
        const erro = await resposta.json().catch(() => ({}));
        throw new Error(erro.detail ?? 'Credenciais inválidas');
    }

    const dados = await resposta.json();
    return dados;
}

export { renovarToken, getAuthHeaders, fetchComAuth };
