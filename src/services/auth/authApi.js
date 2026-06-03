import { API_BASE_URL, API_LOGIN_BEARER_TOKEN } from "../../config/api";
import { ApiError } from "../api/ApiError";

/**
 * POST /api/admin/login
 * @param {{ email: string, password: string }} credentials
 */
export async function loginAdmin(credentials) {
  const headers = {
    "Content-Type": "application/json",
  };

  if (API_LOGIN_BEARER_TOKEN) {
    headers.Authorization = `Bearer ${API_LOGIN_BEARER_TOKEN}`;
  }

  const url = `${API_BASE_URL}/api/admin/login`;

  let response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        email: credentials.email.trim(),
        password: credentials.password,
      }),
    });
  } catch {
    throw new ApiError("Unable to reach the server. Please try again.");
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    throw new ApiError("Invalid response from server.");
  }

  if (!response.ok || data?.success !== true) {
    throw new ApiError(
      data?.message || "Login failed. Please try again.",
      data,
      response.status
    );
  }

  if (!data.token) {
    throw new ApiError(data?.message || "Login failed. Please try again.", data);
  }

  if (
    data.admin?.status &&
    String(data.admin.status).toLowerCase() !== "active"
  ) {
    throw new ApiError(
      "Your account is inactive. Please contact support.",
      data
    );
  }

  return data;
}
