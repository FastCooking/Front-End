export function Pills({
  items = [],
  value,
  onChange,
  align = "start",
  className = "",
}) {
  const alignClass =
    align === "center" ? "justify-start md:justify-center" : "justify-start";

  return (
    <div
      className={`flex items-center ${alignClass} gap-2 overflow-x-auto pb-1 scrollbar-none ${className}`}
    >
      {items.map((item) => {
        const option =
          typeof item === "string" ? { value: item, label: item } : item;
        const isSelected = value === option.value;
        const Icon = option.icon;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange && onChange(option.value)}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer shadow-xs ${
              isSelected
                ? "bg-brand text-white shadow-sm"
                : "bg-white text-gray-700 hover:bg-brand-soft hover:text-brand border border-gray-200"
            }`}
          >
            {Icon && <Icon size={16} className="shrink-0" />}
            <span>{option.label}</span>
            {option.count !== undefined && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[11px] font-bold ${
                  isSelected
                    ? "bg-white/20 text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {option.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default Pills;
