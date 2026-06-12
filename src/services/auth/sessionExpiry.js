import toast from "../toast/toast";
import { clearAuthSession } from "./authStorage";

export const SESSION_EXPIRED_MESSAGE =
  "Your session has expired. Please log in again.";

const LOGIN_PATH = "/auth";

/** Blocks further authenticated API calls after forced logout begins. */
let sessionExpiredHandled = false;

export function isSessionExpiredHandled() {
  return sessionExpiredHandled;
}

/** Resets forced-logout guard after a successful login. */
export function resetSessionExpiredState() {
  sessionExpiredHandled = false;
}

/**
 * Clears auth state, shows session-expired toast once, and redirects to login.
 * Safe to call from multiple concurrent 401 handlers — only runs once.
 */
export function forceLogoutAfterSessionExpired() {
  if (sessionExpiredHandled) return;
  sessionExpiredHandled = true;

  clearAuthSession();
  toast.error(SESSION_EXPIRED_MESSAGE);

  if (typeof window === "undefined") return;

  const { pathname } = window.location;
  const isGuestAuthRoute =
    pathname === LOGIN_PATH || pathname.startsWith(`${LOGIN_PATH}/`);

  if (!isGuestAuthRoute) {
    window.location.replace(LOGIN_PATH);
  }
}
