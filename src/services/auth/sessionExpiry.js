import toast from "../toast/toast";
import { notifyPartnerUrlTabsAdminLogout } from "../../modules/survey/utils/partnerUrlTabSync";
import { clearAuthSession, getAuthToken } from "./authStorage";

export const SESSION_EXPIRED_MESSAGE =
  "Your session has expired. Please log in again.";

const LOGIN_PATH = "/auth";
const PENDING_SESSION_EXPIRED_TOAST_KEY = "auth:pending-session-expired-toast";

/** Blocks further authenticated API calls after forced logout begins. */
let sessionExpiredHandled = false;

/** True while an intentional Sign Out is in progress (skip duplicate forced logout). */
let intentionalLogoutInProgress = false;

/** Single in-flight expired-session logout (API + clear + redirect). */
let expiredLogoutInFlight = null;

export function isSessionExpiredHandled() {
  return sessionExpiredHandled;
}

export function isIntentionalLogoutInProgress() {
  return intentionalLogoutInProgress;
}

/** Mark intentional logout so concurrent 401 handlers do not double-redirect. */
export function beginIntentionalLogout() {
  intentionalLogoutInProgress = true;
}

export function endIntentionalLogout() {
  intentionalLogoutInProgress = false;
}

/** Resets forced-logout guard after a successful login. */
export function resetSessionExpiredState() {
  sessionExpiredHandled = false;
  intentionalLogoutInProgress = false;
  expiredLogoutInFlight = null;
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

function redirectToLoginAfterExpiry() {
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

/**
 * Clears auth state after the token/session expires.
 * Calls POST /api/admin/logout once when a token is still present, then
 * redirects to login. Safe to call from JWT expiry and concurrent 401s.
 */
export function forceLogoutAfterSessionExpired() {
  if (intentionalLogoutInProgress || sessionExpiredHandled) {
    return expiredLogoutInFlight;
  }
  sessionExpiredHandled = true;
  beginIntentionalLogout();

  expiredLogoutInFlight = (async () => {
    try {
      const { stopAuthSessionLifecycle } = await import("./sessionLifecycle");
      stopAuthSessionLifecycle();
    } catch {
      // Lifecycle may already be stopped.
    }

    try {
      if (getAuthToken()) {
        const { logoutAdmin } = await import("./authApi");
        await logoutAdmin();
      }
    } catch {
      // Logout API may reject an already-expired token; still clear locally.
    }

    notifyPartnerUrlTabsAdminLogout();
    clearAuthSession();
    redirectToLoginAfterExpiry();
  })();

  return expiredLogoutInFlight;
}
