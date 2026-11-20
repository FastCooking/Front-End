import { useEffect } from "react";
import { MdClose } from "react-icons/md";

const MAX_WIDTHS = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
};

export function Modal({
  open = true,
  onClose,
  title,
  subtitle,
  icon: Icon,
  size = "md",
  footer,
  children,
  closeOnBackdrop = true,
}) {
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e) {
      if (e.key === "Escape" && onClose) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const maxWidthClass = MAX_WIDTHS[size] || MAX_WIDTHS.md;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto"
      onClick={closeOnBackdrop && onClose ? onClose : undefined}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`bg-white rounded-3xl shadow-2xl w-full ${maxWidthClass} max-h-[90vh] flex flex-col border border-gray-100 animate-fade-in overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || onClose) && (
          <div className="flex items-start justify-between gap-3 px-5 sm:px-6 py-4 border-b border-gray-100 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              {Icon && (
                <div className="w-9 h-9 rounded-xl bg-brand-soft text-brand flex items-center justify-center shrink-0">
                  <Icon size={20} />
                </div>
              )}
              <div className="min-w-0">
                {title && (
                  <h2 className="text-base sm:text-lg font-bold text-gray-900 leading-snug truncate">
                    {title}
                  </h2>
                )}
                {subtitle && (
                  <p className="text-xs text-gray-500 mt-0.5 truncate">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer shrink-0"
                aria-label="Fechar modal"
              >
                <MdClose size={20} />
              </button>
            )}
          </div>
        )}

        <div className="p-5 sm:p-6 overflow-y-auto flex-1">{children}</div>

        {footer && (
          <div className="px-5 sm:px-6 py-3.5 bg-gray-50/80 border-t border-gray-100 flex items-center justify-end gap-2.5 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export default Modal;
