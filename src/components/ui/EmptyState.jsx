export function EmptyState({
  icon: Icon,
  title = "Nenhum registro encontrado",
  description,
  action,
  className = "",
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center py-10 px-4 ${className}`}
    >
      {Icon && (
        <div className="w-12 h-12 rounded-2xl bg-brand-soft text-brand flex items-center justify-center mb-3">
          <Icon size={26} />
        </div>
      )}
      <h3 className="text-sm sm:text-base font-bold text-gray-800">{title}</h3>
      {description && (
        <p className="text-xs text-gray-500 mt-1 max-w-sm leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export default EmptyState;
