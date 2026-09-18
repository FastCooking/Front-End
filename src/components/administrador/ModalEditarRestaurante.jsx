import { useState } from "react";
import { MdStore } from "react-icons/md";
import { atualizarRestaurante } from "../../services/restauranteService";
import {
  formatarCNPJ,
  formatarTelefone,
  formatarCEP,
} from "../../utils/formatters";

function ModalEditarRestaurante({ restaurante, onClose, onSuccess }) {
  const [nome, setNome] = useState(restaurante.nome || "");
  const [cnpj, setCnpj] = useState(formatarCNPJ(restaurante.cnpj || ""));
  const [telefone, setTelefone] = useState(formatarTelefone(restaurante.telefone || ""));
  const [email, setEmail] = useState(restaurante.email || "");
  const [cep, setCep] = useState(formatarCEP(restaurante.cep || ""));
  const [status, setStatus] = useState(restaurante.status);

  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");

    if (!nome.trim() || !cnpj.trim() || !telefone.trim() || !email.trim() || !cep.trim()) {
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
      console.error("Erro ao atualizar restaurante:", err);
      setErro(err.message || "Não foi possível atualizar o restaurante.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 md:p-8">
        <div className="flex justify-between items-center mb-4 border-b pb-3 border-[#B78A10]/30">
          <h2 className="text-xl font-bold text-[#9C1C0E] flex items-center gap-2">
            <MdStore size={24} /> Editar Restaurante
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-2xl font-bold cursor-pointer"
          >
            &times;
          </button>
        </div>

        {erro && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-lg mb-4 text-sm">
            {erro}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Nome do Restaurante <span className="text-[#9C1C0E]">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={255}
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:border-[#9C1C0E] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              CNPJ <span className="text-[#9C1C0E]">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={18}
              value={cnpj}
              onChange={(e) => setCnpj(formatarCNPJ(e.target.value))}
              placeholder="00.000.000/0000-00"
              className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:border-[#9C1C0E] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Telefone <span className="text-[#9C1C0E]">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={15}
              value={telefone}
              onChange={(e) => setTelefone(formatarTelefone(e.target.value))}
              placeholder="(11) 99999-9999"
              className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:border-[#9C1C0E] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              E-mail <span className="text-[#9C1C0E]">*</span>
            </label>
            <input
              type="email"
              required
              maxLength={255}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:border-[#9C1C0E] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              CEP <span className="text-[#9C1C0E]">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={9}
              value={cep}
              onChange={(e) => setCep(formatarCEP(e.target.value))}
              placeholder="00000-000"
              className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:border-[#9C1C0E] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Status <span className="text-[#9C1C0E]">*</span>
            </label>
            <select
              value={status ? "true" : "false"}
              onChange={(e) => setStatus(e.target.value === "true")}
              className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:border-[#9C1C0E] focus:outline-none"
            >
              <option value="true">Ativo</option>
              <option value="false">Inativo</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={carregando}
              className="px-6 py-2 text-sm rounded-lg bg-[#9C1C0E] text-white hover:bg-[#7a160b] font-semibold cursor-pointer disabled:opacity-50"
            >
              {carregando ? "Salvando..." : "Salvar Alterações"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ModalEditarRestaurante;
