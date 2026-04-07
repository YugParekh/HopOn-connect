const configuredApiUrl = (import.meta.env.VITE_API_URL || "")
  .trim()
  .replace(/\/+$/, "");

export const API_BASE_URL = configuredApiUrl || (import.meta.env.DEV ? "http://localhost:5002" : "");

if (!API_BASE_URL && !import.meta.env.DEV) {
  console.error("Missing VITE_API_URL in production. API requests will go to relative /api paths and may return 404.");
}

export const buildApiUrl = (path: string) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return API_BASE_URL ? `${API_BASE_URL}${normalizedPath}` : normalizedPath;
};
