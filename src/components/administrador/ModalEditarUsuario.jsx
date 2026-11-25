import { useState } from "react";
import { MdPerson } from "react-icons/md";
import { atualizarUsuario } from "../../services/usuarioService";
import { formatarCPF } from "../../utils/formatters";

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
    cargosPermitidos.includes(usuario.funcao) ? usuario.funcao : cargosPermitidos[0] || "Garcom"
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
      console.error("Erro ao atualizar usuário:", err);
      setErro(err.message || "Não foi possível atualizar os dados do usuário.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 md:p-8">
        <div className="flex justify-between items-center mb-4 border-b pb-3 border-[#B78A10]/30">
          <h2 className="text-xl font-bold text-[#9C1C0E] flex items-center gap-2">
            <MdPerson size={24} /> Editar Usuário
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
              Nome Completo <span className="text-[#9C1C0E]">*</span>
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
              CPF <span className="text-[#9C1C0E]">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={14}
              value={cpf}
              onChange={(e) => setCpf(formatarCPF(e.target.value))}
              placeholder="000.000.000-00"
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
              Função / Cargo <span className="text-[#9C1C0E]">*</span>
            </label>
            <select
              value={funcao}
              onChange={(e) => setFuncao(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:border-[#9C1C0E] focus:outline-none"
            >
              {cargosPermitidos.includes("Garcom") && <option value="Garcom">Garçom</option>}
              {cargosPermitidos.includes("Cozinheiro") && <option value="Cozinheiro">Cozinheiro</option>}
              {cargosPermitidos.includes("Gerente") && <option value="Gerente">Gerente</option>}
              {cargosPermitidos.includes("Adm") && <option value="Adm">Adm</option>}
            </select>
          </div>

          <p className="text-xs text-gray-500 italic">
            * Para redefinir a senha deste usuário, utilize o botão "Resetar Senha" na lista.
          </p>

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

export default ModalEditarUsuario;
