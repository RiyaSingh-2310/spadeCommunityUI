const DEFAULT_DURATION = 4500;
const DEDUPE_MS = 2500;
const MAX_TOASTS = 3;

let toasts = [];
let listeners = new Set();
let theme = "light";
let toastId = 0;
let lastShown = { message: "", type: "", at: 0 };
/** @type {Map<number, number>} */
const timeouts = new Map();

function notify() {
  listeners.forEach((listener) => listener(toasts));
}

export function subscribe(listener) {
  listeners.add(listener);
  listener(toasts);
  return () => listeners.delete(listener);
}

export function setToastTheme(isDarkMode) {
  theme = isDarkMode ? "dark" : "light";
  notify();
}

export function getToastTheme() {
  return theme;
}

function shouldDedupe(message, type) {
  const now = Date.now();
  if (
    message === lastShown.message &&
    type === lastShown.type &&
    now - lastShown.at < DEDUPE_MS
  ) {
    return true;
  }
  lastShown = { message, type, at: now };
  return false;
}

function clearToastTimeout(id) {
  const handle = timeouts.get(id);
  if (handle != null) {
    window.clearTimeout(handle);
    timeouts.delete(id);
  }
}

function scheduleRemoval(id, duration) {
  clearToastTimeout(id);
  if (!(duration > 0)) return;
  const handle = window.setTimeout(() => {
    timeouts.delete(id);
    removeToast(id);
  }, duration);
  timeouts.set(id, handle);
}

/**
 * @param {string} type
 * @param {string} message
 * @param {number} [duration]
 * @param {{ force?: boolean }} [options] force skips short-window dedupe
 */
export function pushToast(type, message, duration = DEFAULT_DURATION, options = {}) {
  const trimmed = String(message ?? "").trim();
  if (!trimmed) return null;

  const force = Boolean(options?.force);
  if (!force && shouldDedupe(trimmed, type)) {
    return null;
  }
  if (force) {
    lastShown = { message: trimmed, type, at: Date.now() };
  }

  // Replace an existing toast with the same message+type and reset its timer.
  const existing = toasts.find((t) => t.message === trimmed && t.type === type);
  if (existing) {
    clearToastTimeout(existing.id);
    toasts = toasts.filter((t) => t.id !== existing.id);
  }

  const id = ++toastId;
  const toast = { id, type, message: trimmed, duration };
  // Keep the newest toasts only — prevents covering header controls.
  toasts = [...toasts, toast].slice(-MAX_TOASTS);
  // Drop timeouts for toasts that fell off the stack.
  const liveIds = new Set(toasts.map((t) => t.id));
  for (const [timeoutId] of timeouts) {
    if (!liveIds.has(timeoutId)) clearToastTimeout(timeoutId);
  }

  notify();
  scheduleRemoval(id, duration);
  return id;
}

export function removeToast(id) {
  clearToastTimeout(id);
  toasts = toasts.filter((t) => t.id !== id);
  notify();
}

export function clearToasts() {
  for (const [id] of timeouts) {
    clearToastTimeout(id);
  }
  toasts = [];
  notify();
}

export { DEFAULT_DURATION };
