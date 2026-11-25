import { useCallback, useEffect, useMemo, useState } from "react";
import {
  MdAdd,
  MdDelete,
  MdEdit,
  MdLockReset,
  MdPeople,
  MdSearch,
  MdStore,
  MdToggleOff,
  MdToggleOn,
} from "react-icons/md";
import { useNavigate, useSearchParams } from "react-router-dom";

import ModalEditarRestaurante from "../components/administrador/ModalEditarRestaurante";
import ModalEditarUsuario from "../components/administrador/ModalEditarUsuario";
import ModalNovoRestaurante from "../components/administrador/ModalNovoRestaurante";
import ModalNovoUsuario from "../components/administrador/ModalNovoUsuario";
import ModalResetarSenha from "../components/administrador/ModalResetarSenha";
import AppShell from "../components/layout/AppShell";
import {
  Badge,
  Button,
  Card,
  DataTable,
  EmptyState,
  Input,
  PageHeader,
  Select,
  Spinner,
  useConfirm,
  useToast,
} from "../components/ui";
import { formatarFuncao } from "../constants/RotasPerfil";
import {
  alterarStatusRestaurante,
  excluirRestaurante,
  listarRestaurantes,
} from "../services/restauranteService";
import {
  alterarStatusUsuario,
  excluirUsuario,
  listarUsuarios,
} from "../services/usuarioService";

const EMAIL_ADMIN_PROTEGIDO = "fastcooking@fastcooking.com.br";

function TelaAdministrador() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();
  const confirm = useConfirm();

  const abaAtiva =
    searchParams.get("secao") === "usuarios" ? "usuarios" : "restaurantes";

  function setAbaAtiva(novaSecao) {
    setSearchParams({ secao: novaSecao }, { replace: true });
  }

  const [restaurantes, setRestaurantes] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [carregandoRest, setCarregandoRest] = useState(false);
  const [carregandoUsers, setCarregandoUsers] = useState(false);

  const [buscaRestaurante, setBuscaRestaurante] = useState("");
  const [filtroRestauranteUsuario, setFiltroRestauranteUsuario] = useState("");
  const [filtroFuncaoUsuario, setFiltroFuncaoUsuario] = useState("");
  const [buscaUsuario, setBuscaUsuario] = useState("");

  const [modalNovoRest, setModalNovoRest] = useState(false);
  const [modalEditRest, setModalEditRest] = useState(null);
  const [modalNovoUser, setModalNovoUser] = useState(false);
  const [modalEditUser, setModalEditUser] = useState(null);
  const [modalResetSenha, setModalResetSenha] = useState(null);

  useEffect(() => {
    const funcao = localStorage.getItem("funcao");
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    if (funcao !== "Adm" && funcao !== "adm") {
      toast.error("Acesso restrito a Administradores do Sistema.");
      const funcaoNorm = (funcao || "").toLowerCase();
      if (funcaoNorm === "gerente") navigate("/gerente");
      else if (funcaoNorm === "garcom") navigate("/garcom");
      else if (funcaoNorm === "cozinheiro" || funcaoNorm === "cozinha")
        navigate("/cozinha");
      else navigate("/login");
    }
  }, [navigate, toast]);

  const carregarRestaurantes = useCallback(async () => {
    try {
      setCarregandoRest(true);
      const params = {};
      if (buscaRestaurante.trim()) params.busca = buscaRestaurante.trim();
      const dados = await listarRestaurantes(params);
      const restaurantesValidos = (dados || []).filter(
        (r) => !r.nome?.toUpperCase().includes("RESTAURANTE REMOVIDO")
      );
      setRestaurantes(restaurantesValidos);
    } catch {
      toast.error("Não foi possível carregar a lista de restaurantes.");
    } finally {
      setCarregandoRest(false);
    }
  }, [buscaRestaurante, toast]);

  const carregarUsuarios = useCallback(async () => {
    try {
      setCarregandoUsers(true);
      const params = {};
      if (filtroRestauranteUsuario)
        params.idRestaurante = filtroRestauranteUsuario;
      if (filtroFuncaoUsuario) params.funcao = filtroFuncaoUsuario;
      if (buscaUsuario.trim()) params.busca = buscaUsuario.trim();
      const dados = await listarUsuarios(params);

      const usuariosValidos = (dados || []).filter((u) => {
        const nomeUpper = u.nome?.toUpperCase() || "";
        const emailLower = u.email?.toLowerCase() || "";
        if (nomeUpper.includes("USUARIO REMOVIDO")) return false;
        if (
          emailLower.includes("@anonimizado.local") ||
          emailLower.startsWith("removido_")
        )
          return false;
        return true;
      });

      setUsuarios(usuariosValidos);
    } catch {
      toast.error("Não foi possível carregar a lista de usuários.");
    } finally {
      setCarregandoUsers(false);
    }
  }, [filtroRestauranteUsuario, filtroFuncaoUsuario, buscaUsuario, toast]);

  useEffect(() => {
    let ativo = true;
    Promise.resolve().then(() => {
      if (ativo) carregarRestaurantes();
    });
    return () => {
      ativo = false;
    };
  }, [carregarRestaurantes]);

  useEffect(() => {
    let ativo = true;
    Promise.resolve().then(() => {
      if (ativo) carregarUsuarios();
    });
    return () => {
      ativo = false;
    };
  }, [carregarUsuarios]);

  async function handleToggleStatusRestaurante(r) {
    try {
      await alterarStatusRestaurante(r.idRestaurante, !r.status);
      toast.success(`Status de "${r.nome}" atualizado!`);
      carregarRestaurantes();
    } catch (err) {
      toast.error(err.message || "Erro ao alternar status do restaurante.");
    }
  }

  async function handleExcluirRestaurante(r) {
    const ok = await confirm({
      title: "Remover Restaurante",
      message: `Deseja realmente remover o restaurante "${r.nome}"? Esta ação desativará e removerá o restaurante do sistema.`,
      confirmText: "Remover Restaurante",
      tone: "danger",
    });
    if (!ok) return;

    try {
      await excluirRestaurante(r.idRestaurante);
      toast.success(`Restaurante "${r.nome}" removido com sucesso!`);
      carregarRestaurantes();
      carregarUsuarios();
    } catch (err) {
      toast.error(err.message || "Erro ao remover restaurante.");
    }
  }

  async function handleToggleStatusUsuario(u) {
    if (u.email === EMAIL_ADMIN_PROTEGIDO) {
      toast.warning(
        `O usuário ${EMAIL_ADMIN_PROTEGIDO} é o administrador principal e não pode ser desativado.`
      );
      return;
    }

    try {
      await alterarStatusUsuario(u.idUsuario, !u.status);
      toast.success(`Status de "${u.nome}" atualizado!`);
      carregarUsuarios();
    } catch (err) {
      toast.error(err.message || "Erro ao alternar status do usuário.");
    }
  }

  async function handleExcluirUsuario(u) {
    if (u.email === EMAIL_ADMIN_PROTEGIDO) {
      toast.warning(
        `O usuário ${EMAIL_ADMIN_PROTEGIDO} é o administrador principal e não pode ser removido.`
      );
      return;
    }

    const ok = await confirm({
      title: "Remover Usuário",
      message: `Deseja realmente remover o usuário "${u.nome}" (${u.email})?`,
      confirmText: "Remover Usuário",
      tone: "danger",
    });
    if (!ok) return;

    try {
      await excluirUsuario(u.idUsuario);
      toast.success(`Usuário "${u.nome}" removido com sucesso!`);
      carregarUsuarios();
    } catch (err) {
      toast.error(err.message || "Erro ao remover usuário.");
    }
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    localStorage.removeItem("funcao");
    navigate("/login");
  }

  const mapRestaurantes = useMemo(
    () =>
      restaurantes.reduce((acc, curr) => {
        acc[curr.idRestaurante] = curr.nome;
        return acc;
      }, {}),
    [restaurantes]
  );

  const secoes = useMemo(
    () => [
      {
        id: "restaurantes",
        label: "Restaurantes",
        icon: MdStore,
        badge: restaurantes.length,
      },
      {
        id: "usuarios",
        label: "Usuários",
        icon: MdPeople,
        badge: usuarios.length,
      },
    ],
    [restaurantes.length, usuarios.length]
  );

  const colunasUsuarios = [
    {
      key: "nome",
      header: "Nome / E-mail",
      render: (u) => {
        const isRootAdmin = u.email === EMAIL_ADMIN_PROTEGIDO;
        return (
          <div>
            <div className="font-semibold text-gray-900 flex items-center gap-1.5">
              <span>{u.nome}</span>
              {isRootAdmin && <Badge tone="brand">PROTEGIDO</Badge>}
            </div>
            <div className="text-xs text-gray-500">{u.email}</div>
          </div>
        );
      },
    },
    {
      key: "cpf",
      header: "CPF",
      cellClassName: "text-xs font-mono",
    },
    {
      key: "restaurante",
      header: "Restaurante",
      render: (u) => (
        <span className="text-xs font-medium text-gray-800">
          {mapRestaurantes[u.idRestaurante] ||
            `Restaurante #${String(u.idRestaurante).slice(0, 8)}`}
        </span>
      ),
    },
    {
      key: "funcao",
      header: "Função",
      render: (u) => <Badge tone="gold">{formatarFuncao(u.funcao)}</Badge>,
    },
    {
      key: "status",
      header: "Status",
      render: (u) => (
        <Badge tone={u.status ? "success" : "danger"}>
          {u.status ? "Ativo" : "Inativo"}
        </Badge>
      ),
    },
    {
      key: "acoes",
      header: "Ações",
      align: "right",
      render: (u) => {
        const isRootAdmin = u.email === EMAIL_ADMIN_PROTEGIDO;
        return (
          <div className="flex items-center justify-end gap-1">
            <button
              type="button"
              onClick={() => setModalEditUser(u)}
              className="p-1.5 rounded-xl text-gray-600 hover:text-brand hover:bg-brand-soft transition-colors cursor-pointer"
              title="Editar Dados do Usuário"
            >
              <MdEdit size={18} />
            </button>

            <button
              type="button"
              onClick={() => setModalResetSenha(u)}
              className="p-1.5 rounded-xl text-gray-600 hover:text-gold hover:bg-amber-50 transition-colors cursor-pointer"
              title="Redefinir Senha"
            >
              <MdLockReset size={20} />
            </button>

            <button
              type="button"
              onClick={() => handleToggleStatusUsuario(u)}
              disabled={isRootAdmin}
              className={`p-1.5 rounded-xl transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                u.status
                  ? "text-emerald-600 hover:text-red-600 hover:bg-red-50"
                  : "text-red-600 hover:text-emerald-600 hover:bg-emerald-50"
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

            <button
              type="button"
              onClick={() => handleExcluirUsuario(u)}
              disabled={isRootAdmin}
              className="p-1.5 rounded-xl text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              title={
                isRootAdmin
                  ? "Administrador principal não pode ser removido"
                  : "Remover Usuário"
              }
            >
              <MdDelete size={18} />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <AppShell
      modulo="Painel Administrativo"
      secoes={secoes}
      secaoAtiva={abaAtiva}
      onSecao={setAbaAtiva}
      onLogout={handleLogout}
    >
      {abaAtiva === "restaurantes" && (
        <div className="space-y-5">
          <PageHeader
            title="Restaurantes Cadastrados"
            icon={MdStore}
            actions={
              <Button icon={MdAdd} onClick={() => setModalNovoRest(true)}>
                Novo Restaurante
              </Button>
            }
          />

          <div className="relative max-w-md">
            <MdSearch
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              size={19}
            />
            <Input
              type="text"
              placeholder="Buscar restaurante por nome ou CNPJ..."
              value={buscaRestaurante}
              onChange={(e) => setBuscaRestaurante(e.target.value)}
              className="pl-10"
            />
          </div>

          {carregandoRest ? (
            <Card className="py-14 flex justify-center">
              <Spinner size="lg" label="Carregando restaurantes..." />
            </Card>
          ) : restaurantes.length === 0 ? (
            <Card>
              <EmptyState
                icon={MdStore}
                title="Nenhum restaurante encontrado"
                description="Cadastre uma nova unidade ou limpe o filtro de busca."
              />
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {restaurantes.map((r) => (
                <Card
                  key={r.idRestaurante}
                  hover
                  className={`flex flex-col justify-between ${
                    r.status ? "" : "border-red-200 bg-red-50/30"
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-3">
                      <h3 className="font-bold text-base sm:text-lg text-gray-900 leading-tight">
                        {r.nome}
                      </h3>
                      <Badge tone={r.status ? "success" : "danger"}>
                        {r.status ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>

                    <div className="space-y-1 text-xs text-gray-600">
                      <p>
                        <strong>CNPJ:</strong> {r.cnpj}
                      </p>
                      <p>
                        <strong>Telefone:</strong> {r.telefone}
                      </p>
                      <p>
                        <strong>E-mail:</strong> {r.email}
                      </p>
                      <p>
                        <strong>CEP:</strong> {r.cep}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => {
                        setFiltroRestauranteUsuario(String(r.idRestaurante));
                        setAbaAtiva("usuarios");
                      }}
                      className="text-xs text-brand font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <MdPeople size={15} /> Ver Equipe
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setModalEditRest(r)}
                        className="p-1.5 rounded-xl text-gray-600 hover:text-brand hover:bg-brand-soft transition-colors cursor-pointer"
                        title="Editar Restaurante"
                      >
                        <MdEdit size={18} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleStatusRestaurante(r)}
                        className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                          r.status
                            ? "text-emerald-600 hover:text-red-600 hover:bg-red-50"
                            : "text-red-600 hover:text-emerald-600 hover:bg-emerald-50"
                        }`}
                        title={
                          r.status
                            ? "Desativar Restaurante"
                            : "Ativar Restaurante"
                        }
                      >
                        {r.status ? (
                          <MdToggleOn size={22} />
                        ) : (
                          <MdToggleOff size={22} />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleExcluirRestaurante(r)}
                        className="p-1.5 rounded-xl text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Remover Restaurante"
                      >
                        <MdDelete size={18} />
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {abaAtiva === "usuarios" && (
        <div className="space-y-5">
          <PageHeader
            title="Usuários do Sistema"
            icon={MdPeople}
            actions={
              <Button icon={MdAdd} onClick={() => setModalNovoUser(true)}>
                Novo Usuário
              </Button>
            }
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <MdSearch
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                size={19}
              />
              <Input
                type="text"
                placeholder="Buscar por nome ou e-mail..."
                value={buscaUsuario}
                onChange={(e) => setBuscaUsuario(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select
              value={filtroRestauranteUsuario}
              onChange={(e) => setFiltroRestauranteUsuario(e.target.value)}
            >
              <option value="">Todos os Restaurantes</option>
              {restaurantes.map((r) => (
                <option key={r.idRestaurante} value={r.idRestaurante}>
                  {r.nome}
                </option>
              ))}
            </Select>

            <Select
              value={filtroFuncaoUsuario}
              onChange={(e) => setFiltroFuncaoUsuario(e.target.value)}
            >
              <option value="">Todas as Funções</option>
              <option value="Adm">Adm</option>
              <option value="Gerente">Gerente</option>
              <option value="Garcom">Garçom</option>
              <option value="Cozinheiro">Cozinheiro</option>
            </Select>
          </div>

          <DataTable
            columns={colunasUsuarios}
            rows={usuarios}
            rowKey={(u) => u.idUsuario}
            loading={carregandoUsers}
            loadingLabel="Carregando usuários..."
            emptyIcon={MdPeople}
            emptyTitle="Nenhum usuário encontrado"
            emptyDescription="Ajuste os filtros ou cadastre um novo membro."
          />
        </div>
      )}

      {modalNovoRest && (
        <ModalNovoRestaurante
          onClose={() => setModalNovoRest(false)}
          onSuccess={() => {
            setModalNovoRest(false);
            toast.success(
              "Restaurante e usuário inicial criados com sucesso!"
            );
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
            toast.success("Restaurante atualizado com sucesso!");
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
            toast.success("Usuário cadastrado com sucesso!");
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
            toast.success("Dados do usuário atualizados com sucesso!");
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
            toast.success("Senha do usuário redefinida com sucesso!");
          }}
        />
      )}
    </AppShell>
  );
}

export default TelaAdministrador;
