import {
  normalizeSearchQuery as collapseSearchWhitespace,
} from "./searchQuery";

const MATCH = {
  EXACT: 3,
  STARTS_WITH: 2,
  CONTAINS: 1,
  NONE: 0,
};

/** @param {string} query */
export function normalizeSearchQuery(query) {
  return collapseSearchWhitespace(query).toLowerCase();
}

/** @param {string} text */
function normalizeText(text) {
  return collapseSearchWhitespace(text).toLowerCase();
}

/**
 * @param {string} text
 * @param {string} query
 * @returns {number}
 */
export function getTextMatchRank(text, query) {
  const value = normalizeText(text);
  const q = normalizeSearchQuery(query);
  if (!q) return MATCH.NONE;
  if (!value) return MATCH.NONE;
  if (value === q) return MATCH.EXACT;
  if (value.startsWith(q)) return MATCH.STARTS_WITH;
  if (value.includes(q)) return MATCH.CONTAINS;
  return MATCH.NONE;
}

/**
 * @param {string} code
 * @param {string} query
 * @returns {number}
 */
function getCodeMatchRank(code, query) {
  const value = normalizeText(code);
  const q = normalizeSearchQuery(query);
  if (!q || !value) return MATCH.NONE;
  if (value === q) return MATCH.EXACT;
  if (q.length <= 3 && value.startsWith(q)) return MATCH.STARTS_WITH;
  return MATCH.NONE;
}

/**
 * @param {string} dialCode
 * @param {string} query
 * @returns {{ rank: number, exact: boolean }}
 */
function getDialCodeMatchRank(dialCode, query) {
  const q = normalizeSearchQuery(query);
  if (!q) return { rank: MATCH.NONE, exact: false };

  const normalizedDial = String(dialCode ?? "").trim().toLowerCase();
  const dialDigits = normalizedDial.replace(/\D/g, "");
  const queryDigits = q.replace(/\D/g, "");

  if (!queryDigits) return { rank: MATCH.NONE, exact: false };

  const plusQuery = q.startsWith("+") ? q : `+${queryDigits}`;

  if (normalizedDial === plusQuery || normalizedDial === q) {
    return { rank: MATCH.EXACT, exact: true };
  }

  if (dialDigits === queryDigits) {
    return { rank: MATCH.EXACT, exact: true };
  }

  if (normalizedDial.startsWith(plusQuery) || dialDigits.startsWith(queryDigits)) {
    return { rank: MATCH.STARTS_WITH, exact: false };
  }

  return { rank: MATCH.NONE, exact: false };
}

function queryLooksLikeDialCode(query) {
  const trimmed = String(query ?? "").trim();
  return /^\+?\d+$/.test(trimmed);
}

/**
 * @param {{ name?: string, label?: string, code?: string, dialCode?: string }} country
 */
export function formatCountryOptionLabel(country) {
  const name = String(country?.name ?? country?.label ?? "").trim();
  const dialCode = String(country?.dialCode ?? "").trim();
  if (!name) return "";
  return dialCode ? `${name} (${dialCode})` : name;
}

/**
 * @param {{ name?: string, label?: string, code?: string, dialCode?: string }} country
 * @param {string} query
 */
export function getCountryMatchScore(country, query) {
  const q = normalizeSearchQuery(query);
  if (!q) {
    return { rank: MATCH.NONE, exactName: false, exactCode: false, exactDial: false };
  }

  const name = country.name ?? country.label ?? "";
  const nameRank = getTextMatchRank(name, q);
  const codeRank = getCodeMatchRank(country.code, q);

  let dialRank = MATCH.NONE;
  let exactDial = false;
  if (country.dialCode && queryLooksLikeDialCode(q)) {
    const dialMatch = getDialCodeMatchRank(country.dialCode, q);
    dialRank = dialMatch.rank;
    exactDial = dialMatch.exact;
  }

  const rank = Math.max(nameRank, codeRank, dialRank);

  return {
    rank,
    exactName: nameRank === MATCH.EXACT,
    exactCode: codeRank === MATCH.EXACT,
    exactDial,
  };
}

/**
 * @param {{ name?: string, label?: string, code?: string, dialCode?: string }} country
 * @param {string} query
 */
export function getPhoneCountryMatchScore(country, query) {
  const q = normalizeSearchQuery(query);
  if (!q) {
    return { rank: MATCH.NONE, exactName: false, exactCode: false, exactDial: false };
  }

  const name = country.name ?? country.label ?? "";
  const nameRank = getTextMatchRank(name, q);
  const codeRank = getCodeMatchRank(country.code, q);

  let dialRank = MATCH.NONE;
  let exactDial = false;

  if (queryLooksLikeDialCode(q)) {
    const dialMatch = getDialCodeMatchRank(country.dialCode, q);
    dialRank = dialMatch.rank;
    exactDial = dialMatch.exact;
  }

  const rank = Math.max(nameRank, codeRank, dialRank);

  return {
    rank,
    exactName: nameRank === MATCH.EXACT,
    exactCode: codeRank === MATCH.EXACT,
    exactDial,
  };
}

/**
 * @template T
 * @param {T[]} items
 * @param {(item: T) => string} getSortName
 */
function sortByName(items, getSortName) {
  return [...items].sort((a, b) => getSortName(a).localeCompare(getSortName(b)));
}

/**
 * @template T
 * @param {T[]} items
 * @param {string} query
 * @param {(item: T) => { rank: number }} scoreItem
 * @param {(item: T) => string} getSortName
 */
function filterPartialMatches(items, query, scoreItem, getSortName) {
  const scored = items
    .map((item) => ({ item, ...scoreItem(item) }))
    .filter((entry) => entry.rank > MATCH.NONE);

  return [...scored]
    .sort((a, b) => {
      if (b.rank !== a.rank) return b.rank - a.rank;
      return getSortName(a.item).localeCompare(getSortName(b.item));
    })
    .map((entry) => entry.item);
}

/**
 * @template T
 * @param {T[]} items
 * @param {string} query
 * @param {(item: T) => string} getName
 * @param {(item: T) => string | undefined} getCode
 * @param {(item: T) => string} getSortName
 * @param {(item: T) => string | undefined} [getDialCode]
 */
function narrowCountryExactMatches(items, query, getName, getCode, getSortName, getDialCode) {
  const q = normalizeSearchQuery(query);
  if (!q) return null;

  const exactNameMatches = items.filter(
    (item) => getTextMatchRank(getName(item), q) === MATCH.EXACT
  );
  if (exactNameMatches.length > 0) {
    return sortByName(exactNameMatches, getSortName);
  }

  const exactCodeMatches = items.filter(
    (item) => getCodeMatchRank(getCode(item), q) === MATCH.EXACT
  );
  if (exactCodeMatches.length > 0) {
    return sortByName(exactCodeMatches, getSortName);
  }

  if (getDialCode && queryLooksLikeDialCode(q)) {
    const exactDialMatches = items.filter(
      (item) => getDialCodeMatchRank(getDialCode(item), q).exact
    );
    if (exactDialMatches.length > 0) {
      return sortByName(exactDialMatches, getSortName);
    }
  }

  return null;
}

/**
 * @template T
 * @param {T[]} items
 * @param {string} query
 * @param {(item: T) => string} getName
 * @param {(item: T) => string | undefined} getCode
 * @param {(item: T) => string | undefined} getDialCode
 * @param {(item: T) => string} getSortName
 */
function narrowPhoneExactMatches(items, query, getName, getCode, getDialCode, getSortName) {
  const countryMatches = narrowCountryExactMatches(
    items,
    query,
    getName,
    getCode,
    getSortName
  );
  if (countryMatches) return countryMatches;

  const q = normalizeSearchQuery(query);
  if (queryLooksLikeDialCode(q)) {
    const exactDialMatches = items.filter(
      (item) => getDialCodeMatchRank(getDialCode(item), q).exact
    );
    if (exactDialMatches.length > 0) {
      return sortByName(exactDialMatches, getSortName);
    }
  }

  return null;
}

/** @param {string} haystack @param {string} query */
export function matchesPartialText(haystack, query) {
  return getTextMatchRank(haystack, query) > MATCH.NONE;
}

/**
 * @param {{ name?: string, label?: string, code?: string }} country
 * @param {string} query
 */
export function matchesCountryOption(country, query) {
  return getCountryMatchScore(country, query).rank > MATCH.NONE;
}

/**
 * @param {{ name?: string, label?: string, code?: string, dialCode?: string }} country
 * @param {string} query
 */
export function matchesPhoneCountryOption(country, query) {
  return getPhoneCountryMatchScore(country, query).rank > MATCH.NONE;
}

/**
 * @param {{ name?: string, label?: string, code?: string, dialCode?: string }} country
 */
export function mapCountryToSelectOption(country) {
  const name = country.name ?? country.label ?? "";
  return {
    value: name,
    label: formatCountryOptionLabel(country),
    searchMeta: {
      name,
      code: country.code,
      dialCode: country.dialCode,
    },
  };
}

/**
 * @param {Array<{ value?: string, label?: string, searchMeta?: { name?: string, code?: string } }>} options
 * @param {string} query
 */
export function filterSelectOptions(options, query) {
  const q = normalizeSearchQuery(query);
  if (!q) return options;

  const countryOptions = options.filter((option) => option.searchMeta);
  const genericOptions = options.filter((option) => !option.searchMeta);

  const filteredCountry =
    narrowCountryExactMatches(
      countryOptions,
      q,
      (option) => option.searchMeta?.name ?? option.label ?? "",
      (option) => option.searchMeta?.code,
      (option) => option.searchMeta?.name ?? option.label ?? "",
      (option) => option.searchMeta?.dialCode
    ) ??
    filterPartialMatches(
      countryOptions,
      q,
      (option) => getCountryMatchScore(option.searchMeta, q),
      (option) => option.searchMeta?.name ?? option.label ?? ""
    );

  const filteredGeneric =
    narrowCountryExactMatches(
      genericOptions,
      q,
      (option) => option.label ?? option.value ?? "",
      () => undefined,
      (option) => option.label ?? option.value ?? ""
    ) ??
    filterPartialMatches(
      genericOptions,
      q,
      (option) => {
        const label = option.label ?? option.value ?? "";
        const rank = getTextMatchRank(label, q);
        return { rank };
      },
      (option) => option.label ?? option.value ?? ""
    );

  return [...filteredCountry, ...filteredGeneric];
}

/**
 * @param {Array<{ name?: string, label?: string, code?: string }>} countries
 * @param {string} query
 */
export function filterCountryOptions(countries, query) {
  const q = normalizeSearchQuery(query);
  if (!q) return countries;

  const getSortName = (country) => country.name ?? country.label ?? "";

  return (
    narrowCountryExactMatches(
      countries,
      q,
      (country) => country.name ?? country.label ?? "",
      (country) => country.code,
      getSortName,
      (country) => country.dialCode
    ) ??
    filterPartialMatches(countries, q, (country) => getCountryMatchScore(country, q), getSortName)
  );
}

/**
 * @param {Array<{ name?: string, label?: string, code?: string, dialCode?: string }>} countries
 * @param {string} query
 */
export function filterPhoneCountryOptions(countries, query) {
  const q = normalizeSearchQuery(query);
  if (!q) return countries;

  const getSortName = (country) => country.name ?? country.label ?? "";

  return (
    narrowPhoneExactMatches(
      countries,
      q,
      (country) => country.name ?? country.label ?? "",
      (country) => country.code,
      (country) => country.dialCode,
      getSortName
    ) ??
    filterPartialMatches(
      countries,
      q,
      (country) => getPhoneCountryMatchScore(country, q),
      getSortName
    )
  );
}
