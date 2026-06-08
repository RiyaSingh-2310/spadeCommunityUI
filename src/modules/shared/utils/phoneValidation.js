import {
  findPhoneCountry,
  getPhoneCountryByCode,
  PHONE_COUNTRIES,
} from "../data/phoneCountries";

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
    const sorted = [...PHONE_COUNTRIES].sort(
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
    return { valid: false, message: "Phone number is required" };
  }

  if (country.code === "IN") {
    if (digits.length !== 10) {
      return { valid: false, message: "Indian phone numbers must be exactly 10 digits" };
    }
    if (!/^[6-9]/.test(digits)) {
      return { valid: false, message: "Indian mobile numbers must start with 6, 7, 8, or 9" };
    }
    return { valid: true, message: "" };
  }

  if (country.code === "US" || country.code === "CA") {
    if (digits.length !== 10) {
      return {
        valid: false,
        message: `${country.name} phone numbers must be exactly 10 digits`,
      };
    }
    if (digits.startsWith("0") || digits.startsWith("1")) {
      return { valid: false, message: "Enter a valid area code and phone number" };
    }
    return { valid: true, message: "" };
  }

  if (country.code === "GB") {
    if (digits.length !== 10) {
      return { valid: false, message: "UK phone numbers must be exactly 10 digits" };
    }
    return { valid: true, message: "" };
  }

  if (digits.length !== country.nationalLength) {
    return {
      valid: false,
      message: `${country.name} phone numbers must be exactly ${country.nationalLength} digits`,
    };
  }

  return { valid: true, message: "" };
}

/**
 * @param {string} fullValue
 * @param {{ required?: boolean, label?: string, defaultCountryCode?: string }} [options]
 */
export function getPhoneError(
  fullValue,
  { required = true, label = "Phone number", defaultCountryCode = "IN" } = {}
) {
  const trimmed = String(fullValue ?? "").trim();
  if (!trimmed) {
    return required ? `${label} is required` : "";
  }

  const parsed = parsePhoneValue(trimmed, defaultCountryCode);
  const country = findPhoneCountry(parsed.countryCode) ?? getPhoneCountryByCode(parsed.countryCode);
  const result = validateNationalPhoneNumber(country.code, parsed.nationalNumber);

  if (!result.valid) {
    return result.message;
  }

  return "";
}
