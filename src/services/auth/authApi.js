import { API_LOGIN_BEARER_TOKEN, API_ROUTES, buildApiUrl } from "../../config/api";
import { apiRequest } from "../api/client";
import { ApiError } from "../api/ApiError";
import { mapLoginResponse } from "./mapLoginResponse";

const AUTH_FLOW_REQUEST_OPTIONS = {
  method: "POST",
  auth: false,
  loginBearer: true,
};

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

  const url = buildApiUrl(API_ROUTES.admin.login);

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

  const isHttpSuccess = response.status === 200 || response.status === 201;
  const mapped = mapLoginResponse(data);

  if (!isHttpSuccess) {
    throw new ApiError(
      mapped.message || data?.message || "Login failed. Please try again.",
      data,
      response.status
    );
  }

  if (!mapped.success || !mapped.token) {
    throw new ApiError(
      mapped.message || data?.message || "Login failed. Please try again.",
      data,
      response.status
    );
  }

  const status = mapped.admin?.status ?? data?.admin?.status ?? data?.status;
  if (status && String(status).toLowerCase() !== "active") {
    throw new ApiError(
      "Your account is inactive. Please contact support.",
      data
    );
  }

  return {
    ...data,
    success: true,
    message: mapped.message || data?.message,
    token: mapped.token,
    refreshToken: mapped.refreshToken,
    admin: mapped.admin,
  };
}

/**
 * @param {object | null | undefined} data
 */
function assertAuthFlowSuccess(data, fallbackMessage) {
  if (data?.success !== true) {
    throw new ApiError(data?.message || fallbackMessage, data);
  }
  return data;
}

/**
 * POST /api/admin/forgot-password — sends OTP to email.
 * @param {{ email: string }} payload
 */
export async function forgotPassword(payload) {
  const data = await apiRequest(API_ROUTES.admin.forgotPassword, {
    ...AUTH_FLOW_REQUEST_OPTIONS,
    body: {
      email: payload.email.trim(),
    },
  });

  return assertAuthFlowSuccess(data, "Failed to send OTP. Please try again.");
}

/**
 * POST /api/admin/verify-otp
 * @param {{ email: string, otp: string }} payload
 */
export async function verifyOtp(payload) {
  const data = await apiRequest(API_ROUTES.admin.verifyOtp, {
    ...AUTH_FLOW_REQUEST_OPTIONS,
    body: {
      email: payload.email.trim(),
      otp: String(payload.otp).trim(),
    },
  });

  return assertAuthFlowSuccess(data, "OTP verification failed. Please try again.");
}

/**
 * POST /api/admin/reset-password
 * @param {{ email: string, otp: string, newPassword: string }} payload
 */
export async function resetPassword(payload) {
  const data = await apiRequest(API_ROUTES.admin.resetPassword, {
    ...AUTH_FLOW_REQUEST_OPTIONS,
    body: {
      email: payload.email.trim(),
      otp: String(payload.otp).trim(),
      newPassword: payload.newPassword,
    },
  });

  return assertAuthFlowSuccess(data, "Password reset failed. Please try again.");
}
