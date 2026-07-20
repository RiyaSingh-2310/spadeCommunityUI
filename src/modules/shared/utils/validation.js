export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Matches backend auth identifiers (e.g. test@123). */
export const AUTH_EMAIL_REGEX = /^[^\s@]+@[^\s@]+$/;
export const URL_REGEX = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;

export const DEFAULT_PASSWORD_MIN_LENGTH = 8;

/** Legacy shared max length retained for non-form fields. */
export const USER_FIELD_MAX_LENGTH = 30;
export const NAME_FIELD_MAX_LENGTH = 60;
export const CONTACT_PERSON_MAX_LENGTH = 60;
export const EMAIL_FIELD_MAX_LENGTH = 60;
export const PASSWORD_FIELD_MAX_LENGTH = 30;

const NAME_REGEX = /^[A-Za-z ]+$/;

/**
 * Keyboard-level input guard for admin "Name" fields.
 * Allows only A-Z, a-z, and spaces (plus standard control/navigation keys).
 */
export function preventBlockedNameKeys(event) {
  const key = event.key;

  // Allow shortcuts (copy/paste/select/undo) without interfering.
  if (event.ctrlKey || event.metaKey) return;

  // Allow navigation/editing keys.
  if (
    key === "Backspace" ||
    key === "Delete" ||
    key === "Tab" ||
    key === "Enter" ||
    key === "Escape" ||
    key === "ArrowLeft" ||
    key === "ArrowRight" ||
    key === "ArrowUp" ||
    key === "ArrowDown" ||
    key === "Home" ||
    key === "End"
  ) {
    return;
  }

  // Allow space.
  if (key === " " || key === "Spacebar" || key === "Space") return;

  // Allow single letters only.
  if (typeof key === "string" && /^[A-Za-z]$/.test(key)) return;

  // Block anything else (digits, symbols, etc).
  event.preventDefault();
}

export function limitTextInput(value, maxLength = USER_FIELD_MAX_LENGTH) {
  return String(value ?? "").slice(0, maxLength);
}

function getFieldMaxLengthError(value, maxLength, label) {
  if (String(value ?? "").length > maxLength) {
    return `${label} must be at most ${maxLength} characters`;
  }
  return "";
}

/** Required text field with a shared max length (titles/names without letter-only rules). */
export function getRequiredMaxLengthError(
  value,
  label,
  maxLength = NAME_FIELD_MAX_LENGTH
) {
  const required = getRequiredError(value, label);
  if (required) return required;
  return getFieldMaxLengthError(value, maxLength, label);
}

export function getUserNameError(
  value,
  { label = "Name", maxLength = NAME_FIELD_MAX_LENGTH } = {}
) {
  const required = getRequiredError(value, label);
  if (required) return required;
  const trimmed = String(value ?? "").trim();
  if (!NAME_REGEX.test(trimmed)) {
    return "Name can only contain letters and spaces.";
  }
  return getFieldMaxLengthError(value, maxLength, label);
}

export function getContactPersonError(
  value,
  { required = false, label = "Contact Person", maxLength = CONTACT_PERSON_MAX_LENGTH } = {}
) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) {
    return required ? `${label} is required` : "";
  }
  if (!NAME_REGEX.test(trimmed)) {
    return `${label} can only contain letters and spaces`;
  }
  return getFieldMaxLengthError(trimmed, maxLength, label);
}

export function getRequiredError(value, label) {
  if (!String(value ?? "").trim()) {
    return `${label} is required`;
  }
  return "";
}

export function getEmailError(
  value,
  { required = true, label = "Email Address", maxLength = EMAIL_FIELD_MAX_LENGTH } = {}
) {
  const raw = String(value ?? "");
  const trimmed = raw.trim();
  if (!trimmed) {
    return required ? `${label} is required` : "";
  }
  if (/\s/.test(raw)) {
    return `${label} cannot contain spaces`;
  }
  const maxError = getFieldMaxLengthError(trimmed, maxLength, label);
  if (maxError) return maxError;
  if (!EMAIL_REGEX.test(trimmed)) {
    return "Please enter a valid email address";
  }
  return "";
}

/** Lenient email validation for login / forgot-password flows. */
export function getAuthEmailError(
  value,
  { required = true, label = "Email", maxLength = EMAIL_FIELD_MAX_LENGTH } = {}
) {
  const raw = String(value ?? "");
  const trimmed = raw.trim();
  if (!trimmed) {
    return required ? `${label} is required` : "";
  }
  if (/\s/.test(raw)) {
    return `${label} cannot contain spaces`;
  }
  const maxError = getFieldMaxLengthError(trimmed, maxLength, label);
  if (maxError) return maxError;
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

export function getPasswordError(
  password,
  minLength = DEFAULT_PASSWORD_MIN_LENGTH,
  maxLength = PASSWORD_FIELD_MAX_LENGTH
) {
  const raw = String(password ?? "");
  const trimmed = raw.trim();
  if (!trimmed) {
    return "Password is required";
  }
  if (raw !== trimmed) {
    return "Password cannot start or end with spaces";
  }
  if (trimmed.length > maxLength) {
    return `Password must be at most ${maxLength} characters`;
  }
  if (trimmed.length < minLength) {
    return `Password must be at least ${minLength} characters`;
  }
  return "";
}

export function getConfirmPasswordError(
  password,
  confirmPassword,
  maxLength = PASSWORD_FIELD_MAX_LENGTH
) {
  const pwdRaw = String(password ?? "");
  const confirmRaw = String(confirmPassword ?? "");
  const pwd = pwdRaw.trim();
  const confirm = confirmRaw.trim();
  if (!confirm) {
    return "Confirm password is required";
  }
  if (confirmRaw !== confirm) {
    return "Confirm password cannot start or end with spaces";
  }
  if (confirm.length > maxLength) {
    return `Confirm password must be at most ${maxLength} characters`;
  }
  if (pwd && confirm && pwd !== confirm) {
    return "Passwords must match";
  }
  return "";
}

export function getOptionalPasswordError(
  password,
  minLength = DEFAULT_PASSWORD_MIN_LENGTH,
  maxLength = PASSWORD_FIELD_MAX_LENGTH
) {
  const raw = String(password ?? "");
  if (!raw.trim()) return "";
  return getPasswordError(raw, minLength, maxLength);
}

export function getOptionalConfirmPasswordError(
  password,
  confirmPassword,
  maxLength = PASSWORD_FIELD_MAX_LENGTH
) {
  const pwdRaw = String(password ?? "");
  const confirmRaw = String(confirmPassword ?? "");
  const pwd = pwdRaw.trim();
  const confirm = confirmRaw.trim();
  if (!pwd && !confirm) return "";
  if (!confirm) return "Confirm password is required";
  if (confirmRaw !== confirm) {
    return "Confirm password cannot start or end with spaces";
  }
  if (confirm.length > maxLength) {
    return `Confirm password must be at most ${maxLength} characters`;
  }
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
