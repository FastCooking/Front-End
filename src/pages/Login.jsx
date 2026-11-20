import { useEffect, useState } from "react";
import {
  MdArrowBack,
  MdEmail,
  MdErrorOutline,
  MdLock,
  MdVisibility,
  MdVisibilityOff,
} from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { Button, Card, Field, Input } from "../components/ui";
import { RotaPerfil } from "../constants/RotasPerfil";
import { login } from "../services/authService";

function TelaLogin() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);

  const [erro, setErro] = useState("");
  const [tentativas, setTentativas] = useState(0);
  const [bloqueado, setBloqueado] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (erro) {
      const timer = setTimeout(() => setErro(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [erro]);

  async function handleEnter(event) {
    event.preventDefault();
    if (bloqueado || carregando) return;

    setCarregando(true);
    setErro("");

    try {
      const dados = await login(email.trim().toLowerCase(), senha.trim());

      localStorage.setItem("token", dados.access_token);
      if (dados.refresh_token) {
        localStorage.setItem("refreshToken", dados.refresh_token);
      }
      localStorage.setItem("funcao", dados.funcao);
      localStorage.setItem("user", JSON.stringify(dados));

      setTentativas(0);
      navigate(RotaPerfil[dados.funcao] || "/");
    } catch (error) {
      const novasTentativas = tentativas + 1;
      setTentativas(novasTentativas);
      setErro(
        error.message ||
          `Credenciais inválidas. Tentativa ${novasTentativas} de 5.`
      );

      if (novasTentativas >= 5) {
        setBloqueado(true);
        setErro(
          "Conta bloqueada devido a múltiplas tentativas falhas. Tente novamente mais tarde."
        );
      }
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <Card className="w-full max-w-md rounded-3xl p-7 sm:p-9">
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-brand transition-colors cursor-pointer"
          >
            <MdArrowBack size={16} />
            <span>Início</span>
          </button>
        </div>

        <div className="flex flex-col items-center text-center mb-7">
          <img
            src="/fast cooking logo.svg"
            alt="Fast Cooking"
            className="h-14 w-auto object-contain mb-3"
          />
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            Acesso ao Sistema
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Entre com suas credenciais de colaborador
          </p>
        </div>

        {erro && (
          <div className="mb-5 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm font-medium flex items-center gap-2.5 animate-fade-in">
            <MdErrorOutline size={20} className="shrink-0 text-red-600" />
            <span className="flex-1 leading-snug">{erro}</span>
          </div>
        )}

        <form onSubmit={handleEnter} className="space-y-4">
          <Field label="E-mail" required htmlFor="email">
            <div className="relative">
              <MdEmail
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
              <Input
                id="email"
                type="email"
                placeholder="seu.email@fastcooking.com"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                disabled={carregando || bloqueado}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </Field>

          <Field label="Senha" required htmlFor="senha">
            <div className="relative">
              <MdLock
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
              <Input
                id="senha"
                type={mostrarSenha ? "text" : "password"}
                placeholder="••••••••"
                autoCapitalize="none"
                autoCorrect="off"
                disabled={carregando || bloqueado}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="pl-10 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setMostrarSenha(!mostrarSenha)}
                disabled={carregando || bloqueado}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 p-1 transition-colors cursor-pointer disabled:opacity-40"
                title={mostrarSenha ? "Ocultar senha" : "Ver senha"}
              >
                {mostrarSenha ? (
                  <MdVisibilityOff size={18} />
                ) : (
                  <MdVisibility size={18} />
                )}
              </button>
            </div>
          </Field>

          <Button
            type="submit"
            size="lg"
            loading={carregando}
            disabled={bloqueado}
            className="w-full mt-2"
          >
            Entrar
          </Button>
        </form>

        <div className="mt-7 pt-5 border-t border-gray-100 text-center">
          <p className="text-[11px] text-gray-400">
            FastCooking &bull; Gestão Gastronômica Inteligente
          </p>
        </div>
      </Card>
    </div>
  );
}

export default TelaLogin;
