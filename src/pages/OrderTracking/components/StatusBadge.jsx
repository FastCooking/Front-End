import { STATUS_LABELS, STATUS_STYLES } from '../types';

/**
 * Badge colorido indicando o status de um item ou pedido.
 *
 * @param {{ status: import('../types').ItemStatus | import('../types').OrderStatus, size?: 'sm' | 'md' }} props
 */
export default function StatusBadge({ status, size = 'sm' }) {
  const styles = STATUS_STYLES[status] || STATUS_STYLES.PENDING;
  const label = STATUS_LABELS[status] || status;

  const sizeClasses = size === 'md'
    ? 'text-sm px-3 py-1.5'
    : 'text-xs px-2.5 py-1';

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full font-semibold
        whitespace-nowrap transition-all duration-300
        ${styles.bg} ${styles.text} ${sizeClasses}
      `}
      role="status"
      aria-label={`Status: ${label}`}
    >
      <span className={`w-2 h-2 rounded-full ${styles.dot} animate-pulse`} aria-hidden="true" />
      {label}
    </span>
  );
}
