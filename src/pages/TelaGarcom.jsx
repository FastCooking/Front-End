import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  buscarPedidosGarcom,
  assumirEntrega,
  marcarComoEntregue,
  simularNovoPedidoPronto,
  tocarAlertaSonoro,
  subscreverMudancasPedidos,
} from "../services/garcomService.js";

import {
  buscarMesas,
  aplicarDesconto,
  removerDesconto,
  registrarPagamento,
  removerPagamento,
  encerrarConta,
  simularSolicitacaoFechamentoCliente,
  subscreverMudancasMesas,
} from "../services/mesasService.js";

import HeaderGarcom from "../components/garcom/HeaderGarcom.jsx";
import AlertaPedidoPronto from "../components/garcom/AlertaPedidoPronto.jsx";
import CardPedidoPronto from "../components/garcom/CardPedidoPronto.jsx";
import CardEntregaAtiva from "../components/garcom/CardEntregaAtiva.jsx";
import CardEntregue from "../components/garcom/CardEntregue.jsx";
import ListaMesasAbertas from "../components/garcom/ListaMesasAbertas.jsx";
import VisualizacaoContaMesa from "../components/garcom/VisualizacaoContaMesa.jsx";
import ModalReciboFechamento from "../components/garcom/ModalReciboFechamento.jsx";

import {
  MdNotifications,
  MdDeliveryDining,
  MdHistory,
  MdOutlineInfo,
  MdCheckCircle,
  MdErrorOutline,
  MdReceiptLong,
  MdNotificationsActive,
} from "react-icons/md";

function TelaGarcom() {
  const navigate = useNavigate();

  // Usuário autenticado
  const [usuario] = useState(() => {
    try {
      const salvo = localStorage.getItem("usuarioLogado");
      if (salvo) return JSON.parse(salvo);
    } catch {
      // fallback
    }
    return { email: "garcom@test.com", perfil: "garcom", nome: "Garçom Carlos" };
  });

  // Estados dos pedidos (KDS / Entregas)
  const [prontos, setProntos] = useState([]);
  const [minhasEntregas, setMinhasEntregas] = useState([]);
  const [entregues, setEntregues] = useState([]);
  const [podeAssumir, setPodeAssumir] = useState(true);
  const [carregandoAcao, setCarregandoAcao] = useState(false);

  // Estados das Mesas e Fechamento de Conta (RF05, RF13, RF14, RF15, RF16)
  const [mesas, setMesas] = useState([]);
  const [mesaSelecionadaNumero, setMesaSelecionadaNumero] = useState(null);
  const [reciboFechamento, setReciboFechamento] = useState(null);

  // Aba ativa: 'prontos' | 'minha_entrega' | 'contas' | 'historico'
  const [abaAtiva, setAbaAtiva] = useState("prontos");

  // Alerta sonoro e visual
  const [somAtivo, setSomAtivo] = useState(() => {
    return localStorage.getItem("garcom_som_ativo") !== "false";
  });
  const [alertaVisual, setAlertaVisual] = useState(null);
  const [toastMensagem, setToastMensagem] = useState(null);

  // Referência para controlar quais IDs já foram notificados
  const idsConhecidosRef = useRef(new Set());
  const primeiraCargaRef = useRef(true);

  // Notificação Toast temporária
  const exibirToast = useCallback((texto, tipo = "info") => {
    setToastMensagem({ texto, tipo });
    setTimeout(() => {
      setToastMensagem((prev) => (prev?.texto === texto ? null : prev));
    }, 4000);
  }, []);

  // Carregar dados dos pedidos (KDS)
  const carregarDadosPedidos = useCallback(async () => {
    try {
      const dados = await buscarPedidosGarcom(usuario.email);
      setProntos(dados.prontos);
      setMinhasEntregas(dados.minhasEntregas);
      setEntregues(dados.entregues);
      setPodeAssumir(dados.podeAssumir);

      // Detecção de novos pedidos prontos (RF06)
      const idsAtuais = new Set(dados.prontos.map((p) => p.idItemPedido));

      if (primeiraCargaRef.current) {
        idsConhecidosRef.current = idsAtuais;
        primeiraCargaRef.current = false;
      } else {
        const novos = dados.prontos.filter((p) => !idsConhecidosRef.current.has(p.idItemPedido));
        if (novos.length > 0) {
          const ultimoNovo = novos[0];
          setAlertaVisual(ultimoNovo);

          if (somAtivo) {
            tocarAlertaSonoro();
          }

          idsConhecidosRef.current = idsAtuais;
        } else {
          idsConhecidosRef.current = idsAtuais;
        }
      }
    } catch (erro) {
      console.error("Erro ao carregar pedidos do garçom:", erro);
    }
  }, [usuario.email, somAtivo]);

  // Carregar dados das Mesas e Fechamento
  const carregarDadosMesas = useCallback(async () => {
    try {
      const dados = await buscarMesas();
      setMesas(dados.mesas);
    } catch (erro) {
      console.error("Erro ao carregar mesas:", erro);
    }
  }, []);

  // Efeito de montagem: carrega dados e escuta mudanças em tempo real
  useEffect(() => {
    let cancelado = false;

    Promise.resolve().then(() => {
      if (!cancelado) {
        carregarDadosPedidos();
        carregarDadosMesas();
      }
    });

    const desinscreverPedidos = subscreverMudancasPedidos(() => {
      if (!cancelado) {
        carregarDadosPedidos();
      }
    });

    const desinscreverMesas = subscreverMudancasMesas(() => {
      if (!cancelado) {
        carregarDadosMesas();
      }
    });

    const intervalo = setInterval(() => {
      if (!cancelado) {
        carregarDadosPedidos();
        carregarDadosMesas();
      }
    }, 2000);

    return () => {
      cancelado = true;
      desinscreverPedidos();
      desinscreverMesas();
      clearInterval(intervalo);
    };
  }, [carregarDadosPedidos, carregarDadosMesas]);

  // Alternar som
  function handleToggleSom() {
    const novoStatus = !somAtivo;
    setSomAtivo(novoStatus);
    localStorage.setItem("garcom_som_ativo", String(novoStatus));
    if (novoStatus) {
      tocarAlertaSonoro();
      exibirToast("Alerta sonoro ativado 🔊", "sucesso");
    } else {
      exibirToast("Alerta sonoro desativado 🔇", "info");
    }
  }

  // Testar som manualmente
  function handleTestarSom() {
    tocarAlertaSonoro();
    exibirToast("Teste de alerta sonoro reproduzido!", "info");
  }

  // Simular novo item pronto
  function handleSimularPronto() {
    const novo = simularNovoPedidoPronto();
    setAlertaVisual(novo);
    if (somAtivo) {
      tocarAlertaSonoro();
    }
    carregarDadosPedidos();
    exibirToast(`Novo item pronto simulado: Mesa ${novo.mesa} - ${novo.nomeItem}`, "sucesso");
  }

  // Simular solicitação de fechamento pelo cliente (RF05)
  function handleSimularChamadoCliente() {
    const mesaAtualizada = simularSolicitacaoFechamentoCliente(7);
    if (mesaAtualizada) {
      if (somAtivo) {
        tocarAlertaSonoro();
      }
      carregarDadosMesas();
      exibirToast("Mesa 7 solicitou fechamento da conta pelo autoatendimento (RF05)!", "info");
    }
  }

  // Logout
  function handleLogout() {
    localStorage.removeItem("usuarioLogado");
    navigate("/login");
  }

  // Ação: Assumir Entrega (RF08)
  async function handleAssumir(idItemPedido) {
    setCarregandoAcao(true);
    try {
      const resposta = await assumirEntrega(idItemPedido, usuario.email, usuario.nome);
      exibirToast(resposta.mensagem, "sucesso");
      await carregarDadosPedidos();
      setAbaAtiva("minha_entrega");
    } catch (erro) {
      exibirToast(erro.message || "Não foi possível assumir a entrega.", "erro");
    } finally {
      setCarregandoAcao(false);
    }
  }

  // Ação: Marcar como Entregue (RF08, RF19)
  async function handleMarcarEntregue(idItemPedido) {
    setCarregandoAcao(true);
    try {
      const resposta = await marcarComoEntregue(idItemPedido, usuario.email);
      exibirToast(resposta.mensagem, "sucesso");
      await carregarDadosPedidos();
      setAbaAtiva("prontos");
    } catch (erro) {
      exibirToast(erro.message || "Erro ao marcar como entregue.", "erro");
    } finally {
      setCarregandoAcao(false);
    }
  }

  // Ações de Pagamento e Fechamento (RF13, RF14, RF15, RF16)
  async function handleAplicarDesconto(numeroMesa, dadosDesconto) {
    setCarregandoAcao(true);
    try {
      const res = await aplicarDesconto(numeroMesa, {
        ...dadosDesconto,
        garcom: usuario.nome || usuario.email,
      });
      exibirToast(res.mensagem, "sucesso");
      await carregarDadosMesas();
    } catch (err) {
      exibirToast(err.message, "erro");
      throw err;
    } finally {
      setCarregandoAcao(false);
    }
  }

  async function handleRemoverDesconto(numeroMesa) {
    setCarregandoAcao(true);
    try {
      const res = await removerDesconto(numeroMesa);
      exibirToast(res.mensagem, "info");
      await carregarDadosMesas();
    } catch (err) {
      exibirToast(err.message, "erro");
    } finally {
      setCarregandoAcao(false);
    }
  }

  async function handleRegistrarPagamento(numeroMesa, dadosPagamento) {
    setCarregandoAcao(true);
    try {
      const res = await registrarPagamento(numeroMesa, {
        ...dadosPagamento,
        garcom: usuario.nome || usuario.email,
      });
      exibirToast(res.mensagem, "sucesso");
      await carregarDadosMesas();
    } catch (err) {
      exibirToast(err.message, "erro");
      throw err;
    } finally {
      setCarregandoAcao(false);
    }
  }

  async function handleRemoverPagamento(numeroMesa, idPagamento) {
    setCarregandoAcao(true);
    try {
      const res = await removerPagamento(numeroMesa, idPagamento);
      exibirToast(res.mensagem, "info");
      await carregarDadosMesas();
    } catch (err) {
      exibirToast(err.message, "erro");
    } finally {
      setCarregandoAcao(false);
    }
  }

  async function handleEncerrarConta(numeroMesa) {
    setCarregandoAcao(true);
    try {
      const res = await encerrarConta(numeroMesa, usuario.nome || usuario.email);
      setReciboFechamento(res.recibo);
      exibirToast(res.mensagem, "sucesso");
      setMesaSelecionadaNumero(null);
      await carregarDadosMesas();
    } catch (err) {
      exibirToast(err.message, "erro");
    } finally {
      setCarregandoAcao(false);
    }
  }

  const entregaEmAndamento = minhasEntregas.length > 0 ? minhasEntregas[0] : null;
  const mesaAtiva = mesas.find((m) => m.numeroMesa === mesaSelecionadaNumero);
  const mesasSolicitandoFechamento = mesas.filter((m) => m.status === "aberta" && m.solicitouFechamento);

  return (
    <div className="min-h-screen bg-linear-to-b from-[#F9ECE5] via-[#f3e5dd] to-[#e8ded7] text-gray-800 pb-20">
      {/* Header com dados do garçom e status RF08 */}
      <HeaderGarcom
        usuario={usuario}
        podeAssumir={podeAssumir}
        totalPendentes={minhasEntregas.length}
        somAtivo={somAtivo}
        onToggleSom={handleToggleSom}
        onSimularPedido={handleSimularPronto}
        onTestarSom={handleTestarSom}
        onLogout={handleLogout}
      />

      {/* Alerta Visual de Pedido Pronto (RF06) */}
      <AlertaPedidoPronto
        alerta={alertaVisual}
        onDismiss={() => setAlertaVisual(null)}
        onVisualizar={() => setAbaAtiva("prontos")}
      />

      {/* Toast Feedback */}
      {toastMensagem && (
        <div className="fixed bottom-20 left-4 right-4 z-50 flex justify-center pointer-events-none">
          <div
            className={`pointer-events-auto max-w-sm px-4 py-3 rounded-xl shadow-lg text-sm font-semibold flex items-center gap-2 animate-[slide-in_0.2s_ease-out] ${
              toastMensagem.tipo === "sucesso"
                ? "bg-emerald-800 text-white"
                : toastMensagem.tipo === "erro"
                ? "bg-red-800 text-white"
                : "bg-gray-900 text-white"
            }`}
          >
            {toastMensagem.tipo === "sucesso" && <MdCheckCircle size={18} className="text-emerald-300" />}
            {toastMensagem.tipo === "erro" && <MdErrorOutline size={18} className="text-red-300" />}
            {toastMensagem.tipo === "info" && <MdOutlineInfo size={18} className="text-blue-300" />}
            <span>{toastMensagem.texto}</span>
          </div>
        </div>
      )}

      {/* Conteúdo Principal */}
      <main className="max-w-md mx-auto px-4 pt-4">
        {/* Banner de Chamado do Cliente pelo Autoatendimento (RF05) se estiver em outra aba */}
        {mesasSolicitandoFechamento.length > 0 && abaAtiva !== "contas" && (
          <div
            onClick={() => {
              setAbaAtiva("contas");
              setMesaSelecionadaNumero(mesasSolicitandoFechamento[0].numeroMesa);
            }}
            className="mb-3.5 bg-amber-500 hover:bg-amber-600 text-slate-950 p-3 rounded-2xl shadow-md flex items-center justify-between cursor-pointer transition animate-bounce-slow"
          >
            <div className="flex items-center gap-2.5">
              <span className="p-1.5 bg-black/15 rounded-xl">
                <MdNotificationsActive size={20} />
              </span>
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider block leading-tight">
                  Chamado de Fechamento (RF05)
                </span>
                <span className="text-xs font-bold leading-tight">
                  Mesa {mesasSolicitandoFechamento[0].numeroMesa} solicitou a conta
                </span>
              </div>
            </div>
            <span className="text-xs font-black bg-slate-950 text-white px-2.5 py-1 rounded-lg">
              Atender
            </span>
          </div>
        )}

        {/* Banner de Aviso de Entrega em Andamento quando na aba 'prontos' */}
        {entregaEmAndamento && abaAtiva !== "minha_entrega" && (
          <div
            onClick={() => setAbaAtiva("minha_entrega")}
            className="mb-4 bg-emerald-600 hover:bg-emerald-700 text-white p-3 rounded-xl shadow-md flex items-center justify-between cursor-pointer transition"
          >
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-white/20 rounded-lg">
                <MdDeliveryDining size={20} />
              </span>
              <div>
                <span className="text-[11px] font-bold text-emerald-100 uppercase tracking-wide block">
                  Entrega em Andamento
                </span>
                <span className="text-sm font-black">
                  Levar à Mesa {entregaEmAndamento.mesa} ({entregaEmAndamento.nomeItem})
                </span>
              </div>
            </div>
            <span className="text-xs font-bold bg-white text-emerald-800 px-2.5 py-1 rounded-lg">
              Ver
            </span>
          </div>
        )}

        {/* Barra de Abas / Navegação do Garçom */}
        <div className="bg-white/80 backdrop-blur-sm p-1 rounded-2xl border border-gray-200/80 shadow-xs grid grid-cols-4 gap-1 mb-4">
          {/* Aba 1: Prontos */}
          <button
            onClick={() => setAbaAtiva("prontos")}
            className={`py-2 px-1 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
              abaAtiva === "prontos"
                ? "bg-[#9C1C0E] text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900 hover:bg-white/60"
            }`}
          >
            <div className="relative">
              <MdNotifications size={16} />
              {prontos.length > 0 && (
                <span
                  className={`absolute -top-1 -right-2 text-[9px] px-1 rounded-full font-black ${
                    abaAtiva === "prontos" ? "bg-white text-[#9C1C0E]" : "bg-[#9C1C0E] text-white"
                  }`}
                >
                  {prontos.length}
                </span>
              )}
            </div>
            <span className="text-[11px]">Prontos</span>
          </button>

          {/* Aba 2: Minha Entrega */}
          <button
            onClick={() => setAbaAtiva("minha_entrega")}
            className={`py-2 px-1 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center gap-0.5 cursor-pointer relative ${
              abaAtiva === "minha_entrega"
                ? "bg-[#9C1C0E] text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900 hover:bg-white/60"
            }`}
          >
            <div className="relative">
              <MdDeliveryDining size={18} />
              {minhasEntregas.length > 0 && (
                <span className="absolute -top-0.5 -right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              )}
            </div>
            <span className="text-[11px]">Entrega</span>
          </button>

          {/* Aba 3: Contas / Fechamento de Mesa (RF14, RF15, RF16) */}
          <button
            onClick={() => setAbaAtiva("contas")}
            className={`py-2 px-1 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center gap-0.5 cursor-pointer relative ${
              abaAtiva === "contas"
                ? "bg-[#9C1C0E] text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900 hover:bg-white/60"
            }`}
          >
            <div className="relative">
              <MdReceiptLong size={17} />
              {mesasSolicitandoFechamento.length > 0 && (
                <span className="absolute -top-1 -right-2 bg-amber-500 text-slate-950 text-[9px] px-1 rounded-full font-black animate-pulse">
                  {mesasSolicitandoFechamento.length}
                </span>
              )}
            </div>
            <span className="text-[11px]">Contas</span>
          </button>

          {/* Aba 4: Histórico Entregues */}
          <button
            onClick={() => setAbaAtiva("historico")}
            className={`py-2 px-1 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
              abaAtiva === "historico"
                ? "bg-[#9C1C0E] text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900 hover:bg-white/60"
            }`}
          >
            <MdHistory size={16} />
            <span className="text-[11px]">Entregues</span>
          </button>
        </div>

        {/* VISUALIZAÇÃO DE CADA ABA */}

        {/* ABA 1: Pedidos Prontos */}
        {abaAtiva === "prontos" && (
          <div className="space-y-3.5">
            <div className="flex items-center justify-between px-1">
              <div>
                <h3 className="text-sm font-extrabold text-gray-800 uppercase tracking-wide">
                  Prontos para Retirada
                </h3>
                <p className="text-xs text-gray-500">
                  Notificações compartilhadas com toda a equipe (RF06, RF07)
                </p>
              </div>
              <span className="text-xs font-bold bg-white text-gray-700 px-2 py-1 rounded-md border border-gray-200">
                {prontos.length} no total
              </span>
            </div>

            {prontos.length === 0 ? (
              <div className="bg-white/80 rounded-2xl p-8 text-center border border-dashed border-gray-300">
                <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <MdNotifications size={28} />
                </div>
                <h4 className="text-base font-bold text-gray-800">Nenhum pedido pronto no momento</h4>
                <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
                  Assim que a cozinha marcar um item como pronto no monitor KDS, ele aparecerá aqui com alerta sonoro e visual.
                </p>
                <button
                  onClick={handleSimularPronto}
                  className="mt-4 inline-flex items-center gap-1.5 bg-[#9C1C0E] hover:bg-[#7a1509] text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-xs transition cursor-pointer"
                >
                  Simular Pedido Pronto Agora
                </button>
              </div>
            ) : (
              prontos.map((item) => (
                <CardPedidoPronto
                  key={item.idItemPedido}
                  item={item}
                  podeAssumir={podeAssumir}
                  onAssumir={handleAssumir}
                  carregando={carregandoAcao}
                />
              ))
            )}
          </div>
        )}

        {/* ABA 2: Minha Entrega Ativa */}
        {abaAtiva === "minha_entrega" && (
          <div className="space-y-4">
            <div className="px-1">
              <h3 className="text-sm font-extrabold text-gray-800 uppercase tracking-wide">
                Minha Entrega Atual
              </h3>
              <p className="text-xs text-gray-500">
                Acompanhe o trajeto até a mesa e confirme após a entrega física (RF08, RF19)
              </p>
            </div>

            {entregaEmAndamento ? (
              <CardEntregaAtiva
                entrega={entregaEmAndamento}
                onMarcarEntregue={handleMarcarEntregue}
                carregando={carregandoAcao}
              />
            ) : (
              <div className="bg-white/80 rounded-2xl p-8 text-center border border-dashed border-gray-300">
                <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <MdCheckCircle size={28} />
                </div>
                <h4 className="text-base font-bold text-gray-800">Você está sem entregas pendentes!</h4>
                <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
                  Você está 100% disponível para assumir qualquer pedido pronto da equipe na aba ao lado.
                </p>
                <button
                  onClick={() => setAbaAtiva("prontos")}
                  className="mt-4 inline-flex items-center gap-1.5 bg-[#9C1C0E] hover:bg-[#7a1509] text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-xs transition cursor-pointer"
                >
                  Ver Pedidos Prontos ({prontos.length})
                </button>
              </div>
            )}
          </div>
        )}

        {/* ABA 3: Contas e Fechamento de Mesas (RF05, RF13, RF14, RF15, RF16) */}
        {abaAtiva === "contas" && (
          <div>
            {mesaAtiva ? (
              <VisualizacaoContaMesa
                mesa={mesaAtiva}
                onVoltar={() => setMesaSelecionadaNumero(null)}
                onAplicarDesconto={handleAplicarDesconto}
                onRemoverDesconto={handleRemoverDesconto}
                onRegistrarPagamento={handleRegistrarPagamento}
                onRemoverPagamento={handleRemoverPagamento}
                onEncerrarConta={handleEncerrarConta}
                carregando={carregandoAcao}
              />
            ) : (
              <ListaMesasAbertas
                mesas={mesas}
                onSelecionarMesa={(numero) => setMesaSelecionadaNumero(numero)}
                onSimularChamadoCliente={handleSimularChamadoCliente}
              />
            )}
          </div>
        )}

        {/* ABA 4: Histórico de Entregues */}
        {abaAtiva === "historico" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <div>
                <h3 className="text-sm font-extrabold text-gray-800 uppercase tracking-wide">
                  Histórico de Entregas
                </h3>
                <p className="text-xs text-gray-500">Pedidos finalizados no salão hoje</p>
              </div>
              <span className="text-xs font-bold bg-white text-emerald-800 px-2 py-1 rounded-md border border-emerald-200">
                {entregues.length} entregues
              </span>
            </div>

            {entregues.length === 0 ? (
              <div className="bg-white/80 rounded-2xl p-8 text-center border border-dashed border-gray-300">
                <div className="w-14 h-14 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-3">
                  <MdHistory size={28} />
                </div>
                <h4 className="text-base font-bold text-gray-800">Nenhum pedido entregue ainda</h4>
                <p className="text-xs text-gray-500 mt-1">
                  Assim que você concluir uma entrega, ela ficará registrada aqui.
                </p>
              </div>
            ) : (
              entregues.map((item) => <CardEntregue key={item.idItemPedido} item={item} />)
            )}
          </div>
        )}
      </main>

      {/* Modal de Recibo Conclusivo após Encerramento da Conta (RF16) */}
      {reciboFechamento && (
        <ModalReciboFechamento
          recibo={reciboFechamento}
          onFechar={() => setReciboFechamento(null)}
        />
      )}
    </div>
  );
}

export default TelaGarcom;
