import { useState } from "react";
import {
  MdCheckCircle,
  MdLockReset,
  MdRadioButtonUnchecked,
  MdVisibility,
  MdVisibilityOff,
} from "react-icons/md";
import { resetarSenhaUsuario } from "../../services/usuarioService";
import {
  checarCriteriosSenha,
  validarSenhaForte,
} from "../../utils/validacaoSenha";
import { Button, Field, Input, Modal } from "../ui";

function ModalResetarSenha({ usuario, onClose, onSuccess }) {
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  const criterios = checarCriteriosSenha(novaSenha);

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");

    if (novaSenha !== confirmarSenha) {
      setErro("As senhas não coincidem.");
      return;
    }

    const erroSenha = validarSenhaForte(novaSenha);
    if (erroSenha) {
      setErro(erroSenha);
      return;
    }

    setCarregando(true);

    try {
      await resetarSenhaUsuario(usuario.idUsuario, novaSenha);
      onSuccess();
    } catch (err) {
      setErro(err.message || "Não foi possível redefinir a senha.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Redefinir Senha"
      subtitle={`${usuario.nome} (${usuario.email})`}
      icon={MdLockReset}
      size="md"
    >
      {erro && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-xl mb-4 text-xs sm:text-sm font-medium">
          {erro}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Nova Senha" required>
          <div className="relative">
            <Input
              type={mostrarSenha ? "text" : "password"}
              required
              minLength={8}
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              placeholder="Nova senha forte"
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

          <div className="mt-2.5 p-3 bg-surface rounded-xl border border-gray-200/80 text-xs space-y-1">
            <span className="font-semibold text-gray-600 block mb-1">
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
                <MdCheckCircle size={15} />
              ) : (
                <MdRadioButtonUnchecked size={15} />
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
                <MdCheckCircle size={15} />
              ) : (
                <MdRadioButtonUnchecked size={15} />
              )}
              <span>Pelo menos uma letra (a-z, A-Z)</span>
            </div>
            <div
              className={`flex items-center gap-1.5 ${
                criterios.temNumero
                  ? "text-emerald-700 font-medium"
                  : "text-gray-400"
              }`}
            >
              {criterios.temNumero ? (
                <MdCheckCircle size={15} />
              ) : (
                <MdRadioButtonUnchecked size={15} />
              )}
              <span>Pelo menos um número (0-9)</span>
            </div>
          </div>
        </Field>

        <Field label="Confirmar Nova Senha" required>
          <Input
            type={mostrarSenha ? "text" : "password"}
            required
            minLength={8}
            value={confirmarSenha}
            onChange={(e) => setConfirmarSenha(e.target.value)}
            placeholder="Repita a nova senha"
          />
        </Field>

        <div className="flex justify-end gap-2.5 pt-4 border-t border-gray-100">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            loading={carregando}
            disabled={!criterios.valida}
          >
            Redefinir Senha
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default ModalResetarSenha;
