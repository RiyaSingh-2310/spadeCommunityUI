export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const URL_REGEX = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;

export const DEFAULT_PASSWORD_MIN_LENGTH = 8;

export function getRequiredError(value, label) {
  if (!String(value ?? "").trim()) {
    return `${label} is required`;
  }
  return "";
}

export function getEmailError(value, { required = true, label = "Email Address" } = {}) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) {
    return required ? `${label} is required` : "";
  }
  if (!EMAIL_REGEX.test(trimmed)) {
    return "Please enter a valid email address";
  }
  return "";
}

export function getUrlError(value, { required = false, label = "Website URL" } = {}) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) {
    return required ? `${label} is required` : "";
  }
  if (!URL_REGEX.test(trimmed)) {
    return "Please enter a valid URL (e.g. https://example.com)";
  }
  return "";
}

export function getPasswordError(password, minLength = DEFAULT_PASSWORD_MIN_LENGTH) {
  const trimmed = String(password ?? "").trim();
  if (!trimmed) {
    return "Password is required";
  }
  if (trimmed.length < minLength) {
    return `Password must be at least ${minLength} characters`;
  }
  return "";
}

export function getConfirmPasswordError(password, confirmPassword) {
  const pwd = String(password ?? "").trim();
  const confirm = String(confirmPassword ?? "").trim();
  if (!confirm) {
    return "Confirm password is required";
  }
  if (pwd !== confirm) {
    return "Passwords must match";
  }
  return "";
}

export function getOptionalPasswordError(password, minLength = DEFAULT_PASSWORD_MIN_LENGTH) {
  const trimmed = String(password ?? "").trim();
  if (!trimmed) return "";
  return getPasswordError(trimmed, minLength);
}

export function getOptionalConfirmPasswordError(password, confirmPassword) {
  const pwd = String(password ?? "").trim();
  const confirm = String(confirmPassword ?? "").trim();
  if (!pwd && !confirm) return "";
  if (!confirm) return "Confirm password is required";
  if (pwd !== confirm) return "Passwords must match";
  return "";
}

export function isFormValid(errors) {
  return Object.values(errors).every((msg) => !msg);
}
