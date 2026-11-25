import { useState } from "react";
import { MdStore } from "react-icons/md";
import { atualizarRestaurante } from "../../services/restauranteService";
import {
  formatarCEP,
  formatarCNPJ,
  formatarTelefone,
} from "../../utils/formatters";
import { Button, Field, Input, Modal, Select } from "../ui";

function ModalEditarRestaurante({ restaurante, onClose, onSuccess }) {
  const [nome, setNome] = useState(restaurante.nome || "");
  const [cnpj, setCnpj] = useState(formatarCNPJ(restaurante.cnpj || ""));
  const [telefone, setTelefone] = useState(
    formatarTelefone(restaurante.telefone || "")
  );
  const [email, setEmail] = useState(restaurante.email || "");
  const [cep, setCep] = useState(formatarCEP(restaurante.cep || ""));
  const [status, setStatus] = useState(restaurante.status);

  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");

    if (
      !nome.trim() ||
      !cnpj.trim() ||
      !telefone.trim() ||
      !email.trim() ||
      !cep.trim()
    ) {
      setErro("Todos os campos com * são obrigatórios.");
      return;
    }

    if (cnpj.replace(/\D/g, "").length !== 14) {
      setErro("O CNPJ deve conter exatamente 14 dígitos.");
      return;
    }

    if (cep.replace(/\D/g, "").length !== 8) {
      setErro("O CEP deve conter 8 dígitos.");
      return;
    }

    setCarregando(true);

    try {
      await atualizarRestaurante(restaurante.idRestaurante, {
        nome: nome.trim(),
        cnpj,
        telefone,
        email: email.trim(),
        cep,
        status,
      });

      onSuccess();
    } catch (err) {
      setErro(err.message || "Não foi possível atualizar o restaurante.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Editar Restaurante"
      icon={MdStore}
      size="lg"
    >
      {erro && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-xl mb-4 text-xs sm:text-sm font-medium">
          {erro}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Nome do Restaurante" required>
          <Input
            type="text"
            required
            maxLength={255}
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="CNPJ" required>
            <Input
              type="text"
              required
              maxLength={18}
              value={cnpj}
              onChange={(e) => setCnpj(formatarCNPJ(e.target.value))}
              placeholder="00.000.000/0000-00"
            />
          </Field>

          <Field label="Telefone" required>
            <Input
              type="text"
              required
              maxLength={15}
              value={telefone}
              onChange={(e) => setTelefone(formatarTelefone(e.target.value))}
              placeholder="(11) 99999-9999"
            />
          </Field>
        </div>

        <Field label="E-mail" required>
          <Input
            type="email"
            required
            maxLength={255}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="CEP" required>
            <Input
              type="text"
              required
              maxLength={9}
              value={cep}
              onChange={(e) => setCep(formatarCEP(e.target.value))}
              placeholder="00000-000"
            />
          </Field>

          <Field label="Status" required>
            <Select
              value={status ? "true" : "false"}
              onChange={(e) => setStatus(e.target.value === "true")}
            >
              <option value="true">Ativo</option>
              <option value="false">Inativo</option>
            </Select>
          </Field>
        </div>

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

export default ModalEditarRestaurante;
