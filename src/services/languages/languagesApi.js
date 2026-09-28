import { API_ROUTES } from "../../config/api";
import { apiRequest } from "../api/client";
import { ApiError } from "../api/ApiError";

/** @type {string[] | null} */
let cachedLanguages = null;
/** @type {Promise<string[]> | null} */
let inflightRequest = null;

function assertSuccess(data) {
  if (data?.success !== true) {
    throw new ApiError(data?.message ?? "", data);
  }
  return data;
}

function displayLanguageName(value) {
  const text = String(value ?? "").trim();
  if (!text) return "";
  if (text === text.toLowerCase()) {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }
  return text;
}

function isAllLanguagesToken(value) {
  const key = String(value ?? "").trim().toLowerCase();
  return key === "all" || key === "all languages";
}

function extractLanguages(data) {
  const raw = Array.isArray(data?.data) ? data.data : [];
  const names = [];
  const seen = new Set();

  raw.forEach((item) => {
    const name =
      typeof item === "string"
        ? displayLanguageName(item)
        : displayLanguageName(item?.name ?? item?.language ?? item?.label ?? "");
    if (!name || isAllLanguagesToken(name)) return;
    const key = name.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    names.push(name);
  });

  return names;
}

export function isLanguagesCacheReady() {
  return Array.isArray(cachedLanguages);
}

export function getCachedLanguages() {
  return cachedLanguages ?? [];
}

/** Test helper. */
export function clearLanguagesCache() {
  cachedLanguages = null;
  inflightRequest = null;
}

/** GET /api/languages — cached after the first successful fetch. */
export async function getLanguages() {
  if (cachedLanguages) return cachedLanguages;
  if (inflightRequest) return inflightRequest;

  inflightRequest = apiRequest(API_ROUTES.languages.list)
    .then((data) => {
      assertSuccess(data);
      cachedLanguages = extractLanguages(data);
      return cachedLanguages;
    })
    .finally(() => {
      inflightRequest = null;
    });

  return inflightRequest;
}

/**
 * API languages, plus a stored name that is not already in the response.
 * The API list is never reduced to a group, question, or current-page subset.
 */
export function mergeLanguageNames(languages = [], { extra = [], selected = "" } = {}) {
  const names = [];
  const seen = new Set();

  const add = (raw) => {
    const value = displayLanguageName(raw);
    if (!value || isAllLanguagesToken(value)) return;
    const key = value.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    names.push(value);
  };

  (Array.isArray(languages) ? languages : []).forEach(add);
  (Array.isArray(extra) ? extra : [extra]).forEach(add);
  add(selected);

  return names;
}

/** List filters keep lowercase slug values plus an All languages option. */
export function toLanguageFilterOptions(languages = [], { extra = [], selected = "" } = {}) {
  return [
    { value: "all", label: "All languages" },
    ...mergeLanguageNames(languages, { extra, selected }).map((name) => ({
      value: name.toLowerCase(),
      label: name,
    })),
  ];
}
