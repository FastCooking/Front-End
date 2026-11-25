import { STATUS_STYLES } from "../types";
import StatusBadge from "./StatusBadge";

export default function OrderItemCard({ item }) {
  const isCancelled = item.status === "CANCELLED";
  const styles = STATUS_STYLES[item.status] || STATUS_STYLES.PENDING;

  return (
    <div
      className={`flex items-center justify-between gap-4 p-4 rounded-2xl border transition-colors ${styles.bgCard} ${styles.border}`}
      id={`order-item-${item.id}`}
    >
      <div className="flex items-start gap-3 min-w-0 flex-1">
        <div
          className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold ${styles.bg} ${styles.text}`}
          aria-label={`Quantidade: ${item.quantity}`}
        >
          {item.quantity}×
        </div>

        <div className="min-w-0 flex-1">
          <p
            className={`text-sm sm:text-base font-semibold truncate ${
              isCancelled ? "line-through text-gray-400" : "text-gray-800"
            }`}
          >
            {item.name}
          </p>
          {item.notes && (
            <p
              className="mt-0.5 text-xs text-gray-500 italic truncate"
              title={item.notes}
            >
              Obs: {item.notes}
            </p>
          )}
        </div>
      </div>

      <div className="shrink-0">
        <StatusBadge status={item.status} />
      </div>
    </div>
  );
}
