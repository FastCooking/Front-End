import { useState } from "react";
import {
  MdCheckCircle,
  MdPerson,
  MdRadioButtonUnchecked,
  MdVisibility,
  MdVisibilityOff,
} from "react-icons/md";
import { criarUsuario } from "../../services/usuarioService";
import { formatarCPF } from "../../utils/formatters";
import {
  checarCriteriosSenha,
  validarSenhaForte,
} from "../../utils/validacaoSenha";
import { Button, Field, Input, Modal, Select } from "../ui";

function ModalNovoUsuario({
  restaurantes,
  restaurantePreSelecionado,
  cargosPermitidos = ["Gerente", "Adm", "Garcom", "Cozinheiro"],
  travarRestaurante = false,
  onClose,
  onSuccess,
}) {
  const restaurantesDisponiveis = (restaurantes || []).filter((r) => {
    if (r.status === false) return false;
    if (r.nome && r.nome.toUpperCase().includes("RESTAURANTE REMOVIDO"))
      return false;
    return true;
  });

  const [idRestaurante, setIdRestaurante] = useState(() => {
    if (restaurantePreSelecionado) return String(restaurantePreSelecionado);
    return restaurantesDisponiveis.length > 0
      ? String(restaurantesDisponiveis[0].idRestaurante)
      : "";
  });
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [funcao, setFuncao] = useState(cargosPermitidos[0] || "Garcom");
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  const [prevPreSelecionado, setPrevPreSelecionado] = useState(
    restaurantePreSelecionado
  );
  if (restaurantePreSelecionado !== prevPreSelecionado) {
    setPrevPreSelecionado(restaurantePreSelecionado);
    if (restaurantePreSelecionado) {
      setIdRestaurante(String(restaurantePreSelecionado));
    }
  }

  const criterios = checarCriteriosSenha(senha);

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");

    if (
      !idRestaurante ||
      !nome.trim() ||
      !cpf.trim() ||
      !email.trim() ||
      !senha.trim()
    ) {
      setErro("Todos os campos marcados com * são obrigatórios.");
      return;
    }

    if (cpf.replace(/\D/g, "").length !== 11) {
      setErro("O CPF deve conter exatamente 11 dígitos.");
      return;
    }

    const erroSenha = validarSenhaForte(senha);
    if (erroSenha) {
      setErro(erroSenha);
      return;
    }

    setCarregando(true);

    try {
      await criarUsuario({
        idRestaurante: String(idRestaurante),
        nome: nome.trim(),
        cpf,
        email: email.trim(),
        senha,
        funcao,
        status: true,
      });

      onSuccess();
    } catch (err) {
      setErro(err.message || "Não foi possível cadastrar o usuário.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <Modal open onClose={onClose} title="Novo Usuário" icon={MdPerson} size="lg">
      {erro && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-xl mb-4 text-xs sm:text-sm font-medium">
          {erro}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Restaurante Vinculado" required>
          {restaurantesDisponiveis.length === 0 && !idRestaurante ? (
            <div className="text-xs text-red-600 p-2.5 border border-red-200 rounded-xl bg-red-50">
              Nenhum restaurante ativo disponível. Cadastre ou ative um
              restaurante primeiro.
            </div>
          ) : (
            <Select
              required
              disabled={travarRestaurante}
              value={idRestaurante}
              onChange={(e) => setIdRestaurante(e.target.value)}
            >
              {restaurantesDisponiveis.map((r) => (
                <option key={r.idRestaurante} value={r.idRestaurante}>
                  {r.nome}
                </option>
              ))}
              {!restaurantesDisponiveis.some(
                (r) => String(r.idRestaurante) === String(idRestaurante)
              ) &&
                idRestaurante && (
                  <option value={idRestaurante}>
                    Restaurante #{idRestaurante}
                  </option>
                )}
            </Select>
          )}
        </Field>

        <Field label="Nome Completo" required>
          <Input
            type="text"
            required
            maxLength={255}
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex: João da Silva"
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="CPF" required>
            <Input
              type="text"
              required
              maxLength={14}
              value={cpf}
              onChange={(e) => setCpf(formatarCPF(e.target.value))}
              placeholder="000.000.000-00"
            />
          </Field>

          <Field label="Função / Cargo" required>
            <Select value={funcao} onChange={(e) => setFuncao(e.target.value)}>
              {cargosPermitidos.includes("Garcom") && (
                <option value="Garcom">Garçom</option>
              )}
              {cargosPermitidos.includes("Cozinheiro") && (
                <option value="Cozinheiro">Cozinheiro</option>
              )}
              {cargosPermitidos.includes("Gerente") && (
                <option value="Gerente">Gerente</option>
              )}
              {cargosPermitidos.includes("Adm") && (
                <option value="Adm">Adm</option>
              )}
            </Select>
          </Field>
        </div>

        <Field label="E-mail (Login)" required>
          <Input
            type="email"
            required
            maxLength={255}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="usuario@restaurante.com"
          />
        </Field>

        <Field label="Senha de Acesso" required>
          <div className="relative">
            <Input
              type={mostrarSenha ? "text" : "password"}
              required
              minLength={8}
              maxLength={128}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Senha inicial forte"
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setMostrarSenha(!mostrarSenha)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 cursor-pointer"
              aria-label="Alternar visibilidade da senha"
            >
              {mostrarSenha ? (
                <MdVisibilityOff size={18} />
              ) : (
                <MdVisibility size={18} />
              )}
            </button>
          </div>

          <div className="mt-2 p-2.5 bg-surface rounded-xl border border-gray-200/80 text-xs space-y-1">
            <span className="font-semibold text-gray-600 block mb-0.5">
              Critérios de segurança:
            </span>
            <div
              className={`flex items-center gap-1.5 ${
                criterios.temMinimo8
                  ? "text-emerald-700 font-medium"
                  : "text-gray-400"
              }`}
            >
              {criterios.temMinimo8 ? (
                <MdCheckCircle size={14} />
              ) : (
                <MdRadioButtonUnchecked size={14} />
              )}
              <span>Mínimo de 8 caracteres</span>
            </div>
            <div
              className={`flex items-center gap-1.5 ${
                criterios.temLetra
                  ? "text-emerald-700 font-medium"
                  : "text-gray-400"
              }`}
            >
              {criterios.temLetra ? (
                <MdCheckCircle size={14} />
              ) : (
                <MdRadioButtonUnchecked size={14} />
              )}
              <span>Pelo menos uma letra</span>
            </div>
            <div
              className={`flex items-center gap-1.5 ${
                criterios.temNumero
                  ? "text-emerald-700 font-medium"
                  : "text-gray-400"
              }`}
            >
              {criterios.temNumero ? (
                <MdCheckCircle size={14} />
              ) : (
                <MdRadioButtonUnchecked size={14} />
              )}
              <span>Pelo menos um número</span>
            </div>
          </div>
        </Field>

        <div className="flex justify-end gap-2.5 pt-4 border-t border-gray-100">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={carregando}>
            Cadastrar Usuário
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default ModalNovoUsuario;
