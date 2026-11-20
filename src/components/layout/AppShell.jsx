import { useEffect, useState } from "react";
import {
  MdChevronLeft,
  MdChevronRight,
  MdClose,
  MdExitToApp,
  MdMenu,
} from "react-icons/md";

const STORAGE_KEY = "fc_sidebar_collapsed";

export function AppShell({
  modulo,
  restauranteNome,
  secoes = [],
  secaoAtiva,
  onSecao,
  usuario,
  onLogout,
  headerActions,
  maxWidth = "max-w-7xl",
  children,
}) {
  const temSidebar = Array.isArray(secoes) && secoes.length > 1;

  const [recolhida, setRecolhida] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [drawerAberto, setDrawerAberto] = useState(false);

  function toggleRecolhida() {
    setRecolhida((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        // Ignora erro de storage
      }
      return next;
    });
  }

  useEffect(() => {
    if (!drawerAberto) return;
    function handleKeyDown(e) {
      if (e.key === "Escape") {
        setDrawerAberto(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [drawerAberto]);

  const secaoAtualObj = secoes.find((s) => s.id === secaoAtiva);

  return (
    <div className="min-h-screen bg-surface text-gray-800 flex">
      {/* Sidebar Desktop */}
      {temSidebar && (
        <aside
          className={`hidden lg:flex flex-col fixed inset-y-0 left-0 z-30 bg-white border-r border-gray-200/80 transition-all duration-200 ${
            recolhida ? "w-[72px]" : "w-60"
          }`}
        >
          {/* Topo da Sidebar */}
          <div className="h-16 px-3.5 border-b border-gray-100 flex items-center justify-between gap-2 shrink-0">
            {!recolhida && (
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src="/fast cooking logo.svg"
                  alt="Fast Cooking"
                  className="h-8 w-auto shrink-0"
                />
                <span className="font-extrabold text-sm text-brand truncate">
                  Fast Cooking
                </span>
              </div>
            )}
            <button
              type="button"
              onClick={toggleRecolhida}
              className={`p-2 rounded-xl text-gray-500 hover:text-brand hover:bg-brand-soft transition-colors cursor-pointer ${
                recolhida ? "mx-auto" : ""
              }`}
              title={recolhida ? "Expandir menu lateral" : "Recolher menu lateral"}
              aria-label={recolhida ? "Expandir menu lateral" : "Recolher menu lateral"}
            >
              {recolhida ? <MdChevronRight size={20} /> : <MdChevronLeft size={20} />}
            </button>
          </div>

          {/* Navegação das Seções */}
          <nav className="flex-1 p-2.5 space-y-1 overflow-y-auto" aria-label="Navegação do painel">
            {secoes.map((sec) => {
              const Icon = sec.icon;
              const ativo = sec.id === secaoAtiva;
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => onSecao && onSecao(sec.id)}
                  aria-current={ativo ? "page" : undefined}
                  title={recolhida ? sec.label : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                    recolhida ? "justify-center" : "justify-between"
                  } ${
                    ativo
                      ? "bg-brand text-white shadow-xs"
                      : "text-gray-700 hover:bg-brand-soft hover:text-brand"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {Icon && <Icon size={20} className="shrink-0" />}
                    {!recolhida && <span className="truncate">{sec.label}</span>}
                  </div>
                  {!recolhida && sec.badge !== undefined && sec.badge !== null && (
                    <span
                      className={`px-2 py-0.5 text-[11px] font-bold rounded-full shrink-0 ${
                        ativo
                          ? "bg-white/20 text-white"
                          : "bg-brand-soft text-brand"
                      }`}
                    >
                      {sec.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Rodapé da Sidebar */}
          {onLogout && (
            <div className="p-2.5 border-t border-gray-100 shrink-0">
              {!recolhida && usuario?.nome && (
                <div className="px-3 py-1.5 mb-1">
                  <p className="text-xs font-bold text-gray-800 truncate">
                    {usuario.nome}
                  </p>
                  {usuario.funcao && (
                    <p className="text-[11px] text-gray-500 truncate">
                      {usuario.funcao}
                    </p>
                  )}
                </div>
              )}
              <button
                type="button"
                onClick={onLogout}
                title="Sair da conta"
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-gray-600 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer ${
                  recolhida ? "justify-center" : ""
                }`}
              >
                <MdExitToApp size={19} className="shrink-0" />
                {!recolhida && <span>Sair</span>}
              </button>
            </div>
          )}
        </aside>
      )}

      {/* Drawer Mobile / Tablet */}
      {temSidebar && drawerAberto && (
        <div
          className="fixed inset-0 z-50 lg:hidden flex bg-black/50 backdrop-blur-xs"
          onClick={() => setDrawerAberto(false)}
          role="dialog"
          aria-modal="true"
        >
          <aside
            className="w-64 max-w-[82vw] bg-white h-full flex flex-col shadow-2xl animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-16 px-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src="/fast cooking logo.svg"
                  alt="Fast Cooking"
                  className="h-7 w-auto shrink-0"
                />
                <span className="font-extrabold text-sm text-brand truncate">
                  {modulo}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setDrawerAberto(false)}
                className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer"
                aria-label="Fechar menu"
              >
                <MdClose size={20} />
              </button>
            </div>

            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {secoes.map((sec) => {
                const Icon = sec.icon;
                const ativo = sec.id === secaoAtiva;
                return (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => {
                      if (onSecao) onSecao(sec.id);
                      setDrawerAberto(false);
                    }}
                    aria-current={ativo ? "page" : undefined}
                    className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                      ativo
                        ? "bg-brand text-white shadow-xs"
                        : "text-gray-700 hover:bg-brand-soft hover:text-brand"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {Icon && <Icon size={20} className="shrink-0" />}
                      <span className="truncate">{sec.label}</span>
                    </div>
                    {sec.badge !== undefined && sec.badge !== null && (
                      <span
                        className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                          ativo
                            ? "bg-white/20 text-white"
                            : "bg-brand-soft text-brand"
                        }`}
                      >
                        {sec.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {onLogout && (
              <div className="p-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setDrawerAberto(false);
                    onLogout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <MdExitToApp size={19} />
                  <span>Sair da conta</span>
                </button>
              </div>
            )}
          </aside>
        </div>
      )}

      {/* Área Principal */}
      <div
        className={`flex-1 flex flex-col min-w-0 ${
          temSidebar ? (recolhida ? "lg:pl-[72px]" : "lg:pl-60") : ""
        } transition-all duration-200`}
      >
        {/* Sticky Top Header (padrão Autoatendimento) */}
        <header className="sticky top-0 z-20 bg-surface/95 backdrop-blur-md border-b border-gray-200/80 shadow-xs px-4 sm:px-6 py-3">
          <div className={`${maxWidth} mx-auto flex items-center justify-between gap-3`}>
            <div className="flex items-center gap-2.5 min-w-0">
              {temSidebar && (
                <button
                  type="button"
                  onClick={() => setDrawerAberto(true)}
                  className="lg:hidden p-2 rounded-xl bg-white border border-gray-200 text-gray-700 hover:text-brand hover:border-brand transition-colors cursor-pointer shrink-0"
                  aria-label="Abrir menu de seções"
                >
                  <MdMenu size={20} />
                </button>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-base sm:text-xl font-black text-brand tracking-tight leading-tight truncate">
                    {modulo}
                  </h1>
                  {secaoAtualObj && (
                    <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-bold text-gold bg-gold/15 px-2.5 py-0.5 rounded-full">
                      {secaoAtualObj.label}
                    </span>
                  )}
                  {restauranteNome && (
                    <span className="inline-flex items-center text-[11px] sm:text-xs font-semibold text-gray-600 bg-white border border-gray-200 px-2.5 py-0.5 rounded-full truncate max-w-[180px] sm:max-w-xs">
                      {restauranteNome}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {headerActions}
              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className={`${
                    temSidebar ? "lg:hidden" : ""
                  } inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 hover:text-red-700 hover:border-red-200 text-xs sm:text-sm font-semibold transition-colors cursor-pointer shadow-xs`}
                  title="Sair da conta"
                >
                  <MdExitToApp size={17} />
                  <span className="hidden sm:inline">Sair</span>
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Conteúdo da Página */}
        <main className={`flex-1 w-full ${maxWidth} mx-auto px-4 sm:px-6 py-5 sm:py-6`}>
          {children}
        </main>
      </div>
    </div>
  );
}

export default AppShell;
