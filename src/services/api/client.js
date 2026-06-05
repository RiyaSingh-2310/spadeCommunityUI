import { API_DEBUG, API_LOGIN_BEARER_TOKEN, buildApiUrl } from "../../config/api";
import { getAuthToken } from "../auth/authStorage";
import { ApiError } from "./ApiError";

function extractErrorMessage(response, data, rawText) {
  if (data?.message) return data.message;
  if (data?.error) return data.error;
  if (typeof data === "string" && data.trim()) return data.trim();

  const preMatch = rawText?.match(/<pre>([^<]+)<\/pre>/i);
  if (preMatch?.[1]) {
    return preMatch[1].trim();
  }

  if (rawText?.trim() && !rawText.includes("<!DOCTYPE")) {
    return rawText.trim();
  }

  if (response.status) {
    return response.statusText
      ? `${response.statusText} (${response.status})`
      : `Request failed (${response.status})`;
  }

  return "Request failed";
}

async function readResponseBody(response) {
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
  } catch {
    throw new ApiError("Unable to reach the server. Please try again.");
  }

  const { data, rawText } = await readResponseBody(response);

  if (API_DEBUG) {
    console.log("[API] Response status:", response.status);
    console.log("[API] Response:", data ?? rawText);
  }

  if (!response.ok) {
    const message = extractErrorMessage(response, data, rawText);
    throw new ApiError(message, data, response.status);
  }

  return data;
}
