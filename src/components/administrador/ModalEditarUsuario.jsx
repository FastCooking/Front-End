import { useState } from "react";
import { MdPerson } from "react-icons/md";
import { atualizarUsuario } from "../../services/usuarioService";
import { formatarCPF } from "../../utils/formatters";
import { Button, Field, Input, Modal, Select } from "../ui";

function ModalEditarUsuario({
  usuario,
  cargosPermitidos = ["Gerente", "Adm", "Garcom", "Cozinheiro"],
  onClose,
  onSuccess,
}) {
  const [nome, setNome] = useState(usuario.nome || "");
  const [cpf, setCpf] = useState(formatarCPF(usuario.cpf || ""));
  const [email, setEmail] = useState(usuario.email || "");
  const [funcao, setFuncao] = useState(
    cargosPermitidos.includes(usuario.funcao)
      ? usuario.funcao
      : cargosPermitidos[0] || "Garcom"
  );

  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");

    if (!nome.trim() || !cpf.trim() || !email.trim()) {
      setErro("Todos os campos com * são obrigatórios.");
      return;
    }

    if (cpf.replace(/\D/g, "").length !== 11) {
      setErro("O CPF deve conter exatamente 11 dígitos.");
      return;
    }

    setCarregando(true);

    try {
      await atualizarUsuario(usuario.idUsuario, {
        nome: nome.trim(),
        cpf,
        email: email.trim(),
        funcao,
      });

      onSuccess();
    } catch (err) {
      setErro(
        err.message || "Não foi possível atualizar os dados do usuário."
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <Modal open onClose={onClose} title="Editar Usuário" icon={MdPerson} size="lg">
      {erro && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-xl mb-4 text-xs sm:text-sm font-medium">
          {erro}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Nome Completo" required>
          <Input
            type="text"
            required
            maxLength={255}
            value={nome}
            onChange={(e) => setNome(e.target.value)}
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

        <Field
          label="E-mail"
          required
          hint="Para redefinir a senha deste usuário, utilize o botão Resetar Senha na lista."
        >
          <Input
            type="email"
            required
            maxLength={255}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>

        <div className="flex justify-end gap-2.5 pt-4 border-t border-gray-100">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={carregando}>
            Salvar Alterações
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default ModalEditarUsuario;
