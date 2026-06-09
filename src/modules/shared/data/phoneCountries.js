import {
  findCountryByValue,
  getCachedCountries,
  resolveCountryCode as resolveCountryCodeFromService,
} from "../../../services/countries/countriesApi";

/** @typedef {{ code: string, name: string, dialCode: string, nationalLength: number, label?: string }} PhoneCountry */

/** @type {PhoneCountry[]} */
export const PHONE_COUNTRIES_FALLBACK = [
  { code: "IN", name: "India", dialCode: "+91", nationalLength: 10, label: "India" },
  { code: "US", name: "United States", dialCode: "+1", nationalLength: 10, label: "United States" },
  { code: "GB", name: "United Kingdom", dialCode: "+44", nationalLength: 10, label: "United Kingdom" },
  { code: "AE", name: "United Arab Emirates", dialCode: "+971", nationalLength: 9, label: "United Arab Emirates" },
  { code: "CA", name: "Canada", dialCode: "+1", nationalLength: 10, label: "Canada" },
  { code: "AU", name: "Australia", dialCode: "+61", nationalLength: 9, label: "Australia" },
  { code: "DE", name: "Germany", dialCode: "+49", nationalLength: 10, label: "Germany" },
  { code: "FR", name: "France", dialCode: "+33", nationalLength: 9, label: "France" },
  { code: "SG", name: "Singapore", dialCode: "+65", nationalLength: 8, label: "Singapore" },
];

/** @deprecated Use getPhoneCountries() */
export const PHONE_COUNTRIES = PHONE_COUNTRIES_FALLBACK;

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

export function getPhoneCountries() {
  const cached = getCachedCountries();
  return cached.length > 0 ? cached : PHONE_COUNTRIES_FALLBACK;
}

export function getDefaultPhoneCountryCode(formCountryLabel) {
  if (formCountryLabel) {
    const match = findCountryByValue(formCountryLabel);
    if (match?.code) return match.code;

    const mapped = COUNTRY_LABEL_TO_PHONE_CODE[String(formCountryLabel).trim()];
    if (mapped && getPhoneCountries().some((c) => c.code === mapped)) {
      return mapped;
    }
  }
  if (getPhoneCountries().some((c) => c.code === ENV_DEFAULT)) {
    return ENV_DEFAULT;
  }
  return getPhoneCountries()[0]?.code ?? "IN";
}

export function findPhoneCountry(codeOrDial) {
  const raw = String(codeOrDial ?? "").trim();
  if (!raw) return null;

  const countries = getPhoneCountries();
  const byCode = countries.find((c) => c.code.toUpperCase() === raw.toUpperCase());
  if (byCode) return byCode;

  const normalizedDial = raw.startsWith("+") ? raw : `+${raw}`;
  return (
    countries.find((c) => c.dialCode === normalizedDial) ??
    countries.find((c) => normalizedDial.startsWith(c.dialCode)) ??
    null
  );
}

export function getPhoneCountryByCode(code) {
  return getPhoneCountries().find((c) => c.code === code) ?? PHONE_COUNTRIES_FALLBACK[0];
}

export function resolveCountryCode(value) {
  return resolveCountryCodeFromService(value) || getDefaultPhoneCountryCode(value);
}
