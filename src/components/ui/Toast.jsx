/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import {
  MdCheckCircle,
  MdClose,
  MdErrorOutline,
  MdInfoOutline,
  MdWarningAmber,
} from "react-icons/md";

const ToastContext = createContext(null);

const TONE_CONFIG = {
  success: {
    icon: MdCheckCircle,
    bg: "bg-emerald-600 text-white border-emerald-700",
  },
  error: {
    icon: MdErrorOutline,
    bg: "bg-red-600 text-white border-red-700",
  },
  warning: {
    icon: MdWarningAmber,
    bg: "bg-amber-500 text-white border-amber-600",
  },
  info: {
    icon: MdInfoOutline,
    bg: "bg-gray-900 text-white border-gray-800",
  },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const pushToast = useCallback(
    (tone, message, duration = 4000) => {
      if (!message) return;
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev.slice(-3), { id, tone, message }]);
      if (duration > 0) {
        setTimeout(() => removeToast(id), duration);
      }
    },
    [removeToast]
  );

  const api = useMemo(
    () => ({
      success: (msg, dur) => pushToast("success", msg, dur),
      error: (msg, dur) => pushToast("error", msg, dur || 5000),
      warning: (msg, dur) => pushToast("warning", msg, dur),
      info: (msg, dur) => pushToast("info", msg, dur),
    }),
    [pushToast]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      {toasts.length > 0 && (
        <div
          className="fixed top-4 right-4 z-[60] flex flex-col gap-2 max-w-sm w-[calc(100vw-2rem)] pointer-events-none"
          aria-live="polite"
        >
          {toasts.map((item) => {
            const cfg = TONE_CONFIG[item.tone] || TONE_CONFIG.info;
            const Icon = cfg.icon;
            return (
              <div
                key={item.id}
                className={`pointer-events-auto flex items-start justify-between gap-2.5 px-4 py-3 rounded-2xl border shadow-lg text-xs sm:text-sm font-medium animate-fade-in ${cfg.bg}`}
              >
                <div className="flex items-start gap-2 min-w-0">
                  <Icon size={18} className="shrink-0 mt-0.5" />
                  <span className="leading-snug break-words">{item.message}</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeToast(item.id)}
                  className="opacity-80 hover:opacity-100 cursor-pointer shrink-0"
                  aria-label="Fechar aviso"
                >
                  <MdClose size={17} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </ToastContext.Provider>
  );
}

const fallbackToast = {
  success: (msg) => console.info("[Toast]", msg),
  error: (msg) => console.error("[Toast]", msg),
  warning: (msg) => console.warn("[Toast]", msg),
  info: (msg) => console.info("[Toast]", msg),
};

export function useToast() {
  return useContext(ToastContext) || fallbackToast;
}
