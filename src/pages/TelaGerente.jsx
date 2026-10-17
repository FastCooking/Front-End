import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  MdPeople,
  MdRestaurantMenu,
  MdInventory,
  MdAdd,
  MdEdit,
  MdDelete,
  MdLockReset,
  MdSearch,
  MdToggleOn,
  MdToggleOff,
  MdExitToApp,
  MdReceipt,
  MdListAlt,
  MdFilterList,
  MdTableBar,
  MdSoupKitchen,
  MdShoppingBag,
  MdHistory,
  MdWarning,
  MdQrCode2,
  MdReceiptLong,
  MdLaunch,
  MdTimeline,
  MdRefresh,
  MdCheckCircle,
  MdAccessTime,
  MdAttachMoney,
  MdArrowForward,
  MdInfoOutline,
  MdCreditCard,
  MdClose,
} from "react-icons/md";

import {
  listarUsuarios,
  obterUsuarioPorId,
  alterarStatusUsuario,
  excluirUsuario,
} from "../services/usuarioService";
import { listarRestaurantes } from "../services/restauranteService";
import {
  listarItensCardapio,
  alternarDisponibilidade,
  excluirItemCardapio,
} from "../services/cardapioService";
import { buscarInsumos, excluirInsumo } from "../services/insumosService";
import {
  listarMesas,
  atualizarMesa,
  excluirMesa,
} from "../services/mesaService";
import { obterFilaKds, listarPedidos } from "../services/pedidoService";

import ModalNovoUsuario from "../components/administrador/ModalNovoUsuario";
import ModalEditarUsuario from "../components/administrador/ModalEditarUsuario";
import ModalResetarSenha from "../components/administrador/ModalResetarSenha";
import ModalCardapio from "../components/cardapio/ModalCardapio";
import ModalEstoque from "../components/insumos/ModalEstoque";
import ModalMesa from "../components/mesas/ModalMesa";
import ModalQrCodeMesa from "../components/mesas/ModalQrCodeMesa";
import ModalComandaMesa from "../components/mesas/ModalComandaMesa";

import FormularioFichaTec from "../components/insumos/FormularioFichaTec";

import logo from "../assets/fast cooking logo.png";

function getUserIdFromToken() {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.sub ? String(payload.sub) : null;
  } catch {
    return null;
  }
}

function TelaGerente() {
  const navigate = useNavigate();

  // Controle de Aba Principal: 'usuarios', 'cardapio', 'estoque', 'mesas', 'cozinha', 'pedidos', 'historico'
  const [abaAtiva, setAbaAtiva] = useState("usuarios");

  // Controle de Sub-aba em Estoque: 'lista', 'ficha'
  const [abaEstoque, setAbaEstoque] = useState("lista");

  // Perfil do Gerente Autenticado
  const [idRestauranteGerente, setIdRestauranteGerente] = useState(null);

  // Mensagens globais
  const [mensagemSucesso, setMensagemSucesso] = useState("");
  const [erroGeral, setErroGeral] = useState("");

  // Estados de Dados Usuários
  const [usuarios, setUsuarios] = useState([]);
  const [restaurantes, setRestaurantes] = useState([]);
  const [carregandoUsuarios, setCarregandoUsuarios] = useState(false);
  const [filtroFuncaoUsuario, setFiltroFuncaoUsuario] = useState("");
  const [buscaUsuario, setBuscaUsuario] = useState("");

  // Modais de Usuário
  const [modalNovoUser, setModalNovoUser] = useState(false);
  const [modalEditUser, setModalEditUser] = useState(null);
  const [modalResetSenha, setModalResetSenha] = useState(null);

  // Estados de Dados Cardápio
  const [itensCardapio, setItensCardapio] = useState([]);
  const [carregandoCardapio, setCarregandoCardapio] = useState(false);
  const [buscaCardapio, setBuscaCardapio] = useState("");
  const [filtroCategoriaCardapio, setFiltroCategoriaCardapio] = useState("");
  const [modalCardapio, setModalCardapio] = useState(false);
  const [itemCardapioEdicao, setItemCardapioEdicao] = useState(null);

  // Estados de Dados Estoque
  const [itensEstoque, setItensEstoque] = useState([]);
  const [carregandoEstoque, setCarregandoEstoque] = useState(false);
  const [buscaEstoque, setBuscaEstoque] = useState("");
  const [modalEstoque, setModalEstoque] = useState(false);
  const [itemEstoqueEdicao, setItemEstoqueEdicao] = useState(null);

  // Estados de Dados Mesas
  const [mesas, setMesas] = useState([]);
  const [carregandoMesas, setCarregandoMesas] = useState(false);
  const [filtroStatusMesa, setFiltroStatusMesa] = useState("");
  const [buscaMesa, setBuscaMesa] = useState("");
  const [modalMesa, setModalMesa] = useState(false);
  const [mesaEdicao, setMesaEdicao] = useState(null);
  const [mesaQrCode, setMesaQrCode] = useState(null);
  const [mesaComanda, setMesaComanda] = useState(null);

  // Estados de Dados Cozinha (KDS)
  const [filaKds, setFilaKds] = useState([]);
  const [carregandoKds, setCarregandoKds] = useState(false);
  const [filtroStatusKds, setFiltroStatusKds] = useState("Todos");

  // Estados de Dados Pedidos Ativos
  const [pedidosAtivos, setPedidosAtivos] = useState([]);
  const [carregandoPedidos, setCarregandoPedidos] = useState(false);
  const [buscaPedido, setBuscaPedido] = useState("");
  const [filtroStatusPedido, setFiltroStatusPedido] = useState("Todos");

  // Estados de Dados Histórico de Pedidos
  const [historicoPedidos, setHistoricoPedidos] = useState([]);
  const [carregandoHistorico, setCarregandoHistorico] = useState(false);
  const [buscaHistorico, setBuscaHistorico] = useState("");
  const [filtroStatusHistorico, setFiltroStatusHistorico] = useState("Todos");
  const [detalhesHistoricoModal, setDetalhesHistoricoModal] = useState(null);

  // Cargos permitidos para o Gerente criar/editar (estritamente inferiores a Gerente)
  const CARGOS_PERMITIDOS_GERENTE = ["Garcom", "Cozinheiro"];

  // 1. Proteção de Rota e Identificação do Restaurante do Gerente
  useEffect(() => {
    const funcao = localStorage.getItem("funcao");
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    const funcaoNormalizada = (funcao || "").toLowerCase();
    if (funcaoNormalizada === "adm") {
      navigate("/administrativo");
      return;
    }
    if (funcaoNormalizada !== "gerente") {
      alert("Acesso restrito ao perfil de Gerente.");
      if (funcaoNormalizada === "garcom") navigate("/garcom");
      else if (funcaoNormalizada === "cozinheiro" || funcaoNormalizada === "cozinha") navigate("/cozinha");
      else navigate("/login");
      return;
    }

    async function resolverDadosGerente() {
      const idUser = getUserIdFromToken();
      if (idUser) {
        try {
          const dadosUser = await obterUsuarioPorId(idUser);
          if (dadosUser && dadosUser.idRestaurante) {
            setIdRestauranteGerente(dadosUser.idRestaurante);
          }
        } catch (err) {
          console.error("Erro ao obter perfil do gerente:", err);
        }
      }
    }

    resolverDadosGerente();
  }, [navigate]);

  // Carregar Restaurantes (uma única vez)
  useEffect(() => {
    async function carregarRestaurantes() {
      try {
        const dados = await listarRestaurantes();
        setRestaurantes(dados || []);
      } catch (err) {
        console.error("Erro ao carregar restaurantes:", err);
      }
    }
    carregarRestaurantes();
  }, []);

  // 2. Carregar Usuários do Restaurante do Gerente
  const carregarUsuarios = useCallback(async () => {
    try {
      setCarregandoUsuarios(true);
      const params = {};
      if (idRestauranteGerente) params.idRestaurante = idRestauranteGerente;
      if (filtroFuncaoUsuario) params.funcao = filtroFuncaoUsuario;
      if (buscaUsuario.trim()) params.busca = buscaUsuario.trim();

      const dados = await listarUsuarios(params);

      const usuariosValidos = (dados || []).filter((u) => {
        if (idRestauranteGerente && String(u.idRestaurante) !== String(idRestauranteGerente)) {
          return false;
        }
        const nomeUpper = u.nome?.toUpperCase() || "";
        const emailLower = u.email?.toLowerCase() || "";
        if (nomeUpper.includes("USUARIO REMOVIDO")) return false;
        if (emailLower.includes("@anonimizado.local") || emailLower.startsWith("removido_")) return false;
        return true;
      });

      setUsuarios(usuariosValidos);
    } catch (err) {
      console.error("Erro ao carregar usuários:", err);
      setErroGeral("Não foi possível carregar a lista de usuários.");
    } finally {
      setCarregandoUsuarios(false);
    }
  }, [idRestauranteGerente, filtroFuncaoUsuario, buscaUsuario]);

  useEffect(() => {
    let ativo = true;
    if (abaAtiva === "usuarios") {
      Promise.resolve().then(() => {
        if (ativo) carregarUsuarios();
      });
    }
    return () => {
      ativo = false;
    };
  }, [abaAtiva, carregarUsuarios]);

  // 3. Carregar Cardápio
  const carregarCardapio = useCallback(async () => {
    try {
      setCarregandoCardapio(true);
      const dados = await listarItensCardapio(idRestauranteGerente);
      setItensCardapio(dados || []);
    } catch (err) {
      console.error("Erro ao carregar cardápio:", err);
    } finally {
      setCarregandoCardapio(false);
    }
  }, [idRestauranteGerente]);

  useEffect(() => {
    let ativo = true;
    if (abaAtiva === "cardapio") {
      Promise.resolve().then(() => {
        if (ativo) carregarCardapio();
      });
    }
    return () => {
      ativo = false;
    };
  }, [abaAtiva, carregarCardapio]);

  // 4. Carregar Estoque
  const carregarEstoque = useCallback(async () => {
    try {
      setCarregandoEstoque(true);
      const dados = await buscarInsumos();
      setItensEstoque(dados || []);
    } catch (err) {
      console.error("Erro ao carregar estoque:", err);
    } finally {
      setCarregandoEstoque(false);
    }
  }, []);

  useEffect(() => {
    let ativo = true;
    if (abaAtiva === "estoque") {
      Promise.resolve().then(() => {
        if (ativo) carregarEstoque();
      });
    }
    return () => {
      ativo = false;
    };
  }, [abaAtiva, carregarEstoque]);

  // 5. Carregar Mesas
  const carregarMesas = useCallback(async () => {
    if (!idRestauranteGerente) return;
    try {
      setCarregandoMesas(true);
      const dados = await listarMesas(idRestauranteGerente);
      setMesas(dados || []);
    } catch (err) {
      console.error("Erro ao carregar mesas:", err);
    } finally {
      setCarregandoMesas(false);
    }
  }, [idRestauranteGerente]);

  useEffect(() => {
    let ativo = true;
    if (abaAtiva === "mesas") {
      Promise.resolve().then(() => {
        if (ativo) carregarMesas();
      });
    }
    return () => {
      ativo = false;
    };
  }, [abaAtiva, carregarMesas]);

  // 6. Carregar Cozinha (KDS)
  const carregarKds = useCallback(async () => {
    try {
      setCarregandoKds(true);
      const dados = await obterFilaKds();
      setFilaKds(dados?.items || []);
    } catch (err) {
      console.warn("Erro ao carregar fila KDS:", err);
    } finally {
      setCarregandoKds(false);
    }
  }, []);

  useEffect(() => {
    let ativo = true;
    if (abaAtiva === "cozinha") {
      carregarKds();
      const intervalId = setInterval(() => {
        if (ativo) carregarKds();
      }, 10000);
      return () => {
        ativo = false;
        clearInterval(intervalId);
      };
    }
  }, [abaAtiva, carregarKds]);

  // 7. Carregar Pedidos Ativos
  const carregarPedidos = useCallback(async () => {
    if (!idRestauranteGerente) return;
    try {
      setCarregandoPedidos(true);
      const dados = await listarPedidos({ idRestaurante: idRestauranteGerente, tipo: "ativos" });
      setPedidosAtivos(dados || []);
    } catch (err) {
      console.warn("Erro ao carregar pedidos ativos:", err);
    } finally {
      setCarregandoPedidos(false);
    }
  }, [idRestauranteGerente]);

  useEffect(() => {
    let ativo = true;
    if (abaAtiva === "pedidos") {
      carregarPedidos();
      const intervalId = setInterval(() => {
        if (ativo) carregarPedidos();
      }, 10000);
      return () => {
        ativo = false;
        clearInterval(intervalId);
      };
    }
  }, [abaAtiva, carregarPedidos]);

  // 8. Carregar Histórico de Pedidos
  const carregarHistorico = useCallback(async () => {
    if (!idRestauranteGerente) return;
    try {
      setCarregandoHistorico(true);
      const dados = await listarPedidos({ idRestaurante: idRestauranteGerente, tipo: "historico" });
      setHistoricoPedidos(dados || []);
    } catch (err) {
      console.warn("Erro ao carregar histórico de pedidos:", err);
    } finally {
      setCarregandoHistorico(false);
    }
  }, [idRestauranteGerente]);

  useEffect(() => {
    let ativo = true;
    if (abaAtiva === "historico") {
      carregarHistorico();
    }
    return () => {
      ativo = false;
    };
  }, [abaAtiva, carregarHistorico]);

  async function handleExcluirMesa(m) {
    const confirmou = window.confirm(
      `Deseja realmente remover a Mesa #${m.numero}? Esta ação não pode ser desfeita.`
    );
    if (!confirmou) return;

    try {
      await excluirMesa(m.idMesa);
      dispararSucesso(`Mesa #${m.numero} removida com sucesso!`);
      carregarMesas();
    } catch (err) {
      alert(err.message || "Erro ao remover mesa.");
    }
  }

  function dispararSucesso(msg) {
    setMensagemSucesso(msg);
    setTimeout(() => setMensagemSucesso(""), 4000);
  }

  // Ações de Usuário
  async function handleToggleStatusUsuario(u) {
    const funcaoUser = (u.funcao || "").toLowerCase();
    if (funcaoUser === "gerente" || funcaoUser === "adm") {
      alert("Você não tem permissão para alterar o status de gerentes ou administradores.");
      return;
    }

    try {
      await alterarStatusUsuario(u.idUsuario, !u.status);
      dispararSucesso(`Status de "${u.nome}" atualizado!`);
      carregarUsuarios();
    } catch (err) {
      alert(err.message || "Erro ao alternar status do usuário.");
    }
  }

  async function handleExcluirUsuario(u) {
    const funcaoUser = (u.funcao || "").toLowerCase();
    if (funcaoUser === "gerente" || funcaoUser === "adm") {
      alert("Você não tem permissão para remover gerentes ou administradores.");
      return;
    }

    const confirmar = window.confirm(
      `Deseja realmente remover o usuário "${u.nome}" (${u.email})?`
    );
    if (!confirmar) return;

    try {
      await excluirUsuario(u.idUsuario);
      dispararSucesso(`Usuário "${u.nome}" removido com sucesso!`);
      carregarUsuarios();
    } catch (err) {
      alert(err.message || "Erro ao remover usuário.");
    }
  }

  // Ações de Cardápio
  async function handleToggleDisponibilidadeCardapio(item) {
    try {
      await alternarDisponibilidade(item.id, !item.disponivel);
      dispararSucesso(`Disponibilidade de "${item.nome}" alterada!`);
      carregarCardapio();
    } catch (err) {
      alert(err.message || "Não foi possível alterar a disponibilidade do item.");
    }
  }

  async function handleExcluirCardapio(item) {
    const confirmar = window.confirm(`Deseja realmente desativar/remover o item "${item.nome}" do cardápio?`);
    if (!confirmar) return;

    try {
      await excluirItemCardapio(item.id);
      dispararSucesso(`Item "${item.nome}" desativado do cardápio!`);
      carregarCardapio();
    } catch (err) {
      alert(err.message || "Erro ao desativar item do cardápio.");
    }
  }

  async function handleExcluirEstoque(insumo) {
    const id = insumo.idEstoque || insumo.id;
    const confirmar = window.confirm(`Deseja realmente remover o item "${insumo.nome}" do estoque?`);
    if (!confirmar) return;

    try {
      await excluirInsumo(id);
      dispararSucesso(`Item "${insumo.nome}" removido do estoque!`);
      carregarEstoque();
    } catch (err) {
      alert(err.message || "Erro ao remover item do estoque.");
    }
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    localStorage.removeItem("funcao");
    navigate("/login");
  }

  const mapRestaurantes = restaurantes.reduce((acc, curr) => {
    acc[curr.idRestaurante] = curr.nome;
    return acc;
  }, {});

  // Filtros de exibição do cardápio
  const itensCardapioFiltrados = itensCardapio.filter((item) => {
    if (buscaCardapio.trim()) {
      const termo = buscaCardapio.toLowerCase().trim();
      const bateNome = item.nome?.toLowerCase().includes(termo);
      const bateCat = item.categoria?.toLowerCase().includes(termo);
      if (!bateNome && !bateCat) return false;
    }
    if (filtroCategoriaCardapio && item.categoria !== filtroCategoriaCardapio) {
      return false;
    }
    return true;
  });

  const categoriasDisponiveisCardapio = Array.from(
    new Set(itensCardapio.map((i) => i.categoria).filter(Boolean))
  );

  // Filtros de exibição do estoque
  const itensEstoqueFiltrados = itensEstoque.filter((item) => {
    if (buscaEstoque.trim()) {
      const termo = buscaEstoque.toLowerCase().trim();
      return item.nome?.toLowerCase().includes(termo);
    }
    return true;
  });

  // Filtros de exibição das mesas
  const mesasFiltradas = mesas.filter((m) => {
    if (buscaMesa.trim()) {
      const termo = buscaMesa.toLowerCase().trim();
      const bateNumero = String(m.numero).includes(termo);
      const bateStatus = m.status?.toLowerCase().includes(termo);
      if (!bateNumero && !bateStatus) return false;
    }
    if (filtroStatusMesa && m.status !== filtroStatusMesa) {
      return false;
    }
    return true;
  });

  // Filtros de exibição da cozinha (KDS)
  const filaKdsFiltrada = filaKds.filter((item) => {
    if (filtroStatusKds !== "Todos" && item.status !== filtroStatusKds) {
      return false;
    }
    return true;
  });

  // Filtros de exibição dos pedidos ativos
  const pedidosFiltrados = pedidosAtivos.filter((p) => {
    if (buscaPedido.trim()) {
      const termo = buscaPedido.toLowerCase().trim();
      const bateMesa = String(p.numeroMesa).includes(termo);
      const bateId = String(p.idPedido).toLowerCase().includes(termo);
      const bateGarcom = p.nomeGarcom?.toLowerCase().includes(termo);
      if (!bateMesa && !bateId && !bateGarcom) return false;
    }
    if (filtroStatusPedido !== "Todos" && p.status !== filtroStatusPedido) {
      return false;
    }
    return true;
  });

  // Filtros de exibição do histórico de pedidos
  const historicoFiltrado = historicoPedidos.filter((h) => {
    if (buscaHistorico.trim()) {
      const termo = buscaHistorico.toLowerCase().trim();
      const bateMesa = String(h.numeroMesa).includes(termo);
      const bateId = String(h.idPedido).toLowerCase().includes(termo);
      if (!bateMesa && !bateId) return false;
    }
    if (filtroStatusHistorico !== "Todos" && h.status !== filtroStatusHistorico) {
      return false;
    }
    return true;
  });

  const pedidosFechados = historicoPedidos.filter((h) => h.status === "Fechado");
  const pedidosCancelados = historicoPedidos.filter((h) => h.status === "Cancelado");
  const totalFaturado = pedidosFechados.reduce((acc, h) => acc + (Number(h.total) || 0), 0);
  const ticketMedio = pedidosFechados.length > 0 ? totalFaturado / pedidosFechados.length : 0;

  return (
    <div className="min-h-screen bg-linear-to-r from-[#F9ECE5] to-[#D4C8C0] pb-12">
      {/* Header / Top Bar (sem a tag de role) */}
      <header className="bg-white/80 backdrop-blur-md border-b border-[#9C1C0E]/20 sticky top-0 z-40 px-6 py-4 flex flex-wrap items-center justify-between shadow-xs">
        <div className="flex items-center gap-4">
          <img src={logo} alt="Fast Cooking" className="h-10 w-auto" />
          <div>
            <h1 className="text-xl font-bold text-[#9C1C0E]">Painel do Gerente</h1>
            <p className="text-xs text-gray-500">Gestão do seu restaurante, equipe, cardápio e estoque</p>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-2 sm:mt-0">
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-[#9C1C0E] transition-colors cursor-pointer font-medium"
            title="Sair da Conta"
          >
            <MdExitToApp size={18} />
            <span>Sair</span>
          </button>
        </div>
      </header>

      {/* Notificações */}
      {mensagemSucesso && (
        <div className="max-w-6xl mx-auto mt-4 px-4">
          <div className="bg-green-100 border border-green-400 text-green-800 px-4 py-2 rounded-lg text-sm shadow-xs">
            {mensagemSucesso}
          </div>
        </div>
      )}

      {erroGeral && (
        <div className="max-w-6xl mx-auto mt-4 px-4">
          <div className="bg-red-100 border border-red-400 text-red-800 px-4 py-2 rounded-lg text-sm shadow-xs">
            {erroGeral}
          </div>
        </div>
      )}

      {/* Conteúdo Principal */}
      <main className="max-w-6xl mx-auto mt-6 px-4">
        {/* Abas do Gerente (Incluindo botões solicitados: Mesas, Cozinha, Pedidos, Histórico) */}
        <div className="flex flex-wrap gap-2 border-b border-gray-300 pb-2 mb-6">
          <button
            onClick={() => setAbaAtiva("usuarios")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all cursor-pointer ${
              abaAtiva === "usuarios"
                ? "bg-[#9C1C0E] text-white shadow-md"
                : "bg-white/60 text-gray-700 hover:bg-white"
            }`}
          >
            <MdPeople size={18} />
            Equipe
          </button>

          <button
            onClick={() => setAbaAtiva("cardapio")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all cursor-pointer ${
              abaAtiva === "cardapio"
                ? "bg-[#9C1C0E] text-white shadow-md"
                : "bg-white/60 text-gray-700 hover:bg-white"
            }`}
          >
            <MdRestaurantMenu size={18} />
            Cardápio
          </button>

          <button
            onClick={() => setAbaAtiva("estoque")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all cursor-pointer ${
              abaAtiva === "estoque"
                ? "bg-[#9C1C0E] text-white shadow-md"
                : "bg-white/60 text-gray-700 hover:bg-white"
            }`}
          >
            <MdInventory size={18} />
            Estoque
          </button>

          {/* Botões de Módulos (Sem função por enquanto, conforme solicitado) */}
          <button
            onClick={() => setAbaAtiva("mesas")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all cursor-pointer ${
              abaAtiva === "mesas"
                ? "bg-[#9C1C0E] text-white shadow-md"
                : "bg-white/60 text-gray-700 hover:bg-white"
            }`}
          >
            <MdTableBar size={18} />
            Mesas
          </button>

          <button
            onClick={() => setAbaAtiva("cozinha")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all cursor-pointer ${
              abaAtiva === "cozinha"
                ? "bg-[#9C1C0E] text-white shadow-md"
                : "bg-white/60 text-gray-700 hover:bg-white"
            }`}
          >
            <MdSoupKitchen size={18} />
            Cozinha
          </button>

          <button
            onClick={() => setAbaAtiva("pedidos")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all cursor-pointer ${
              abaAtiva === "pedidos"
                ? "bg-[#9C1C0E] text-white shadow-md"
                : "bg-white/60 text-gray-700 hover:bg-white"
            }`}
          >
            <MdShoppingBag size={18} />
            Pedidos
          </button>

          <button
            onClick={() => setAbaAtiva("historico")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all cursor-pointer ${
              abaAtiva === "historico"
                ? "bg-[#9C1C0E] text-white shadow-md"
                : "bg-white/60 text-gray-700 hover:bg-white"
            }`}
          >
            <MdHistory size={18} />
            Histórico
          </button>
        </div>

        {/* ================= ABA USUÁRIOS / EQUIPE ================= */}
        {abaAtiva === "usuarios" && (
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mb-6">
              <div className="flex flex-wrap items-center gap-3 flex-1">
                <div className="relative flex-1 min-w-[200px]">
                  <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Buscar funcionário por nome ou e-mail..."
                    value={buscaUsuario}
                    onChange={(e) => setBuscaUsuario(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/70 border border-gray-200 text-sm focus:outline-none focus:border-[#9C1C0E]"
                  />
                </div>

                <select
                  value={filtroFuncaoUsuario}
                  onChange={(e) => setFiltroFuncaoUsuario(e.target.value)}
                  className="bg-white/70 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-700 focus:outline-none cursor-pointer"
                >
                  <option value="">Todas as Funções</option>
                  <option value="Garcom">Garçom</option>
                  <option value="Cozinheiro">Cozinheiro</option>
                </select>
              </div>

              <button
                onClick={() => setModalNovoUser(true)}
                className="flex items-center justify-center gap-2 bg-[#9C1C0E] text-white px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-[#7a160b] shadow-md cursor-pointer transition-all shrink-0"
              >
                <MdAdd size={20} />
                Novo Usuário
              </button>
            </div>

            <div className="bg-white/80 backdrop-blur-xs rounded-2xl shadow-md overflow-hidden border border-gray-200">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-700">
                  <thead className="bg-[#F9ECE5] text-xs uppercase text-[#9C1C0E] border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 font-semibold">Nome / E-mail</th>
                      <th className="px-6 py-3 font-semibold">CPF</th>
                      <th className="px-6 py-3 font-semibold">Restaurante</th>
                      <th className="px-6 py-3 font-semibold">Função</th>
                      <th className="px-6 py-3 font-semibold">Status</th>
                      <th className="px-6 py-3 font-semibold text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {carregandoUsuarios ? (
                      <tr>
                        <td colSpan={6} className="text-center py-10 text-gray-500">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <div className="w-8 h-8 border-3 border-[#9C1C0E] border-t-transparent rounded-full animate-spin" />
                            <span className="text-xs">Carregando usuários do restaurante...</span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      usuarios.map((u) => {
                      const isHighRole = u.funcao === "Gerente" || u.funcao === "Adm" || u.funcao === "gerente" || u.funcao === "adm";

                      return (
                        <tr key={u.idUsuario} className="hover:bg-white/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-semibold text-gray-900">{u.nome}</div>
                            <div className="text-xs text-gray-500">{u.email}</div>
                          </td>
                          <td className="px-6 py-4 text-xs font-mono">{u.cpf}</td>
                          <td className="px-6 py-4 text-xs">
                            <span className="font-medium text-gray-800">
                              {mapRestaurantes[u.idRestaurante] || `Restaurante #${u.idRestaurante}`}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs">
                            <span className="bg-[#B78A10]/15 text-[#9C1C0E] px-2.5 py-1 rounded-md font-semibold">
                              {u.funcao}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs">
                            <span
                              className={`px-2.5 py-0.5 rounded-full font-medium ${
                                u.status
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {u.status ? "Ativo" : "Inativo"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => setModalEditUser(u)}
                                disabled={isHighRole}
                                className="p-1.5 rounded-lg text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                title={isHighRole ? "Não é possível editar Gerentes ou Adm" : "Editar Usuário"}
                              >
                                <MdEdit size={18} />
                              </button>

                              <button
                                onClick={() => setModalResetSenha(u)}
                                disabled={isHighRole}
                                className="p-1.5 rounded-lg text-gray-600 hover:text-[#B78A10] hover:bg-amber-50 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                title={isHighRole ? "Não é possível alterar senha de Gerentes" : "Redefinir Senha"}
                              >
                                <MdLockReset size={20} />
                              </button>

                              <button
                                onClick={() => handleToggleStatusUsuario(u)}
                                disabled={isHighRole}
                                className={`p-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                                  u.status
                                    ? "text-green-600 hover:text-red-600 hover:bg-red-50"
                                    : "text-red-600 hover:text-green-600 hover:bg-green-50"
                                }`}
                                title={isHighRole ? "Apenas o Administrador pode desativar Gerentes" : u.status ? "Desativar Usuário" : "Ativar Usuário"}
                              >
                                {u.status ? <MdToggleOn size={22} /> : <MdToggleOff size={22} />}
                              </button>

                              <button
                                onClick={() => handleExcluirUsuario(u)}
                                disabled={isHighRole}
                                className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                title={isHighRole ? "Apenas o Administrador pode remover Gerentes" : "Remover Usuário"}
                              >
                                <MdDelete size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }))}

                    {usuarios.length === 0 && !carregandoUsuarios && (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-gray-500 text-xs">
                          Nenhum usuário encontrado para o seu restaurante.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================= ABA CARDÁPIO ================= */}
        {abaAtiva === "cardapio" && (
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mb-6">
              <div className="flex flex-wrap items-center gap-3 flex-1">
                <div className="relative flex-1 min-w-[200px]">
                  <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Buscar item no cardápio..."
                    value={buscaCardapio}
                    onChange={(e) => setBuscaCardapio(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/70 border border-gray-200 text-sm focus:outline-none focus:border-[#9C1C0E]"
                  />
                </div>

                {categoriasDisponiveisCardapio.length > 0 && (
                  <div className="flex items-center gap-1 bg-white/70 border border-gray-200 rounded-xl px-3 py-1.5">
                    <MdFilterList className="text-gray-400" size={16} />
                    <select
                      value={filtroCategoriaCardapio}
                      onChange={(e) => setFiltroCategoriaCardapio(e.target.value)}
                      className="bg-transparent text-xs text-gray-700 focus:outline-none cursor-pointer"
                    >
                      <option value="">Todas as Categorias</option>
                      {categoriasDisponiveisCardapio.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={`/cardapio?idRestaurante=${idRestauranteGerente || ""}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-1.5 bg-white border border-[#B78A10] text-[#9C1C0E] hover:bg-[#F9ECE5] px-4 py-2.5 rounded-xl font-medium text-sm shadow-xs transition-all cursor-pointer shrink-0"
                  title="Visualizar cardápio como cliente / autoatendimento"
                >
                  <MdLaunch size={18} />
                  <span>Acessar Cardápio</span>
                </a>

                <button
                  onClick={() => {
                    setItemCardapioEdicao(null);
                    setModalCardapio(true);
                  }}
                  className="flex items-center justify-center gap-2 bg-[#9C1C0E] text-white px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-[#7a160b] shadow-md cursor-pointer transition-all shrink-0"
                >
                  <MdAdd size={20} />
                  Novo Item do Cardápio
                </button>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-xs rounded-2xl shadow-md overflow-hidden border border-gray-200">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-700">
                  <thead className="bg-[#F9ECE5] text-xs uppercase text-[#9C1C0E] border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 font-semibold">Item / Descrição</th>
                      <th className="px-6 py-3 font-semibold">Categoria</th>
                      <th className="px-6 py-3 font-semibold">Preço</th>
                      <th className="px-6 py-3 font-semibold">Disponibilidade</th>
                      <th className="px-6 py-3 font-semibold text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {carregandoCardapio ? (
                      <tr>
                        <td colSpan={5} className="text-center py-10 text-gray-500">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <div className="w-8 h-8 border-3 border-[#9C1C0E] border-t-transparent rounded-full animate-spin" />
                            <span className="text-xs">Carregando itens do cardápio...</span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      itensCardapioFiltrados.map((item) => {
                      const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/+$/, "");
                      const imgUrl = item.pathImage || item.imagemUrl || item.imagem_url;
                      const fullImgUrl = imgUrl ? (imgUrl.startsWith("http") ? imgUrl : `${API_BASE}${imgUrl}`) : null;

                      return (
                        <tr key={item.id} className="hover:bg-white/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {fullImgUrl ? (
                                <img src={fullImgUrl} alt={item.nome} className="w-10 h-10 object-cover rounded-lg border border-gray-200 shrink-0" />
                              ) : (
                                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 border border-gray-200 shrink-0">
                                  <MdRestaurantMenu size={20} />
                                </div>
                              )}
                              <div>
                                <div className="font-semibold text-gray-900">{item.nome}</div>
                                {item.descricao && (
                                  <div className="text-xs text-gray-500 max-w-md truncate">
                                    {item.descricao}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        <td className="px-6 py-4 text-xs font-medium">
                          <span className="bg-gray-100 text-gray-800 px-2.5 py-1 rounded-md font-semibold">
                            {item.categoria}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-[#9C1C0E]">
                          R$ {Number(item.preco).toFixed(2).replace(".", ",")}
                        </td>
                        <td className="px-6 py-4 text-xs">
                          <span
                            className={`px-2.5 py-0.5 rounded-full font-medium ${
                              item.disponivel
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {item.disponivel ? "Disponível" : "Indisponível"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => {
                                setItemCardapioEdicao(item);
                                setModalCardapio(true);
                              }}
                              className="p-1.5 rounded-lg text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                              title="Editar Item"
                            >
                              <MdEdit size={18} />
                            </button>

                            <button
                              onClick={() => handleToggleDisponibilidadeCardapio(item)}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                item.disponivel
                                  ? "text-green-600 hover:text-red-600 hover:bg-red-50"
                                  : "text-red-600 hover:text-green-600 hover:bg-green-50"
                              }`}
                              title={item.disponivel ? "Desativar Item" : "Item Desativado"}
                            >
                              {item.disponivel ? <MdToggleOn size={22} /> : <MdToggleOff size={22} />}
                            </button>

                            <button
                              onClick={() => handleExcluirCardapio(item)}
                              className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                              title="Excluir Item"
                            >
                              <MdDelete size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                      );
                    }))}

                    {itensCardapioFiltrados.length === 0 && !carregandoCardapio && (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-gray-500 text-xs">
                          Nenhum item encontrado no cardápio.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================= ABA ESTOQUE E FICHA TÉCNICA ================= */}
        {abaAtiva === "estoque" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
              <div className="flex gap-3 bg-white/60 p-1.5 rounded-xl border border-gray-200 max-w-md">
                <button
                  onClick={() => setAbaEstoque("lista")}
                  className={`flex-1 py-2 px-4 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    abaEstoque === "lista"
                      ? "bg-[#9C1C0E] text-white shadow-xs"
                      : "text-gray-700 hover:bg-white/80"
                  }`}
                >
                  <MdListAlt size={16} /> Itens do Estoque
                </button>
                <button
                  onClick={() => setAbaEstoque("ficha")}
                  className={`flex-1 py-2 px-4 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    abaEstoque === "ficha"
                      ? "bg-[#9C1C0E] text-white shadow-xs"
                      : "text-gray-700 hover:bg-white/80"
                  }`}
                >
                  <MdReceipt size={16} /> Atribuir Ficha Técnica
                </button>
              </div>

              {abaEstoque === "lista" && (
                <button
                  onClick={() => {
                    setItemEstoqueEdicao(null);
                    setModalEstoque(true);
                  }}
                  className="flex items-center justify-center gap-2 bg-[#9C1C0E] text-white px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-[#7a160b] shadow-md cursor-pointer transition-all shrink-0"
                >
                  <MdAdd size={20} />
                  Novo Item no Estoque
                </button>
              )}
            </div>

            {abaEstoque === "lista" && (
              <div>
                <div className="mb-4">
                  <div className="relative max-w-md">
                    <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      placeholder="Buscar item no estoque..."
                      value={buscaEstoque}
                      onChange={(e) => setBuscaEstoque(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/70 border border-gray-200 text-sm focus:outline-none focus:border-[#9C1C0E]"
                    />
                  </div>
                </div>

                <div className="bg-white/80 backdrop-blur-xs rounded-2xl shadow-md overflow-hidden border border-gray-200">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-700">
                      <thead className="bg-[#F9ECE5] text-xs uppercase text-[#9C1C0E] border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 font-semibold">Nome do Insumo / Estoque</th>
                          <th className="px-6 py-3 font-semibold">Quantidade Atual</th>
                          <th className="px-6 py-3 font-semibold">Qtd. Mínima</th>
                          <th className="px-6 py-3 font-semibold">Status de Estoque</th>
                          <th className="px-6 py-3 font-semibold text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {carregandoEstoque ? (
                          <tr>
                            <td colSpan={5} className="text-center py-10 text-gray-500">
                              <div className="flex flex-col items-center justify-center gap-2">
                                <div className="w-8 h-8 border-3 border-[#9C1C0E] border-t-transparent rounded-full animate-spin" />
                                <span className="text-xs">Carregando itens de estoque...</span>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          itensEstoqueFiltrados.map((insumo, index) => {
                          const estoqueBaixo = Number(insumo.quantidadeEmEstoque) <= Number(insumo.quantidadeMinima);

                          return (
                            <tr key={insumo.idEstoque || insumo.id || index} className="hover:bg-white/50 transition-colors">
                              <td className="px-6 py-4 font-semibold text-gray-900">
                                {insumo.nome}
                              </td>
                              <td className="px-6 py-4 text-sm font-mono">
                                {insumo.quantidadeEmEstoque} {insumo.unidadeMedida}
                              </td>
                              <td className="px-6 py-4 text-sm font-mono text-gray-600">
                                {insumo.quantidadeMinima} {insumo.unidadeMedida}
                              </td>
                              <td className="px-6 py-4 text-xs">
                                {estoqueBaixo ? (
                                  <span className="bg-red-100 text-red-800 px-2.5 py-1 rounded-full font-bold flex items-center gap-1 w-fit">
                                    <MdWarning size={14} /> Estoque Baixo
                                  </span>
                                ) : (
                                  <span className="bg-green-100 text-green-800 px-2.5 py-1 rounded-full font-semibold w-fit">
                                    Normal
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    onClick={() => {
                                      setItemEstoqueEdicao(insumo);
                                      setModalEstoque(true);
                                    }}
                                    className="p-1.5 rounded-lg text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                                    title="Editar Item de Estoque"
                                  >
                                    <MdEdit size={18} />
                                  </button>

                                  <button
                                    onClick={() => handleExcluirEstoque(insumo)}
                                    className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                    title="Excluir Item de Estoque"
                                  >
                                    <MdDelete size={18} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        }))}

                        {itensEstoqueFiltrados.length === 0 && !carregandoEstoque && (
                          <tr>
                            <td colSpan={5} className="text-center py-8 text-gray-500 text-xs">
                              Nenhum item encontrado no estoque.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {abaEstoque === "ficha" && (
              <div className="bg-white/80 backdrop-blur-xs p-6 rounded-2xl shadow-md border border-gray-200">
                <h2 className="text-lg font-bold text-[#9C1C0E] mb-4 text-center">
                  Atribuir Ficha Técnica a Prato do Cardápio
                </h2>
                <FormularioFichaTec idRestaurante={idRestauranteGerente} />
              </div>
            )}
          </div>
        )}

        {/* ================= ABA MESAS (MÓDULO TOTALMENTE FUNCIONAL) ================= */}
        {abaAtiva === "mesas" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
              <div className="flex flex-wrap items-center gap-3 flex-1">
                <div className="relative flex-1 min-w-[200px]">
                  <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Buscar mesa por número ou status..."
                    value={buscaMesa}
                    onChange={(e) => setBuscaMesa(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/70 border border-gray-200 text-sm focus:outline-none focus:border-[#9C1C0E]"
                  />
                </div>

                <div className="flex items-center gap-1 bg-white/70 border border-gray-200 rounded-xl px-3 py-1.5">
                  <MdFilterList className="text-gray-400" size={16} />
                  <select
                    value={filtroStatusMesa}
                    onChange={(e) => setFiltroStatusMesa(e.target.value)}
                    className="bg-transparent text-xs text-gray-700 focus:outline-none cursor-pointer"
                  >
                    <option value="">Todos os Status</option>
                    <option value="Disponivel">Disponível</option>
                    <option value="Ocupada">Ocupada</option>
                    <option value="Reservada">Reservada</option>
                    <option value="Manutencao">Manutenção</option>
                  </select>
                </div>
              </div>

              <button
                onClick={() => {
                  setMesaEdicao(null);
                  setModalMesa(true);
                }}
                className="flex items-center justify-center gap-2 bg-[#9C1C0E] text-white px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-[#7a160b] shadow-md cursor-pointer transition-all shrink-0"
              >
                <MdAdd size={20} />
                Nova Mesa
              </button>
            </div>

            <div className="bg-white/80 backdrop-blur-xs rounded-2xl shadow-md overflow-hidden border border-gray-200">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-700">
                  <thead className="bg-[#F9ECE5] text-xs uppercase text-[#9C1C0E] border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 font-semibold">Mesa</th>
                      <th className="px-6 py-3 font-semibold">Status</th>
                      <th className="px-6 py-3 font-semibold">Autoatendimento (QR Code)</th>
                      <th className="px-6 py-3 font-semibold">Consumo / Comanda</th>
                      <th className="px-6 py-3 font-semibold text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {carregandoMesas ? (
                      <tr>
                        <td colSpan={5} className="text-center py-10 text-gray-500">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <div className="w-8 h-8 border-3 border-[#9C1C0E] border-t-transparent rounded-full animate-spin" />
                            <span className="text-xs">Carregando mesas do restaurante...</span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      mesasFiltradas.map((m) => (
                        <tr key={m.idMesa} className="hover:bg-white/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-[#B78A10]/15 text-[#9C1C0E] flex items-center justify-center font-bold text-base shadow-xs">
                                #{m.numero}
                              </div>
                              <div>
                                <span className="font-bold text-gray-900 block">Mesa {m.numero}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold inline-block ${
                                m.status === "Disponivel"
                                  ? "bg-green-100 text-green-800"
                                  : m.status === "Ocupada"
                                  ? "bg-amber-100 text-amber-800"
                                  : m.status === "Reservada"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {m.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => setMesaQrCode(m)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#B78A10]/40 text-[#9C1C0E] hover:bg-[#F9ECE5] rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer"
                              title="Visualizar e imprimir QR Code da mesa"
                            >
                              <MdQrCode2 size={18} />
                              <span>Ver QR Code</span>
                            </button>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setMesaComanda(m)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer"
                                title="Visualizar itens e consumo ativo da mesa"
                              >
                                <MdReceiptLong size={18} />
                                <span>Ver Comanda</span>
                              </button>
                              <button
                                onClick={() => {
                                  if (m.idPedidoAtivo) {
                                    window.open(`/tracking/${m.idPedidoAtivo}`, "_blank");
                                  } else {
                                    setMesaComanda(m);
                                  }
                                }}
                                className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-[#9C1C0E] border border-amber-200 rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer"
                                title="Acompanhar status do preparo dos pedidos desta mesa em tempo real"
                              >
                                <MdTimeline size={16} />
                                <span>Tracking</span>
                                <MdLaunch size={12} />
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => {
                                  setMesaEdicao(m);
                                  setModalMesa(true);
                                }}
                                className="p-1.5 rounded-lg text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                                title="Editar Mesa"
                              >
                                <MdEdit size={18} />
                              </button>
                              <button
                                onClick={() => handleExcluirMesa(m)}
                                className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                title="Remover Mesa"
                              >
                                <MdDelete size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}

                    {mesasFiltradas.length === 0 && !carregandoMesas && (
                      <tr>
                        <td colSpan={5} className="text-center py-10 text-gray-500 text-xs">
                          Nenhuma mesa encontrada. Cadastre mesas no botão acima para disponibilizar o atendimento.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================= ABA COZINHA (KDS EM TEMPO REAL) ================= */}
        {abaAtiva === "cozinha" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <MdSoupKitchen className="text-[#9C1C0E]" size={24} />
                  Fila da Cozinha (KDS em Tempo Real)
                </h2>
                <p className="text-xs text-gray-500">
                  Supervisão em tempo real da produção dos pedidos na cozinha do restaurante.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={filtroStatusKds}
                  onChange={(e) => setFiltroStatusKds(e.target.value)}
                  className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-700 focus:outline-none cursor-pointer"
                >
                  <option value="Todos">Todos os Itens ({filaKds.length})</option>
                  <option value="Pendente">Pendentes ({filaKds.filter((i) => i.status === "Pendente").length})</option>
                  <option value="Em preparo">Em preparo ({filaKds.filter((i) => i.status === "Em preparo").length})</option>
                  <option value="Pronto">Prontos ({filaKds.filter((i) => i.status === "Pronto").length})</option>
                </select>

                <button
                  onClick={carregarKds}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 hover:text-[#9C1C0E] hover:border-[#9C1C0E] text-xs font-semibold shadow-xs transition-all cursor-pointer"
                  title="Atualizar fila da cozinha"
                >
                  <MdRefresh className={carregandoKds ? "animate-spin text-[#9C1C0E]" : ""} size={18} />
                  <span>Atualizar</span>
                </button>
              </div>
            </div>

            <div className="bg-[#F9ECE5] border border-[#B78A10]/30 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-700">
              <div className="flex items-center gap-2.5">
                <MdInfoOutline className="text-[#9C1C0E] shrink-0" size={20} />
                <span>
                  <strong>Visão Gerencial:</strong> Esta fila reflete a priorização calculada pelo motor KDS da cozinha. O avanço de status de preparo é realizado pelos Cozinheiros.
                </span>
              </div>
              <span className="text-[11px] font-bold text-[#9C1C0E] bg-white px-2.5 py-1 rounded-lg border border-[#9C1C0E]/20">
                Sincronização a cada 10s
              </span>
            </div>

            {carregandoKds && filaKds.length === 0 ? (
              <div className="text-center py-16 text-gray-500 bg-white/80 rounded-2xl border border-gray-200">
                <div className="w-10 h-10 border-4 border-[#9C1C0E] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <span className="text-xs">Carregando fila da cozinha...</span>
              </div>
            ) : filaKdsFiltrada.length === 0 ? (
              <div className="text-center py-16 bg-white/80 rounded-2xl border border-gray-200 p-8">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <MdCheckCircle size={32} />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1">Cozinha sem pedidos pendentes!</h3>
                <p className="text-xs text-gray-500">Todos os pedidos estão em dia ou não há novos itens aguardando preparo.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filaKdsFiltrada.map((item) => (
                  <div
                    key={item.idItemPedido}
                    className={`bg-white rounded-2xl p-5 border shadow-xs transition-all flex flex-col justify-between ${
                      item.status === "Em preparo"
                        ? "border-amber-300 ring-2 ring-amber-100"
                        : item.status === "Pronto"
                        ? "border-green-300"
                        : "border-gray-200"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="bg-[#9C1C0E] text-white text-xs font-black px-2.5 py-1 rounded-lg">
                          Mesa #{item.numeroMesa || "--"}
                        </span>
                        <span
                          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                            item.status === "Em preparo"
                              ? "bg-amber-100 text-amber-800"
                              : item.status === "Pronto"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>

                      <h4 className="text-base font-bold text-gray-900 leading-snug">
                        {item.quantidade}x {item.nomeItem || "Item"}
                      </h4>
                      <p className="text-xs text-gray-500 mb-2">{item.categoria || "Geral"}</p>

                      {item.observacao && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-xs text-amber-900 font-medium mb-3">
                          ⚠️ Obs: {item.observacao}
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <MdAccessTime size={14} />
                        {item.dataCriacao
                          ? new Date(item.dataCriacao).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                          : "--:--"}
                      </span>
                      {item.idPedido && (
                        <button
                          onClick={() => window.open(`/tracking/${item.idPedido}`, "_blank")}
                          className="text-xs text-[#9C1C0E] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <MdTimeline size={14} />
                          <span>Tracking</span>
                          <MdLaunch size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= ABA PEDIDOS (PEDIDOS ATIVOS NO RESTAURANTE) ================= */}
        {abaAtiva === "pedidos" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
              <div className="flex flex-wrap items-center gap-3 flex-1">
                <div className="relative flex-1 min-w-[200px]">
                  <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Buscar por mesa, código ou garçom..."
                    value={buscaPedido}
                    onChange={(e) => setBuscaPedido(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/70 border border-gray-200 text-sm focus:outline-none focus:border-[#9C1C0E]"
                  />
                </div>

                <select
                  value={filtroStatusPedido}
                  onChange={(e) => setFiltroStatusPedido(e.target.value)}
                  className="bg-white/70 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-700 focus:outline-none cursor-pointer"
                >
                  <option value="Todos">Todos os Status ({pedidosAtivos.length})</option>
                  <option value="Aberto">Aberto</option>
                  <option value="Em preparo">Em preparo</option>
                  <option value="Pronto">Pronto</option>
                </select>
              </div>

              <button
                onClick={carregarPedidos}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 hover:text-[#9C1C0E] hover:border-[#9C1C0E] text-xs font-semibold shadow-xs transition-all cursor-pointer shrink-0"
              >
                <MdRefresh className={carregandoPedidos ? "animate-spin text-[#9C1C0E]" : ""} size={18} />
                <span>Atualizar Pedidos</span>
              </button>
            </div>

            <div className="bg-white/80 backdrop-blur-xs rounded-2xl shadow-md overflow-hidden border border-gray-200">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-700">
                  <thead className="bg-[#F9ECE5] text-xs uppercase text-[#9C1C0E] border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 font-semibold">Mesa</th>
                      <th className="px-6 py-3 font-semibold">Horário</th>
                      <th className="px-6 py-3 font-semibold">Itens do Pedido</th>
                      <th className="px-6 py-3 font-semibold">Total</th>
                      <th className="px-6 py-3 font-semibold">Status</th>
                      <th className="px-6 py-3 font-semibold text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {carregandoPedidos ? (
                      <tr>
                        <td colSpan={6} className="text-center py-10 text-gray-500">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <div className="w-8 h-8 border-3 border-[#9C1C0E] border-t-transparent rounded-full animate-spin" />
                            <span className="text-xs">Carregando pedidos ativos...</span>
                          </div>
                        </td>
                      </tr>
                    ) : pedidosFiltrados.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-gray-500 text-xs">
                          Nenhum pedido ativo encontrado no restaurante no momento.
                        </td>
                      </tr>
                    ) : (
                      pedidosFiltrados.map((p) => (
                        <tr key={p.idPedido} className="hover:bg-white/50 transition-colors">
                          <td className="px-6 py-4 font-bold text-gray-900">
                            <span className="inline-flex items-center gap-1 bg-[#9C1C0E]/10 text-[#9C1C0E] px-2.5 py-1 rounded-lg">
                              <MdTableBar size={16} /> Mesa #{p.numeroMesa || "--"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs text-gray-500">
                            {p.dataAbertura
                              ? new Date(p.dataAbertura).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                              : "--:--"}
                          </td>
                          <td className="px-6 py-4 text-xs">
                            <div className="space-y-1 max-w-xs">
                              {p.itens?.map((it, idx) => (
                                <div key={idx} className="flex items-center justify-between gap-2">
                                  <span className="truncate">
                                    {it.quantidade}x {it.nome}
                                  </span>
                                  <span
                                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                                      it.status === "Pronto"
                                        ? "bg-green-100 text-green-700"
                                        : it.status === "Em preparo"
                                        ? "bg-amber-100 text-amber-700"
                                        : it.status === "Cancelado"
                                        ? "bg-red-100 text-red-700 line-through"
                                        : "bg-gray-100 text-gray-600"
                                    }`}
                                  >
                                    {it.status}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4 font-bold text-gray-900 text-xs">
                            R$ {Number(p.total || 0).toFixed(2)}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                p.status === "Pronto"
                                  ? "bg-green-100 text-green-800"
                                  : p.status === "Em preparo"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {p.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => window.open(`/tracking/${p.idPedido}`, "_blank")}
                                className="flex items-center gap-1 px-3 py-1.5 bg-[#9C1C0E] hover:bg-[#7a160b] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                                title="Acompanhar status na tela de tracking em tempo real"
                              >
                                <MdTimeline size={16} />
                                <span>Tracking</span>
                                <MdLaunch size={12} />
                              </button>

                              <button
                                onClick={() => {
                                  const mesaObj = mesas.find((m) => String(m.idMesa) === String(p.idMesa)) || {
                                    idMesa: p.idMesa,
                                    numero: p.numeroMesa,
                                  };
                                  setMesaComanda(mesaObj);
                                }}
                                className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                                title="Ver comanda completa e gerenciar itens"
                              >
                                <MdReceiptLong size={16} />
                                <span>Comanda</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================= ABA HISTÓRICO (VENDAS E PEDIDOS ENCERRADOS) ================= */}
        {abaAtiva === "historico" && (
          <div className="space-y-6">
            {/* KPI Financeiros */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white/80 p-5 rounded-2xl border border-gray-200 shadow-xs">
                <span className="text-xs text-gray-500 font-medium">Total Faturado</span>
                <div className="text-2xl font-black text-[#9C1C0E] mt-1">
                  R$ {totalFaturado.toFixed(2)}
                </div>
                <span className="text-[11px] text-emerald-600 font-semibold mt-1 inline-block">
                  {pedidosFechados.length} pedidos pagos
                </span>
              </div>

              <div className="bg-white/80 p-5 rounded-2xl border border-gray-200 shadow-xs">
                <span className="text-xs text-gray-500 font-medium">Ticket Médio</span>
                <div className="text-2xl font-black text-gray-900 mt-1">
                  R$ {ticketMedio.toFixed(2)}
                </div>
                <span className="text-[11px] text-gray-400 mt-1 inline-block">
                  Por pedido finalizado
                </span>
              </div>

              <div className="bg-white/80 p-5 rounded-2xl border border-gray-200 shadow-xs">
                <span className="text-xs text-gray-500 font-medium">Pedidos Finalizados</span>
                <div className="text-2xl font-black text-emerald-700 mt-1">
                  {pedidosFechados.length}
                </div>
                <span className="text-[11px] text-gray-400 mt-1 inline-block">
                  Fechados e pagos
                </span>
              </div>

              <div className="bg-white/80 p-5 rounded-2xl border border-gray-200 shadow-xs">
                <span className="text-xs text-gray-500 font-medium">Pedidos Cancelados</span>
                <div className="text-2xl font-black text-red-600 mt-1">
                  {pedidosCancelados.length}
                </div>
                <span className="text-[11px] text-gray-400 mt-1 inline-block">
                  Sem faturamento
                </span>
              </div>
            </div>

            {/* Filtros Histórico */}
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
              <div className="flex flex-wrap items-center gap-3 flex-1">
                <div className="relative flex-1 min-w-[200px]">
                  <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Buscar por mesa ou código no histórico..."
                    value={buscaHistorico}
                    onChange={(e) => setBuscaHistorico(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/70 border border-gray-200 text-sm focus:outline-none focus:border-[#9C1C0E]"
                  />
                </div>

                <select
                  value={filtroStatusHistorico}
                  onChange={(e) => setFiltroStatusHistorico(e.target.value)}
                  className="bg-white/70 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-700 focus:outline-none cursor-pointer"
                >
                  <option value="Todos">Todos os Status ({historicoPedidos.length})</option>
                  <option value="Fechado">Fechados ({pedidosFechados.length})</option>
                  <option value="Cancelado">Cancelados ({pedidosCancelados.length})</option>
                </select>
              </div>

              <button
                onClick={carregarHistorico}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 hover:text-[#9C1C0E] hover:border-[#9C1C0E] text-xs font-semibold shadow-xs transition-all cursor-pointer shrink-0"
              >
                <MdRefresh className={carregandoHistorico ? "animate-spin text-[#9C1C0E]" : ""} size={18} />
                <span>Atualizar Histórico</span>
              </button>
            </div>

            {/* Tabela do Histórico */}
            <div className="bg-white/80 backdrop-blur-xs rounded-2xl shadow-md overflow-hidden border border-gray-200">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-700">
                  <thead className="bg-[#F9ECE5] text-xs uppercase text-[#9C1C0E] border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 font-semibold">Data / Horário</th>
                      <th className="px-6 py-3 font-semibold">Mesa</th>
                      <th className="px-6 py-3 font-semibold">Pagamento</th>
                      <th className="px-6 py-3 font-semibold">Total</th>
                      <th className="px-6 py-3 font-semibold">Status</th>
                      <th className="px-6 py-3 font-semibold text-right">Detalhes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {carregandoHistorico ? (
                      <tr>
                        <td colSpan={6} className="text-center py-10 text-gray-500">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <div className="w-8 h-8 border-3 border-[#9C1C0E] border-t-transparent rounded-full animate-spin" />
                            <span className="text-xs">Carregando histórico de pedidos...</span>
                          </div>
                        </td>
                      </tr>
                    ) : historicoFiltrado.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-gray-500 text-xs">
                          Nenhum pedido finalizado no histórico até o momento.
                        </td>
                      </tr>
                    ) : (
                      historicoFiltrado.map((h) => {
                        const formaPag = h.pagamentos?.[0]?.formaPagamento || "Não informado";
                        return (
                          <tr key={h.idPedido} className="hover:bg-white/50 transition-colors">
                            <td className="px-6 py-4 text-xs text-gray-600">
                              <div className="font-semibold text-gray-900">
                                {h.dataAbertura ? new Date(h.dataAbertura).toLocaleDateString("pt-BR") : "--"}
                              </div>
                              <div className="text-[11px] text-gray-400">
                                {h.dataAbertura
                                  ? new Date(h.dataAbertura).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                                  : "--:--"}
                                {h.dataFechamento
                                  ? ` → ${new Date(h.dataFechamento).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                                  : ""}
                              </div>
                            </td>
                            <td className="px-6 py-4 font-bold text-gray-900">
                              Mesa #{h.numeroMesa || "--"}
                            </td>
                            <td className="px-6 py-4 text-xs text-gray-700">
                              <span className="inline-flex items-center gap-1 bg-gray-100 px-2.5 py-1 rounded-md text-gray-800 font-medium">
                                <MdCreditCard size={14} className="text-[#9C1C0E]" />
                                {formaPag}
                              </span>
                            </td>
                            <td className="px-6 py-4 font-bold text-gray-900 text-xs">
                              R$ {Number(h.total || 0).toFixed(2)}
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                  h.status === "Fechado" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                                }`}
                              >
                                {h.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => setDetalhesHistoricoModal(h)}
                                className="px-3 py-1.5 bg-white border border-gray-200 hover:border-[#9C1C0E] hover:text-[#9C1C0E] text-xs font-semibold rounded-xl transition-all shadow-xs cursor-pointer"
                              >
                                Ver Detalhes
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modais de Usuário (Restritos ao Restaurante do Gerente) */}
      {modalNovoUser && (
        <ModalNovoUsuario
          restaurantes={restaurantes}
          restaurantePreSelecionado={idRestauranteGerente}
          travarRestaurante={true}
          cargosPermitidos={CARGOS_PERMITIDOS_GERENTE}
          onClose={() => setModalNovoUser(false)}
          onSuccess={() => {
            setModalNovoUser(false);
            dispararSucesso("Novo usuário cadastrado com sucesso no seu restaurante!");
            carregarUsuarios();
          }}
        />
      )}

      {modalEditUser && (
        <ModalEditarUsuario
          usuario={modalEditUser}
          cargosPermitidos={CARGOS_PERMITIDOS_GERENTE}
          onClose={() => setModalEditUser(null)}
          onSuccess={() => {
            setModalEditUser(null);
            dispararSucesso("Dados do usuário atualizados com sucesso!");
            carregarUsuarios();
          }}
        />
      )}

      {modalResetSenha && (
        <ModalResetarSenha
          usuario={modalResetSenha}
          onClose={() => setModalResetSenha(null)}
          onSuccess={() => {
            setModalResetSenha(null);
            dispararSucesso("Senha do usuário redefinida com sucesso!");
          }}
        />
      )}

      {/* Modal de Cardápio (Segue o mesmo modelo visual do ModalNovoUsuario) */}
      {modalCardapio && (
        <ModalCardapio
          item={itemCardapioEdicao}
          idRestaurante={idRestauranteGerente}
          onClose={() => {
            setModalCardapio(false);
            setItemCardapioEdicao(null);
          }}
          onSuccess={() => {
            setModalCardapio(false);
            setItemCardapioEdicao(null);
            dispararSucesso("Item do cardápio salvo com sucesso!");
            carregarCardapio();
          }}
        />
      )}

      {/* Modal de Estoque (Segue o mesmo modelo visual do ModalNovoUsuario) */}
      {modalEstoque && (
        <ModalEstoque
          item={itemEstoqueEdicao}
          idRestaurante={idRestauranteGerente}
          onClose={() => {
            setModalEstoque(false);
            setItemEstoqueEdicao(null);
          }}
          onSuccess={() => {
            setModalEstoque(false);
            setItemEstoqueEdicao(null);
            dispararSucesso("Item de estoque salvo com sucesso!");
            carregarEstoque();
          }}
        />
      )}

      {/* Modais de Mesas */}
      {modalMesa && (
        <ModalMesa
          mesa={mesaEdicao}
          idRestaurante={idRestauranteGerente}
          onClose={() => {
            setModalMesa(false);
            setMesaEdicao(null);
          }}
          onSuccess={() => {
            setModalMesa(false);
            setMesaEdicao(null);
            dispararSucesso(mesaEdicao ? "Mesa atualizada com sucesso!" : "Mesa criada com sucesso!");
            carregarMesas();
          }}
        />
      )}

      {mesaQrCode && (
        <ModalQrCodeMesa
          mesa={mesaQrCode}
          onClose={() => setMesaQrCode(null)}
        />
      )}

      {mesaComanda && (
        <ModalComandaMesa
          mesa={mesaComanda}
          onClose={() => setMesaComanda(null)}
        />
      )}

      {/* Modal de Detalhes do Histórico de Pedido */}
      {detalhesHistoricoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 md:p-8 animate-fade-in">
            <div className="flex justify-between items-center mb-4 border-b pb-3 border-[#B78A10]/30">
              <div>
                <h2 className="text-xl font-bold text-[#9C1C0E] flex items-center gap-2">
                  <MdHistory size={24} /> Pedido #{detalhesHistoricoModal.numeroMesa ? `Mesa ${detalhesHistoricoModal.numeroMesa}` : detalhesHistoricoModal.idPedido.slice(0, 8)}
                </h2>
                <p className="text-xs text-gray-500">
                  Status: <strong className={detalhesHistoricoModal.status === "Fechado" ? "text-emerald-700" : "text-red-700"}>{detalhesHistoricoModal.status}</strong>
                </p>
              </div>
              <button
                onClick={() => setDetalhesHistoricoModal(null)}
                className="text-gray-400 hover:text-gray-700 text-2xl font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-[#F9ECE5]/60 p-3 rounded-xl text-xs text-gray-700 flex flex-wrap justify-between gap-2">
                <span>Abertura: <strong>{detalhesHistoricoModal.dataAbertura ? new Date(detalhesHistoricoModal.dataAbertura).toLocaleString("pt-BR") : "--"}</strong></span>
                <span>Fechamento: <strong>{detalhesHistoricoModal.dataFechamento ? new Date(detalhesHistoricoModal.dataFechamento).toLocaleString("pt-BR") : "--"}</strong></span>
              </div>

              <div>
                <h4 className="text-xs font-bold text-gray-700 uppercase mb-2">Itens Consumidos:</h4>
                <div className="max-h-52 overflow-y-auto divide-y divide-gray-100 border border-gray-100 rounded-xl p-2">
                  {detalhesHistoricoModal.itens?.map((it, idx) => (
                    <div key={idx} className="py-2 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-gray-900">{it.quantidade}x {it.nome}</span>
                        {it.observacao && <p className="text-[11px] text-gray-400 italic">Obs: {it.observacao}</p>}
                      </div>
                      <span className="font-bold text-gray-800">
                        R$ {((Number(it.precoUnitario) || 0) * (it.quantidade || 1)).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {detalhesHistoricoModal.pagamentos && detalhesHistoricoModal.pagamentos.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-gray-700 uppercase mb-2">Pagamento Registrado:</h4>
                  <div className="bg-gray-50 rounded-xl p-3 space-y-1 text-xs">
                    {detalhesHistoricoModal.pagamentos.map((pg, idx) => (
                      <div key={idx} className="flex justify-between items-center">
                        <span className="flex items-center gap-1 font-semibold text-gray-800">
                          <MdCreditCard className="text-[#9C1C0E]" size={16} />
                          {pg.formaPagamento}
                        </span>
                        <span className="font-bold text-gray-900">
                          R$ {Number(pg.valor || 0).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                <span className="text-sm font-bold text-gray-700">Total do Pedido:</span>
                <span className="text-xl font-black text-[#9C1C0E]">
                  R$ {Number(detalhesHistoricoModal.total || 0).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setDetalhesHistoricoModal(null)}
                className="px-5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-sm transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TelaGerente;
