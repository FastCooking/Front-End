import { STATUS_LABELS, STATUS_STYLES, STATUS_PROGRESSION } from '../types';

/**
 * Barra de progresso horizontal que mostra a evolução do pedido
 * através das etapas: Pendente → Em preparo → Pronto → Entregue.
 *
 * @param {{ status: import('../types').OrderStatus }} props
 */
export default function OrderProgressBar({ status }) {
  const currentIndex = STATUS_PROGRESSION.indexOf(status);
  // Se o status não está na progressão (ex: CANCELLED), mostra posição 0
  const activeIndex = currentIndex >= 0 ? currentIndex : 0;
  const isCancelled = status === 'CANCELLED';

  return (
    <div className="w-full" role="progressbar" aria-label="Progresso do pedido" aria-valuenow={activeIndex + 1} aria-valuemin={1} aria-valuemax={STATUS_PROGRESSION.length}>
      {/* Etapas */}
      <div className="flex items-center justify-between relative">
        {/* Linha de fundo */}
        <div className="absolute top-5 left-[10%] right-[10%] h-1 bg-gray-200 rounded-full z-0" />

        {/* Linha de progresso ativa */}
        <div
          className="absolute top-5 left-[10%] h-1 rounded-full z-[1] transition-all duration-700 ease-out"
          style={{
            width: `${(activeIndex / (STATUS_PROGRESSION.length - 1)) * 80}%`,
            background: isCancelled
              ? '#ef4444'
              : 'linear-gradient(90deg, #9C1C0E, #B78A10)',
          }}
        />

        {STATUS_PROGRESSION.map((step, i) => {
          const isActive = i <= activeIndex && !isCancelled;
          const isCurrent = i === activeIndex && !isCancelled;

          return (
            <div key={step} className="relative z-10 flex flex-col items-center flex-1">
              {/* Dot/Círculo */}
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center
                  transition-all duration-500 shadow-sm
                  ${isCurrent
                    ? 'bg-[#9C1C0E] text-white ring-4 ring-[#9C1C0E]/20 scale-110'
                    : isActive
                      ? 'bg-[#9C1C0E]/80 text-white'
                      : 'bg-gray-200 text-gray-400'
                  }
                  ${isCancelled ? 'bg-red-400 text-white' : ''}
                `}
              >
                {isActive ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span className="text-xs font-bold">{i + 1}</span>
                )}
              </div>

              {/* Label */}
              <span
                className={`
                  mt-2.5 text-xs font-semibold text-center leading-tight
                  ${isCurrent ? 'text-[#9C1C0E]' : isActive ? 'text-gray-700' : 'text-gray-400'}
                `}
              >
                {STATUS_LABELS[step]}
              </span>
            </div>
          );
        })}
      </div>

      {/* Cancelled overlay */}
      {isCancelled && (
        <div className="mt-4 text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-700 rounded-full text-sm font-semibold">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Pedido Cancelado
          </span>
        </div>
      )}
    </div>
  );
}
