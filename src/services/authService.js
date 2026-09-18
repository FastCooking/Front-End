const BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
const API_URL = `${BASE_URL}/auth`;

/**
 * Realiza login na API e retorna o token JWT e a função do usuário.
 * @param {string} email
 * @param {string} senha
 * @returns {{ access_token: string, token_type: string, funcao: string }}
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

    return resposta.json();
}
