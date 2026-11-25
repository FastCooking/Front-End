import { MdArrowBack } from "react-icons/md";

export function PublicShell({
  title,
  badge,
  subtitle,
  onBack,
  backTitle = "Voltar",
  actions,
  subHeader,
  maxWidth = "max-w-7xl",
  className = "pb-24",
  children,
}) {
  return (
    <div className={`min-h-screen bg-surface text-gray-800 ${className}`}>
      <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur-md border-b border-gray-200/80 shadow-xs py-3">
        <div className={`${maxWidth} mx-auto px-4 sm:px-6 lg:px-8 space-y-3`}>
          <div className="flex items-center justify-between gap-2 sm:gap-3">
            <div className="flex items-center gap-2 min-w-0">
              {onBack && (
                <button
                  type="button"
                  onClick={onBack}
                  className="p-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-white transition-colors cursor-pointer shrink-0"
                  title={backTitle}
                  aria-label={backTitle}
                >
                  <MdArrowBack size={20} className="sm:w-[22px] sm:h-[22px]" />
                </button>
              )}
              <div className="min-w-0">
                <h1 className="text-lg sm:text-2xl font-black text-brand tracking-tight leading-tight truncate max-w-[160px] xs:max-w-[210px] sm:max-w-xs md:max-w-md">
                  {title}
                </h1>
                {badge ? (
                  <div className="mt-0.5">{badge}</div>
                ) : (
                  subtitle && (
                    <span className="text-[11px] text-gray-500 block truncate">
                      {subtitle}
                    </span>
                  )
                )}
              </div>
            </div>

            {actions && (
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                {actions}
              </div>
            )}
          </div>

          {subHeader}
        </div>
      </header>

      <main className={`${maxWidth} mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6`}>
        {children}
      </main>
    </div>
  );
}

export default PublicShell;
