const EMAIL_KEY = "spade_pwd_reset_email";
const OTP_KEY = "spade_pwd_reset_otp";

function safeGet(key) {
  try {
    return String(sessionStorage.getItem(key) ?? "").trim();
  } catch {
    return "";
  }
}

function safeSet(key, value) {
  try {
    const normalized = String(value ?? "").trim();
    if (normalized) {
      sessionStorage.setItem(key, normalized);
    } else {
      sessionStorage.removeItem(key);
    }
  } catch {
    // Ignore storage failures (private mode / blocked storage).
  }
}

function safeRemove(key) {
  try {
    sessionStorage.removeItem(key);
  } catch {
    // Ignore storage failures.
  }
}

/**
 * Persist password-reset flow state so refresh/direct navigation can continue.
 */
export function savePasswordResetEmail(email) {
  safeSet(EMAIL_KEY, email);
}

export function savePasswordResetOtp(otp) {
  safeSet(OTP_KEY, otp);
}

export function readPasswordResetEmail() {
  return safeGet(EMAIL_KEY);
}

export function readPasswordResetOtp() {
  return safeGet(OTP_KEY);
}

export function clearPasswordResetSession() {
  safeRemove(EMAIL_KEY);
  safeRemove(OTP_KEY);
}
