import {
  getUserDisplayName,
  getUserInitials,
  normalizeAdminUser,
} from "../../modules/shared/utils/userAvatar";

const TOKEN_KEY = "authToken";
const ADMIN_KEY = "adminUser";

export function saveAuthSession({ token, admin }) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(ADMIN_KEY, JSON.stringify(normalizeAdminUser(admin)));
  sessionStorage.removeItem(TOKEN_KEY);
}

export function clearAuthSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ADMIN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
}

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
}

export function isAuthenticated() {
  return Boolean(getAuthToken());
}

export function getAdminUser() {
  try {
    const raw = localStorage.getItem(ADMIN_KEY);
    return raw ? normalizeAdminUser(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

/** @deprecated Prefer getAdminUser() fields or getUserInitials(firstName, lastName) */
export function getAdminInitials(nameOrAdmin) {
  if (nameOrAdmin && typeof nameOrAdmin === "object") {
    return getUserInitials(nameOrAdmin.firstName, nameOrAdmin.lastName);
  }
  const name = typeof nameOrAdmin === "string" ? nameOrAdmin : "";
  if (!name?.trim()) return "A";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  if (parts.length >= 2) {
    return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
  }
  return "A";
}

export function getAdminDisplayName(admin = getAdminUser()) {
  if (!admin) return "Admin";
  return (
    admin.displayName ||
    getUserDisplayName(admin.firstName, admin.lastName, admin.name)
  );
}
