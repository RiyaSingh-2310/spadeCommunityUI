export const BLOCKED_NUMERIC_KEYS = ["e", "E", "+", "-"];

export const DEFAULT_DECIMAL_PLACES = 2;

/** Whole numbers only (no decimals). */
export function sanitizeInteger(raw) {
  return String(raw ?? "").replace(/\D/g, "");
}

/** Whole numbers greater than zero (empty allowed while typing). */
export function sanitizePositiveInteger(raw, maxDigits) {
  const digits =
    maxDigits != null
      ? sanitizeInteger(raw).slice(0, maxDigits)
      : sanitizeInteger(raw);
  if (!digits) return "";
  const num = Number.parseInt(digits, 10);
  if (!Number.isFinite(num) || num <= 0) return "";
  return String(num);
}

/**
 * Numeric string with at most `maxDecimals` digits after the decimal point.
 * Examples: "10.50" valid, "10.999" -> "10.99"
 */
export function sanitizeDecimal(raw, maxDecimals = DEFAULT_DECIMAL_PLACES) {
  let cleaned = String(raw ?? "").replace(/[^\d.]/g, "");

  const dotIndex = cleaned.indexOf(".");
  if (dotIndex === -1) {
    return cleaned;
  }

  const intPart = cleaned.slice(0, dotIndex);
  const decPart = cleaned.slice(dotIndex + 1).replace(/\./g, "");
  const trimmedDec = decPart.slice(0, maxDecimals);

  if (cleaned.endsWith(".") && trimmedDec.length === 0) {
    return `${intPart}.`;
  }

  return trimmedDec.length > 0 ? `${intPart}.${trimmedDec}` : intPart;
}

/**
 * Returns true when value is empty, a whole number, or has at most `maxDecimals` places.
 * Incomplete values ending with "." are invalid.
 * @param {unknown} value
 * @param {number} [maxDecimals=DEFAULT_DECIMAL_PLACES]
 */
export function isValidDecimalPlaces(value, maxDecimals = DEFAULT_DECIMAL_PLACES) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return true;
  if (trimmed.endsWith(".")) return false;
  if (!/^\d+(\.\d+)?$/.test(trimmed)) return false;
  const [, decPart = ""] = trimmed.split(".");
  return decPart.length <= maxDecimals;
}

/**
 * Validation error for decimal fields that allow at most `maxDecimals` places.
 * @param {unknown} value
 * @param {string} label
 * @param {{ required?: boolean, maxDecimals?: number }} [options]
 */
export function getDecimalPlacesError(
  value,
  label,
  { required = true, maxDecimals = DEFAULT_DECIMAL_PLACES } = {}
) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) {
    return required ? `${label} is required` : "";
  }
  if (trimmed.endsWith(".")) return `${label} is incomplete`;
  if (!/^\d+(\.\d+)?$/.test(trimmed)) {
    return `${label} must be a valid number`;
  }
  const [, decPart = ""] = trimmed.split(".");
  if (decPart.length > maxDecimals) {
    return `${label} allows at most ${maxDecimals} digits after the decimal`;
  }
  return "";
}

export function preventBlockedNumericKeys(event) {
  if (BLOCKED_NUMERIC_KEYS.includes(event.key)) {
    event.preventDefault();
  }
}

export function preventWheelValueChange(event) {
  event.currentTarget.blur();
}

export function handleIntegerPaste(event, onChange) {
  event.preventDefault();
  const pasted = event.clipboardData?.getData("text") ?? "";
  onChange(sanitizeInteger(pasted));
}

export function handleDecimalPaste(event, onChange, maxDecimals = DEFAULT_DECIMAL_PLACES) {
  event.preventDefault();
  const pasted = event.clipboardData?.getData("text") ?? "";
  onChange(sanitizeDecimal(pasted, maxDecimals));
}
