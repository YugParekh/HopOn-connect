const configuredApiUrl = (import.meta.env.VITE_API_URL || "").trim();

export const API_BASE_URL = configuredApiUrl || (import.meta.env.DEV ? "http://localhost:5002" : "");

export const buildApiUrl = (path: string) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return API_BASE_URL ? `${API_BASE_URL}${normalizedPath}` : normalizedPath;
};
