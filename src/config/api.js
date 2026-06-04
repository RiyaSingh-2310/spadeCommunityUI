const DEFAULT_API_BASE_URL = "http://localhost:5050";

/** Backend route paths (must match server; always include /api prefix). */
export const API_ROUTES = {
  admin: {
    login: "/api/admin/login",
    forgotPassword: "/api/admin/forgot-password",
    verifyOtp: "/api/admin/verify-otp",
    resetPassword: "/api/admin/reset-password",
    all: "/api/admin/all",
    byId: (id) => `/api/admin/${id}`,
    create: "/api/admin/add-user",
    update: (id) => `/api/admin/updateadmin/${id}`,
    updatePermissions: (id) => `/api/admin/permissions/${id}`,
    delete: (id) => `/api/admin/delete/${id}`,
  },
  clients: {
    list: "/api/clients/all",
    create: "/api/clients/add",
    update: (id) => `/api/clients/update/${id}`,
  },
};

const ENV_KEYS = [
  "VITE_API_BASE_URL",
  "VITE_API_URL",
  "REACT_APP_API_URL",
  "NEXT_PUBLIC_API_URL",
];

function readEnvBaseUrl() {
  for (const key of ENV_KEYS) {
    const raw = import.meta.env[key];
    if (typeof raw !== "string") continue;
    return raw.trim();
  }
  return undefined;
}

/**
 * Resolves API origin without duplicating /api (paths in API_ROUTES already include it).
 * - Dev + empty env → "" (same-origin; Vite proxies /api → localhost:5050)
 * - Production + empty env → http://localhost:5050
 */
function resolveApiBaseUrl() {
  const fromEnv = readEnvBaseUrl();

  if (fromEnv === "") {
    return import.meta.env.DEV ? "" : DEFAULT_API_BASE_URL;
  }

  if (fromEnv) {
    let base = fromEnv.replace(/\/$/, "");
    if (base.endsWith("/api")) {
      base = base.slice(0, -4);
    }
    return base;
  }

  if (import.meta.env.DEV) {
    return "";
  }

  return DEFAULT_API_BASE_URL;
}

export const API_BASE_URL = resolveApiBaseUrl();

export const API_LOGIN_BEARER_TOKEN =
  import.meta.env.VITE_API_LOGIN_BEARER_TOKEN?.trim() ?? "";

export const API_DEBUG =
  import.meta.env.DEV && import.meta.env.VITE_API_DEBUG === "true";

/**
 * @param {string} path Path starting with /api/...
 */
export function buildApiUrl(path) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const base = API_BASE_URL.replace(/\/$/, "");
  if (!base) {
    return normalizedPath;
  }
  return `${base}${normalizedPath}`;
}
