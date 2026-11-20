import { useState } from "react";
import {
  MdAdd,
  MdDelete,
  MdEdit,
  MdLockReset,
  MdPeople,
  MdSearch,
  MdToggleOff,
  MdToggleOn,
} from "react-icons/md";
import ModalEditarUsuario from "../../components/administrador/ModalEditarUsuario";
import ModalNovoUsuario from "../../components/administrador/ModalNovoUsuario";
import ModalResetarSenha from "../../components/administrador/ModalResetarSenha";
import {
  Badge,
  Button,
  DataTable,
  Input,
  PageHeader,
  Select,
  useConfirm,
  useToast,
} from "../../components/ui";
import {
  alterarStatusUsuario,
  excluirUsuario,
} from "../../services/usuarioService";

const CARGOS_PERMITIDOS_GERENTE = ["Garcom", "Cozinheiro"];

export default function SecaoEquipe({
  usuarios,
  carregando,
  restaurantes,
  mapRestaurantes,
  idRestauranteGerente,
  buscaUsuario,
  setBuscaUsuario,
  filtroFuncaoUsuario,
  setFiltroFuncaoUsuario,
  onRecarregar,
}) {
  const toast = useToast();
  const confirm = useConfirm();

  const [modalNovoUser, setModalNovoUser] = useState(false);
  const [modalEditUser, setModalEditUser] = useState(null);
  const [modalResetSenha, setModalResetSenha] = useState(null);
  const [itemAtualizandoId, setItemAtualizandoId] = useState(null);

  async function handleToggleStatusUsuario(u) {
    const funcaoUser = (u.funcao || "").toLowerCase();
    if (funcaoUser === "gerente" || funcaoUser === "adm") {
      toast.warning(
        "Você não tem permissão para alterar o status de gerentes ou administradores."
      );
      return;
    }

    setItemAtualizandoId(u.idUsuario);
    try {
      await alterarStatusUsuario(u.idUsuario, !u.status);
      toast.success(`Status de "${u.nome}" atualizado!`);
      onRecarregar();
    } catch (err) {
      toast.error(err.message || "Erro ao alternar status do usuário.");
    } finally {
      setItemAtualizandoId(null);
    }
  }

  async function handleExcluirUsuario(u) {
    const funcaoUser = (u.funcao || "").toLowerCase();
    if (funcaoUser === "gerente" || funcaoUser === "adm") {
      toast.warning(
        "Você não tem permissão para remover gerentes ou administradores."
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

    setItemAtualizandoId(u.idUsuario);
    try {
      await excluirUsuario(u.idUsuario);
      toast.success(`Usuário "${u.nome}" removido com sucesso!`);
      onRecarregar();
    } catch (err) {
      toast.error(err.message || "Erro ao remover usuário.");
    } finally {
      setItemAtualizandoId(null);
    }
  }

  const colunas = [
    {
      key: "nome",
      header: "Nome / E-mail",
      render: (u) => (
        <div>
          <div className="font-semibold text-gray-900">{u.nome}</div>
          <div className="text-xs text-gray-500">{u.email}</div>
        </div>
      ),
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
      render: (u) => <Badge tone="gold">{u.funcao}</Badge>,
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
        const isHighRole =
          u.funcao === "Gerente" ||
          u.funcao === "Adm" ||
          u.funcao === "gerente" ||
          u.funcao === "adm";

        return (
          <div className="flex items-center justify-end gap-1">
            <button
              type="button"
              onClick={() => setModalEditUser(u)}
              disabled={isHighRole}
              className="p-1.5 rounded-xl text-gray-600 hover:text-brand hover:bg-brand-soft transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              title={
                isHighRole
                  ? "Não é possível editar Gerentes ou Adm"
                  : "Editar Usuário"
              }
            >
              <MdEdit size={18} />
            </button>

            <button
              type="button"
              onClick={() => setModalResetSenha(u)}
              disabled={isHighRole}
              className="p-1.5 rounded-xl text-gray-600 hover:text-gold hover:bg-amber-50 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              title={
                isHighRole
                  ? "Não é possível alterar senha de Gerentes"
                  : "Redefinir Senha"
              }
            >
              <MdLockReset size={20} />
            </button>

            <button
              type="button"
              onClick={() => handleToggleStatusUsuario(u)}
              disabled={isHighRole || itemAtualizandoId === u.idUsuario}
              className={`p-1.5 rounded-xl transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                u.status
                  ? "text-emerald-600 hover:text-red-600 hover:bg-red-50"
                  : "text-red-600 hover:text-emerald-600 hover:bg-emerald-50"
              }`}
              title={
                isHighRole
                  ? "Apenas o Administrador pode desativar Gerentes"
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
              disabled={isHighRole || itemAtualizandoId === u.idUsuario}
              className="p-1.5 rounded-xl text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              title={
                isHighRole
                  ? "Apenas o Administrador pode remover Gerentes"
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
    <div className="space-y-5">
      <PageHeader
        title="Equipe do Restaurante"
        icon={MdPeople}
        actions={
          <Button icon={MdAdd} onClick={() => setModalNovoUser(true)}>
            Novo Usuário
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative sm:col-span-2">
          <MdSearch
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            size={19}
          />
          <Input
            type="text"
            placeholder="Buscar funcionário por nome ou e-mail..."
            value={buscaUsuario}
            onChange={(e) => setBuscaUsuario(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select
          value={filtroFuncaoUsuario}
          onChange={(e) => setFiltroFuncaoUsuario(e.target.value)}
        >
          <option value="">Todas as Funções</option>
          <option value="Garcom">Garçom</option>
          <option value="Cozinheiro">Cozinheiro</option>
        </Select>
      </div>

      <DataTable
        columns={colunas}
        rows={usuarios}
        rowKey={(u) => u.idUsuario}
        loading={carregando}
        loadingLabel="Carregando equipe..."
        emptyIcon={MdPeople}
        emptyTitle="Nenhum usuário encontrado"
        emptyDescription="Cadastre garçons e cozinheiros da sua unidade."
      />

      {modalNovoUser && (
        <ModalNovoUsuario
          restaurantes={restaurantes}
          restaurantePreSelecionado={idRestauranteGerente}
          travarRestaurante
          cargosPermitidos={CARGOS_PERMITIDOS_GERENTE}
          onClose={() => setModalNovoUser(false)}
          onSuccess={() => {
            setModalNovoUser(false);
            toast.success(
              "Novo usuário cadastrado com sucesso no seu restaurante!"
            );
            onRecarregar();
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
            toast.success("Dados do usuário atualizados com sucesso!");
            onRecarregar();
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
    </div>
  );
}
