export const BLOCKED_NUMERIC_KEYS = ["e", "E", "+", "-"];

export const DEFAULT_DECIMAL_PLACES = 2;

/** Whole numbers only (no decimals). */
export function sanitizeInteger(raw) {
  return String(raw ?? "").replace(/\D/g, "");
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

export function preventBlockedNumericKeys(event) {
  if (BLOCKED_NUMERIC_KEYS.includes(event.key)) {
    event.preventDefault();
  }
}

/** Blur on wheel so scrolling the page does not change the input value. */
export function preventWheelValueChange(event) {
  event.currentTarget.blur();
}
