import {
  findPhoneCountry,
  getPhoneCountries,
  getPhoneCountryByCode,
} from "../data/phoneCountries";

/** Contact Number national length across Admin forms. */
export const CONTACT_NUMBER_DIGIT_LENGTH = 10;

/** Digits-only national number (no country code). */
export function sanitizePhoneDigits(raw) {
  return String(raw ?? "").replace(/\D/g, "");
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
 */
export function validateNationalPhoneNumber(countryCode, nationalNumber) {
  const country = getPhoneCountryByCode(countryCode);
  const digits = sanitizePhoneDigits(nationalNumber);

  if (!digits) {
    return { valid: false, message: "Contact Number is required" };
  }

  if (digits.length !== CONTACT_NUMBER_DIGIT_LENGTH) {
    return {
      valid: false,
      message: `Contact Number must be exactly ${CONTACT_NUMBER_DIGIT_LENGTH} digits`,
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
 * @param {{ required?: boolean, label?: string, defaultCountryCode?: string }} [options]
 */
export function getPhoneError(
  fullValue,
  { required = true, label = "Contact Number", defaultCountryCode = "IN" } = {}
) {
  const trimmed = String(fullValue ?? "").trim();
  if (!trimmed) {
    return required ? `${label} is required` : "";
  }

  const parsed = parsePhoneValue(trimmed, defaultCountryCode);
  const country = findPhoneCountry(parsed.countryCode) ?? getPhoneCountryByCode(parsed.countryCode);
  const result = validateNationalPhoneNumber(country.code, parsed.nationalNumber);

  if (!result.valid) {
    if (result.message.startsWith("Contact Number")) {
      return result.message.replace(/^Contact Number/, label);
    }
    return result.message;
  }

  return "";
}
