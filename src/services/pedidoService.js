import { API_BASE as BASE_URL } from "../config/api";
import { fetchComAuth } from "./apiClient";

export async function criarPedido(payload) {
  const response = await fetchComAuth(`${BASE_URL}/pedidos`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Erro ao criar pedido.");
  }

  return response.json();
}

export async function adicionarItensAoPedido(idPedido, itens) {
  const response = await fetchComAuth(`${BASE_URL}/pedidos/${idPedido}/itens`, {
    method: "POST",
    body: JSON.stringify(itens),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Erro ao adicionar itens ao pedido.");
  }

  return response.json();
}

export async function obterPedido(idPedido) {
  const response = await fetchComAuth(`${BASE_URL}/pedidos/${idPedido}`, {
    method: "GET",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Erro ao obter pedido.");
  }

  return response.json();
}

export async function listarPedidos(params = {}) {
  const query = new URLSearchParams();
  if (params.idRestaurante) query.set("idRestaurante", params.idRestaurante);
  if (params.status) query.set("status", params.status);
  if (params.tipo) query.set("tipo", params.tipo);

  const queryString = query.toString() ? `?${query.toString()}` : "";
  const response = await fetchComAuth(`${BASE_URL}/pedidos${queryString}`, {
    method: "GET",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Erro ao listar pedidos.");
  }

  return response.json();
}

export async function obterTrackingPedido(idPedido) {
  const response = await fetchComAuth(
    `${BASE_URL}/pedidos/${idPedido}/tracking`,
    {
      method: "GET",
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Erro ao obter tracking do pedido.");
  }

  return response.json();
}

export async function alterarStatusItem(idItemPedido, status) {
  const response = await fetchComAuth(
    `${BASE_URL}/pedidos/itens/${idItemPedido}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Erro ao alterar status do item.");
  }

  return response.json();
}

export async function obterFilaEntregasProntas() {
  const response = await fetchComAuth(`${BASE_URL}/pedidos/entregas/fila`, {
    method: "GET",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.detail || "Erro ao obter fila de entregas prontas."
    );
  }

  return response.json();
}

export async function concluirEntrega(deliveryOrItemId) {
  const response = await fetchComAuth(
    `${BASE_URL}/pedidos/entregas/${deliveryOrItemId}/complete`,
    {
      method: "POST",
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Erro ao confirmar entrega do item.");
  }

  return response.json();
}

export async function liberarSobremesa(idItemPedido) {
  const response = await fetchComAuth(
    `${BASE_URL}/pedidos/itens/${idItemPedido}/liberar-sobremesa`,
    {
      method: "PATCH",
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Erro ao liberar sobremesa.");
  }

  return response.json();
}

export async function obterFilaCozinha() {
  const response = await fetchComAuth(`${BASE_URL}/pedidos/kds/fila`, {
    method: "GET",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Erro ao obter fila da cozinha.");
  }

  return response.json();
}

export const obterFilaKds = obterFilaCozinha;

export async function abrirMesa(idMesa) {
  const response = await fetchComAuth(`${BASE_URL}/mesas/${idMesa}/abrir`, {
    method: "POST",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Erro ao abrir mesa.");
  }

  return response.json();
}

export async function listarMesas(idRestaurante) {
  const query = idRestaurante ? `?idRestaurante=${idRestaurante}` : "";
  const response = await fetchComAuth(`${BASE_URL}/mesas${query}`, {
    method: "GET",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Erro ao listar mesas.");
  }

  return response.json();
}

export const JUSTIFICATIVA_CANCELAMENTO_PADRAO =
  "Cancelado pelo garçom no atendimento da mesa";

/**
 * Configuração ativa do fluxo de desconto na comanda pelo Garçom.
 * - `habilitado`: Define se a seção de aplicar/remover desconto é exibida no modal de pagamento.
 * - `perfilAutorizador`: Define de quem a senha de autenticação será exigida ("Garcom").
 * - `limitePercentualMaximo`: Percentual máximo permitido para desconto (40%).
 */
export const CONFIG_DESCONTO_COMANDA = {
  habilitado: true,
  perfilAutorizador: "Garcom",
  limitePercentualMaximo: 40,
};

export async function cancelarItemPedido(
  idItemPedido,
  motivo = JUSTIFICATIVA_CANCELAMENTO_PADRAO
) {
  const motivoEfetivo =
    typeof motivo === "string" && motivo.trim()
      ? motivo.trim()
      : JUSTIFICATIVA_CANCELAMENTO_PADRAO;

  const response = await fetchComAuth(
    `${BASE_URL}/pedidos/itens/${idItemPedido}/cancelar`,
    {
      method: "PATCH",
      body: JSON.stringify({
        motivo: motivoEfetivo,
        justificativa: motivoEfetivo,
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Erro ao cancelar item do pedido.");
  }

  return response.json();
}

export async function aplicarDescontoPedido(idPedido, payload) {
  const response = await fetchComAuth(
    `${BASE_URL}/pedidos/${idPedido}/desconto`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Erro ao aplicar desconto na comanda.");
  }

  return response.json();
}

export async function removerDescontoPedido(idPedido, payload = {}) {
  const response = await fetchComAuth(
    `${BASE_URL}/pedidos/${idPedido}/desconto`,
    {
      method: "DELETE",
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Erro ao remover desconto da comanda.");
  }

  return response.json();
}

export async function obterLogsDescontoPedido(idPedido) {
  const response = await fetchComAuth(
    `${BASE_URL}/pedidos/${idPedido}/desconto/logs`,
    {
      method: "GET",
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.detail || "Erro ao consultar histórico de descontos."
    );
  }

  return response.json();
}

export async function chamarGarcom(idMesa) {
  const response = await fetch(`${BASE_URL}/mesas/${idMesa}/chamar-garcom`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Erro ao chamar garçom.");
  }

  return response.json();
}

export async function atenderChamadoMesa(idMesa) {
  const response = await fetchComAuth(
    `${BASE_URL}/mesas/${idMesa}/atender-chamado`,
    {
      method: "POST",
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Erro ao atender chamado da mesa.");
  }

  return response.json();
}

export async function obterChamadosAtivos(idRestaurante) {
  const query = idRestaurante ? `?idRestaurante=${idRestaurante}` : "";
  const response = await fetchComAuth(
    `${BASE_URL}/mesas/chamados/ativos${query}`,
    {
      method: "GET",
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Erro ao obter chamados ativos.");
  }

  return response.json();
}

export async function obterPedidoAtivoMesa(idMesa) {
  const response = await fetchComAuth(
    `${BASE_URL}/mesas/${idMesa}/pedido-ativo`,
    {
      method: "GET",
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Erro ao obter comanda ativa da mesa.");
  }

  const data = await response.json();
  const pedidoData = data.pedido || {};
  return {
    ...data,
    idPedido: data.idPedido || pedidoData.idPedido,
    status: data.status || pedidoData.status,
    idMesa: data.idMesa || pedidoData.idMesa,
    sessao_id: data.sessao_id || pedidoData.sessao_id,
    idRestaurante: data.idRestaurante || pedidoData.idRestaurante,
    itens: data.itens || [],
    pedido: pedidoData,
  };
}

export async function alterarQuantidadeItem(idItemPedido, quantidade) {
  const response = await fetchComAuth(
    `${BASE_URL}/pedidos/itens/${idItemPedido}/quantidade`,
    {
      method: "PATCH",
      body: JSON.stringify({
        quantidade: Number(quantidade),
        motivo: "Alteração de quantidade pelo colaborador",
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Erro ao alterar quantidade do item.");
  }

  return response.json();
}

export async function registrarPagamento(
  idPedido,
  formaPagamento = "Cartão de Crédito",
  valor = null,
  cancelar_pendentes = true
) {
  const payload = {
    formaPagamento,
    cancelar_pendentes: Boolean(cancelar_pendentes),
  };
  if (valor !== null && valor !== undefined) {
    payload.valor = Number(valor);
  }
  const response = await fetchComAuth(
    `${BASE_URL}/pedidos/${idPedido}/pagamento`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Erro ao registrar pagamento.");
  }

  return response.json();
}
