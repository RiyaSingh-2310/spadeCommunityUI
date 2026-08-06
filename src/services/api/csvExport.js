import { buildApiUrl } from "../../config/api";
import { getAuthToken } from "../auth/authStorage";
import {
  forceLogoutAfterSessionExpired,
  isSessionExpiredHandled,
  SESSION_EXPIRED_MESSAGE,
} from "../auth/sessionExpiry";
import { ApiError } from "./ApiError";
import { axiosInstance } from "./client";

/**
 * Parse filename from Content-Disposition header.
 * @param {string | undefined | null} header
 */
export function parseFilenameFromContentDisposition(header) {
  const value = String(header ?? "").trim();
  if (!value) return "";

  const utfMatch = value.match(/filename\*\s*=\s*UTF-8''([^;]+)/i);
  if (utfMatch?.[1]) {
    try {
      return decodeURIComponent(utfMatch[1].trim().replace(/^["']|["']$/g, ""));
    } catch {
      return utfMatch[1].trim().replace(/^["']|["']$/g, "");
    }
  }

  const plainMatch = value.match(/filename\s*=\s*("?)([^";]+)\1/i);
  if (plainMatch?.[2]) {
    return plainMatch[2].trim();
  }

  return "";
}

/**
 * Trigger a browser file download from a Blob without opening a new tab.
 * @param {Blob} blob
 * @param {string} filename
 */
export function triggerBrowserFileDownload(blob, filename) {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename || "export.csv";
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}

async function blobToJsonMessage(blob) {
  try {
    const text = await blob.text();
    if (!text?.trim()) return null;
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === "object") {
      return String(parsed.message ?? parsed.error ?? "").trim() || null;
    }
  } catch {
    // not JSON
  }
  return null;
}

/**
 * GET a CSV export endpoint and download the file as a Blob.
 * Reusable across Admin / Clients / Partners / future modules.
 *
 * @param {string} path API path starting with /api/...
 * @param {{ defaultFilename?: string }} [options]
 */
export async function downloadCsvExport(path, { defaultFilename = "export.csv" } = {}) {
  if (isSessionExpiredHandled()) {
    throw new ApiError(SESSION_EXPIRED_MESSAGE, null, 401, { sessionExpired: true });
  }

  const token = getAuthToken();
  if (!token) {
    throw new ApiError(SESSION_EXPIRED_MESSAGE, null, 401);
  }

  let response;
  try {
    response = await axiosInstance.request({
      url: buildApiUrl(path),
      method: "GET",
      responseType: "blob",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "text/csv, application/octet-stream, */*",
      },
    });
  } catch (error) {
    if (!error.response) {
      throw new ApiError("Unable to reach the server. Please try again.", null, 0);
    }

    const status = error.response.status;
    const data = error.response.data;

    if (status === 401) {
      forceLogoutAfterSessionExpired();
      throw new ApiError(SESSION_EXPIRED_MESSAGE, null, 401, { sessionExpired: true });
    }

    let message = "";
    if (data instanceof Blob) {
      message = (await blobToJsonMessage(data)) || "";
    } else if (data && typeof data === "object") {
      message = String(data.message ?? data.error ?? "").trim();
    }

    if (!message) {
      message =
        status === 403
          ? "You do not have permission to export this data."
          : status === 404
            ? "CSV export is not available for this module yet."
            : "Unable to download CSV. Please try again.";
    }

    throw new ApiError(message, data, status);
  }

  const blob = response.data;
  if (!(blob instanceof Blob) || blob.size === 0) {
    throw new ApiError("Empty CSV response. Nothing to download.", null, 0);
  }

  const contentType = String(response.headers?.["content-type"] ?? "").toLowerCase();
  if (contentType.includes("application/json")) {
    const message =
      (await blobToJsonMessage(blob)) || "Unable to download CSV. Please try again.";
    throw new ApiError(message, null, response.status || 0);
  }

  // Guard against error payloads returned as text/plain JSON.
  if (contentType.includes("text/plain") || contentType.includes("text/html")) {
    const peek = await blob.slice(0, 64).text();
    if (peek.trim().startsWith("{")) {
      const message =
        (await blobToJsonMessage(blob)) || "Unable to download CSV. Please try again.";
      throw new ApiError(message, null, response.status || 0);
    }
  }

  const headerName = parseFilenameFromContentDisposition(
    response.headers?.["content-disposition"]
  );
  const filename = headerName || defaultFilename;

  triggerBrowserFileDownload(blob, filename);

  return {
    success: true,
    message: "CSV downloaded successfully.",
    filename,
  };
}
