import { getAuthToken, getRefreshToken, isAuthenticated } from "./authStorage";
import { getJwtMsUntilExpiry, JWT_EXPIRY_SKEW_MS } from "./jwtUtils";
import { tryRefreshAuthSession } from "./refreshSession";

/** Refresh access token this long before JWT `exp` (only if a refresh token exists). */
const REFRESH_BEFORE_EXPIRY_MS = 90_000;

let started = false;
let refreshTimerId = null;
let expiryLogoutTimerId = null;
let sessionExpiredHandler = null;
let sessionExpiredQueued = false;

function clearTimer(id) {
  if (id != null) window.clearTimeout(id);
  return null;
}

function hasRefreshToken() {
  return Boolean(String(getRefreshToken() ?? "").trim());
}

async function refreshIfNeeded() {
  if (!isAuthenticated() || !hasRefreshToken()) return false;

  const msUntilExpiry = getJwtMsUntilExpiry(getAuthToken());
  if (msUntilExpiry == null) return false;
  if (msUntilExpiry <= REFRESH_BEFORE_EXPIRY_MS) {
    return tryRefreshAuthSession();
  }
  return false;
}

function scheduleExpiryRefresh() {
  refreshTimerId = clearTimer(refreshTimerId);
  if (!started || !isAuthenticated() || !hasRefreshToken()) return;

  const msUntilExpiry = getJwtMsUntilExpiry(getAuthToken());
  if (msUntilExpiry == null) return;

  const delay = Math.max(5_000, msUntilExpiry - REFRESH_BEFORE_EXPIRY_MS);
  refreshTimerId = window.setTimeout(() => {
    refreshIfNeeded()
      .catch(() => false)
      .finally(() => {
        scheduleExpiryRefresh();
        scheduleTokenExpiryLogout();
      });
  }, delay);
}

function triggerSessionExpired() {
  if (sessionExpiredQueued) return;
  sessionExpiredQueued = true;

  const handler = sessionExpiredHandler;
  stopAuthSessionLifecycle();

  if (typeof handler !== "function") return;

  try {
    const result = handler();
    if (result && typeof result.catch === "function") {
      result.catch(() => {});
    }
  } catch {
    // Token-expiry logout must not throw from a timer callback.
  }
}

async function handleTokenExpiry() {
  if (!started || sessionExpiredQueued || !isAuthenticated()) return;

  if (hasRefreshToken()) {
    try {
      const refreshed = await tryRefreshAuthSession();
      if (refreshed && isAuthenticated()) {
        scheduleExpiryRefresh();
        scheduleTokenExpiryLogout();
        return;
      }
    } catch {
      // Fall through to session-expired logout.
    }
  }

  triggerSessionExpired();
}

function scheduleTokenExpiryLogout() {
  expiryLogoutTimerId = clearTimer(expiryLogoutTimerId);
  if (!started || !isAuthenticated() || sessionExpiredQueued) return;

  const msUntilExpiry = getJwtMsUntilExpiry(getAuthToken());
  if (msUntilExpiry == null) {
    // Opaque tokens have no exp claim; wait for an authenticated 401 instead.
    return;
  }

  const delay = Math.max(0, msUntilExpiry - JWT_EXPIRY_SKEW_MS);
  expiryLogoutTimerId = window.setTimeout(() => {
    handleTokenExpiry().catch(() => {});
  }, delay);
}

/**
 * Start JWT expiry monitoring and optional refresh-before-expiry.
 * Does not use inactivity, activity events, or a fixed idle duration.
 * @param {{ onSessionExpired?: () => void | Promise<void> }} [options]
 */
export function startAuthSessionLifecycle({ onSessionExpired } = {}) {
  if (typeof window === "undefined") return;
  if (!isAuthenticated()) return;

  if (started) {
    if (sessionExpiredQueued) return;
    sessionExpiredHandler = onSessionExpired ?? sessionExpiredHandler;
    scheduleExpiryRefresh();
    scheduleTokenExpiryLogout();
    return;
  }

  started = true;
  sessionExpiredQueued = false;
  sessionExpiredHandler = onSessionExpired ?? null;

  scheduleExpiryRefresh();
  scheduleTokenExpiryLogout();
}

/** Stop expiry monitoring (logout / leaving admin shell). */
export function stopAuthSessionLifecycle() {
  if (typeof window === "undefined") return;

  started = false;
  sessionExpiredHandler = null;
  refreshTimerId = clearTimer(refreshTimerId);
  expiryLogoutTimerId = clearTimer(expiryLogoutTimerId);
}
