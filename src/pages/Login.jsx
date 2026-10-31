import { useState, useEffect } from 'react';
import { login } from '../services/authService';
import { useNavigate } from 'react-router-dom';
import { RotaPerfil } from '../constants/RotasPerfil';
import logo from '../assets/fast cooking logo.png';
import { MdEmail, MdLock, MdVisibility, MdVisibilityOff, MdErrorOutline } from 'react-icons/md';

function TelaLogin() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);

  const [erro, setErro] = useState('');
  const [tentativas, setTentativas] = useState(0);
  const [bloqueado, setBloqueado] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (erro) {
      const timer = setTimeout(() => setErro(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [erro]);

  async function handleEnter(event) {
    event.preventDefault();
    if (bloqueado || carregando) return;

    setCarregando(true);
    setErro('');

    try {
      const dados = await login(email.trim().toLowerCase(), senha.trim());

      localStorage.setItem('token', dados.access_token);
      if (dados.refresh_token) {
        localStorage.setItem('refreshToken', dados.refresh_token);
      }
      localStorage.setItem('funcao', dados.funcao);
      localStorage.setItem('user', JSON.stringify(dados));

      setTentativas(0);
      navigate(RotaPerfil[dados.funcao] || '/');
    } catch (error) {
      const novasTentativas = tentativas + 1;
      setTentativas(novasTentativas);
      setErro(error.message || `Credenciais inválidas. Tentativa ${novasTentativas} de 5.`);

      if (novasTentativas >= 5) {
        setBloqueado(true);
        setErro('Conta bloqueada devido a múltiplas tentativas falhas. Tente novamente mais tarde.');
      }
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF6F3] flex items-center justify-center p-4 relative overflow-hidden selection:bg-[#9C1C0E] selection:text-white">
      {/* Decorative gradient glow background */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#9C1C0E]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#B78A10]/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white rounded-3xl border border-[#FAF6F3]/50 shadow-2xl shadow-gray-200/60 p-8 sm:p-10 relative z-10 transition-all">
        {/* Logo & Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-48 h-20 flex items-center justify-center mb-2">
            <img src={logo} alt="Fast Cooking" className="max-h-full object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight font-poppins">
            Acesso ao Sistema
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Entre com suas credenciais de colaborador
          </p>
        </div>

        {/* Error Alert */}
        {erro && (
          <div className="mb-6 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-[#9C1C0E] text-xs sm:text-sm font-medium flex items-center gap-2.5 animate-[fadeIn_0.2s_ease-out]">
            <MdErrorOutline size={20} className="shrink-0 text-[#9C1C0E]" />
            <span className="flex-1 leading-snug">{erro}</span>
          </div>
        )}

        <form onSubmit={handleEnter} className="space-y-5">
          {/* Email input */}
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5"
            >
              E-mail
            </label>
            <div className="relative">
              <MdEmail
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
              <input
                id="email"
                type="email"
                placeholder="seu.email@fastcooking.com"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                disabled={carregando || bloqueado}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50/70 border border-gray-200 rounded-2xl text-sm text-gray-800 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#9C1C0E] focus:border-transparent transition-all disabled:opacity-50"
                required
              />
            </div>
          </div>

          {/* Senha input */}
          <div>
            <label
              htmlFor="senha"
              className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5"
            >
              Senha
            </label>
            <div className="relative">
              <MdLock
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
              <input
                id="senha"
                type={mostrarSenha ? 'text' : 'password'}
                placeholder="••••••••"
                autoCapitalize="none"
                autoCorrect="off"
                disabled={carregando || bloqueado}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full pl-10 pr-11 py-3 bg-gray-50/70 border border-gray-200 rounded-2xl text-sm text-gray-800 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#9C1C0E] focus:border-transparent transition-all disabled:opacity-50"
                required
              />
              <button
                type="button"
                onClick={() => setMostrarSenha(!mostrarSenha)}
                disabled={carregando || bloqueado}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none p-1 transition-colors cursor-pointer disabled:opacity-40"
                title={mostrarSenha ? 'Ocultar senha' : 'Ver senha'}
              >
                {mostrarSenha ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
              </button>
            </div>
          </div>

          {/* Submit button with loading state */}
          <button
            type="submit"
            disabled={carregando || bloqueado}
            className="w-full mt-2 py-3.5 px-4 bg-[#9C1C0E] hover:bg-[#7a160b] active:scale-[0.99] text-white font-bold rounded-2xl shadow-lg shadow-[#9C1C0E]/25 transition-all flex items-center justify-center gap-2 text-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            {carregando ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
                </svg>
                <span>Entrando...</span>
              </>
            ) : (
              <span>Entrar</span>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <p className="text-[11px] text-gray-400">
            FastCooking &bull; Sistema de Gestão Gastronômica Inteligente
          </p>
        </div>
      </div>
    </div>
  );
}

export default TelaLogin;
