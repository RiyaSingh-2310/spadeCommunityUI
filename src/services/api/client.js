import { API_DEBUG, API_LOGIN_BEARER_TOKEN, buildApiUrl } from "../../config/api";
import { getAuthToken } from "../auth/authStorage";
import { ApiError } from "./ApiError";

const HTTP_STATUS_MESSAGES = {
  400: "Bad request. Please check your input.",
  401: "Unauthorized. Please check your credentials.",
  403: "Access forbidden.",
  404: "The requested resource was not found.",
  500: "Internal server error. Please try again later.",
  502: "The API server is unavailable (502 Bad Gateway). Ensure the backend is running and reachable.",
  503: "Service temporarily unavailable. Please try again later.",
  504: "Gateway timeout. The server took too long to respond.",
};

export function extractErrorMessage(response, data, rawText) {
  if (data?.message) return String(data.message);
  if (data?.error) return String(data.error);
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

export async function apiRequest(path, options = {}) {
  const {
    method = "GET",
    body,
    auth = true,
    /** When auth is false, still send VITE_API_LOGIN_BEARER_TOKEN (forgot-password flow). */
    loginBearer = false,
    headers: extraHeaders = {},
  } = options;

  const isFormDataBody = typeof FormData !== "undefined" && body instanceof FormData;
  const headers = {
    ...(isFormDataBody ? {} : { "Content-Type": "application/json" }),
    ...extraHeaders,
  };

  if (auth) {
    const token = getAuthToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  } else if (loginBearer && API_LOGIN_BEARER_TOKEN) {
    headers.Authorization = `Bearer ${API_LOGIN_BEARER_TOKEN}`;
  }

  const url = buildApiUrl(path);

  if (API_DEBUG) {
    console.log("[API] Request URL:", url);
    console.log("[API] Method:", method);
    if (body !== undefined) {
      console.log("[API] Payload:", body);
    }
  }

  let response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body:
        body === undefined
          ? undefined
          : isFormDataBody
            ? body
            : JSON.stringify(body),
    });
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

  if (!response.ok) {
    const message = extractErrorMessage(response, data, rawText);
    if (API_DEBUG) {
      console.error("[API] Error status:", response.status);
      console.error("[API] Error message:", message);
      console.error("[API] Error body:", data ?? rawText);
    }
    throw new ApiError(message, data, response.status);
  }

  return data;
}
