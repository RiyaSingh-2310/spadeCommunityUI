/**
 * Normalizes a search query for API payloads and matching.
 * Collapses runs of whitespace to a single space and trims ends.
 * Preserves meaningful spaces so multi-word titles (e.g. "Country Selection") match.
 * @param {unknown} query
 */
export function normalizeSearchQuery(query) {
  return String(query ?? "").replace(/\s+/g, " ").trim();
}

/**
 * @param {unknown} value
 */
function normalizeComparableText(value) {
  return normalizeSearchQuery(value).toLowerCase();
}

/**
 * @param {unknown} text
 * @param {unknown} query
 */
export function matchesSearchQuery(text, query) {
  const normalizedQuery = normalizeComparableText(query);
  if (!normalizedQuery) return true;
  return normalizeComparableText(text).includes(normalizedQuery);
}

/**
 * @param {Record<string, unknown> | null | undefined} row
 * @param {unknown} query
 * @param {string[] | null | undefined} searchFields
 */
export function rowMatchesSearchQuery(row, query, searchFields = null) {
  const normalizedQuery = normalizeComparableText(query);
  if (!normalizedQuery) return true;
  if (!row || typeof row !== "object") return false;

  const fields =
    Array.isArray(searchFields) && searchFields.length > 0
      ? searchFields
      : Object.keys(row);

  const haystack = fields
    .map((field) => row[field])
    .filter((value) => value != null && value !== "")
    .map((value) => normalizeComparableText(value))
    .join("");

  return haystack.includes(normalizedQuery);
}
