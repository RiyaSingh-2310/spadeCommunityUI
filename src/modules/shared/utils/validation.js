export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Matches backend auth identifiers (e.g. test@123). */
export const AUTH_EMAIL_REGEX = /^[^\s@]+@[^\s@]+$/;
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

/** Lenient email validation for login / forgot-password flows. */
export function getAuthEmailError(value, { required = true, label = "Email" } = {}) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) {
    return required ? `${label} is required` : "";
  }
  if (!AUTH_EMAIL_REGEX.test(trimmed)) {
    return "Please enter a valid email address";
  }
  return "";
}

export const URL_VALIDATION_MESSAGE =
  "Please enter a valid URL. Example: https://example.com";

export function getUrlError(value, { required = false, label = "Website URL" } = {}) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) {
    return required ? `${label} is required` : "";
  }
  if (!URL_REGEX.test(trimmed)) {
    return URL_VALIDATION_MESSAGE;
  }
  return "";
}

/** Validates URL format when a value is present; empty values pass. */
export function getOptionalUrlError(value, label = "URL") {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return "";
  return getUrlError(trimmed, { required: false, label });
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
  if (pwd && confirm && pwd !== confirm) {
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
  if (pwd && confirm && pwd !== confirm) return "Passwords must match";
  return "";
}

export function stripHtmlText(html) {
  if (typeof document !== "undefined") {
    const el = document.createElement("div");
    el.innerHTML = html || "";
    return (el.textContent || "").trim();
  }
  return String(html || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function getRichTextError(value, label) {
  if (!stripHtmlText(value)) {
    return `${label} is required`;
  }
  return "";
}

export function isFormValid(errors) {
  return Object.values(errors).every((msg) => !msg);
}

/** True when every listed field has no validation error. */
export function isFormValidForFields(errors, fields) {
  return fields.every((field) => !errors[field]);
}

/** @param {string[]} fields */
export function createEmptyTouched(fields) {
  return fields.reduce((acc, field) => ({ ...acc, [field]: false }), {});
}

/** @param {string[]} fields */
export function markAllTouched(fields, existing = {}) {
  return fields.reduce((acc, field) => ({ ...acc, [field]: true }), {
    ...existing,
  });
}

export function getDateRangeError(startDate, endDate, { endLabel = "End Date" } = {}) {
  if (!startDate || !endDate) return "";
  if (endDate < startDate) {
    return `${endLabel} cannot be earlier than Start Date`;
  }
  return "";
}

export { getPhoneError } from "./phoneValidation";

/**
 * Show a field error only after the user has blurred the field or submitted the form.
 * @param {string} field
 * @param {Record<string, boolean>} touched
 * @param {Record<string, string>} errors
 * @param {boolean} [submitAttempted]
 */
export function showFieldError(field, touched, errors, submitAttempted = false) {
  if (!submitAttempted && !touched?.[field]) {
    return "";
  }
  return errors?.[field] || "";
}
