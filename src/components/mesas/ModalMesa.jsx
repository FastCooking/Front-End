import { useState } from "react";
import { MdTableBar } from "react-icons/md";
import { criarMesa, atualizarMesa } from "../../services/mesaService";

function ModalMesa({ mesa, idRestaurante, onClose, onSuccess }) {
  const [numero, setNumero] = useState(mesa?.numero ? String(mesa.numero) : "");
  const [status, setStatus] = useState(mesa?.status || "Disponivel");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");

    const numParsed = parseInt(numero, 10);
    if (isNaN(numParsed) || numParsed <= 0) {
      setErro("Por favor, insira um número de mesa válido maior que zero.");
      return;
    }

    setCarregando(true);

    try {
      if (mesa && (mesa.idMesa || mesa.id)) {
        const id = mesa.idMesa || mesa.id;
        await atualizarMesa(id, { numero: numParsed, status });
      } else {
        await criarMesa({
          numero: numParsed,
          status,
          idRestaurante,
        });
      }

      onSuccess();
    } catch (err) {
      console.error("Erro ao salvar mesa:", err);
      setErro(err.message || "Erro ao salvar dados da mesa.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 md:p-8 my-8">
        <div className="flex justify-between items-center mb-4 border-b pb-3 border-[#B78A10]/30">
          <h2 className="text-xl font-bold text-[#9C1C0E] flex items-center gap-2">
            <MdTableBar size={24} />
            {mesa ? `Editar Mesa ${mesa.numero}` : "Cadastrar Nova Mesa"}
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
              Número da Mesa <span className="text-[#9C1C0E]">*</span>
            </label>
            <input
              type="number"
              required
              min="1"
              step="1"
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              placeholder="Ex: 1, 2, 10..."
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:border-[#9C1C0E] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Status Inicial da Mesa
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:border-[#9C1C0E] focus:outline-none bg-white"
            >
              <option value="Disponivel">Disponível</option>
              <option value="Ocupada">Ocupada</option>
              <option value="Indisponivel">Indisponível (Manutenção/Reservada)</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
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
              {carregando ? "Salvando..." : mesa ? "Salvar Alterações" : "Criar Mesa"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ModalMesa;
