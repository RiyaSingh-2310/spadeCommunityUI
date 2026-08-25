import axios from "axios";
import { API_DEBUG, API_LOGIN_BEARER_TOKEN, buildApiUrl } from "../../config/api";
import { getAuthToken } from "../auth/authStorage";
import { shouldInvalidateSessionOn401 } from "../auth/jwtUtils";
import { tryRefreshAuthSession } from "../auth/refreshSession";
import {
  forceLogoutAfterSessionExpired,
  isIntentionalLogoutInProgress,
  isSessionExpiredHandled,
  SESSION_EXPIRED_MESSAGE,
} from "../auth/sessionExpiry";
import { ApiError } from "./ApiError";

const DEFAULT_REQUEST_TIMEOUT_MS = 30000;

const HTTP_STATUS_MESSAGES = {
  400: "Bad request. Please check your input.",
  401: SESSION_EXPIRED_MESSAGE,
  403: "You do not have permission to perform this action.",
  404: "The requested resource was not found.",
  409: "This action conflicts with the current state. Please refresh and try again.",
  422: "Unable to process the request. Please check your input.",
  500: "Internal server error. Please try again later.",
  502: "The API server is unavailable (502 Bad Gateway). Ensure the backend is running and reachable.",
  503: "Service temporarily unavailable. Please try again later.",
  504: "Gateway timeout. The server took too long to respond.",
};

/**
 * Shared Axios instance used by all API modules.
 * Auth, Content-Type, and logging are applied via interceptors / apiRequest.
 */
export const axiosInstance = axios.create({
  timeout: DEFAULT_REQUEST_TIMEOUT_MS,
  headers: {
    Accept: "application/json",
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
    // Let the browser/Axios set multipart boundaries for FormData.
    if (typeof FormData !== "undefined" && config.data instanceof FormData) {
      if (config.headers) {
        if (typeof config.headers.delete === "function") {
          config.headers.delete("Content-Type");
          config.headers.delete("content-type");
        } else {
          delete config.headers["Content-Type"];
          delete config.headers["content-type"];
        }
      }
    }

    if (API_DEBUG) {
      console.info(
        "[API]",
        String(config.method ?? "get").toUpperCase(),
        config.url ?? ""
      );
    }

    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => {
    if (API_DEBUG) {
      console.info("[API] Response status:", response.status);
    }
    return response;
  },
  (error) => {
    if (API_DEBUG && error.response) {
      console.error("[API] Error status:", error.response.status);
    }
    return Promise.reject(error);
  }
);

/**
 * @param {{ status?: number, statusText?: string } | null} response
 * @param {unknown} data
 * @param {string} [rawText]
 */
export function extractErrorMessage(response, data, rawText = "") {
  const message =
    data && typeof data === "object" && data.message != null
      ? String(data.message).trim()
      : "";
  const detail =
    data && typeof data === "object" && data.error != null
      ? String(data.error).trim()
      : "";

  if (message && detail && detail !== message) {
    const genericMessages = new Set([
      "server error!",
      "internal server error",
      "request failed",
      "something went wrong",
    ]);

    if (genericMessages.has(message.toLowerCase())) {
      return detail;
    }

    return `${message} (${detail})`;
  }

  if (message) return message;
  if (detail) return detail;

  if (data?.errors && typeof data.errors === "object") {
    const messages = Object.values(data.errors)
      .flat()
      .map((entry) => (typeof entry === "string" ? entry : entry?.message))
      .filter(Boolean);
    if (messages.length) return messages.join(" ");
  }

  if (typeof data === "string" && data.trim()) return data.trim();

  const text = rawText || (typeof data === "string" ? data : "");
  const preMatch = text?.match?.(/<pre>([^<]+)<\/pre>/i);
  if (preMatch?.[1]) {
    return preMatch[1].trim();
  }

  if (text?.trim() && !text.includes("<!DOCTYPE")) {
    return text.trim();
  }

  if (response?.status && HTTP_STATUS_MESSAGES[response.status]) {
    return HTTP_STATUS_MESSAGES[response.status];
  }

  if (response?.status) {
    return response.statusText
      ? `${response.statusText} (${response.status})`
      : `Request failed (${response.status})`;
  }

  return "Request failed";
}

function normalizeErrorPayload(data) {
  if (data == null) return { data: null, rawText: "" };
  if (typeof data === "string") {
    const trimmed = data.trim();
    if (!trimmed) return { data: null, rawText: "" };
    try {
      return { data: JSON.parse(trimmed), rawText: trimmed };
    } catch {
      return { data: null, rawText: trimmed };
    }
  }
  return { data, rawText: "" };
}

function toNetworkApiError(error) {
  if (error?.code === "ECONNABORTED" || error?.message?.toLowerCase?.().includes("timeout")) {
    return new ApiError("Request timed out. Please try again.");
  }
  if (API_DEBUG) {
    console.error("[API] Network error");
  }
  return new ApiError("Unable to reach the server. Please try again.");
}

/**
 * Central HTTP helper used by all service modules.
 * Preserves the previous fetch-based contract (returns parsed body, throws ApiError).
 *
 * On 401 for authenticated requests: attempts one refresh-token exchange, then
 * retries the original request once. Blind multi-retries with the same expired
 * token were removed (H1).
 *
 * @param {string} path Path starting with /api/...
 * @param {{
 *   method?: string,
 *   body?: unknown,
 *   auth?: boolean,
 *   loginBearer?: boolean,
 *   skipSessionExpiryOn401?: boolean,
 *   headers?: Record<string, string>,
 *   responseType?: import('axios').ResponseType,
 *   _retriedAfterRefresh?: boolean,
 * }} [options]
 */
export async function apiRequest(path, options = {}) {
  const {
    method = "GET",
    body,
    auth = true,
    /** When auth is false, still send VITE_API_LOGIN_BEARER_TOKEN (forgot-password flow). */
    loginBearer = false,
    /** Skip forced session-expired redirect on 401 (intentional logout). */
    skipSessionExpiryOn401 = false,
    headers: extraHeaders = {},
    responseType = "json",
    _retriedAfterRefresh = false,
  } = options;

  if (auth && isSessionExpiredHandled() && !isIntentionalLogoutInProgress()) {
    throw new ApiError(SESSION_EXPIRED_MESSAGE, null, 401, { sessionExpired: true });
  }

  const hasBody = body !== undefined;
  const isFormDataBody = typeof FormData !== "undefined" && body instanceof FormData;
  const headers = {
    ...(hasBody && !isFormDataBody ? { "Content-Type": "application/json" } : {}),
    ...extraHeaders,
  };

  if (auth) {
    const token = getAuthToken();
    if (!token) {
      if (API_DEBUG) {
        console.error("[API] Missing auth token for protected request");
      }
      throw new ApiError(HTTP_STATUS_MESSAGES[401], null, 401);
    }
    headers.Authorization = `Bearer ${token}`;
  } else if (loginBearer && API_LOGIN_BEARER_TOKEN) {
    // M4: token is public in the bundle — only send when backend requires it.
    headers.Authorization = `Bearer ${API_LOGIN_BEARER_TOKEN}`;
  }

  const url = buildApiUrl(path);
  const requestConfig = {
    url,
    method,
    headers,
    responseType,
    skipAuth: !auth,
    data: hasBody ? body : undefined,
  };

  try {
    const response = await axiosInstance.request(requestConfig);
    return response.data;
  } catch (error) {
    if (!error.response) {
      throw toNetworkApiError(error);
    }

    const status = error.response.status;
    const { data, rawText } = normalizeErrorPayload(error.response.data);

    if (status === 401 && auth) {
      if (skipSessionExpiryOn401) {
        throw new ApiError(
          extractErrorMessage(error.response, data, rawText) || SESSION_EXPIRED_MESSAGE,
          data,
          401
        );
      }

      if (!_retriedAfterRefresh) {
        const refreshed = await tryRefreshAuthSession();
        if (refreshed) {
          return apiRequest(path, { ...options, _retriedAfterRefresh: true });
        }
      }

      // Do not force-logout while the user is explicitly signing out.
      // Do not clear a still-valid JWT just because one endpoint returned 401.
      const sessionExpired = shouldInvalidateSessionOn401(getAuthToken());
      if (!isIntentionalLogoutInProgress() && sessionExpired) {
        forceLogoutAfterSessionExpired();
      }
      throw new ApiError(
        sessionExpired
          ? SESSION_EXPIRED_MESSAGE
          : extractErrorMessage(error.response, data, rawText) || SESSION_EXPIRED_MESSAGE,
        data,
        401,
        { sessionExpired }
      );
    }

    const message = extractErrorMessage(error.response, data, rawText);
    if (API_DEBUG) {
      console.error("[API] Error status:", status);
    }
    throw new ApiError(message, data, status);
  }
}
