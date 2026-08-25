import { getAuthToken, getRefreshToken, isAuthenticated } from "./authStorage";
import { getJwtMsUntilExpiry } from "./jwtUtils";
import { tryRefreshAuthSession } from "./refreshSession";

/** Idle logout after this much time with no genuine user interaction. */
export const SESSION_INACTIVITY_MINUTES = 7;
export const SESSION_INACTIVITY_MS = SESSION_INACTIVITY_MINUTES * 60_000;

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
let inactivityTimerId = null;
let lastActivityAt = 0;
let lastRefreshCheckAt = 0;
let idleLogoutHandler = null;
let idleLogoutQueued = false;
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
  if (!isAuthenticated() || !hasRefreshToken()) return;

  const msUntilExpiry = getJwtMsUntilExpiry(getAuthToken());
  if (msUntilExpiry == null) return;
  if (msUntilExpiry <= REFRESH_BEFORE_EXPIRY_MS) {
    await tryRefreshAuthSession();
  }
}

function scheduleExpiryRefresh() {
  refreshTimerId = clearTimer(refreshTimerId);
  if (!started || !isAuthenticated() || !hasRefreshToken()) return;

  const msUntilExpiry = getJwtMsUntilExpiry(getAuthToken());
  if (msUntilExpiry == null) return;

  const delay = Math.max(5_000, msUntilExpiry - REFRESH_BEFORE_EXPIRY_MS);
  refreshTimerId = window.setTimeout(() => {
    refreshIfNeeded()
      .catch(() => {})
      .finally(() => {
        scheduleExpiryRefresh();
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
  if (!started || !isAuthenticated()) return;

  const remaining = SESSION_INACTIVITY_MS - (Date.now() - lastActivityAt);
  inactivityTimerId = window.setTimeout(() => {
    checkInactivity();
  }, Math.max(0, remaining));
}

function triggerIdleLogout() {
  if (idleLogoutQueued) return;
  idleLogoutQueued = true;

  const handler = idleLogoutHandler;
  stopAuthSessionLifecycle();

  if (typeof handler !== "function") return;

  try {
    const result = handler();
    if (result && typeof result.catch === "function") {
      result.catch(() => {});
    }
  } catch {
    // Idle logout must not throw from a timer callback.
  }
}

function checkInactivity() {
  if (!started || !isAuthenticated() || idleLogoutQueued) return;

  const idleFor = Date.now() - lastActivityAt;
  if (idleFor < SESSION_INACTIVITY_MS) {
    scheduleInactivityTimeout();
    return;
  }

  triggerIdleLogout();
}

function onUserActivity() {
  if (!started || idleLogoutQueued) return;
  lastActivityAt = Date.now();
  maybeRefreshOnActivity();
}

function onVisibilityOrFocus() {
  if (!started) return;
  checkInactivity();
}

/**
 * Last genuine user interaction (or session-start) timestamp.
 * @returns {number}
 */
export function getLastActivityAt() {
  return lastActivityAt;
}

/**
 * Start keep-alive + inactivity monitoring for the authenticated admin shell.
 * @param {{ onIdleLogout?: () => void | Promise<void> }} [options]
 */
export function startAuthSessionLifecycle({ onIdleLogout } = {}) {
  if (typeof window === "undefined") return;
  if (started) {
    idleLogoutHandler = onIdleLogout ?? idleLogoutHandler;
    return;
  }
  if (!isAuthenticated()) return;

  started = true;
  idleLogoutQueued = false;
  idleLogoutHandler = onIdleLogout ?? null;
  lastActivityAt = Date.now();
  lastRefreshCheckAt = 0;

  activityBound = onUserActivity;
  visibilityBound = onVisibilityOrFocus;

  ACTIVITY_EVENTS.forEach((eventName) => {
    window.addEventListener(eventName, activityBound, ACTIVITY_LISTENER_OPTIONS);
  });
  document.addEventListener("visibilitychange", visibilityBound);
  window.addEventListener("focus", visibilityBound);

  scheduleExpiryRefresh();
  scheduleInactivityTimeout();
}

/** Stop keep-alive + inactivity monitoring (logout / leaving admin shell). */
export function stopAuthSessionLifecycle() {
  if (typeof window === "undefined") return;

  started = false;
  idleLogoutHandler = null;
  refreshTimerId = clearTimer(refreshTimerId);
  inactivityTimerId = clearTimer(inactivityTimerId);

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
