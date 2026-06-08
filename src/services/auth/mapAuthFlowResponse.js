/**
 * Normalizes forgot-password / verify-otp / reset-password API payloads.
 * @param {object | null | undefined} raw
 */
export function mapAuthFlowResponse(raw) {
  if (!raw || typeof raw !== "object") {
    return { success: false, message: "" };
  }

  const success = raw.success === true || raw.success === "true" || raw.success === 1;
  const message = String(raw.message ?? raw.error ?? "").trim();

  return {
    ...raw,
    success,
    message,
  };
}
