import { useState } from "react";
import { MdLockReset, MdVisibility, MdVisibilityOff } from "react-icons/md";
import { resetarSenhaUsuario } from "../../services/usuarioService";

function ModalResetarSenha({ usuario, onClose, onSuccess }) {
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");

    if (novaSenha !== confirmarSenha) {
      setErro("As senhas não coincidem.");
      return;
    }

    if (novaSenha.length < 6) {
      setErro("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setCarregando(true);

    try {
      await resetarSenhaUsuario(usuario.idUsuario, novaSenha);
      onSuccess();
    } catch (err) {
      console.error("Erro ao resetar senha:", err);
      setErro(err.message || "Não foi possível redefinir a senha.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 md:p-8">
        <div className="flex justify-between items-center mb-4 border-b pb-3 border-[#B78A10]/30">
          <h2 className="text-xl font-bold text-[#9C1C0E] flex items-center gap-2">
            <MdLockReset size={24} /> Resetar Senha
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-2xl font-bold cursor-pointer"
          >
            &times;
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Definindo nova senha para o usuário: <br />
          <strong className="text-gray-900">{usuario.nome}</strong> ({usuario.email})
        </p>

        {erro && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-lg mb-4 text-sm">
            {erro}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Nova Senha * (mínimo 6 caracteres)
            </label>
            <div className="relative">
              <input
                type={mostrarSenha ? "text" : "password"}
                required
                minLength={6}
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                placeholder="Nova senha"
                className="w-full border border-gray-300 rounded-lg p-2 pr-10 text-sm focus:border-[#9C1C0E] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setMostrarSenha(!mostrarSenha)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 cursor-pointer"
              >
                {mostrarSenha ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Confirmar Nova Senha *
            </label>
            <input
              type={mostrarSenha ? "text" : "password"}
              required
              minLength={6}
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              placeholder="Repita a nova senha"
              className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:border-[#9C1C0E] focus:outline-none"
            />
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
              {carregando ? "Alterando..." : "Redefinir Senha"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ModalResetarSenha;
