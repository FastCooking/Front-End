import { useState } from "react";
import { MdPerson, MdVisibility, MdVisibilityOff } from "react-icons/md";
import { criarUsuario } from "../../services/usuarioService";
import { formatarCPF } from "../../utils/formatters";

function ModalNovoUsuario({
  restaurantes,
  restaurantePreSelecionado,
  cargosPermitidos = ["Gerente", "Adm", "Garcom", "Cozinheiro"],
  travarRestaurante = false,
  onClose,
  onSuccess,
}) {
  const [idRestaurante, setIdRestaurante] = useState(
    restaurantePreSelecionado ? String(restaurantePreSelecionado) : ""
  );
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [funcao, setFuncao] = useState(cargosPermitidos[0] || "Garcom");
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  // Filtra apenas restaurantes ativos e válidos (não removidos/anonimizados)
  const restaurantesDisponiveis = (restaurantes || []).filter((r) => {
    if (r.status === false) return false;
    if (r.nome && r.nome.toUpperCase().includes("RESTAURANTE REMOVIDO")) return false;
    return true;
  });

  // Atualiza a seleção inicial caso não esteja setada ou seja um restaurante removido
  useEffect(() => {
    if (restaurantePreSelecionado) {
      setIdRestaurante(String(restaurantePreSelecionado));
    } else if (!idRestaurante && restaurantesDisponiveis.length > 0) {
      setIdRestaurante(String(restaurantesDisponiveis[0].idRestaurante));
    }
  }, [restaurantePreSelecionado, restaurantesDisponiveis]);

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");

    if (!idRestaurante || !nome.trim() || !cpf.trim() || !email.trim() || !senha.trim()) {
      setErro("Todos os campos marcados com * são obrigatórios.");
      return;
    }

    if (cpf.replace(/\D/g, "").length !== 11) {
      setErro("O CPF deve conter exatamente 11 dígitos.");
      return;
    }

    if (senha.length < 6) {
      setErro("A senha deve ter no mínimo 6 caracteres.");
      return;
    }

    setCarregando(true);

    try {
      await criarUsuario({
        idRestaurante: Number(idRestaurante),
        nome: nome.trim(),
        cpf,
        email: email.trim(),
        senha,
        funcao,
        status: true,
      });

      onSuccess();
    } catch (err) {
      console.error("Erro ao cadastrar usuário:", err);
      setErro(err.message || "Não foi possível cadastrar o usuário.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 md:p-8">
        <div className="flex justify-between items-center mb-4 border-b pb-3 border-[#B78A10]/30">
          <h2 className="text-xl font-bold text-[#9C1C0E] flex items-center gap-2">
            <MdPerson size={24} /> Novo Usuário
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
              Restaurante Vinculado <span className="text-[#9C1C0E]">*</span>
            </label>
            {restaurantesDisponiveis.length === 0 && !idRestaurante ? (
              <div className="text-xs text-red-600 p-2 border border-red-200 rounded-lg bg-red-50">
                Nenhum restaurante ativo disponível. Cadastre ou ative um restaurante primeiro.
              </div>
            ) : (
              <select
                required
                disabled={travarRestaurante}
                value={idRestaurante}
                onChange={(e) => setIdRestaurante(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:border-[#9C1C0E] focus:outline-none disabled:bg-gray-100 disabled:text-gray-600 cursor-pointer disabled:cursor-not-allowed"
              >
                {restaurantesDisponiveis.map((r) => (
                  <option key={r.idRestaurante} value={r.idRestaurante}>
                    {r.nome} (ID: {r.idRestaurante})
                  </option>
                ))}
                {/* Fallback caso restaurantePreSelecionado não esteja na lista carregada ainda */}
                {!restaurantesDisponiveis.some((r) => String(r.idRestaurante) === String(idRestaurante)) && idRestaurante && (
                  <option value={idRestaurante}>
                    Restaurante ID #{idRestaurante}
                  </option>
                )}
              </select>
            )}
          </div>

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
              placeholder="Ex: João da Silva"
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@restaurante.com"
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

          <div>
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
                placeholder="Senha inicial"
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
              {carregando ? "Cadastrando..." : "Cadastrar Usuário"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ModalNovoUsuario;
