import { MdBolt, MdSync, MdWifiOff } from "react-icons/md";

export default function ConnectionBanner({
  connectionStatus,
  reconnectAttempt,
}) {
  if (connectionStatus === "CONNECTED") return null;

  const config = {
    CONNECTING: {
      bg: "bg-sky-600",
      icon: MdSync,
      spin: true,
      text: "Conectando ao servidor...",
    },
    RECONNECTING: {
      bg: "bg-amber-600",
      icon: MdBolt,
      spin: false,
      text: `Reconectando... (tentativa ${reconnectAttempt})`,
    },
    DISCONNECTED: {
      bg: "bg-red-600",
      icon: MdWifiOff,
      spin: false,
      text: "Conexão perdida",
    },
  };

  const c = config[connectionStatus] || config.DISCONNECTED;
  const Icon = c.icon;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[100] ${c.bg} text-white text-center text-xs sm:text-sm font-medium py-2 px-4 shadow-md animate-fade-in`}
      role="alert"
      aria-live="polite"
    >
      <span className="inline-flex items-center gap-2">
        <Icon size={16} className={c.spin ? "animate-spin" : ""} />
        <span>{c.text}</span>
      </span>
    </div>
  );
}
