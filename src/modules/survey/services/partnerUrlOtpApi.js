import { API_ROUTES } from "../../../config/api";
import { ApiError } from "../../../services/api/ApiError";
import { apiRequest } from "../../../services/api/client";
import { getAuthToken } from "../../../services/auth/authStorage";

const TEMP_TOKEN_STORAGE_KEY = "surveyAccessTempToken";
const EMAIL_STORAGE_KEY = "surveyAccessEmail";

function assertSuccess(data, fallbackMessage = "Request failed.") {
  if (data?.success !== true && data?.success !== "true") {
    // Business/authorization failure (including survey access denied).
    throw new ApiError(data?.message ?? fallbackMessage, data, 400);
  }
  return data;
}

/**
 * True when Send OTP failed because the email is not allowed to access the survey.
 * Used to abort the Partner URL flow and close the tab — not for network/other errors.
 */
export function isSurveyAccessDeniedError(error) {
  if (!(error instanceof ApiError)) return false;
  if (error.sessionExpired) return false;

  const status = Number(error.status) || 0;
  if (status === 400 || status === 401 || status === 403 || status === 422) {
    return true;
  }

  const data = error.data;
  if (data && typeof data === "object") {
    if (data.success === false || data.success === "false") return true;
  }

  const message = String(error.message ?? "").toLowerCase();
  return (
    message.includes("not authorized") ||
    message.includes("unauthorized") ||
    message.includes("permission") ||
    message.includes("access denied") ||
    message.includes("does not have") ||
    message.includes("not allowed") ||
    message.includes("no access") ||
    message.includes("not permitted")
  );
}

function coerceText(value) {
  return String(value ?? "").trim();
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(coerceText(value));
}

/** Persist tempToken for the duration of the OTP flow (survives remounts). */
export function stashSurveyAccessTempToken(tempToken, email = "") {
  if (typeof sessionStorage === "undefined") return;
  const token = coerceText(tempToken);
  if (!token) return;
  try {
    sessionStorage.setItem(TEMP_TOKEN_STORAGE_KEY, token);
    if (email) {
      sessionStorage.setItem(EMAIL_STORAGE_KEY, coerceText(email));
    }
  } catch {
    // ignore quota / private mode
  }
}

export function readSurveyAccessTempToken() {
  if (typeof sessionStorage === "undefined") return "";
  try {
    return coerceText(sessionStorage.getItem(TEMP_TOKEN_STORAGE_KEY));
  } catch {
    return "";
  }
}

export function readSurveyAccessEmail() {
  if (typeof sessionStorage === "undefined") return "";
  try {
    return coerceText(sessionStorage.getItem(EMAIL_STORAGE_KEY));
  } catch {
    return "";
  }
}

export function clearSurveyAccessTempToken() {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.removeItem(TEMP_TOKEN_STORAGE_KEY);
    sessionStorage.removeItem(EMAIL_STORAGE_KEY);
  } catch {
    // ignore
  }
}

/**
 * Extract vendorUrl from verify-otp response.
 * Backend may return vendorUrl, VenderURL, or links[].VenderURL.
 */
export function extractVendorUrl(data) {
  if (!data || typeof data !== "object") return "";

  const payload =
    data.data && typeof data.data === "object" && !Array.isArray(data.data)
      ? data.data
      : data;

  const direct = coerceText(
    payload.vendorUrl ??
      payload.VenderURL ??
      payload.VendorURL ??
      payload.venderUrl ??
      payload.vendor_url
  );
  if (direct) return direct;

  const links = Array.isArray(payload.links) ? payload.links : [];
  for (const link of links) {
    if (!link || typeof link !== "object") continue;
    const url = coerceText(
      link.vendorUrl ??
        link.VenderURL ??
        link.VendorURL ??
        link.venderUrl ??
        link.vendor_url
    );
    if (url) return url;
  }

  return "";
}

function surveyAccessRequestOptions() {
  const hasToken = Boolean(getAuthToken());
  return {
    method: "POST",
    auth: hasToken,
    // Public Partner URL gateway — never force admin logout on 401.
    skipSessionExpiryOn401: true,
  };
}

/**
 * POST /api/survey-access/send-otp
 * @param {{ email?: string, identifier?: string }} params
 */
export async function sendPartnerUrlOtp({ email, identifier } = {}) {
  const normalizedEmail = coerceText(email ?? identifier);
  if (!normalizedEmail) {
    throw new ApiError("Email is required.", null);
  }
  if (!isValidEmail(normalizedEmail)) {
    throw new ApiError("Please enter a valid email address.", null);
  }

  const data = await apiRequest(API_ROUTES.surveyAccess.sendOtp, {
    ...surveyAccessRequestOptions(),
    body: { email: normalizedEmail },
  });
  assertSuccess(data, "Unable to send OTP.");

  const payload =
    data?.data && typeof data.data === "object" ? data.data : data;
  const tempToken = coerceText(
    payload?.tempToken ?? payload?.temp_token ?? data?.tempToken
  );
  if (!tempToken) {
    throw new ApiError("tempToken missing from send OTP response.", data);
  }

  stashSurveyAccessTempToken(tempToken, normalizedEmail);

  return {
    success: true,
    message: data?.message || "OTP has been sent to your email!",
    tempToken,
    expiresInMinutes: payload?.expiresInMinutes ?? payload?.expires_in_minutes,
    otp: payload?.otp ?? data?.otp,
    email: normalizedEmail,
    ...data,
  };
}

/**
 * POST /api/survey-access/verify-otp
 * @param {{ otp: string, tempToken?: string }} params
 */
export async function verifyPartnerUrlOtp({ otp, tempToken } = {}) {
  const otpText = coerceText(otp);
  if (!otpText) {
    throw new ApiError("OTP is required.", null);
  }

  const token = coerceText(tempToken) || readSurveyAccessTempToken();
  if (!token) {
    throw new ApiError(
      "Verification session expired. Please request a new OTP.",
      null
    );
  }

  const data = await apiRequest(API_ROUTES.surveyAccess.verifyOtp, {
    ...surveyAccessRequestOptions(),
    body: {
      otp: otpText,
      tempToken: token,
    },
  });
  assertSuccess(data, "Unable to verify OTP.");

  const vendorUrl = extractVendorUrl(data);
  if (!vendorUrl) {
    throw new ApiError(
      "Vendor URL missing from verification response.",
      data
    );
  }

  clearSurveyAccessTempToken();

  return {
    success: true,
    verified: true,
    message: data?.message || "OTP verified successfully!",
    vendorUrl,
    email: data?.data?.email,
    ...data,
  };
}

export { isValidEmail };
