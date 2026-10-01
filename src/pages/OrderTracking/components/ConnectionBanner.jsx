/**
 * Banner de feedback sobre o estado da conexão WebSocket.
 * Aparece fixo no topo quando a conexão não está estável.
 *
 * @param {{
 *   connectionStatus: import('../types').ConnectionStatus,
 *   reconnectAttempt: number,
 * }} props
 */
export default function ConnectionBanner({ connectionStatus, reconnectAttempt }) {
  if (connectionStatus === 'CONNECTED') return null;

  const config = {
    CONNECTING: {
      bg: 'bg-blue-600',
      icon: '🔄',
      text: 'Conectando ao servidor...',
    },
    RECONNECTING: {
      bg: 'bg-amber-600',
      icon: '⚡',
      text: `Reconectando... (tentativa ${reconnectAttempt})`,
    },
    DISCONNECTED: {
      bg: 'bg-red-600',
      icon: '🔌',
      text: 'Conexão perdida',
    },
  };

  const c = config[connectionStatus] || config.DISCONNECTED;

  return (
    <div
      className={`
        fixed top-0 left-0 right-0 z-[100]
        ${c.bg} text-white text-center text-sm font-medium
        py-2 px-4 shadow-lg
        animate-[slideDown_0.3s_ease-out]
      `}
      role="alert"
      aria-live="polite"
    >
      <span className="inline-flex items-center gap-2">
        <span className="animate-spin-slow">{c.icon}</span>
        {c.text}
      </span>
    </div>
  );
}
