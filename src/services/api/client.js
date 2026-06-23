import { API_DEBUG, API_LOGIN_BEARER_TOKEN, buildApiUrl } from "../../config/api";
import { getAuthToken } from "../auth/authStorage";
import {
  forceLogoutAfterSessionExpired,
  isSessionExpiredHandled,
  SESSION_EXPIRED_MESSAGE,
} from "../auth/sessionExpiry";
import { ApiError } from "./ApiError";

const MAX_UNAUTHORIZED_RETRIES = 3;

const HTTP_STATUS_MESSAGES = {
  400: "Bad request. Please check your input.",
  401: SESSION_EXPIRED_MESSAGE,
  403: "You do not have permission to perform this action.",
  404: "The requested resource was not found.",
  500: "Internal server error. Please try again later.",
  502: "The API server is unavailable (502 Bad Gateway). Ensure the backend is running and reachable.",
  503: "Service temporarily unavailable. Please try again later.",
  504: "Gateway timeout. The server took too long to respond.",
};

export function extractErrorMessage(response, data, rawText) {
  if (data?.message) return String(data.message);
  if (data?.error) return String(data.error);

  if (data?.errors && typeof data.errors === "object") {
    const messages = Object.values(data.errors)
      .flat()
      .map((entry) => (typeof entry === "string" ? entry : entry?.message))
      .filter(Boolean);
    if (messages.length) return messages.join(" ");
  }

  if (typeof data === "string" && data.trim()) return data.trim();

  const preMatch = rawText?.match(/<pre>([^<]+)<\/pre>/i);
  if (preMatch?.[1]) {
    return preMatch[1].trim();
  }

  if (rawText?.trim() && !rawText.includes("<!DOCTYPE")) {
    return rawText.trim();
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

export async function readResponseBody(response) {
  const rawText = await response.text();
  if (!rawText) {
    return { data: null, rawText: "" };
  }
  try {
    return { data: JSON.parse(rawText), rawText };
  } catch {
    return { data: null, rawText };
  }
}

async function executeRequest(url, fetchInit) {
  let response;
  try {
    response = await fetch(url, fetchInit);
  } catch (networkError) {
    if (API_DEBUG) {
      console.error("[API] Network error:", networkError);
    }
    throw new ApiError("Unable to reach the server. Please try again.");
  }

  const { data, rawText } = await readResponseBody(response);

  if (API_DEBUG) {
    console.log("[API] Response status:", response.status);
    console.log("[API] Response data:", data ?? rawText);
  }

  return { response, data, rawText };
}

export async function apiRequest(path, options = {}) {
  const {
    method = "GET",
    body,
    auth = true,
    /** When auth is false, still send VITE_API_LOGIN_BEARER_TOKEN (forgot-password flow). */
    loginBearer = false,
    headers: extraHeaders = {},
  } = options;

  if (auth && isSessionExpiredHandled()) {
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
        console.error("[API] Missing auth token for protected request:", path);
      }
      throw new ApiError(HTTP_STATUS_MESSAGES[401], null, 401);
    }
    headers.Authorization = `Bearer ${token}`;
  } else if (loginBearer && API_LOGIN_BEARER_TOKEN) {
    headers.Authorization = `Bearer ${API_LOGIN_BEARER_TOKEN}`;
  }

  const url = buildApiUrl(path);
  const fetchInit = {
    method,
    headers,
    body:
      body === undefined
        ? undefined
        : isFormDataBody
          ? body
          : JSON.stringify(body),
  };

  if (API_DEBUG) {
    console.log("[API] Request URL:", url);
    console.log("[API] Method:", method);
    console.log("[API] Auth:", auth ? (headers.Authorization ? "Bearer <token>" : "missing") : "disabled");
    if (hasBody) {
      console.log("[API] Payload:", body);
    }
  }

  const maxAttempts = auth ? 1 + MAX_UNAUTHORIZED_RETRIES : 1;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    if (auth && isSessionExpiredHandled()) {
      throw new ApiError(SESSION_EXPIRED_MESSAGE, null, 401, { sessionExpired: true });
    }

    const { response, data, rawText } = await executeRequest(url, fetchInit);

    if (response.ok) {
      return data;
    }

    const status = response.status;

    if (status === 401 && auth) {
      if (attempt < maxAttempts) {
        if (API_DEBUG) {
          console.warn(
            `[API] 401 Unauthorized — retry ${attempt}/${MAX_UNAUTHORIZED_RETRIES}:`,
            path
          );
        }
        continue;
      }

      forceLogoutAfterSessionExpired();
      throw new ApiError(SESSION_EXPIRED_MESSAGE, data, 401, { sessionExpired: true });
    }

    const message = extractErrorMessage(response, data, rawText);
    if (API_DEBUG) {
      console.error("[API] Error status:", status);
      console.error("[API] Error message:", message);
      console.error("[API] Error body:", data ?? rawText);
    }
    throw new ApiError(message, data, status);
  }

  throw new ApiError(SESSION_EXPIRED_MESSAGE, null, 401, { sessionExpired: true });
}
