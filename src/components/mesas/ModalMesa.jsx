import { useState } from "react";
import { MdTableBar } from "react-icons/md";
import { atualizarMesa, criarMesa } from "../../services/mesaService";
import { Button, Field, Input, Modal, Select } from "../ui";

const STATUS_OPCOES = [
  { value: "Disponivel", label: "Disponível" },
  { value: "Ocupada", label: "Ocupada" },
  { value: "Reservada", label: "Reservada" },
  { value: "Manutencao", label: "Manutenção" },
];

export default function ModalMesa({
  mesa = null,
  idRestaurante,
  onClose,
  onSuccess,
}) {
  const [numero, setNumero] = useState(mesa ? mesa.numero : "");
  const [status, setStatus] = useState(mesa ? mesa.status : "Disponivel");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");

    const num = Number(numero);
    if (!numero || isNaN(num) || num <= 0) {
      setErro("Informe um número de mesa válido e maior que zero.");
      return;
    }

    setCarregando(true);
    try {
      if (mesa) {
        await atualizarMesa(mesa.idMesa, { numero: num, status });
      } else {
        await criarMesa({
          idRestaurante,
          numero: num,
          status,
        });
      }
      onSuccess();
    } catch (err) {
      setErro(err.message || "Erro ao salvar dados da mesa.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={mesa ? `Editar Mesa #${mesa.numero}` : "Nova Mesa"}
      icon={MdTableBar}
      size="md"
    >
      {erro && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-xl mb-4 text-xs sm:text-sm font-medium">
          {erro}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Número da Mesa" required>
          <Input
            type="number"
            min="1"
            step="1"
            required
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
            placeholder="Ex: 5"
          />
        </Field>

        <Field label="Status Inicial da Mesa">
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUS_OPCOES.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </Field>

        <div className="flex justify-end gap-2.5 pt-4 border-t border-gray-100">
          <Button variant="secondary" onClick={onClose} disabled={carregando}>
            Cancelar
          </Button>
          <Button type="submit" loading={carregando}>
            {mesa ? "Salvar Alterações" : "Cadastrar Mesa"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
