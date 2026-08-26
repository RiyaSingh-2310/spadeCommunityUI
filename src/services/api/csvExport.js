import { buildApiUrl } from "../../config/api";
import { getAuthToken } from "../auth/authStorage";
import { tryRefreshAuthSession } from "../auth/refreshSession";
import {
  forceLogoutAfterSessionExpired,
  isIntentionalLogoutInProgress,
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
 * Build a dated export filename for consistent CSV naming (L4).
 * @param {string} baseName e.g. "panelists" or "panelists-export.csv"
 * @param {string} [extension="csv"]
 */
export function buildDatedExportFilename(baseName, extension = "csv") {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const stamp = `${yyyy}${mm}${dd}`;
  const raw = String(baseName ?? "export").trim() || "export";
  const withoutExt = raw.replace(/\.[a-z0-9]+$/i, "");
  const safeBase = withoutExt.replace(/[^a-zA-Z0-9_-]+/g, "-") || "export";
  const ext = String(extension ?? "csv").replace(/^\./, "") || "csv";
  return `${safeBase}-${stamp}.${ext}`;
}

/**
 * Sanitize a download filename fragment (L2).
 * @param {unknown} value
 */
export function sanitizeDownloadFilenamePart(value) {
  const text = String(value ?? "").trim() || "file";
  return text.replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "") || "file";
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
  anchor.download = filename || buildDatedExportFilename("export");
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
 * GET a binary/file export endpoint and download the response as a Blob.
 *
 * @param {string} path API path starting with /api/...
 * @param {{
 *   defaultFilename?: string,
 *   accept?: string,
 *   emptyMessage?: string,
 *   notFoundMessage?: string,
 *   failureMessage?: string,
 * }} [options]
 */
export async function downloadFileExport(
  path,
  {
    defaultFilename = buildDatedExportFilename("export"),
    accept = "application/octet-stream, */*",
    emptyMessage = "Empty file response. Nothing to download.",
    notFoundMessage = "File download is not available for this module yet.",
    failureMessage = "Unable to download file. Please try again.",
  } = {}
) {
  if (isSessionExpiredHandled()) {
    throw new ApiError(SESSION_EXPIRED_MESSAGE, null, 401, { sessionExpired: true });
  }

  const token = getAuthToken();
  if (!token) {
    throw new ApiError(SESSION_EXPIRED_MESSAGE, null, 401);
  }

  const requestOnce = async (authToken) =>
    axiosInstance.request({
      url: buildApiUrl(path),
      method: "GET",
      responseType: "blob",
      headers: {
        Authorization: `Bearer ${authToken}`,
        Accept: accept,
      },
    });

  async function throwFromDownloadError(error) {
    if (!error.response) {
      throw new ApiError("Unable to reach the server. Please try again.", null, 0);
    }

    const status = error.response.status;
    const data = error.response.data;

    if (status === 401) {
      if (!isIntentionalLogoutInProgress()) {
        forceLogoutAfterSessionExpired();
      }
      throw new ApiError(SESSION_EXPIRED_MESSAGE, data, 401, {
        sessionExpired: true,
      });
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
          ? "You do not have permission to download this file."
          : status === 404
            ? notFoundMessage
            : failureMessage;
    }

    throw new ApiError(message, data, status);
  }

  let response;
  try {
    response = await requestOnce(token);
  } catch (error) {
    if (error.response?.status === 401) {
      const refreshed = await tryRefreshAuthSession();
      const nextToken = refreshed ? getAuthToken() : "";
      if (nextToken) {
        try {
          response = await requestOnce(nextToken);
        } catch (retryError) {
          await throwFromDownloadError(retryError);
        }
      } else {
        await throwFromDownloadError(error);
      }
    } else {
      await throwFromDownloadError(error);
    }
  }

  const blob = response.data;
  if (!(blob instanceof Blob) || blob.size === 0) {
    throw new ApiError(emptyMessage, null, 0);
  }

  const contentType = String(response.headers?.["content-type"] ?? "").toLowerCase();
  if (contentType.includes("application/json")) {
    const message = (await blobToJsonMessage(blob)) || failureMessage;
    throw new ApiError(message, null, response.status || 0);
  }

  // Guard against error payloads returned as text/plain JSON.
  if (contentType.includes("text/plain") || contentType.includes("text/html")) {
    const peek = await blob.slice(0, 64).text();
    if (peek.trim().startsWith("{")) {
      const message = (await blobToJsonMessage(blob)) || failureMessage;
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
    message: "File downloaded successfully.",
    filename,
  };
}

/**
 * GET a CSV export endpoint and download the file as a Blob.
 * Reusable across Admin / Clients / Partners / future modules.
 *
 * H4 / UTF-8 BOM: Prefer the backend to emit a leading U+FEFF so Excel opens
 * non-ASCII correctly. Do not rewrite the blob here — that risks a double BOM
 * once the server is fixed.
 *
 * @param {string} path API path starting with /api/...
 * @param {{ defaultFilename?: string }} [options]
 */
export async function downloadCsvExport(path, { defaultFilename } = {}) {
  const result = await downloadFileExport(path, {
    defaultFilename: defaultFilename || buildDatedExportFilename("export"),
    accept: "text/csv, application/octet-stream, */*",
    emptyMessage: "Empty CSV response. Nothing to download.",
    notFoundMessage: "CSV export is not available for this module yet.",
    failureMessage: "Unable to download CSV. Please try again.",
  });

  return {
    ...result,
    message: "CSV downloaded successfully.",
  };
}
