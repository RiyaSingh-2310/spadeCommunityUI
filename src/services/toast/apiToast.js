import { ApiError } from "../api/ApiError";
import toast from "./toast";

export const DEFAULT_SUCCESS_TOAST =
  "Operation completed successfully.";
export const DEFAULT_ERROR_TOAST =
  "Something went wrong. Please try again.";

/**
 * Prefer API `message` (and common nested shapes); else fallback.
 * @param {unknown} value
 * @param {string} [fallback]
 */
export function resolveApiToastMessage(
  value,
  fallback = DEFAULT_SUCCESS_TOAST
) {
  if (typeof value === "string") {
    const text = value.trim();
    if (text) return text;
  }
  if (value && typeof value === "object") {
    // Prefer Error.message first (ApiError / native Error).
    if (value instanceof Error) {
      const errText = String(value.message ?? "").trim();
      if (errText) return errText;
      const nested = value.data;
      if (nested && typeof nested === "object") {
        const fromData = String(nested.message ?? nested.msg ?? "").trim();
        if (fromData) return fromData;
      }
    }

    const candidates = [
      value.message,
      value.msg,
      typeof value.error === "string" ? value.error : value.error?.message,
      value.data?.message,
      value.data?.msg,
      value.response?.data?.message,
    ];
    for (const candidate of candidates) {
      const text = String(candidate ?? "").trim();
      if (text) return text;
    }
  }
  return String(fallback ?? "").trim();
}

/**
 * Show API error using response.message (via ApiError).
 * @param {unknown} error
 * @param {string} [fallbackMessage]
 * @param {{ force?: boolean, duration?: number }} [options]
 */
export function toastApiError(
  error,
  fallbackMessage = DEFAULT_ERROR_TOAST,
  options = {}
) {
  if (error instanceof ApiError && error.sessionExpired) {
    return;
  }
  const message = resolveApiToastMessage(
    error instanceof ApiError ? error : error,
    fallbackMessage || DEFAULT_ERROR_TOAST
  );
  if (message) {
    toast.error(message, {
      force: options.force !== false,
      ...(typeof options.duration === "number"
        ? { duration: options.duration }
        : {}),
    });
  }
}

/**
 * Show API success using response.message.
 * @param {{ message?: string } | string | null | undefined} data
 * @param {string} [fallbackMessage]
 * @param {{ force?: boolean, duration?: number }} [options]
 */
export function toastApiSuccess(
  data,
  fallbackMessage = DEFAULT_SUCCESS_TOAST,
  options = {}
) {
  const message = resolveApiToastMessage(
    data,
    fallbackMessage || DEFAULT_SUCCESS_TOAST
  );
  if (message) {
    toast.success(message, {
      force: options.force !== false,
      ...(typeof options.duration === "number"
        ? { duration: options.duration }
        : {}),
    });
  }
}

/**
 * @param {{ message?: string } | string | null | undefined} data
 * @param {string} [fallbackMessage]
 * @param {{ force?: boolean, duration?: number }} [options]
 */
export function toastApiWarning(data, fallbackMessage = "", options = {}) {
  const message = resolveApiToastMessage(data, fallbackMessage);
  if (message) {
    toast.warning(message, {
      force: options.force !== false,
      ...(typeof options.duration === "number"
        ? { duration: options.duration }
        : {}),
    });
  }
}

/**
 * @param {{ message?: string } | string | null | undefined} data
 * @param {string} [fallbackMessage]
 * @param {{ force?: boolean, duration?: number }} [options]
 */
export function toastApiInfo(data, fallbackMessage = "", options = {}) {
  const message = resolveApiToastMessage(data, fallbackMessage);
  if (message) {
    toast.info(message, {
      force: options.force !== false,
      ...(typeof options.duration === "number"
        ? { duration: options.duration }
        : {}),
    });
  }
}
