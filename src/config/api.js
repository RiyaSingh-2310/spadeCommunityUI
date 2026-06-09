const DEFAULT_API_BASE_URL = "http://localhost:5050/api";

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
  countries: {
    list: "/api/countries/list",
  },
  partners: {
    list: "/api/partner/list",
    byId: (id) => `/api/partner/${id}`,
    create: "/api/partner/add",
    update: (id) => `/api/admin/partner/${id}`,
    delete: (id) => `/api/admin/partner/${id}`,
  },
  projectManagers: {
    list: "/api/projectmanager/list",
    create: "/api/projectmanager/add",
    byId: (id) => `/api/projectmanager/${id}`,
    update: (id) => `/api/projectmanager/${id}`,
  },
  salesProjects: {
    list: "/api/sales/project/list",
    create: "/api/sales/project/add",
    byId: (id) => `/api/sales/project/${id}`,
    update: (id) => `/api/sales/project/${id}`,
  },
};

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.trim()?.replace(/\/$/, "") ||
  DEFAULT_API_BASE_URL;

export const API_LOGIN_BEARER_TOKEN =
  import.meta.env.VITE_API_LOGIN_BEARER_TOKEN?.trim() ?? "";

export const API_DEBUG =
  import.meta.env.DEV && import.meta.env.VITE_API_DEBUG === "true";

/**
 * @param {string} path Path starting with /api/...
 */
export function buildApiUrl(path) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const base = API_BASE_URL;

  if (base.endsWith("/api") && normalizedPath.startsWith("/api/")) {
    return `${base}${normalizedPath.slice(4)}`;
  }

  return `${base}${normalizedPath}`;
}
