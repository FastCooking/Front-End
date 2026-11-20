import { STATUS_LABELS, STATUS_STYLES } from "../types";

export default function StatusBadge({ status, size = "sm" }) {
  const styles = STATUS_STYLES[status] || STATUS_STYLES.PENDING;
  const label = STATUS_LABELS[status] || status;
  const shouldPulse = status === "READY";

  const sizeClasses =
    size === "md" ? "text-sm px-3 py-1.5" : "text-xs px-2.5 py-1";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold whitespace-nowrap ${styles.bg} ${styles.text} ${sizeClasses}`}
      role="status"
      aria-label={`Status: ${label}`}
    >
      <span
        className={`w-2 h-2 rounded-full ${styles.dot} ${
          shouldPulse ? "animate-pulse" : ""
        }`}
        aria-hidden="true"
      />
      {label}
    </span>
  );
}
