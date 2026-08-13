const DEFAULT_DURATION = 3500;
const DEDUPE_MS = 2500;
const MAX_TOASTS = 2;

let toasts = [];
let listeners = new Set();
let theme = "light";
let toastId = 0;
let lastShown = { message: "", type: "", at: 0 };

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

export function pushToast(type, message, duration = DEFAULT_DURATION) {
  const trimmed = String(message ?? "").trim();
  if (!trimmed || shouldDedupe(trimmed, type)) {
    return null;
  }

  // Replace an existing toast with the same message+type instead of stacking.
  const existing = toasts.find((t) => t.message === trimmed && t.type === type);
  if (existing) {
    toasts = toasts.filter((t) => t.id !== existing.id);
  }

  const id = ++toastId;
  const toast = { id, type, message: trimmed, duration };
  // Keep the newest toasts only — prevents covering header controls.
  toasts = [...toasts, toast].slice(-MAX_TOASTS);
  notify();

  window.setTimeout(() => removeToast(id), duration);
  return id;
}

export function removeToast(id) {
  toasts = toasts.filter((t) => t.id !== id);
  notify();
}

export function clearToasts() {
  toasts = [];
  notify();
}

export { DEFAULT_DURATION };
