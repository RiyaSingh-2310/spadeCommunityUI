import {
  API_BASE_URL,
  API_DEBUG,
  API_ROUTES,
  buildApiUrl,
} from "../../config/api";
import { encryptValue } from "../../modules/shared/utils/encryption";
import { notifyPartnerUrlTabsAdminLogout } from "../../modules/survey/utils/partnerUrlTabSync";
import { apiRequest } from "../api/client";
import { ApiError } from "../api/ApiError";
import { LOGIN_ROLES } from "./loginRole";
import { toastApiSuccess } from "../toast/apiToast";
import { clearAuthSession, getAuthToken } from "./authStorage";
import { mapAuthFlowResponse } from "./mapAuthFlowResponse";
import { mapLoginResponse } from "./mapLoginResponse";
import { decodeJwtPayload } from "./jwtUtils";
import {
  beginIntentionalLogout,
  endIntentionalLogout,
  isSessionExpiredHandled,
} from "./sessionExpiry";
import { stopAuthSessionLifecycle } from "./sessionLifecycle";

const AUTH_FLOW_REQUEST_OPTIONS = {
  method: "POST",
  auth: false,
  loginBearer: true,
};

/** Prevents duplicate Sign Out / session-expired logout calls. */
let logoutInFlight = null;

function logAuthDebug(scope, label, value) {
  if (!API_DEBUG) return;
  if (value === undefined) {
    console.info(`[${scope}] ${label}`);
    return;
  }
  console.info(`[${scope}] ${label}:`, value);
}

function logAuthError(scope, error) {
  if (!API_DEBUG) return;
  if (error instanceof ApiError) {
    console.error(`[${scope}] Error status:`, error.status);
    return;
  }
  console.error(`[${scope}] Request failed`);
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

export function resolveLoginRoute(loginRole) {
  if (loginRole === LOGIN_ROLES.SALES) return API_ROUTES.salesManagers.login;
  if (loginRole === LOGIN_ROLES.MANAGER) return API_ROUTES.projectManagers.login;
  if (loginRole === LOGIN_ROLES.PARTNER) return API_ROUTES.partners.login;
  return API_ROUTES.admin.login;
}

/**
 * Role-aware login (same email/password payload and session mapping):
 * - Admin → POST /api/admin/login
 * - Sales Manager → POST /api/salesmanager/login
 * - Project Manager → POST /api/projectmanager/login
 * - Partner → POST /api/partner/login
 * @param {{ email: string, password: string, loginRole?: string }} credentials
 */
export async function loginAdmin(credentials) {
  const payload = {
    email: credentials.email.trim(),
    password: encryptValue(credentials.password),
  };
  const loginRole = credentials.loginRole ?? LOGIN_ROLES.ADMIN;
  const loginPath = resolveLoginRoute(loginRole);

  const url = buildApiUrl(loginPath);

  logAuthDebug("Login", "API base URL", API_BASE_URL);
  logAuthDebug("Login", "Request URL", url);
  logAuthDebug("Login", "Login role", loginRole);

  let data;
  try {
    // Sales Manager login may send optional login bearer when VITE_API_LOGIN_BEARER_TOKEN is set
    // (matches backend curl). Partner login matches POST /api/partner/login with JSON only.
    data = await apiRequest(loginPath, {
      method: "POST",
      auth: false,
      loginBearer: loginRole === LOGIN_ROLES.SALES,
      body: payload,
    });
    logAuthDebug("Login", "Response received");
  } catch (error) {
    logAuthError("Login", error);
    const message =
      error instanceof ApiError && error.message
        ? error.message
        : error?.message || "Unable to sign in. Please try again.";
    const isCredentialFailure =
      error?.status === 401 ||
      /invalid|credential|unauthorized|password|email/i.test(String(message));
    throw new ApiError(
      isCredentialFailure ? "Invalid Credentials" : message,
      error?.data ?? null,
      error?.status ?? 401
    );
  }

  const mapped = mapLoginResponse(data);
  const session = await enrichPartnerLoginSession(mapped, loginRole, payload.email);

  if (!session.success || !session.token) {
    throw new ApiError("Invalid Credentials", data, 200);
  }

  const status =
    session.admin?.status ??
    data?.data?.admin?.status ??
    data?.data?.partner?.status ??
    data?.data?.status;
  if (status && String(status).toLowerCase() !== "active") {
    throw new ApiError("Your account is inactive. Please contact support.", data);
  }

  return {
    success: true,
    message: session.message || "Login successful!",
    token: session.token,
    refreshToken: session.refreshToken,
    admin: session.admin,
    data: data?.data ?? { token: session.token, admin: session.admin },
  };
}

async function enrichPartnerLoginSession(mapped, loginRole, email) {
  if (loginRole !== LOGIN_ROLES.PARTNER) return mapped;
  if (!mapped?.token) return mapped;

  const jwtIdentity = decodeJwtPayload(mapped.token) ?? {};
  const partnerId = String(
    mapped.admin?.id ??
      mapped.admin?.partner_id ??
      mapped.admin?.partnerId ??
      jwtIdentity.id ??
      jwtIdentity.partner_id ??
      jwtIdentity.partnerId ??
      jwtIdentity.partnerid ??
      jwtIdentity.sub ??
      ""
  ).trim();
  const partnerEmail = String(
    mapped.admin?.email ?? jwtIdentity.email ?? email ?? ""
  ).trim();

  let admin = {
    ...(mapped.admin && typeof mapped.admin === "object" ? mapped.admin : {}),
    ...(partnerId ? { id: partnerId } : {}),
    ...(partnerEmail ? { email: partnerEmail } : {}),
  };

  if (partnerId) {
    try {
      const detailData = await apiRequest(API_ROUTES.partners.byId(partnerId), {
        method: "GET",
        auth: false,
        headers: { Authorization: `Bearer ${mapped.token}` },
      });
      const detailMapped = mapLoginResponse(detailData);
      if (detailMapped.admin) {
        admin = { ...admin, ...detailMapped.admin, id: partnerId };
      } else if (detailData?.data && typeof detailData.data === "object") {
        admin = { ...admin, ...detailData.data, id: partnerId };
      }
    } catch {
      try {
        const meData = await apiRequest(API_ROUTES.partners.me, {
          method: "GET",
          auth: false,
          headers: { Authorization: `Bearer ${mapped.token}` },
        });
        const meMapped = mapLoginResponse(meData);
        if (meMapped.admin) {
          admin = { ...admin, ...meMapped.admin, id: admin.id || partnerId };
        }
      } catch {
        // JWT identity is enough for Partner portal authorization.
      }
    }
  }

  return {
    ...mapped,
    admin,
  };
}

/**
 * POST /api/admin/logout — blacklists the current Bearer token on the server.
 * Requires the auth token to still be present in storage when called.
 */
export async function logoutAdmin() {
  const logoutPath = resolveLogoutRoute();
  const logoutUrl = buildApiUrl(logoutPath);
  const token = getAuthToken();

  logAuthDebug("Logout", "API base URL", API_BASE_URL);
  logAuthDebug("Logout", "Request URL", logoutUrl);
  logAuthDebug("Logout", "Method", "POST");
  logAuthDebug("Logout", "Has auth token", Boolean(token));

  if (!token) {
    return { success: false, message: "No auth token available for logout." };
  }

  try {
    const data = await apiRequest(logoutPath, {
      method: "POST",
      skipSessionExpiryOn401: true,
    });
    logAuthDebug("Logout", "Response received");
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
 * Calls logout API first, then clears local auth state and redirects to login.
 * @param {(path: string) => void} navigate
 * @param {{ reason?: "manual" }} [options]
 */
export async function performLogout(navigate, { reason = "manual" } = {}) {
  if (isSessionExpiredHandled()) {
    if (typeof navigate === "function") {
      navigate("/auth");
    } else if (typeof window !== "undefined") {
      window.location.replace("/auth");
    }
    return logoutInFlight;
  }

  if (logoutInFlight) {
    return logoutInFlight;
  }

  logoutInFlight = (async () => {
    beginIntentionalLogout();
    stopAuthSessionLifecycle();

    try {
      // Must call API while the Bearer token is still in storage.
      const result = await logoutAdmin();

      notifyPartnerUrlTabsAdminLogout();
      clearAuthSession();

      if (result.success) {
        if (reason === "manual") {
          toastApiSuccess(result);
        }
      } else if (API_DEBUG) {
        console.warn(
          "[Logout] Server logout did not succeed; local session was cleared and user redirected to login.",
          result.message
        );
      }

      if (typeof navigate === "function") {
        navigate("/auth");
      } else if (typeof window !== "undefined") {
        window.location.replace("/auth");
      }

      return result;
    } finally {
      endIntentionalLogout();
      logoutInFlight = null;
    }
  })();

  return logoutInFlight;
}

/**
 * POST /api/admin/forgot-password — sends OTP to email.
 * @param {{ email: string }} payload
 */
export async function forgotPassword(payload) {
  const body = { email: payload.email.trim() };
  logAuthDebug("Forgot Password", "Request URL", buildApiUrl(API_ROUTES.admin.forgotPassword));

  try {
    const data = await apiRequest(API_ROUTES.admin.forgotPassword, {
      ...AUTH_FLOW_REQUEST_OPTIONS,
      body,
    });
    logAuthDebug("Forgot Password", "Response received");
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

  try {
    const data = await apiRequest(API_ROUTES.admin.verifyOtp, {
      ...AUTH_FLOW_REQUEST_OPTIONS,
      body,
    });
    logAuthDebug("Verify OTP", "Response received");
    return assertAuthFlowSuccess(data, "OTP verification failed. Please try again.");
  } catch (error) {
    logAuthError("Verify OTP", error);
    throw error;
  }
}

/**
 * POST /api/admin/reset-password
 * @param {{
 *   email: string,
 *   otp: string,
 *   newPassword?: string,
 *   password?: string,
 *   confirmPassword?: string,
 * }} payload
 */
export async function resetPassword(payload) {
  const plainPassword = String(
    payload.password ?? payload.newPassword ?? ""
  );
  const plainConfirmPassword = String(
    payload.confirmPassword ?? payload.confirm_password ?? plainPassword
  );
  const encryptedPassword = encryptValue(plainPassword);
  const encryptedConfirmPassword = encryptValue(plainConfirmPassword);

  const body = {
    email: String(payload.email ?? "").trim(),
    otp: String(payload.otp ?? "").trim(),
    password: encryptedPassword,
    confirm_password: encryptedConfirmPassword,
    // Backend currently decrypts `newPassword`; keep it in sync with password.
    newPassword: encryptedPassword,
  };

  logAuthDebug("Reset Password", "Request URL", buildApiUrl(API_ROUTES.admin.resetPassword));

  try {
    const data = await apiRequest(API_ROUTES.admin.resetPassword, {
      ...AUTH_FLOW_REQUEST_OPTIONS,
      body,
    });
    logAuthDebug("Reset Password", "Response received");

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
