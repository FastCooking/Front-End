export function Field({
  label,
  required = false,
  error,
  hint,
  htmlFor,
  className = "",
  children,
}) {
  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="block text-xs font-semibold text-gray-700 mb-1.5"
        >
          {label} {required && <span className="text-brand">*</span>}
        </label>
      )}
      {children}
      {hint && !error && (
        <p className="text-[11px] text-gray-500 mt-1">{hint}</p>
      )}
      {error && (
        <p className="text-[11px] text-red-600 font-medium mt-1">{error}</p>
      )}
    </div>
  );
}

const baseInputClasses =
  "w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/15 focus:outline-none transition-colors disabled:bg-gray-50 disabled:text-gray-400";

export function Input({ className = "", error, ...props }) {
  return (
    <input
      className={`${baseInputClasses} ${error ? "border-red-400 focus:border-red-500 focus:ring-red-100" : ""} ${className}`}
      {...props}
    />
  );
}

export function Select({ className = "", error, children, ...props }) {
  return (
    <select
      className={`${baseInputClasses} ${error ? "border-red-400 focus:border-red-500 focus:ring-red-100" : ""} ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

export function Textarea({ className = "", error, rows = 3, ...props }) {
  return (
    <textarea
      rows={rows}
      className={`${baseInputClasses} ${error ? "border-red-400 focus:border-red-500 focus:ring-red-100" : ""} ${className}`}
      {...props}
    />
  );
}
