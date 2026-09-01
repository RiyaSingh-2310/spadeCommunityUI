import {
  findPhoneCountry,
  getPhoneCountryByCode,
  getPhoneCountries,
} from "../data/phoneCountries";

/** Default national length when a country does not define one. */
export const CONTACT_NUMBER_DIGIT_LENGTH = 10;

/** Digits-only national number (no country code). */
export function sanitizePhoneDigits(raw) {
  return String(raw ?? "").replace(/\D/g, "");
}

export function getNationalPhoneLength(countryCode, fallback = CONTACT_NUMBER_DIGIT_LENGTH) {
  const length = Number(getPhoneCountryByCode(countryCode)?.nationalLength);
  return Number.isFinite(length) && length > 0 ? length : fallback;
}

export function limitNationalPhoneDigits(raw, maxLength = CONTACT_NUMBER_DIGIT_LENGTH) {
  return sanitizePhoneDigits(raw).slice(0, maxLength);
}

/**
 * Blocks non-numeric keystrokes in phone fields (letters, spaces, decimals, symbols).
 */
export function preventNonDigitPhoneKeys(event) {
  const key = event.key;

  if (event.ctrlKey || event.metaKey) return;

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

  if (typeof key === "string" && /^[0-9]$/.test(key)) return;

  event.preventDefault();
}

/**
 * @param {string} fullValue e.g. "+91 9876543210"
 * @param {string} [fallbackCountryCode]
 */
export function parsePhoneValue(fullValue, fallbackCountryCode = "IN") {
  const trimmed = String(fullValue ?? "").trim();
  if (!trimmed) {
    return {
      countryCode: fallbackCountryCode,
      nationalNumber: "",
      dialCode: getPhoneCountryByCode(fallbackCountryCode).dialCode,
    };
  }

  if (trimmed.startsWith("+")) {
    const digits = sanitizePhoneDigits(trimmed);
    const sorted = [...getPhoneCountries()].sort(
      (a, b) => b.dialCode.length - a.dialCode.length
    );

    for (const country of sorted) {
      const dialDigits = sanitizePhoneDigits(country.dialCode);
      if (digits.startsWith(dialDigits)) {
        return {
          countryCode: country.code,
          nationalNumber: digits.slice(dialDigits.length),
          dialCode: country.dialCode,
        };
      }
    }
  }

  const country = getPhoneCountryByCode(fallbackCountryCode);
  return {
    countryCode: country.code,
    nationalNumber: sanitizePhoneDigits(trimmed),
    dialCode: country.dialCode,
  };
}

export function formatPhoneValue(countryCode, nationalNumber) {
  const country = getPhoneCountryByCode(countryCode);
  const digits = sanitizePhoneDigits(nationalNumber);
  if (!digits) return "";
  return `${country.dialCode} ${digits}`;
}

/**
 * @param {string} countryCode
 * @param {string} nationalNumber
 * @param {string} [label]
 */
export function validateNationalPhoneNumber(
  countryCode,
  nationalNumber,
  label = "Contact Number"
) {
  const country = getPhoneCountryByCode(countryCode);
  const expectedLength = getNationalPhoneLength(country.code);
  const digits = sanitizePhoneDigits(nationalNumber);

  if (!digits) {
    return { valid: false, message: `${label} is required` };
  }

  if (digits.length !== expectedLength) {
    return {
      valid: false,
      message: `${label} must be exactly ${expectedLength} digits for ${country.name}`,
    };
  }

  if (country.code === "IN" && !/^[6-9]/.test(digits)) {
    return { valid: false, message: "Indian mobile numbers must start with 6, 7, 8, or 9" };
  }

  if (
    (country.code === "US" || country.code === "CA") &&
    (digits.startsWith("0") || digits.startsWith("1"))
  ) {
    return { valid: false, message: "Enter a valid area code and phone number" };
  }

  return { valid: true, message: "" };
}

/**
 * @param {string} fullValue
 * @param {{ required?: boolean, label?: string, defaultCountryCode?: string, exactLength?: number }} [options]
 */
export function getPhoneError(
  fullValue,
  {
    required = true,
    label = "Contact Number",
    defaultCountryCode = "IN",
    exactLength,
  } = {}
) {
  const trimmed = String(fullValue ?? "").trim();
  if (!trimmed) {
    return required ? `${label} is required` : "";
  }

  const parsed = parsePhoneValue(trimmed, defaultCountryCode);
  const country = findPhoneCountry(parsed.countryCode) ?? getPhoneCountryByCode(parsed.countryCode);
  const expectedLength = exactLength ?? getNationalPhoneLength(country.code);
  const digits = sanitizePhoneDigits(parsed.nationalNumber);

  if (digits.length !== expectedLength) {
    return `${label} must be exactly ${expectedLength} digits`;
  }

  const result = validateNationalPhoneNumber(country.code, digits, label);
  return result.valid ? "" : result.message;
}

/** Panelist mobile: optional or required 10-digit numeric Indian mobile. */
export function getPanelistMobileError(value, { required = false, label = "Mobile" } = {}) {
  const digits = sanitizePhoneDigits(value);
  if (!digits) {
    return required ? `${label} is required` : "";
  }
  return getPhoneError(digits, {
    required,
    label,
    defaultCountryCode: "IN",
    exactLength: 10,
  });
}
