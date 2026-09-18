import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  MdStore,
  MdPeople,
  MdAdd,
  MdEdit,
  MdDelete,
  MdLockReset,
  MdSearch,
  MdToggleOn,
  MdToggleOff,
  MdExitToApp,
  MdFilterList,
} from "react-icons/md";

import {
  listarRestaurantes,
  alterarStatusRestaurante,
  excluirRestaurante,
} from "../services/restauranteService";
import {
  listarUsuarios,
  alterarStatusUsuario,
  excluirUsuario,
} from "../services/usuarioService";

import ModalNovoRestaurante from "../components/administrador/ModalNovoRestaurante";
import ModalEditarRestaurante from "../components/administrador/ModalEditarRestaurante";
import ModalNovoUsuario from "../components/administrador/ModalNovoUsuario";
import ModalEditarUsuario from "../components/administrador/ModalEditarUsuario";
import ModalResetarSenha from "../components/administrador/ModalResetarSenha";

import logo from "../assets/fast cooking logo.png";

// Usuário protegido contra exclusão e desativação
const EMAIL_ADMIN_PROTEGIDO = "fastcooking@fastcooking.com.br";

function TelaAdministrador() {
  const navigate = useNavigate();

  // Controle de Abas: 'restaurantes' ou 'usuarios'
  const [abaAtiva, setAbaAtiva] = useState("restaurantes");

  // Dados
  const [restaurantes, setRestaurantes] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState("");
  const [erroGeral, setErroGeral] = useState("");

  // Filtros
  const [buscaRestaurante, setBuscaRestaurante] = useState("");
  const [filtroRestauranteUsuario, setFiltroRestauranteUsuario] = useState("");
  const [filtroFuncaoUsuario, setFiltroFuncaoUsuario] = useState("");
  const [buscaUsuario, setBuscaUsuario] = useState("");

  // Modais
  const [modalNovoRest, setModalNovoRest] = useState(false);
  const [modalEditRest, setModalEditRest] = useState(null);
  const [modalNovoUser, setModalNovoUser] = useState(false);
  const [modalEditUser, setModalEditUser] = useState(null);
  const [modalResetSenha, setModalResetSenha] = useState(null);

  // Verificação de permissão
  useEffect(() => {
    const funcao = localStorage.getItem("funcao");
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    // Apenas quem é Adm (ou adm) pode acessar esta tela
    if (funcao !== "Adm" && funcao !== "adm") {
      alert("Acesso restrito a Administradores do Sistema.");
      navigate("/login");
    }
  }, [navigate]);

  // Carregar dados
  useEffect(() => {
    carregarRestaurantes();
  }, [buscaRestaurante]);

  useEffect(() => {
    carregarUsuarios();
  }, [filtroRestauranteUsuario, filtroFuncaoUsuario, buscaUsuario]);

  async function carregarRestaurantes() {
    try {
      setCarregando(true);
      const params = {};
      if (buscaRestaurante.trim()) params.busca = buscaRestaurante.trim();
      const dados = await listarRestaurantes(params);
      // Filtra para remover da visualização e vinculação os registros anonimizados/removidos
      const restaurantesValidos = (dados || []).filter(
        (r) => !r.nome?.toUpperCase().includes("RESTAURANTE REMOVIDO")
      );
      setRestaurantes(restaurantesValidos);
    } catch (err) {
      console.error("Erro ao carregar restaurantes:", err);
      setErroGeral("Não foi possível carregar a lista de restaurantes.");
    } finally {
      setCarregando(false);
    }
  }

  async function carregarUsuarios() {
    try {
      setCarregando(true);
      const params = {};
      if (filtroRestauranteUsuario) params.idRestaurante = filtroRestauranteUsuario;
      if (filtroFuncaoUsuario) params.funcao = filtroFuncaoUsuario;
      if (buscaUsuario.trim()) params.busca = buscaUsuario.trim();
      const dados = await listarUsuarios(params);

      // Filtra para remover da visualização os usuários anonimizados/removidos
      const usuariosValidos = (dados || []).filter((u) => {
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
      setCarregando(false);
    }
  }

  function dispararSucesso(msg) {
    setMensagemSucesso(msg);
    setTimeout(() => setMensagemSucesso(""), 4000);
  }

  async function handleToggleStatusRestaurante(r) {
    try {
      await alterarStatusRestaurante(r.idRestaurante, !r.status);
      dispararSucesso(`Status de "${r.nome}" atualizado!`);
      carregarRestaurantes();
    } catch (err) {
      alert(err.message || "Erro ao alternar status do restaurante.");
    }
  }

  async function handleExcluirRestaurante(r) {
    const confirmar = window.confirm(
      `Deseja realmente remover o restaurante "${r.nome}"? Esta ação desativará e removerá o restaurante do sistema.`
    );
    if (!confirmar) return;

    try {
      await excluirRestaurante(r.idRestaurante);
      dispararSucesso(`Restaurante "${r.nome}" removido com sucesso!`);
      carregarRestaurantes();
      carregarUsuarios();
    } catch (err) {
      alert(err.message || "Erro ao remover restaurante.");
    }
  }

  async function handleToggleStatusUsuario(u) {
    // Validação de proteção do usuário raiz
    if (u.email === EMAIL_ADMIN_PROTEGIDO) {
      alert(`O usuário ${EMAIL_ADMIN_PROTEGIDO} é o administrador principal do sistema e não pode ter seu status alterado.`);
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
    // Validação de proteção do usuário raiz
    if (u.email === EMAIL_ADMIN_PROTEGIDO) {
      alert(`O usuário ${EMAIL_ADMIN_PROTEGIDO} é o administrador principal do sistema e não pode ser removido.`);
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

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("funcao");
    navigate("/login");
  }

  // Nome do restaurante por ID
  const mapRestaurantes = restaurantes.reduce((acc, curr) => {
    acc[curr.idRestaurante] = curr.nome;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-linear-to-r from-[#F9ECE5] to-[#D4C8C0] pb-12">
      {/* Header / Navbar */}
      <header className="bg-white/80 backdrop-blur-md border-b border-[#9C1C0E]/20 sticky top-0 z-40 px-6 py-4 flex flex-wrap items-center justify-between shadow-xs">
        <div className="flex items-center gap-4">
          <img src={logo} alt="Fast Cooking" className="h-10 w-auto" />
          <div>
            <h1 className="text-xl font-bold text-[#9C1C0E]">Painel do Administrador</h1>
            <p className="text-xs text-gray-500">Gestão global de restaurantes e usuários</p>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-2 sm:mt-0">
          <span className="text-xs bg-[#9C1C0E]/10 text-[#9C1C0E] px-3 py-1 rounded-full font-semibold">
            Role: ADM
          </span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-[#9C1C0E] transition-colors cursor-pointer"
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
        {/* Abas */}
        <div className="flex gap-2 border-b border-gray-300 pb-2 mb-6">
          <button
            onClick={() => setAbaAtiva("restaurantes")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all cursor-pointer ${
              abaAtiva === "restaurantes"
                ? "bg-[#9C1C0E] text-white shadow-md"
                : "bg-white/60 text-gray-700 hover:bg-white"
            }`}
          >
            <MdStore size={18} />
            Restaurantes ({restaurantes.length})
          </button>

          <button
            onClick={() => setAbaAtiva("usuarios")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all cursor-pointer ${
              abaAtiva === "usuarios"
                ? "bg-[#9C1C0E] text-white shadow-md"
                : "bg-white/60 text-gray-700 hover:bg-white"
            }`}
          >
            <MdPeople size={18} />
            Usuários ({usuarios.length})
          </button>
        </div>

        {/* ================= ABA RESTAURANTES ================= */}
        {abaAtiva === "restaurantes" && (
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mb-6">
              <div className="relative flex-1 max-w-md">
                <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Buscar restaurante por nome, CNPJ..."
                  value={buscaRestaurante}
                  onChange={(e) => setBuscaRestaurante(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/70 border border-gray-200 text-sm focus:outline-none focus:border-[#9C1C0E]"
                />
              </div>

              <button
                onClick={() => setModalNovoRest(true)}
                className="flex items-center justify-center gap-2 bg-[#9C1C0E] text-white px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-[#7a160b] shadow-md cursor-pointer transition-all"
              >
                <MdAdd size={20} />
                Novo Restaurante
              </button>
            </div>

            {/* Grid de Restaurantes */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {restaurantes.map((r) => (
                <div
                  key={r.idRestaurante}
                  className={`bg-white/80 backdrop-blur-xs rounded-2xl p-6 shadow-md border transition-all flex flex-col justify-between ${
                    r.status ? "border-gray-200" : "border-red-200 bg-red-50/40"
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-lg text-gray-900 leading-tight">
                        {r.nome}
                      </h3>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                          r.status ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}
                      >
                        {r.status ? "Ativo" : "Inativo"}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs text-gray-600 mt-3">
                      <p><strong>CNPJ:</strong> {r.cnpj}</p>
                      <p><strong>Telefone:</strong> {r.telefone}</p>
                      <p><strong>E-mail:</strong> {r.email}</p>
                      <p><strong>CEP:</strong> {r.cep}</p>
                      <p><strong>ID:</strong> {r.idRestaurante}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100">
                    <button
                      onClick={() => {
                        setFiltroRestauranteUsuario(String(r.idRestaurante));
                        setAbaAtiva("usuarios");
                      }}
                      className="text-xs text-[#B78A10] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <MdPeople size={14} /> Ver Usuários
                    </button>

                    <div className="flex items-center gap-1">
                      {/* Editar */}
                      <button
                        onClick={() => setModalEditRest(r)}
                        className="p-1.5 rounded-lg text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                        title="Editar Restaurante"
                      >
                        <MdEdit size={18} />
                      </button>

                      {/* Ativar/Desativar */}
                      <button
                        onClick={() => handleToggleStatusRestaurante(r)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          r.status
                            ? "text-green-600 hover:text-red-600 hover:bg-red-50"
                            : "text-red-600 hover:text-green-600 hover:bg-green-50"
                        }`}
                        title={r.status ? "Desativar Restaurante" : "Ativar Restaurante"}
                      >
                        {r.status ? <MdToggleOn size={22} /> : <MdToggleOff size={22} />}
                      </button>

                      {/* Remover */}
                      <button
                        onClick={() => handleExcluirRestaurante(r)}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Remover Restaurante"
                      >
                        <MdDelete size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {restaurantes.length === 0 && !carregando && (
                <div className="col-span-full text-center py-12 text-gray-500">
                  Nenhum restaurante encontrado.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= ABA USUÁRIOS ================= */}
        {abaAtiva === "usuarios" && (
          <div>
            {/* Barra de Filtros e Criação */}
            <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 mb-6">
              <div className="flex flex-wrap items-center gap-3 flex-1">
                {/* Busca */}
                <div className="relative flex-1 min-w-[200px]">
                  <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Buscar por nome ou e-mail..."
                    value={buscaUsuario}
                    onChange={(e) => setBuscaUsuario(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/70 border border-gray-200 text-sm focus:outline-none focus:border-[#9C1C0E]"
                  />
                </div>

                {/* Filtro por Restaurante */}
                <div className="flex items-center gap-1 bg-white/70 border border-gray-200 rounded-xl px-3 py-1.5">
                  <MdFilterList className="text-gray-400" size={16} />
                  <select
                    value={filtroRestauranteUsuario}
                    onChange={(e) => setFiltroRestauranteUsuario(e.target.value)}
                    className="bg-transparent text-xs text-gray-700 focus:outline-none cursor-pointer"
                  >
                    <option value="">Todos os Restaurantes</option>
                    {restaurantes.map((r) => (
                      <option key={r.idRestaurante} value={r.idRestaurante}>
                        {r.nome}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filtro por Função */}
                <select
                  value={filtroFuncaoUsuario}
                  onChange={(e) => setFiltroFuncaoUsuario(e.target.value)}
                  className="bg-white/70 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-700 focus:outline-none cursor-pointer"
                >
                  <option value="">Todas as Funções</option>
                  <option value="Adm">Adm</option>
                  <option value="Gerente">Gerente</option>
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

            {/* Tabela de Usuários */}
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
                      const isRootAdmin = u.email === EMAIL_ADMIN_PROTEGIDO;

                      return (
                        <tr key={u.idUsuario} className="hover:bg-white/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-semibold text-gray-900 flex items-center gap-1.5">
                              {u.nome}
                              {isRootAdmin && (
                                <span className="text-[10px] bg-[#9C1C0E] text-white px-1.5 py-0.5 rounded-full font-bold">
                                  PROTEGIDO
                                </span>
                              )}
                            </div>
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
                              {/* Editar dados gerais */}
                              <button
                                onClick={() => setModalEditUser(u)}
                                className="p-1.5 rounded-lg text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                                title="Editar Dados do Usuário"
                              >
                                <MdEdit size={18} />
                              </button>

                              {/* Resetar Senha */}
                              <button
                                onClick={() => setModalResetSenha(u)}
                                className="p-1.5 rounded-lg text-gray-600 hover:text-[#B78A10] hover:bg-amber-50 transition-colors cursor-pointer"
                                title="Redefinir Senha"
                              >
                                <MdLockReset size={20} />
                              </button>

                              {/* Ativar/Desativar */}
                              <button
                                onClick={() => handleToggleStatusUsuario(u)}
                                disabled={isRootAdmin}
                                className={`p-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                                  u.status
                                    ? "text-green-600 hover:text-red-600 hover:bg-red-50"
                                    : "text-red-600 hover:text-green-600 hover:bg-green-50"
                                }`}
                                title={
                                  isRootAdmin
                                    ? "Administrador principal não pode ser desativado"
                                    : u.status
                                    ? "Desativar Usuário"
                                    : "Ativar Usuário"
                                }
                              >
                                {u.status ? <MdToggleOn size={22} /> : <MdToggleOff size={22} />}
                              </button>

                              {/* Remover Usuário */}
                              <button
                                onClick={() => handleExcluirUsuario(u)}
                                disabled={isRootAdmin}
                                className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                title={
                                  isRootAdmin
                                    ? "Administrador principal não pode ser removido"
                                    : "Remover Usuário"
                                }
                              >
                                <MdDelete size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {usuarios.length === 0 && !carregando && (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-gray-500 text-xs">
                          Nenhum usuário encontrado para os filtros selecionados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modais */}
      {modalNovoRest && (
        <ModalNovoRestaurante
          onClose={() => setModalNovoRest(false)}
          onSuccess={() => {
            setModalNovoRest(false);
            dispararSucesso("Restaurante e usuário inicial criados com sucesso!");
            carregarRestaurantes();
            carregarUsuarios();
          }}
        />
      )}

      {modalEditRest && (
        <ModalEditarRestaurante
          restaurante={modalEditRest}
          onClose={() => setModalEditRest(null)}
          onSuccess={() => {
            setModalEditRest(null);
            dispararSucesso("Restaurante atualizado com sucesso!");
            carregarRestaurantes();
          }}
        />
      )}

      {modalNovoUser && (
        <ModalNovoUsuario
          restaurantes={restaurantes}
          restaurantePreSelecionado={filtroRestauranteUsuario}
          onClose={() => setModalNovoUser(false)}
          onSuccess={() => {
            setModalNovoUser(false);
            dispararSucesso("Usuário cadastrado com sucesso!");
            carregarUsuarios();
          }}
        />
      )}

      {modalEditUser && (
        <ModalEditarUsuario
          usuario={modalEditUser}
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
    </div>
  );
}

export default TelaAdministrador;