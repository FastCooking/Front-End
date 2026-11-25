import { useState } from "react";
import { MdTableBar } from "react-icons/md";
import { criarMesa, atualizarMesa } from "../../services/mesaService";

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

  const STATUS_OPCOES = [
    { value: "Disponivel", label: "Disponível" },
    { value: "Ocupada", label: "Ocupada" },
    { value: "Reservada", label: "Reservada" },
    { value: "Manutencao", label: "Manutenção" },
  ];

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 md:p-8 animate-fade-in">
        <div className="flex justify-between items-center mb-4 border-b pb-3 border-[#B78A10]/30">
          <h2 className="text-xl font-bold text-[#9C1C0E] flex items-center gap-2">
            <MdTableBar size={24} /> {mesa ? `Editar Mesa #${mesa.numero}` : "Nova Mesa"}
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
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
              Número da Mesa *
            </label>
            <input
              type="number"
              min="1"
              step="1"
              required
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              placeholder="Ex: 5"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#9C1C0E] text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
              Status Inicial da Mesa
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#9C1C0E] text-sm bg-white"
            >
              {STATUS_OPCOES.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={carregando}
              className="px-4 py-2 rounded-xl text-gray-600 hover:bg-gray-100 font-medium text-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={carregando}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#9C1C0E] text-white hover:bg-[#7a160b] font-medium text-sm transition-colors cursor-pointer shadow-md disabled:opacity-50"
            >
              {carregando ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Salvando...
                </>
              ) : (
                mesa ? "Salvar Alterações" : "Cadastrar Mesa"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
