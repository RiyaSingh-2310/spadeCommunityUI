import { prepareAdminSessionUser } from "../../modules/permissions/permissionsUtils";
import {
  getUserDisplayName,
  normalizeAdminUser,
} from "../../modules/shared/utils/userAvatar";
import { clearLoginRole, saveLoginRole } from "./loginRole";
import { resetSessionExpiredState } from "./sessionExpiry";

const TOKEN_KEY = "authToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const ADMIN_KEY = "adminUser";

const AUTH_STORAGE_KEYS = [TOKEN_KEY, REFRESH_TOKEN_KEY, ADMIN_KEY];

function clearAuthStorageKeys(storage) {
  AUTH_STORAGE_KEYS.forEach((key) => storage.removeItem(key));
}

/** Dispatched after login/logout so listeners can refresh auth-dependent UI. */
export const AUTH_SESSION_CHANGED_EVENT = "auth:session-changed";

function notifyAuthSessionChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_SESSION_CHANGED_EVENT));
  }
}

/**
 * Persist auth session in localStorage.
 *
 * H3: localStorage is readable by any page JS (XSS blast radius). Primary
 * mitigation is sanitizing HTML (C1). Longer-term, prefer httpOnly Secure
 * cookies for access/refresh tokens if the backend can support them.
 *
 * @param {{ token: string, refreshToken?: string, admin?: object | null, loginRole?: string }} session
 */
export function saveAuthSession({ token, refreshToken, admin, loginRole }) {
  const normalizedToken = normalizeAuthToken(token);
  if (!normalizedToken) {
    throw new Error("Cannot save auth session without a token.");
  }

  localStorage.setItem(TOKEN_KEY, normalizedToken);

  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, String(refreshToken).trim());
  } else {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }

  const sessionAdmin = prepareAdminSessionUser(admin);
  const normalizedAdmin = sessionAdmin ? normalizeAdminUser(sessionAdmin) : null;
  if (normalizedAdmin) {
    localStorage.setItem(ADMIN_KEY, JSON.stringify(normalizedAdmin));
  } else {
    localStorage.removeItem(ADMIN_KEY);
  }

  sessionStorage.removeItem(TOKEN_KEY);
  if (loginRole) {
    saveLoginRole(loginRole);
  }
  resetSessionExpiredState();
  notifyAuthSessionChanged();
}

export function clearAuthSession() {
  clearAuthStorageKeys(localStorage);
  clearAuthStorageKeys(sessionStorage);
  clearLoginRole();
  notifyAuthSessionChanged();
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

/** Strips accidental Bearer prefix, quotes, and whitespace from stored tokens. */
export function normalizeAuthToken(token) {
  const raw = String(token ?? "").trim();
  if (!raw || raw === "undefined" || raw === "null") return "";

  let normalized = raw.replace(/^Bearer\s+/i, "").trim();
  if (
    (normalized.startsWith('"') && normalized.endsWith('"')) ||
    (normalized.startsWith("'") && normalized.endsWith("'"))
  ) {
    normalized = normalized.slice(1, -1).trim();
  }

  return normalized;
}

export function getAuthToken() {
  const stored =
    localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
  return normalizeAuthToken(stored);
}

export function isAuthenticated() {
  const token = getAuthToken();
  return Boolean(token && String(token).trim() && token !== "undefined" && token !== "null");
}

export function getAdminUser() {
  try {
    const raw = localStorage.getItem(ADMIN_KEY);
    return raw ? normalizeAdminUser(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function getAdminDisplayName(admin = getAdminUser()) {
  if (!admin) return "Admin";
  return (
    admin.displayName ||
    getUserDisplayName(admin.firstName, admin.lastName, admin.name)
  );
}
