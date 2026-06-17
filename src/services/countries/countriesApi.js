import { API_ROUTES } from "../../config/api";
import { COUNTRY_NAME_TO_ISO } from "../../modules/shared/data/countryIsoByName";
import { PHONE_COUNTRIES_FALLBACK } from "../../modules/shared/data/phoneCountries";
import { apiRequest } from "../api/client";
import { ApiError } from "../api/ApiError";

/** @type {import("../../modules/shared/data/phoneCountries").PhoneCountry[] | null} */
let cachedCountries = null;
/** @type {Promise<import("../../modules/shared/data/phoneCountries").PhoneCountry[]> | null} */
let inflightRequest = null;
/** @type {Map<string, import("../../modules/shared/data/phoneCountries").PhoneCountry> | null} */
let cachedByName = null;
/** @type {Map<string, import("../../modules/shared/data/phoneCountries").PhoneCountry> | null} */
let cachedByCode = null;

const DEFAULT_NATIONAL_LENGTH = 15;

const NATIONAL_LENGTH_BY_CODE = {
  IN: 10,
  US: 10,
  CA: 10,
  GB: 10,
  AE: 9,
  AU: 9,
  DE: 10,
  FR: 9,
  SG: 8,
};

function assertSuccess(data) {
  if (data?.success !== true) {
    throw new ApiError(data?.message ?? "", data);
  }
  return data;
}

function normalizeCountryNameKey(name) {
  return String(name ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function resolveIsoCode(name) {
  const trimmed = String(name ?? "").trim();
  if (!trimmed) return "";

  if (trimmed.length === 2 && /^[A-Za-z]{2}$/.test(trimmed)) {
    return trimmed.toUpperCase();
  }

  const direct = COUNTRY_NAME_TO_ISO[trimmed];
  if (direct) return direct;

  const normalized = normalizeCountryNameKey(trimmed);
  for (const [label, code] of Object.entries(COUNTRY_NAME_TO_ISO)) {
    if (normalizeCountryNameKey(label) === normalized) {
      return code;
    }
  }

  return "";
}

/**
 * @param {object} country
 */
function normalizeCountry(country) {
  const name = String(country?.name ?? "").trim();
  const code = resolveIsoCode(name);
  const callingCode = country?.calling_code ?? country?.callingCode ?? "";
  const dialCode =
    callingCode && String(callingCode).startsWith("+")
      ? String(callingCode)
      : callingCode
        ? `+${String(callingCode).replace(/^\+/, "")}`
        : "";

  return {
    id: country?.country_id ?? country?.id ?? name,
    name,
    code,
    callingCode: dialCode,
    dialCode,
    nationalLength: NATIONAL_LENGTH_BY_CODE[code] ?? DEFAULT_NATIONAL_LENGTH,
    label: name,
  };
}

function buildRegistry(countries) {
  const byName = new Map();
  const byCode = new Map();

  for (const country of countries) {
    if (country.name) {
      byName.set(normalizeCountryNameKey(country.name), country);
    }
    if (country.code) {
      byCode.set(country.code.toUpperCase(), country);
    }
  }

  cachedByName = byName;
  cachedByCode = byCode;
}

function extractCountriesList(data) {
  if (!data || typeof data !== "object") return [];
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.countries)) return data.countries;
  return [];
}

function buildFallbackCountries() {
  const dialByCode = Object.fromEntries(
    PHONE_COUNTRIES_FALLBACK.map((country) => [country.code, country.dialCode])
  );
  const nationalByCode = Object.fromEntries(
    PHONE_COUNTRIES_FALLBACK.map((country) => [country.code, country.nationalLength])
  );
  const byCode = new Map();

  for (const [name, code] of Object.entries(COUNTRY_NAME_TO_ISO)) {
    const trimmedName = String(name ?? "").trim();
    const isoCode = String(code ?? "").trim().toUpperCase();
    if (!trimmedName || !isoCode) continue;

    const existing = byCode.get(isoCode);
    if (!existing || trimmedName.length > existing.name.length) {
      byCode.set(isoCode, { name: trimmedName, code: isoCode });
    }
  }

  return [...byCode.values()]
    .map(({ name, code }) =>
      normalizeCountry({
        name,
        calling_code: dialByCode[code]?.replace(/^\+/, "") ?? "",
        nationalLength: nationalByCode[code],
      })
    )
    .sort((a, b) => a.name.localeCompare(b.name));
}

function setCountriesCache(countries) {
  const normalized = (Array.isArray(countries) ? countries : [])
    .map((country) => (country?.name ? country : normalizeCountry(country)))
    .filter((country) => country.name);

  cachedCountries = normalized.length > 0 ? normalized : buildFallbackCountries();
  buildRegistry(cachedCountries);
  return cachedCountries;
}

/** Whether the countries list has been loaded and cached. */
export function isCountriesCacheReady() {
  return Boolean(cachedCountries?.length);
}

/** Synchronous countries list for dropdowns (cached API data or local fallback). */
export function getCountriesOrFallback() {
  if (cachedCountries?.length) return cachedCountries;
  return buildFallbackCountries();
}

/** GET /api/countries/list — cached after first successful fetch. */
export async function getCountries() {
  if (cachedCountries) {
    return cachedCountries;
  }

  if (inflightRequest) {
    return inflightRequest;
  }

  inflightRequest = apiRequest(API_ROUTES.countries.list)
    .then((data) => {
      assertSuccess(data);
      const rawCountries = extractCountriesList(data);
      return setCountriesCache(rawCountries.map((country) => normalizeCountry(country)));
    })
    .catch(() => setCountriesCache([]))
    .finally(() => {
      inflightRequest = null;
    });

  return inflightRequest;
}

/**
 * @param {import("../../modules/shared/data/phoneCountries").PhoneCountry[] | null | undefined} countries
 */
export function getCachedCountries(countries = cachedCountries) {
  return countries ?? [];
}

/**
 * @param {string | null | undefined} value
 * @param {import("../../modules/shared/data/phoneCountries").PhoneCountry[] | null} [countries]
 */
export function findCountryByValue(value, countries = cachedCountries) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;

  const list = countries ?? [];
  const normalized = normalizeCountryNameKey(raw);

  const byRegistry = cachedByName?.get(normalized) ?? null;
  if (byRegistry) return byRegistry;

  const isoCode = resolveIsoCode(raw);
  if (isoCode) {
    const byCode =
      cachedByCode?.get(isoCode) ??
      list.find((item) => item.code?.toUpperCase() === isoCode) ??
      null;
    if (byCode) return byCode;
  }

  const byCodeRaw = cachedByCode?.get(raw.toUpperCase()) ?? null;
  if (byCodeRaw) return byCodeRaw;

  const codeNameMatch = raw.match(/^([A-Za-z]{2})\s*-\s*(.+)$/);
  if (codeNameMatch) {
    const [, code, name] = codeNameMatch;
    const byCode = list.find((item) => item.code?.toUpperCase() === code.toUpperCase());
    if (byCode) return byCode;
    const byName = list.find(
      (item) => normalizeCountryNameKey(item.name) === normalizeCountryNameKey(name)
    );
    if (byName) return byName;
  }

  return (
    list.find((item) => normalizeCountryNameKey(item.name) === normalized) ??
    list.find((item) => item.code?.toUpperCase() === raw.toUpperCase()) ??
    null
  );
}

const PREFERRED_COUNTRY_NAMES_BY_ISO = {
  US: "United States",
  GB: "United Kingdom",
  AE: "United Arab Emirates",
};

function resolveCountryNameFromIsoCode(code) {
  const normalizedCode = String(code ?? "").trim().toUpperCase();
  if (!normalizedCode) return "";

  const fromCache = cachedByCode?.get(normalizedCode);
  if (fromCache?.name) return fromCache.name;

  const fromList = (cachedCountries ?? []).find(
    (item) => item.code?.toUpperCase() === normalizedCode
  );
  if (fromList?.name) return fromList.name;

  if (PREFERRED_COUNTRY_NAMES_BY_ISO[normalizedCode]) {
    return PREFERRED_COUNTRY_NAMES_BY_ISO[normalizedCode];
  }

  let resolved = "";
  for (const [name, iso] of Object.entries(COUNTRY_NAME_TO_ISO)) {
    if (iso !== normalizedCode) continue;
    if (name.length > 3 && (!resolved || name.length < resolved.length)) {
      resolved = name;
    }
  }

  return resolved;
}

/**
 * Resolves stored/API country value (name) from code, label, or raw string.
 * @param {string | null | undefined} value
 * @param {import("../../modules/shared/data/phoneCountries").PhoneCountry[] | null} [countries]
 */
export function resolveCountryName(value, countries = cachedCountries) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";

  const codeNameMatch = raw.match(/^[A-Za-z]{2}\s*-\s*(.+)$/);
  if (codeNameMatch?.[1]) {
    return codeNameMatch[1].trim();
  }

  const match = findCountryByValue(raw, countries);
  if (match?.name) return match.name;

  if (/^[A-Za-z]{2}$/.test(raw)) {
    const fromCode = resolveCountryNameFromIsoCode(raw);
    if (fromCode) return fromCode;
  }

  return raw;
}

/**
 * @param {string | null | undefined} value
 * @param {import("../../modules/shared/data/phoneCountries").PhoneCountry[] | null} [countries]
 */
export function formatCountryLabel(value, countries = cachedCountries) {
  const name = resolveCountryName(value, countries);
  return name || "—";
}

/**
 * @param {string | null | undefined} value
 * @param {import("../../modules/shared/data/phoneCountries").PhoneCountry[] | null} [countries]
 */
export function resolveCountryCode(value, countries = cachedCountries) {
  const match = findCountryByValue(value, countries);
  if (match?.code) return match.code;
  return resolveIsoCode(value);
}

/** @param {import("../../modules/shared/data/phoneCountries").PhoneCountry[] | null} [countries] */
export function getCountrySelectOptions(countries = cachedCountries) {
  return getCachedCountries(countries);
}

export async function getCountriesMeta() {
  const countries = await getCountries();
  return {
    total: countries.length,
    count: countries.length,
  };
}
