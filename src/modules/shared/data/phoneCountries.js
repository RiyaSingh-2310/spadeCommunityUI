/** @typedef {{ code: string, name: string, dialCode: string, flag: string, nationalLength: number }} PhoneCountry */

/** @type {PhoneCountry[]} */
export const PHONE_COUNTRIES = [
  { code: "IN", name: "India", dialCode: "+91", flag: "🇮🇳", nationalLength: 10 },
  { code: "US", name: "United States", dialCode: "+1", flag: "🇺🇸", nationalLength: 10 },
  { code: "GB", name: "United Kingdom", dialCode: "+44", flag: "🇬🇧", nationalLength: 10 },
  { code: "AE", name: "United Arab Emirates", dialCode: "+971", flag: "🇦🇪", nationalLength: 9 },
  { code: "CA", name: "Canada", dialCode: "+1", flag: "🇨🇦", nationalLength: 10 },
  { code: "AU", name: "Australia", dialCode: "+61", flag: "🇦🇺", nationalLength: 9 },
  { code: "DE", name: "Germany", dialCode: "+49", flag: "🇩🇪", nationalLength: 10 },
  { code: "FR", name: "France", dialCode: "+33", flag: "🇫🇷", nationalLength: 9 },
  { code: "SG", name: "Singapore", dialCode: "+65", flag: "🇸🇬", nationalLength: 8 },
];

const ENV_DEFAULT =
  import.meta.env.VITE_DEFAULT_PHONE_COUNTRY?.trim()?.toUpperCase() ?? "IN";

/** Maps form country labels to ISO phone country codes. */
export const COUNTRY_LABEL_TO_PHONE_CODE = {
  India: "IN",
  USA: "US",
  "United States": "US",
  UK: "GB",
  "United Kingdom": "GB",
  UAE: "AE",
  "United Arab Emirates": "AE",
  Canada: "CA",
  Australia: "AU",
  Germany: "DE",
  France: "FR",
  Singapore: "SG",
};

export function getDefaultPhoneCountryCode(formCountryLabel) {
  if (formCountryLabel) {
    const mapped = COUNTRY_LABEL_TO_PHONE_CODE[String(formCountryLabel).trim()];
    if (mapped && PHONE_COUNTRIES.some((c) => c.code === mapped)) {
      return mapped;
    }
  }
  if (PHONE_COUNTRIES.some((c) => c.code === ENV_DEFAULT)) {
    return ENV_DEFAULT;
  }
  return PHONE_COUNTRIES[0]?.code ?? "IN";
}

export function findPhoneCountry(codeOrDial) {
  const raw = String(codeOrDial ?? "").trim();
  if (!raw) return null;

  const byCode = PHONE_COUNTRIES.find(
    (c) => c.code.toUpperCase() === raw.toUpperCase()
  );
  if (byCode) return byCode;

  const normalizedDial = raw.startsWith("+") ? raw : `+${raw}`;
  return (
    PHONE_COUNTRIES.find((c) => c.dialCode === normalizedDial) ??
    PHONE_COUNTRIES.find((c) => normalizedDial.startsWith(c.dialCode)) ??
    null
  );
}

export function getPhoneCountryByCode(code) {
  return PHONE_COUNTRIES.find((c) => c.code === code) ?? PHONE_COUNTRIES[0];
}
