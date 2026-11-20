const VARIANTS = {
  primary:
    "bg-brand hover:bg-brand-dark text-white shadow-xs border border-transparent",
  secondary:
    "bg-white hover:bg-brand-soft text-gray-700 hover:text-brand border border-gray-200 shadow-xs",
  soft:
    "bg-brand-soft hover:bg-brand/15 text-brand border border-brand/20",
  gold:
    "bg-amber-500 hover:bg-amber-600 text-white shadow-xs border border-transparent",
  danger:
    "bg-red-600 hover:bg-red-700 text-white shadow-xs border border-transparent",
  dangerSoft:
    "bg-red-50 hover:bg-red-100 text-red-700 border border-red-200",
  ghost:
    "bg-transparent hover:bg-gray-100 text-gray-600 hover:text-gray-900 border border-transparent",
};

const SIZES = {
  xs: "px-2.5 py-1.5 text-xs rounded-xl gap-1",
  sm: "px-3.5 py-2 text-xs sm:text-sm rounded-xl gap-1.5",
  md: "px-4 py-2.5 text-sm rounded-xl gap-2",
  lg: "px-5 py-3 text-sm sm:text-base rounded-2xl gap-2",
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  icon: Icon,
  className = "",
  type = "button",
  ...props
}) {
  const variantClasses = VARIANTS[variant] || VARIANTS.primary;
  const sizeClasses = SIZES[size] || SIZES.md;

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses} ${sizeClasses} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
      ) : (
        Icon && <Icon size={size === "xs" ? 15 : size === "lg" ? 20 : 18} className="shrink-0" />
      )}
      {children}
    </button>
  );
}

export default Button;
