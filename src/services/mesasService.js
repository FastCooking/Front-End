// Serviço com as regras de negócio de Mesas, Comandas, Pagamentos, Descontos e Fechamento de Conta
// (RF05, RF13, RF14, RF15, RF16, UC11, UC12)

const STORAGE_KEY_MESAS = "fastcooking_mesas_v1";
const STORAGE_KEY_LOGS_DESCONTO = "fastcooking_logs_desconto_v1";
const STORAGE_KEY_HISTORICO_FECHAMENTO = "fastcooking_historico_fechamento_v1";
const EVENTO_MUDANCA_MESAS = "fastcooking_mesas_changed";

// Senha do gerente definida conforme AuthMock.js (gerente@test.com / 654321)
const SENHA_GERENTE_PADRAO = "654321";

const MESAS_INICIAIS = [
  {
    numeroMesa: 7,
    status: "aberta", // "aberta" | "livre" | "fechada"
    solicitouFechamento: true, // RF05: Cliente sinalizou encerramento pelo autoatendimento
    horarioAbertura: "19:40",
    comanda: {
      idComanda: "COM-007",
      itens: [
        { idItem: 1, nomeItem: "Suco de Laranja Natural", quantidade: 2, precoUnitario: 12.0, categoria: "Bebidas", entregue: true },
        { idItem: 2, nomeItem: "Bruschetta Tradicional", quantidade: 1, precoUnitario: 28.0, categoria: "Entrada", entregue: true },
        { idItem: 3, nomeItem: "Filé ao Molho Madeira", quantidade: 1, precoUnitario: 68.0, categoria: "Prato Principal", entregue: true },
        { idItem: 4, nomeItem: "Mousse de Maracujá", quantidade: 2, precoUnitario: 18.0, categoria: "Sobremesa", entregue: true },
      ],
      desconto: {
        aplicado: false,
        tipo: "percentual", // "percentual" ou "valor"
        valorInformado: 0,
        valorDesconto: 0,
        motivo: "",
        gerenteAutorizador: "",
        garcomSolicitante: "",
        dataHora: null,
      },
      pagamentos: [],
      status: "aberta",
    },
  },
  {
    numeroMesa: 4,
    status: "aberta",
    solicitouFechamento: false,
    horarioAbertura: "20:05",
    comanda: {
      idComanda: "COM-004",
      itens: [
        { idItem: 10, nomeItem: "Bruschetta Tradicional", quantidade: 1, precoUnitario: 28.0, categoria: "Entrada", entregue: true },
        { idItem: 11, nomeItem: "Chopp Artesanal 500ml", quantidade: 2, precoUnitario: 16.0, categoria: "Bebidas", entregue: true },
      ],
      desconto: { aplicado: false, valorDesconto: 0 },
      pagamentos: [],
      status: "aberta",
    },
  },
  {
    numeroMesa: 2,
    status: "aberta",
    solicitouFechamento: false,
    horarioAbertura: "20:15",
    comanda: {
      idComanda: "COM-002",
      itens: [
        { idItem: 20, nomeItem: "Filé ao Molho Madeira", quantidade: 1, precoUnitario: 68.0, categoria: "Prato Principal", entregue: true },
        { idItem: 21, nomeItem: "Água Mineral com Gás", quantidade: 1, precoUnitario: 6.0, categoria: "Bebidas", entregue: true },
      ],
      desconto: { aplicado: false, valorDesconto: 0 },
      pagamentos: [],
      status: "aberta",
    },
  },
  {
    numeroMesa: 3,
    status: "aberta",
    solicitouFechamento: false,
    horarioAbertura: "20:20",
    comanda: {
      idComanda: "COM-003",
      itens: [
        { idItem: 30, nomeItem: "Picanha na Brasa com Fritas", quantidade: 2, precoUnitario: 85.0, categoria: "Prato Principal", entregue: true },
        { idItem: 31, nomeItem: "Caipirinha de Limão", quantidade: 2, precoUnitario: 22.0, categoria: "Bebidas", entregue: true },
      ],
      desconto: { aplicado: false, valorDesconto: 0 },
      pagamentos: [],
      status: "aberta",
    },
  },
  {
    numeroMesa: 1,
    status: "livre",
    solicitouFechamento: false,
    horarioAbertura: null,
    comanda: null,
  },
  {
    numeroMesa: 5,
    status: "livre",
    solicitouFechamento: false,
    horarioAbertura: null,
    comanda: null,
  },
];

export function obterMesasStorage() {
  try {
    const salvo = localStorage.getItem(STORAGE_KEY_MESAS);
    if (!salvo) {
      localStorage.setItem(STORAGE_KEY_MESAS, JSON.stringify(MESAS_INICIAIS));
      return [...MESAS_INICIAIS];
    }
    return JSON.parse(salvo);
  } catch (e) {
    console.error("Erro ao ler mesas do localStorage:", e);
    return [...MESAS_INICIAIS];
  }
}

export function salvarMesasStorage(mesas) {
  try {
    localStorage.setItem(STORAGE_KEY_MESAS, JSON.stringify(mesas));
    window.dispatchEvent(new CustomEvent(EVENTO_MUDANCA_MESAS, { detail: mesas }));
  } catch (e) {
    console.error("Erro ao salvar mesas no localStorage:", e);
  }
}

export function subscreverMudancasMesas(callback) {
  function handleCustomEvent(e) {
    callback(e.detail || obterMesasStorage());
  }

  function handleStorageEvent(e) {
    if (e.key === STORAGE_KEY_MESAS) {
      callback(obterMesasStorage());
    }
  }

  window.addEventListener(EVENTO_MUDANCA_MESAS, handleCustomEvent);
  window.addEventListener("storage", handleStorageEvent);

  return () => {
    window.removeEventListener(EVENTO_MUDANCA_MESAS, handleCustomEvent);
    window.removeEventListener("storage", handleStorageEvent);
  };
}

/**
 * Calcula subtotal, desconto, total, total pago e saldo restante de uma mesa
 */
export function calcularTotaisMesa(mesa) {
  if (!mesa || !mesa.comanda) {
    return {
      subtotal: 0,
      valorDesconto: 0,
      totalComDesconto: 0,
      totalPago: 0,
      saldoRestante: 0,
      podeEncerrar: false,
    };
  }

  const subtotal = (mesa.comanda.itens || []).reduce(
    (acc, item) => acc + item.quantidade * item.precoUnitario,
    0
  );

  let valorDesconto = 0;
  const desc = mesa.comanda.desconto;
  if (desc && desc.aplicado) {
    if (desc.tipo === "percentual") {
      valorDesconto = (subtotal * parseFloat(desc.valorInformado)) / 100;
    } else {
      valorDesconto = parseFloat(desc.valorInformado) || 0;
    }
    // Garante que o desconto não ultrapasse o subtotal
    valorDesconto = Math.min(valorDesconto, subtotal);
  }

  const totalComDesconto = Math.max(0, subtotal - valorDesconto);

  const totalPago = (mesa.comanda.pagamentos || []).reduce(
    (acc, p) => acc + parseFloat(p.valor || 0),
    0
  );

  // Consideramos diferença de até 0.001 como zero por arredondamento flutuante
  const diferenca = totalComDesconto - totalPago;
  const saldoRestante = diferenca > 0.005 ? diferenca : 0;
  const podeEncerrar = totalPago >= totalComDesconto - 0.005 && totalComDesconto > 0;

  return {
    subtotal: Number(subtotal.toFixed(2)),
    valorDesconto: Number(valorDesconto.toFixed(2)),
    totalComDesconto: Number(totalComDesconto.toFixed(2)),
    totalPago: Number(totalPago.toFixed(2)),
    saldoRestante: Number(saldoRestante.toFixed(2)),
    podeEncerrar,
  };
}

/**
 * Retorna as mesas com totais calculados
 */
export async function buscarMesas() {
  return new Promise((resolve) => {
    setTimeout(() => {
      const mesas = obterMesasStorage();
      const formatadas = mesas.map((mesa) => ({
        ...mesa,
        totais: calcularTotaisMesa(mesa),
      }));

      const abertas = formatadas.filter((m) => m.status === "aberta");
      const solicitandoFechamento = abertas.filter((m) => m.solicitouFechamento);

      resolve({
        mesas: formatadas,
        abertas,
        solicitandoFechamento,
        totalAbertas: abertas.length,
        totalSolicitacoes: solicitandoFechamento.length,
      });
    }, 150);
  });
}

/**
 * Busca uma mesa específica por número com totais calculados
 */
export async function buscarMesaPorNumero(numeroMesa) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const mesas = obterMesasStorage();
      const mesa = mesas.find((m) => m.numeroMesa === Number(numeroMesa));
      if (!mesa) {
        return reject(new Error(`Mesa ${numeroMesa} não encontrada.`));
      }
      resolve({
        ...mesa,
        totais: calcularTotaisMesa(mesa),
      });
    }, 100);
  });
}

/**
 * Validação de senha do gerente para desconto (UC12, RF13)
 */
export function validarSenhaGerente(senha) {
  return senha === SENHA_GERENTE_PADRAO;
}

/**
 * Aplica desconto na comanda condicionado à autenticação da senha do gerente (RF13, UC12)
 */
export async function aplicarDesconto(numeroMesa, { senhaGerente, tipo, valor, motivo, garcom }) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // 1. Validação da senha do gerente (RF13, UC12)
      if (!validarSenhaGerente(senhaGerente)) {
        // Registra tentativa falha de autenticação no log
        const logTentativa = {
          tipo: "tentativa_falha_desconto",
          numeroMesa,
          usuario: garcom,
          dataHora: new Date().toISOString(),
          motivo: "Senha do gerente inválida",
        };
        salvarLog(STORAGE_KEY_LOGS_DESCONTO, logTentativa);

        return reject(new Error("Senha do gerente inválida. Concessão de desconto rejeitada!"));
      }

      if (!valor || parseFloat(valor) <= 0) {
        return reject(new Error("Informe um valor de desconto válido maior que zero."));
      }

      if (!motivo || motivo.trim() === "") {
        return reject(new Error("O registro de justificativa/motivo é obrigatório para aplicar desconto."));
      }

      const mesas = obterMesasStorage();
      const index = mesas.findIndex((m) => m.numeroMesa === Number(numeroMesa));

      if (index === -1) {
        return reject(new Error(`Mesa ${numeroMesa} não encontrada.`));
      }

      const mesa = mesas[index];
      if (!mesa.comanda) {
        return reject(new Error("Esta mesa não possui comanda aberta."));
      }

      const valorNumerico = parseFloat(valor);
      const subtotal = (mesa.comanda.itens || []).reduce(
        (acc, item) => acc + item.quantidade * item.precoUnitario,
        0
      );

      let valorCalculadoReais;
      if (tipo === "percentual") {
        if (valorNumerico > 100) {
          return reject(new Error("Desconto percentual não pode ultrapassar 100%."));
        }
        valorCalculadoReais = (subtotal * valorNumerico) / 100;
      } else {
        if (valorNumerico > subtotal) {
          return reject(new Error("O desconto não pode ser maior que o subtotal da conta."));
        }
        valorCalculadoReais = valorNumerico;
      }

      const novoDesconto = {
        aplicado: true,
        tipo,
        valorInformado: valorNumerico,
        valorDesconto: Number(valorCalculadoReais.toFixed(2)),
        motivo: motivo.trim(),
        gerenteAutorizador: "gerente@test.com",
        garcomSolicitante: garcom || "Garçom em serviço",
        dataHora: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      mesa.comanda.desconto = novoDesconto;
      mesas[index] = mesa;
      salvarMesasStorage(mesas);

      // Log auditável conforme RF13 (usuário, valor e horário do desconto)
      const logAuditoria = {
        tipo: "desconto_concedido",
        numeroMesa,
        comandaId: mesa.comanda.idComanda,
        usuarioSolicitante: novoDesconto.garcomSolicitante,
        gerenteAutorizador: novoDesconto.gerenteAutorizador,
        valorDesconto: novoDesconto.valorDesconto,
        tipoDesconto: tipo,
        valorInformado: valorNumerico,
        motivo: novoDesconto.motivo,
        dataHora: new Date().toISOString(),
      };
      salvarLog(STORAGE_KEY_LOGS_DESCONTO, logAuditoria);

      resolve({
        sucesso: true,
        mensagem: `Desconto de R$ ${novoDesconto.valorDesconto.toFixed(2)} aplicado com sucesso!`,
        mesa: {
          ...mesa,
          totais: calcularTotaisMesa(mesa),
        },
      });
    }, 200);
  });
}

/**
 * Remove o desconto da comanda
 */
export async function removerDesconto(numeroMesa) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const mesas = obterMesasStorage();
      const index = mesas.findIndex((m) => m.numeroMesa === Number(numeroMesa));
      if (index === -1) return reject(new Error("Mesa não encontrada."));

      const mesa = mesas[index];
      mesa.comanda.desconto = { aplicado: false, valorDesconto: 0 };
      mesas[index] = mesa;
      salvarMesasStorage(mesas);

      resolve({
        sucesso: true,
        mensagem: "Desconto removido.",
        mesa: { ...mesa, totais: calcularTotaisMesa(mesa) },
      });
    }, 150);
  });
}

/**
 * Registra um pagamento para a comanda (RF14)
 * Formas aceitas: 'Pix', 'Crédito', 'Débito', 'Dinheiro'
 */
export async function registrarPagamento(numeroMesa, { forma, valor, valorRecebido, garcom }) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const valorNum = parseFloat(valor);
      if (!valorNum || valorNum <= 0) {
        return reject(new Error("Informe um valor de pagamento válido."));
      }

      const formasValidas = ["Pix", "Crédito", "Débito", "Dinheiro"];
      if (!formasValidas.includes(forma)) {
        return reject(new Error(`Forma de pagamento '${forma}' inválida. Use Pix, Crédito, Débito ou Dinheiro.`));
      }

      const mesas = obterMesasStorage();
      const index = mesas.findIndex((m) => m.numeroMesa === Number(numeroMesa));
      if (index === -1) return reject(new Error("Mesa não encontrada."));

      const mesa = mesas[index];
      const totaisAtuais = calcularTotaisMesa(mesa);

      if (totaisAtuais.saldoRestante <= 0) {
        return reject(new Error("O valor total da conta já foi quitado!"));
      }

      let troco = 0;
      if (forma === "Dinheiro" && valorRecebido) {
        const recebidoNum = parseFloat(valorRecebido);
        if (recebidoNum >= valorNum) {
          troco = Number((recebidoNum - valorNum).toFixed(2));
        }
      }

      const novoPagamento = {
        idPagamento: Date.now(),
        forma,
        valor: Number(valorNum.toFixed(2)),
        valorRecebido: valorRecebido ? Number(parseFloat(valorRecebido).toFixed(2)) : valorNum,
        troco,
        garcom: garcom || "Garçom em serviço",
        dataHora: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      if (!mesa.comanda.pagamentos) {
        mesa.comanda.pagamentos = [];
      }
      mesa.comanda.pagamentos.push(novoPagamento);

      mesas[index] = mesa;
      salvarMesasStorage(mesas);

      const totaisAtualizados = calcularTotaisMesa(mesa);

      resolve({
        sucesso: true,
        mensagem: `Pagamento de R$ ${novoPagamento.valor.toFixed(2)} (${forma}) registrado!`,
        pagamento: novoPagamento,
        mesa: { ...mesa, totais: totaisAtualizados },
      });
    }, 200);
  });
}

/**
 * Remove um pagamento registrado (estorno/correção antes do fechamento)
 */
export async function removerPagamento(numeroMesa, idPagamento) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const mesas = obterMesasStorage();
      const index = mesas.findIndex((m) => m.numeroMesa === Number(numeroMesa));
      if (index === -1) return reject(new Error("Mesa não encontrada."));

      const mesa = mesas[index];
      mesa.comanda.pagamentos = (mesa.comanda.pagamentos || []).filter(
        (p) => p.idPagamento !== idPagamento
      );

      mesas[index] = mesa;
      salvarMesasStorage(mesas);

      resolve({
        sucesso: true,
        mensagem: "Registro de pagamento cancelado.",
        mesa: { ...mesa, totais: calcularTotaisMesa(mesa) },
      });
    }, 150);
  });
}

/**
 * Encerrar a conta de qualquer mesa (RF16, UC11)
 * Regra: Status da mesa alterado para "fechada"/liberada apenas após a confirmação do pagamento
 * cobrindo 100% do total da conta.
 */
export async function encerrarConta(numeroMesa, garcom = "Garçom Carlos") {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const mesas = obterMesasStorage();
      const index = mesas.findIndex((m) => m.numeroMesa === Number(numeroMesa));
      if (index === -1) return reject(new Error("Mesa não encontrada."));

      const mesa = mesas[index];
      const totais = calcularTotaisMesa(mesa);

      // Regra RF14, RF16: soma dos pagamentos deve igualar ou cobrir o total
      if (!totais.podeEncerrar) {
        return reject(
          new Error(
            `A conta não pode ser encerrada. Ainda restam R$ ${totais.saldoRestante.toFixed(2)} pendentes de pagamento.`
          )
        );
      }

      const horarioFechamento = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      const registroFechamento = {
        idFechamento: Date.now(),
        numeroMesa: mesa.numeroMesa,
        idComanda: mesa.comanda.idComanda,
        horarioAbertura: mesa.horarioAbertura,
        horarioFechamento,
        garcomFechamento: garcom,
        itens: mesa.comanda.itens,
        subtotal: totais.subtotal,
        desconto: mesa.comanda.desconto,
        totalFinal: totais.totalComDesconto,
        pagamentos: mesa.comanda.pagamentos,
        dataHoraISO: new Date().toISOString(),
      };

      // Salva no histórico de comandas fechadas
      salvarLog(STORAGE_KEY_HISTORICO_FECHAMENTO, registroFechamento);

      // RF01, RF16: comanda fechada e mesa retorna ao status "livre" / disponível
      mesa.status = "livre";
      mesa.solicitouFechamento = false;
      mesa.horarioAbertura = null;
      mesa.comanda = null;

      mesas[index] = mesa;
      salvarMesasStorage(mesas);

      resolve({
        sucesso: true,
        mensagem: `Conta da Mesa ${numeroMesa} encerrada com sucesso! Mesa liberada.`,
        recibo: registroFechamento,
      });
    }, 250);
  });
}

/**
 * Simula a solicitação de fechamento feita pelo cliente no autoatendimento (RF05)
 */
export function simularSolicitacaoFechamentoCliente(numeroMesa = 7) {
  const mesas = obterMesasStorage();
  const index = mesas.findIndex((m) => m.numeroMesa === Number(numeroMesa));
  if (index !== -1) {
    mesas[index].solicitouFechamento = true;
    salvarMesasStorage(mesas);
    return mesas[index];
  }
  return null;
}

/**
 * Função utilitária para salvar registros em logs no localStorage
 */
function salvarLog(storageKey, itemLog) {
  try {
    const atual = JSON.parse(localStorage.getItem(storageKey) || "[]");
    atual.unshift(itemLog);
    localStorage.setItem(storageKey, JSON.stringify(atual));
  } catch (e) {
    console.error("Erro ao salvar log:", e);
  }
}
