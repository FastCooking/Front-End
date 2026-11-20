const TONES = {
  neutral: "bg-gray-100 text-gray-700 border-gray-200",
  brand: "bg-brand-soft text-brand border-brand/20",
  gold: "bg-amber-50 text-amber-800 border-amber-200",
  success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  warning: "bg-amber-50 text-amber-800 border-amber-200",
  danger: "bg-red-50 text-red-700 border-red-200",
  info: "bg-sky-50 text-sky-700 border-sky-200",
};

const STATUS_MAP = {
  pendente: { tone: "warning", label: "Pendente" },
  "em preparo": { tone: "info", label: "Em preparo" },
  em_preparo: { tone: "info", label: "Em preparo" },
  pronto: { tone: "success", label: "Pronto" },
  entregue: { tone: "neutral", label: "Entregue" },
  cancelado: { tone: "danger", label: "Cancelado" },
  aberto: { tone: "info", label: "Aberto" },
  fechado: { tone: "neutral", label: "Fechado" },
  finalizado: { tone: "success", label: "Finalizado" },
  pago: { tone: "success", label: "Pago" },
  disponivel: { tone: "success", label: "Disponível" },
  ocupada: { tone: "warning", label: "Ocupada" },
  indisponivel: { tone: "danger", label: "Indisponível" },
  ativo: { tone: "success", label: "Ativo" },
  inativo: { tone: "danger", label: "Inativo" },
};

export function Badge({
  children,
  tone = "neutral",
  icon: Icon,
  className = "",
}) {
  const classes = TONES[tone] || TONES.neutral;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${classes} ${className}`}
    >
      {Icon && <Icon size={13} className="shrink-0" />}
      {children}
    </span>
  );
}

export function StatusBadge({ status, label, className = "" }) {
  const key = String(status || "").trim().toLowerCase();
  const mapped = STATUS_MAP[key] || { tone: "neutral", label: status || "—" };
  return (
    <Badge tone={mapped.tone} className={className}>
      {label || mapped.label}
    </Badge>
  );
}

export default Badge;
