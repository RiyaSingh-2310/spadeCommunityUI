import { ApiError } from "../api/ApiError";
import toast from "./toast";

/**
 * Show API error using response.message (via ApiError).
 * @param {unknown} error
 */
export function toastApiError(error) {
  if (error instanceof ApiError && error.sessionExpired) {
    return;
  }
  const message =
    error instanceof ApiError ? error.message : error?.message ?? "";
  if (message) {
    toast.error(message);
  }
}

/**
 * Show API success using response.message.
 * @param {{ message?: string } | null | undefined} data
 */
export function toastApiSuccess(data) {
  if (data?.message) {
    toast.success(data.message);
  }
}

/**
 * @param {{ message?: string } | null | undefined} data
 */
export function toastApiWarning(data) {
  if (data?.message) {
    toast.warning(data.message);
  }
}

/**
 * @param {{ message?: string } | null | undefined} data
 */
export function toastApiInfo(data) {
  if (data?.message) {
    toast.info(data.message);
  }
}
