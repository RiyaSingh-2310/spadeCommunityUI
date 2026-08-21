import { getSystemSettings } from "../../modules/settings/utils/settingsStorage";
import { getAuthToken, isAuthenticated } from "./authStorage";
import { getJwtMsUntilExpiry } from "./jwtUtils";
import { tryRefreshAuthSession } from "./refreshSession";

/** Prefer 10 minutes; never below this for inactivity logout. */
export const DEFAULT_SESSION_INACTIVITY_MINUTES = 10;

/** Refresh access token this long before JWT `exp`. */
const REFRESH_BEFORE_EXPIRY_MS = 90_000;

/** How often to re-check token expiry / schedule refresh. */
const KEEP_ALIVE_TICK_MS = 30_000;

/** Fallback refresh interval when JWT has no readable `exp` but a refresh token may exist. */
const FALLBACK_REFRESH_INTERVAL_MS = 8 * 60_000;

const ACTIVITY_EVENTS = [
  "mousedown",
  "mousemove",
  "keydown",
  "scroll",
  "touchstart",
  "click",
  "wheel",
];

let started = false;
let keepAliveTimerId = null;
let refreshTimerId = null;
let inactivityTimerId = null;
let lastActivityAt = Date.now();
let lastFallbackRefreshAt = 0;
let idleLogoutHandler = null;
let activityBound = null;

/**
 * Inactivity timeout from System Settings (minutes), floored at 10 minutes.
 */
export function getSessionInactivityTimeoutMs() {
  const raw = Number(getSystemSettings()?.sessionTimeout);
  const minutes =
    Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_SESSION_INACTIVITY_MINUTES;
  return Math.max(DEFAULT_SESSION_INACTIVITY_MINUTES, minutes) * 60_000;
}

function clearTimer(id) {
  if (id != null) window.clearTimeout(id);
  return null;
}

function clearIntervalTimer(id) {
  if (id != null) window.clearInterval(id);
  return null;
}

async function refreshIfNeeded() {
  if (!isAuthenticated()) return;

  const token = getAuthToken();
  const msUntilExpiry = getJwtMsUntilExpiry(token);

  if (msUntilExpiry == null) {
    const now = Date.now();
    if (now - lastFallbackRefreshAt >= FALLBACK_REFRESH_INTERVAL_MS) {
      lastFallbackRefreshAt = now;
      await tryRefreshAuthSession();
    }
    return;
  }

  if (msUntilExpiry <= REFRESH_BEFORE_EXPIRY_MS) {
    await tryRefreshAuthSession();
  }
}

function scheduleExpiryRefresh() {
  refreshTimerId = clearTimer(refreshTimerId);
  if (!isAuthenticated()) return;

  const token = getAuthToken();
  const msUntilExpiry = getJwtMsUntilExpiry(token);
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

function resetInactivityTimer() {
  inactivityTimerId = clearTimer(inactivityTimerId);
  if (!started || !isAuthenticated()) return;

  const timeoutMs = getSessionInactivityTimeoutMs();
  inactivityTimerId = window.setTimeout(() => {
    if (!isAuthenticated()) return;
    const idleFor = Date.now() - lastActivityAt;
    if (idleFor < timeoutMs - 1_000) {
      resetInactivityTimer();
      return;
    }
    idleLogoutHandler?.();
  }, timeoutMs);
}

function onUserActivity() {
  if (document.visibilityState === "hidden") return;
  lastActivityAt = Date.now();
  resetInactivityTimer();

  const msUntilExpiry = getJwtMsUntilExpiry(getAuthToken());
  if (msUntilExpiry != null && msUntilExpiry <= REFRESH_BEFORE_EXPIRY_MS) {
    refreshIfNeeded().catch(() => {});
  }
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
  idleLogoutHandler = onIdleLogout ?? null;
  lastActivityAt = Date.now();
  lastFallbackRefreshAt = 0;

  activityBound = onUserActivity;
  ACTIVITY_EVENTS.forEach((eventName) => {
    window.addEventListener(eventName, activityBound, { passive: true });
  });
  document.addEventListener("visibilitychange", activityBound);

  scheduleExpiryRefresh();
  refreshIfNeeded().catch(() => {});
  resetInactivityTimer();

  keepAliveTimerId = window.setInterval(() => {
    refreshIfNeeded().catch(() => {});
  }, KEEP_ALIVE_TICK_MS);
}

/** Stop keep-alive + inactivity monitoring (logout / leaving admin shell). */
export function stopAuthSessionLifecycle() {
  if (typeof window === "undefined") return;

  started = false;
  idleLogoutHandler = null;
  keepAliveTimerId = clearIntervalTimer(keepAliveTimerId);
  refreshTimerId = clearTimer(refreshTimerId);
  inactivityTimerId = clearTimer(inactivityTimerId);

  if (activityBound) {
    ACTIVITY_EVENTS.forEach((eventName) => {
      window.removeEventListener(eventName, activityBound);
    });
    document.removeEventListener("visibilitychange", activityBound);
    activityBound = null;
  }
}
