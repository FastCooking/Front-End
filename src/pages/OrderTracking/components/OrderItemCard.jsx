import StatusBadge from './StatusBadge';
import { STATUS_STYLES } from '../types';

/**
 * Card individual de um item do pedido com status visual diferenciado.
 *
 * @param {{ item: import('../types').OrderItem }} props
 */
export default function OrderItemCard({ item }) {
  const styles = STATUS_STYLES[item.status] || STATUS_STYLES.PENDING;

  return (
    <div
      className={`
        flex items-center justify-between gap-4 p-4 rounded-xl
        border transition-all duration-300
        ${styles.bgCard} ${styles.border}
        hover:shadow-md
      `}
      id={`order-item-${item.id}`}
    >
      {/* Lado esquerdo: quantidade + nome + observações */}
      <div className="flex items-start gap-3 min-w-0 flex-1">
        {/* Badge de quantidade */}
        <div
          className={`
            flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center
            text-sm font-bold ${styles.bg} ${styles.text}
          `}
          aria-label={`Quantidade: ${item.quantity}`}
        >
          {item.quantity}×
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm sm:text-base font-semibold text-gray-800 truncate">
            {item.name}
          </p>
          {item.notes && (
            <p className="mt-0.5 text-xs text-gray-500 italic truncate" title={item.notes}>
              📝 {item.notes}
            </p>
          )}
        </div>
      </div>

      {/* Lado direito: badge de status */}
      <div className="flex-shrink-0">
        <StatusBadge status={item.status} />
      </div>
    </div>
  );
}
