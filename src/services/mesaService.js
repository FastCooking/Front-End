import { fetchComAuth, getAuthHeaders } from './apiClient';

const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/+$/, '');
const API_URL = `${BASE_URL}/mesas`;

export async function listarMesas(idRestaurante, status = null) {
  const params = new URLSearchParams();
  if (idRestaurante) params.append('idRestaurante', idRestaurante);
  if (status) params.append('status', status);

  const query = params.toString() ? `?${params.toString()}` : '';
  const resposta = await fetchComAuth(`${API_URL}${query}`);

  if (!resposta.ok) {
    const erro = await resposta.json().catch(() => ({}));
    throw new Error(erro.detail || 'Erro ao listar mesas.');
  }

  return resposta.json();
}

export async function criarMesa({ idRestaurante, numero, status = 'Disponivel' }) {
  const resposta = await fetchComAuth(API_URL, {
    method: 'POST',
    body: JSON.stringify({
      idRestaurante,
      numero: Number(numero),
      status,
    }),
  });

  if (!resposta.ok) {
    const erro = await resposta.json().catch(() => ({}));
    throw new Error(erro.detail || 'Erro ao cadastrar mesa.');
  }

  return resposta.json();
}

export async function atualizarMesa(idMesa, { numero, status }) {
  const payload = {};
  if (numero !== undefined && numero !== null) payload.numero = Number(numero);
  if (status !== undefined && status !== null) payload.status = status;

  const resposta = await fetchComAuth(`${API_URL}/${idMesa}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

  if (!resposta.ok) {
    const erro = await resposta.json().catch(() => ({}));
    throw new Error(erro.detail || 'Erro ao atualizar mesa.');
  }

  return resposta.json();
}

export async function excluirMesa(idMesa) {
  const resposta = await fetchComAuth(`${API_URL}/${idMesa}`, {
    method: 'DELETE',
  });

  if (!resposta.ok) {
    const erro = await resposta.json().catch(() => ({}));
    throw new Error(erro.detail || 'Erro ao excluir mesa.');
  }
}

export async function obterQrCodeMesaUrl(idMesa) {
  const resposta = await fetch(`${API_URL}/${idMesa}/qrcode`, {
    headers: getAuthHeaders(),
  });

  if (!resposta.ok) {
    const erro = await resposta.json().catch(() => ({}));
    throw new Error(erro.detail || 'Erro ao obter QR Code da mesa.');
  }

  const blob = await resposta.blob();
  return URL.createObjectURL(blob);
}

export async function obterPedidoAtivoMesa(idMesa) {
  const resposta = await fetchComAuth(`${API_URL}/${idMesa}/pedido-ativo`);

  if (!resposta.ok) {
    const erro = await resposta.json().catch(() => ({}));
    throw new Error(erro.detail || 'Nenhum pedido ativo encontrado para esta mesa.');
  }

  return resposta.json();
}
