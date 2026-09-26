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

import ModalNovoUsuario from "../components/administrador/ModalNovoUsuario";
import ModalEditarUsuario from "../components/administrador/ModalEditarUsuario";
import ModalResetarSenha from "../components/administrador/ModalResetarSenha";
import ModalCardapio from "../components/cardapio/ModalCardapio";
import ModalEstoque from "../components/insumos/ModalEstoque";

import FormularioFichaTec from "../components/insumos/FormularioFichaTec";

import logo from "../assets/fast cooking logo.png";

function getUserIdFromToken() {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.sub ? Number(payload.sub) : null;
  } catch (e) {
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
    if (funcaoNormalizada !== "gerente" && funcaoNormalizada !== "adm") {
      alert("Acesso restrito a Gerentes e Administradores.");
      navigate("/login");
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
        if (idRestauranteGerente && Number(u.idRestaurante) !== Number(idRestauranteGerente)) {
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
    if (abaAtiva === "usuarios") {
      carregarUsuarios();
    }
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
    if (abaAtiva === "cardapio") {
      carregarCardapio();
    }
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
    if (abaAtiva === "estoque") {
      carregarEstoque();
    }
  }, [abaAtiva, carregarEstoque]);

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
                    {usuarios.map((u) => {
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
                    })}

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
                    {itensCardapioFiltrados.map((item) => {
                      const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");
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
                    })}

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
                        {itensEstoqueFiltrados.map((insumo, index) => {
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
                        })}

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
                <FormularioFichaTec />
              </div>
            )}
          </div>
        )}

        {/* ================= ABAS MOCK (MESAS, COZINHA, PEDIDOS, HISTÓRICO) ================= */}
        {(abaAtiva === "mesas" || abaAtiva === "cozinha" || abaAtiva === "pedidos" || abaAtiva === "historico") && (
          <div className="bg-white/80 backdrop-blur-xs p-12 rounded-2xl shadow-md border border-gray-200 text-center">
            <h2 className="text-xl font-bold text-[#9C1C0E] mb-2 capitalize">
              Módulo de {abaAtiva}
            </h2>
            <p className="text-gray-500 text-sm">
              Esta seção está reservada para as funcionalidades de {abaAtiva} do restaurante.
            </p>
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
    </div>
  );
}

export default TelaGerente;
