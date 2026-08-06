import toast from "../toast/toast";
import { notifyPartnerUrlTabsAdminLogout } from "../../modules/survey/utils/partnerUrlTabSync";
import { clearAuthSession } from "./authStorage";

export const SESSION_EXPIRED_MESSAGE =
  "Your session has expired. Please log in again.";

const LOGIN_PATH = "/auth";
const PENDING_SESSION_EXPIRED_TOAST_KEY = "auth:pending-session-expired-toast";

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
 * Shows the session-expired toast after a hard redirect to the login page.
 * Called once on app mount when forceLogoutAfterSessionExpired queued a toast.
 */
export function consumeSessionExpiredToast() {
  if (typeof window === "undefined") return;
  if (sessionStorage.getItem(PENDING_SESSION_EXPIRED_TOAST_KEY) !== "1") return;

  sessionStorage.removeItem(PENDING_SESSION_EXPIRED_TOAST_KEY);
  toast.error(SESSION_EXPIRED_MESSAGE);
}

/**
 * Clears auth state, shows session-expired toast once, and redirects to login.
 * Safe to call from multiple concurrent 401 handlers — only runs once.
 */
export function forceLogoutAfterSessionExpired() {
  if (sessionExpiredHandled) return;
  sessionExpiredHandled = true;

  notifyPartnerUrlTabsAdminLogout();
  clearAuthSession();

  if (typeof window === "undefined") return;

  const { pathname } = window.location;
  const isGuestAuthRoute =
    pathname === LOGIN_PATH || pathname.startsWith(`${LOGIN_PATH}/`);

  if (isGuestAuthRoute) {
    toast.error(SESSION_EXPIRED_MESSAGE);
    return;
  }

  sessionStorage.setItem(PENDING_SESSION_EXPIRED_TOAST_KEY, "1");
  window.location.replace(LOGIN_PATH);
}
