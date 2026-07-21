import {
  API_BASE_URL,
  API_DEBUG,
  API_ROUTES,
  buildApiUrl,
} from "../../config/api";
import { apiRequest } from "../api/client";
import { ApiError } from "../api/ApiError";
import { LOGIN_ROLES } from "./loginRole";
import { toastApiSuccess } from "../toast/apiToast";
import { clearAuthSession } from "./authStorage";
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

function logLogoutRouteHint(status, logoutPath, logoutUrl) {
  if (!API_DEBUG || status !== 404) return;

  console.error(
    `[Logout] 404 Not Found for POST ${logoutPath}.`,
    "Verify the backend exposes this route and has been restarted after pulling latest code.",
    { url: logoutUrl, apiBaseUrl: API_BASE_URL }
  );
}

/**
 * Admin panel sign-out uses POST /api/admin/logout (same JWT blacklist flow as panelist logout).
 */
function resolveLogoutRoute() {
  return API_ROUTES.admin.logout;
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

function resolveLoginRoute(loginRole) {
  if (loginRole === LOGIN_ROLES.SALES) return API_ROUTES.salesManagers.login;
  if (loginRole === LOGIN_ROLES.MANAGER) return API_ROUTES.projectManagers.login;
  return API_ROUTES.admin.login;
}

/**
 * Role-aware login:
 * - Admin → POST /api/admin/login
 * - Sales Manager → POST /api/salesmanager/login
 * - Project Manager → POST /api/projectmanager/login
 * @param {{ email: string, password: string, loginRole?: string }} credentials
 */
export async function loginAdmin(credentials) {
  const payload = {
    email: credentials.email.trim(),
    password: credentials.password,
  };
  const loginRole = credentials.loginRole ?? LOGIN_ROLES.ADMIN;
  const loginPath = resolveLoginRoute(loginRole);

  const url = buildApiUrl(loginPath);

  logAuthDebug("Login", "API base URL", API_BASE_URL);
  logAuthDebug("Login", "Request URL", url);
  logAuthDebug("Login", "Login role", loginRole);
  logAuthDebug("Login", "Request payload", { email: payload.email, password: "***" });

  let data;
  try {
    // Sales Manager login may send optional login bearer when VITE_API_LOGIN_BEARER_TOKEN is set
    // (matches backend curl). Admin / Project Manager login stay unchanged.
    data = await apiRequest(loginPath, {
      method: "POST",
      auth: false,
      loginBearer: loginRole === LOGIN_ROLES.SALES,
      body: payload,
    });
    logAuthDebug("Login", "Response data", data);
  } catch (error) {
    logAuthError("Login", error);
    throw new ApiError("Invalid Credentials", error?.data ?? null, error?.status ?? 401);
  }

  const mapped = mapLoginResponse(data);

  if (!mapped.success || !mapped.token) {
    throw new ApiError("Invalid Credentials", data, 200);
  }

  const status =
    mapped.admin?.status ??
    data?.data?.admin?.status ??
    data?.data?.status;
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
 * POST /api/admin/logout — blacklists the current Bearer token on the server.
 */
export async function logoutAdmin() {
  const logoutPath = resolveLogoutRoute();
  const logoutUrl = buildApiUrl(logoutPath);

  logAuthDebug("Logout", "API base URL", API_BASE_URL);
  logAuthDebug("Logout", "Request URL", logoutUrl);
  logAuthDebug("Logout", "Method", "POST");

  try {
    const data = await apiRequest(logoutPath, {
      method: "POST",
      skipSessionExpiryOn401: true,
    });
    logAuthDebug("Logout", "Response data", data);
    return assertAuthFlowSuccess(data, "Logged out successfully!");
  } catch (error) {
    logAuthError("Logout", error);
    if (error instanceof ApiError) {
      logLogoutRouteHint(error.status, logoutPath, logoutUrl);
    }
    // Allow local sign-out even if the API call fails (expired token, network, etc).
    return { success: false, message: error?.message ?? "Logout request failed." };
  }
}

/**
 * Calls logout API, clears local auth state, shows success toast, and redirects to login.
 * @param {(path: string) => void} navigate
 */
export async function performLogout(navigate) {
  const result = await logoutAdmin();
  clearAuthSession();
  if (result.success) {
    toastApiSuccess(result);
  } else if (API_DEBUG) {
    console.warn(
      "[Logout] Server logout did not succeed; local session was cleared and user redirected to login.",
      result.message
    );
  }
  navigate("/auth");
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
