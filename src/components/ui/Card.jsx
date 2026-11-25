export function Card({
  children,
  className = "",
  padding = "p-5",
  hover = false,
  ...props
}) {
  return (
    <div
      className={`bg-white rounded-2xl border border-gray-200/80 shadow-xs ${
        hover ? "hover:shadow-md hover:border-gold/40 transition-shadow" : ""
      } ${padding} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export default Card;
