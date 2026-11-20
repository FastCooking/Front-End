import { MdCheck, MdClose } from "react-icons/md";
import { STATUS_LABELS, STATUS_PROGRESSION } from "../types";

export default function OrderProgressBar({ status }) {
  const currentIndex = STATUS_PROGRESSION.indexOf(status);
  const activeIndex = currentIndex >= 0 ? currentIndex : 0;
  const isCancelled = status === "CANCELLED";

  return (
    <div
      className="w-full"
      role="progressbar"
      aria-label="Progresso do pedido"
      aria-valuenow={activeIndex + 1}
      aria-valuemin={1}
      aria-valuemax={STATUS_PROGRESSION.length}
    >
      <div className="flex items-center justify-between relative">
        <div className="absolute top-4 sm:top-5 left-[10%] right-[10%] h-1 bg-gray-200 rounded-full z-0" />

        <div
          className={`absolute top-4 sm:top-5 left-[10%] h-1 rounded-full z-[1] transition-all duration-500 ${
            isCancelled ? "bg-red-500" : "bg-brand"
          }`}
          style={{
            width: `${(activeIndex / (STATUS_PROGRESSION.length - 1)) * 80}%`,
          }}
        />

        {STATUS_PROGRESSION.map((step, i) => {
          const isActive = i <= activeIndex && !isCancelled;
          const isCurrent = i === activeIndex && !isCancelled;

          return (
            <div
              key={step}
              className="relative z-10 flex flex-col items-center flex-1 px-0.5"
            >
              <div
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-colors shadow-xs ${
                  isCancelled
                    ? "bg-red-500 text-white"
                    : isCurrent
                    ? "bg-brand text-white ring-4 ring-brand/20"
                    : isActive
                    ? "bg-brand text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {isActive ? (
                  <MdCheck size={18} />
                ) : (
                  <span className="text-[11px] sm:text-xs font-bold">
                    {i + 1}
                  </span>
                )}
              </div>

              <span
                className={`mt-2 text-[10px] sm:text-xs font-semibold text-center leading-tight break-words ${
                  isCurrent
                    ? "text-brand"
                    : isActive
                    ? "text-gray-700"
                    : "text-gray-400"
                }`}
              >
                {STATUS_LABELS[step]}
              </span>
            </div>
          );
        })}
      </div>

      {isCancelled && (
        <div className="mt-4 text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 text-red-700 rounded-full text-xs sm:text-sm font-semibold">
            <MdClose size={16} />
            Pedido Cancelado
          </span>
        </div>
      )}
    </div>
  );
}
