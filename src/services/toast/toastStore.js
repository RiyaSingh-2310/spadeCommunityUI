const DEFAULT_DURATION = 3500;
const DEDUPE_MS = 400;

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

  const id = ++toastId;
  const toast = { id, type, message: trimmed, duration };
  toasts = [...toasts, toast].slice(-5);
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
