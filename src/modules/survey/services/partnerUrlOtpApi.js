import { ApiError } from "../../../services/api/ApiError";

/** Demo OTP used until the real Partner URL OTP API is integrated. */
export const DEMO_PARTNER_URL_OTP = "123456";

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Stub for Partner URL OTP sending.
 * Replace the mock body with a real API call when the backend is ready.
 *
 * @param {{
 *   identifier: string, // Email ID or UID
 *   mappingId?: string,
 *   partnerUrl?: string
 * }} params
 */
export async function sendPartnerUrlOtp({ identifier, mappingId, partnerUrl } = {}) {
  await delay(600);

  const normalized = String(identifier ?? "").trim();
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
  const isValidUid = /^[0-9]{3,}$/.test(normalized);

  if (!normalized || (!isValidEmail && !isValidUid)) {
    throw new ApiError("Invalid Email ID or UID", null);
  }

  if (normalized.endsWith("999")) {
    throw new ApiError("Invalid Credentials", null);
  }

  // Demo/stub response — swap for apiRequest(...) when OTP send API is live.
  void mappingId;
  void partnerUrl;
  return {
    success: true,
    message: "OTP sent successfully!",
    // Exposed for tests/debug only; UI does not display this value.
    mockOtp: DEMO_PARTNER_URL_OTP,
  };
}

/**
 * Stub for Partner URL OTP verification.
 * Accepts DEMO_PARTNER_URL_OTP until the real verify API is wired.
 *
 * @param {{
 *   identifier: string,
 *   otp: string,
 *   mappingId?: string,
 *   partnerUrl?: string
 * }} params
 */
export async function verifyPartnerUrlOtp({
  identifier,
  otp,
  mappingId,
  partnerUrl,
} = {}) {
  await delay(600);

  void identifier;
  void mappingId;
  void partnerUrl;

  const otpText = String(otp ?? "").trim();
  if (!/^\d{6}$/.test(otpText)) {
    throw new ApiError("Invalid OTP. Please enter a 6-digit code.", null);
  }

  if (otpText !== DEMO_PARTNER_URL_OTP) {
    throw new ApiError("Invalid OTP. Please try again.", null);
  }

  return { success: true, verified: true, message: "Email verified successfully!" };
}
