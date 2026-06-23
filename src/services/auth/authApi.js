import {
  API_BASE_URL,
  API_DEBUG,
  API_ROUTES,
  buildApiUrl,
} from "../../config/api";
import { apiRequest } from "../api/client";
import { ApiError } from "../api/ApiError";
import { mapAuthFlowResponse } from "./mapAuthFlowResponse";
import { mapLoginResponse } from "./mapLoginResponse";

const AUTH_FLOW_REQUEST_OPTIONS = {
  method: "POST",
  auth: false,
  loginBearer: true,
};

function logAuthDebug(scope, label, value) {
  if (API_DEBUG) {
    console.log(`[${scope}] ${label}:`, value);
  }
}

function logAuthError(scope, error) {
  if (!API_DEBUG) return;
  if (error instanceof ApiError) {
    console.error(`[${scope}] Error status:`, error.status);
    console.error(`[${scope}] Error message:`, error.message);
    console.error(`[${scope}] Error data:`, error.data);
    return;
  }
  console.error(`[${scope}] Unexpected error:`, error);
}

/**
 * @param {object | null | undefined} data
 */
function assertAuthFlowSuccess(data, fallbackMessage) {
  const mapped = mapAuthFlowResponse(data);
  if (!mapped.success) {
    throw new ApiError(mapped.message || fallbackMessage, data);
  }
  return {
    ...data,
    success: true,
    message: mapped.message || data?.message || fallbackMessage,
  };
}

/**
 * POST /api/admin/login
 * @param {{ email: string, password: string }} credentials
 */
export async function loginAdmin(credentials) {
  const payload = {
    email: credentials.email.trim(),
    password: credentials.password,
  };

  const url = buildApiUrl(API_ROUTES.admin.login);

  logAuthDebug("Login", "API base URL", API_BASE_URL);
  logAuthDebug("Login", "Request URL", url);
  logAuthDebug("Login", "Request payload", { email: payload.email, password: "***" });

  let data;
  try {
    data = await apiRequest(API_ROUTES.admin.login, {
      method: "POST",
      auth: false,
      body: payload,
    });
    logAuthDebug("Login", "Response data", data);
  } catch (error) {
    logAuthError("Login", error);
    throw error;
  }

  const mapped = mapLoginResponse(data);

  if (!mapped.success || !mapped.token) {
    throw new ApiError(
      mapped.message || "Login failed. Please try again.",
      data,
      200
    );
  }

  const status = mapped.admin?.status ?? data?.data?.admin?.status;
  if (status && String(status).toLowerCase() !== "active") {
    throw new ApiError("Your account is inactive. Please contact support.", data);
  }

  return {
    success: true,
    message: mapped.message || "Login successful!",
    token: mapped.token,
    refreshToken: mapped.refreshToken,
    admin: mapped.admin,
    data: data?.data ?? { token: mapped.token, admin: mapped.admin },
  };
}

/**
 * POST /api/admin/forgot-password — sends OTP to email.
 * @param {{ email: string }} payload
 */
export async function forgotPassword(payload) {
  const body = { email: payload.email.trim() };
  logAuthDebug("Forgot Password", "Request URL", buildApiUrl(API_ROUTES.admin.forgotPassword));
  logAuthDebug("Forgot Password", "Payload", body);

  try {
    const data = await apiRequest(API_ROUTES.admin.forgotPassword, {
      ...AUTH_FLOW_REQUEST_OPTIONS,
      body,
    });
    logAuthDebug("Forgot Password", "Response", data);
    return assertAuthFlowSuccess(data, "Failed to send OTP. Please try again.");
  } catch (error) {
    logAuthError("Forgot Password", error);
    throw error;
  }
}

/**
 * POST /api/admin/verify-otp
 * @param {{ email: string, otp: string }} payload
 */
export async function verifyOtp(payload) {
  const body = {
    email: payload.email.trim(),
    otp: String(payload.otp).trim(),
  };
  logAuthDebug("Verify OTP", "Request URL", buildApiUrl(API_ROUTES.admin.verifyOtp));
  logAuthDebug("Verify OTP", "Payload", body);

  try {
    const data = await apiRequest(API_ROUTES.admin.verifyOtp, {
      ...AUTH_FLOW_REQUEST_OPTIONS,
      body,
    });
    logAuthDebug("Verify OTP", "Response", data);
    return assertAuthFlowSuccess(data, "OTP verification failed. Please try again.");
  } catch (error) {
    logAuthError("Verify OTP", error);
    throw error;
  }
}

/**
 * POST /api/admin/reset-password
 * @param {{ email: string, otp: string, newPassword: string }} payload
 */
export async function resetPassword(payload) {
  const body = {
    email: String(payload.email ?? "").trim(),
    otp: String(payload.otp ?? "").trim(),
    newPassword: String(payload.newPassword ?? ""),
  };

  logAuthDebug("Reset Password", "Request URL", buildApiUrl(API_ROUTES.admin.resetPassword));
  logAuthDebug("Reset Password", "Payload", {
    email: body.email,
    otp: body.otp,
    newPassword: "***",
  });

  try {
    const data = await apiRequest(API_ROUTES.admin.resetPassword, {
      ...AUTH_FLOW_REQUEST_OPTIONS,
      body,
    });
    logAuthDebug("Reset Password", "Response", data);

    const mapped = mapAuthFlowResponse(data);
    if (!mapped.success) {
      throw new ApiError(
        mapped.message || "Password reset failed. Please try again.",
        data
      );
    }

    return {
      success: true,
      message: mapped.message || "Password reset successful! You can now login.",
    };
  } catch (error) {
    logAuthError("Reset Password", error);
    throw error;
  }
}
