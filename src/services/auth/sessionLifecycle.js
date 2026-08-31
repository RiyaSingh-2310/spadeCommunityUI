import { getAuthToken, getRefreshToken, isAuthenticated } from "./authStorage";
import { getJwtMsUntilExpiry, JWT_EXPIRY_SKEW_MS } from "./jwtUtils";
import { tryRefreshAuthSession } from "./refreshSession";

/** Idle logout after this much time with no genuine user interaction. */
export const SESSION_INACTIVITY_HOURS = 2;
export const SESSION_INACTIVITY_MS = SESSION_INACTIVITY_HOURS * 60 * 60_000;

/** Refresh access token this long before JWT `exp` (only if a refresh token exists). */
const REFRESH_BEFORE_EXPIRY_MS = 90_000;

/** Avoid decoding JWT / scheduling refresh on every mousemove. */
const REFRESH_CHECK_THROTTLE_MS = 10_000;

const ACTIVITY_EVENTS = [
  "mousedown",
  "mouseup",
  "mousemove",
  "click",
  "dblclick",
  "keydown",
  "keyup",
  "scroll",
  "wheel",
  "touchstart",
  "touchmove",
  "touchend",
  "pointerdown",
  "pointermove",
  "pointerup",
  "input",
  "change",
];

const ACTIVITY_LISTENER_OPTIONS = { capture: true, passive: true };

let started = false;
let refreshTimerId = null;
let expiryLogoutTimerId = null;
let inactivityTimerId = null;
let lastActivityAt = 0;
let lastRefreshCheckAt = 0;
let sessionExpiredHandler = null;
let sessionExpiredQueued = false;
let activityBound = null;
let visibilityBound = null;

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

function maybeRefreshOnActivity() {
  const now = Date.now();
  if (now - lastRefreshCheckAt < REFRESH_CHECK_THROTTLE_MS) return;
  lastRefreshCheckAt = now;

  const msUntilExpiry = getJwtMsUntilExpiry(getAuthToken());
  if (msUntilExpiry != null && msUntilExpiry <= REFRESH_BEFORE_EXPIRY_MS) {
    refreshIfNeeded().catch(() => {});
  }
}

function scheduleInactivityTimeout() {
  inactivityTimerId = clearTimer(inactivityTimerId);
  if (!started || !isAuthenticated() || sessionExpiredQueued) return;

  const remaining = SESSION_INACTIVITY_MS - (Date.now() - lastActivityAt);
  inactivityTimerId = window.setTimeout(() => {
    checkInactivity();
  }, Math.max(0, remaining));
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
    // Session logout must not throw from a timer callback.
  }
}

function checkInactivity() {
  if (!started || !isAuthenticated() || sessionExpiredQueued) return;

  const idleFor = Date.now() - lastActivityAt;
  if (idleFor < SESSION_INACTIVITY_MS) {
    scheduleInactivityTimeout();
    return;
  }

  triggerSessionExpired();
}

function onUserActivity() {
  if (!started || sessionExpiredQueued) return;
  lastActivityAt = Date.now();
  maybeRefreshOnActivity();
}

function onVisibilityOrFocus() {
  if (!started) return;
  checkInactivity();
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
    // Opaque tokens have no exp claim; wait for inactivity or an authenticated 401.
    return;
  }

  const delay = Math.max(0, msUntilExpiry - JWT_EXPIRY_SKEW_MS);
  expiryLogoutTimerId = window.setTimeout(() => {
    handleTokenExpiry().catch(() => {});
  }, delay);
}

function bindActivityListeners() {
  if (activityBound) return;

  activityBound = onUserActivity;
  visibilityBound = onVisibilityOrFocus;

  ACTIVITY_EVENTS.forEach((eventName) => {
    window.addEventListener(eventName, activityBound, ACTIVITY_LISTENER_OPTIONS);
  });
  document.addEventListener("visibilitychange", visibilityBound);
  window.addEventListener("focus", visibilityBound);
}

function unbindActivityListeners() {
  if (activityBound) {
    ACTIVITY_EVENTS.forEach((eventName) => {
      window.removeEventListener(eventName, activityBound, ACTIVITY_LISTENER_OPTIONS);
    });
    activityBound = null;
  }

  if (visibilityBound) {
    document.removeEventListener("visibilitychange", visibilityBound);
    window.removeEventListener("focus", visibilityBound);
    visibilityBound = null;
  }
}

/**
 * Last genuine user interaction (or session-start) timestamp.
 * @returns {number}
 */
export function getLastActivityAt() {
  return lastActivityAt;
}

/**
 * Start JWT expiry monitoring, refresh-before-expiry, and idle auto-logout.
 * Idle logout uses the same `onSessionExpired` handler as token expiry.
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
    scheduleInactivityTimeout();
    return;
  }

  started = true;
  sessionExpiredQueued = false;
  sessionExpiredHandler = onSessionExpired ?? null;
  lastActivityAt = Date.now();
  lastRefreshCheckAt = 0;

  bindActivityListeners();
  scheduleExpiryRefresh();
  scheduleTokenExpiryLogout();
  scheduleInactivityTimeout();
}

/** Stop expiry and inactivity monitoring (logout / leaving admin shell). */
export function stopAuthSessionLifecycle() {
  if (typeof window === "undefined") return;

  started = false;
  sessionExpiredHandler = null;
  refreshTimerId = clearTimer(refreshTimerId);
  expiryLogoutTimerId = clearTimer(expiryLogoutTimerId);
  inactivityTimerId = clearTimer(inactivityTimerId);
  unbindActivityListeners();
}
