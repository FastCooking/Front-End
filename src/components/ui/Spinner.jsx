export function Spinner({ size = "md", label, className = "" }) {
  const dims =
    size === "sm"
      ? "w-4 h-4 border-2"
      : size === "lg"
      ? "w-9 h-9 border-3"
      : "w-6 h-6 border-2";

  return (
    <div
      className={`inline-flex flex-col items-center justify-center gap-2 ${className}`}
      role="status"
    >
      <div
        className={`${dims} border-brand border-t-transparent rounded-full animate-spin`}
      />
      {label && <span className="text-xs text-gray-500 font-medium">{label}</span>}
    </div>
  );
}

export function PageLoader({ label = "Carregando..." }) {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6">
      <Spinner size="lg" label={label} />
    </div>
  );
}

export function Skeleton({ className = "h-4 w-full" }) {
  return (
    <div
      className={`bg-gray-200/80 rounded-xl animate-pulse ${className}`}
      aria-hidden="true"
    />
  );
}

export default Spinner;
