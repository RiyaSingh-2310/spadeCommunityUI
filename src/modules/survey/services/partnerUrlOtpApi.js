import { ApiError } from "../../../services/api/ApiError";

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Stub for Partner URL OTP sending.
 * Kept as a dedicated service so backend integration can be plugged in later
 * without changing UI/components.
 *
 * @param {{
 *   identifier: string, // Email ID or UID
 *   mappingId?: string, // Partner mapping record id
 *   partnerUrl?: string
 * }} params
 */
export async function sendPartnerUrlOtp({ identifier, mappingId, partnerUrl } = {}) {
  // Mock delay to emulate network latency.
  await delay(600);

  const normalized = String(identifier ?? "").trim();
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
  const isValidUid = /^[0-9]{3,}$/.test(normalized);

  if (!normalized || (!isValidEmail && !isValidUid)) {
    throw new ApiError("Invalid Email ID or UID", null);
  }

  // Mock: treat identifiers ending with 999 as invalid credentials.
  if (normalized.endsWith("999")) {
    throw new ApiError("Invalid Credentials", null);
  }

  // Mock OTP for UI testing.
  const mockOtp = "123456";
  return { success: true, mockOtp };
}

/**
 * Stub for Partner URL OTP verification.
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

  const otpText = String(otp ?? "").trim();
  if (!/^\d{6}$/.test(otpText)) {
    throw new ApiError("Invalid OTP. Please enter a 6-digit code.", null);
  }

  // Mock verification: accept only 123456.
  if (otpText !== "123456") {
    throw new ApiError("Invalid OTP. Please try again.", null);
  }

  return { success: true, verified: true };
}

