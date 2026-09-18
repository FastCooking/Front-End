import { useState } from "react";
import { MdStore, MdPerson, MdVisibility, MdVisibilityOff } from "react-icons/md";
import { criarRestaurante } from "../../services/restauranteService";
import { criarUsuario } from "../../services/usuarioService";
import {
  formatarCNPJ,
  formatarTelefone,
  formatarCEP,
  formatarCPF,
} from "../../utils/formatters";

function ModalNovoRestaurante({ onClose, onSuccess }) {
  // Dados do restaurante
  const [nomeRestaurante, setNomeRestaurante] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [telefone, setTelefone] = useState("");
  const [emailRestaurante, setEmailRestaurante] = useState("");
  const [cep, setCep] = useState("");

  // Dados do usuário vinculado
  const [nomeUsuario, setNomeUsuario] = useState("");
  const [cpf, setCpf] = useState("");
  const [emailUsuario, setEmailUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [funcao, setFuncao] = useState("Gerente");
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");

    // Validações básicas de preenchimento
    if (
      !nomeRestaurante.trim() ||
      !cnpj.trim() ||
      !telefone.trim() ||
      !emailRestaurante.trim() ||
      !cep.trim() ||
      !nomeUsuario.trim() ||
      !cpf.trim() ||
      !emailUsuario.trim() ||
      !senha.trim()
    ) {
      setErro("Todos os campos marcados com * são obrigatórios.");
      return;
    }

    if (cnpj.replace(/\D/g, "").length !== 14) {
      setErro("O CNPJ deve conter exatamente 14 dígitos.");
      return;
    }

    if (cpf.replace(/\D/g, "").length !== 11) {
      setErro("O CPF deve conter exatamente 11 dígitos.");
      return;
    }

    if (cep.replace(/\D/g, "").length !== 8) {
      setErro("O CEP deve conter 8 dígitos.");
      return;
    }

    if (senha.length < 6) {
      setErro("A senha deve ter no mínimo 6 caracteres.");
      return;
    }

    setCarregando(true);

    try {
      // 1. Cria o Restaurante
      const restCriado = await criarRestaurante({
        nome: nomeRestaurante.trim(),
        cnpj,
        telefone,
        email: emailRestaurante.trim(),
        cep,
        status: true,
      });

      // 2. Cria o Usuário associado ao restaurante
      await criarUsuario({
        idRestaurante: restCriado.idRestaurante,
        nome: nomeUsuario.trim(),
        cpf,
        email: emailUsuario.trim(),
        senha,
        funcao,
        status: true,
      });

      onSuccess();
    } catch (err) {
      console.error("Erro ao criar restaurante com usuário:", err);
      setErro(err.message || "Não foi possível cadastrar o restaurante e usuário.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 md:p-8">
        <div className="flex justify-between items-center mb-4 border-b pb-3 border-[#B78A10]/30">
          <h2 className="text-xl font-bold text-[#9C1C0E] flex items-center gap-2">
            <MdStore size={24} /> Novo Restaurante & Administrador
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

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Seção Restaurante */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#B78A10] mb-3 flex items-center gap-1">
              <MdStore /> Dados do Restaurante
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Nome do Restaurante <span className="text-[#9C1C0E]">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={255}
                  value={nomeRestaurante}
                  onChange={(e) => setNomeRestaurante(e.target.value)}
                  placeholder="Ex: FastCooking Matriz"
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
                  E-mail do Restaurante <span className="text-[#9C1C0E]">*</span>
                </label>
                <input
                  type="email"
                  required
                  maxLength={255}
                  value={emailRestaurante}
                  onChange={(e) => setEmailRestaurante(e.target.value)}
                  placeholder="contato@restaurante.com"
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:border-[#9C1C0E] focus:outline-none"
                />
              </div>

              <div className="md:col-span-2">
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
            </div>
          </div>

          {/* Seção Usuário Inicial */}
          <div className="border-t pt-4 border-gray-200">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#B78A10] mb-3 flex items-center gap-1">
              <MdPerson /> Usuário Inicial Vinculado (Obrigatório)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Nome do Usuário <span className="text-[#9C1C0E]">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={255}
                  value={nomeUsuario}
                  onChange={(e) => setNomeUsuario(e.target.value)}
                  placeholder="Ex: Carlos Silva"
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
                  E-mail (Login) <span className="text-[#9C1C0E]">*</span>
                </label>
                <input
                  type="email"
                  required
                  maxLength={255}
                  value={emailUsuario}
                  onChange={(e) => setEmailUsuario(e.target.value)}
                  placeholder="carlos@restaurante.com"
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
                  <option value="Gerente">Gerente</option>
                  <option value="Adm">Adm</option>
                  <option value="Garcom">Garçom</option>
                  <option value="Cozinheiro">Cozinheiro</option>
                </select>
              </div>

              <div className="md:col-span-2 relative">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Senha de Acesso <span className="text-[#9C1C0E]">*</span> (mínimo 6 caracteres, máx 128)
                </label>
                <div className="relative">
                  <input
                    type={mostrarSenha ? "text" : "password"}
                    required
                    minLength={6}
                    maxLength={128}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="Digite uma senha forte"
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
            </div>
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
              {carregando ? "Cadastrando..." : "Cadastrar Restaurante e Usuário"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ModalNovoRestaurante;
