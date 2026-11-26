export const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/+$/, "");

export const FALLBACK_FOOD_SVG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" fill="none">
      <rect width="400" height="300" fill="#F9ECE5"/>
      <circle cx="200" cy="140" r="52" fill="#9C1C0E" fill-opacity="0.12"/>
      <path d="M180 120v40M172 120v16a8 8 0 0016 0v-16M212 120c8 0 12 10 12 20h-12v20" stroke="#9C1C0E" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="200" y="225" text-anchor="middle" fill="#9C1C0E" font-family="Poppins, sans-serif" font-size="14" font-weight="600">Fast Cooking</text>
    </svg>`
  );

export function resolverImagem(rawPath, fallback = FALLBACK_FOOD_SVG) {
  if (!rawPath) return fallback;
  if (
    rawPath.startsWith("http://") ||
    rawPath.startsWith("https://") ||
    rawPath.startsWith("data:")
  ) {
    return rawPath;
  }
  return `${API_BASE}${rawPath.startsWith("/") ? "" : "/"}${rawPath}`;
}
