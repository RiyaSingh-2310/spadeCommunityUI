import { normalizeSearchQuery } from "./searchQuery";

/** Backend list endpoints reject limits above this value. */
export const MAX_API_LIST_LIMIT = 100;

/**
 * Clamps a list `limit` into the backend-supported range [1, MAX_API_LIST_LIMIT].
 * @param {unknown} limit
 * @param {number} [fallback=10]
 */
export function clampApiListLimit(limit, fallback = 10) {
  const parsed = Number(limit);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return Math.min(Math.max(1, Number(fallback) || 10), MAX_API_LIST_LIMIT);
  }
  return Math.min(Math.floor(parsed), MAX_API_LIST_LIMIT);
}

/**
 * Builds URLSearchParams for paginated list APIs with optional search.
 * @param {{ page?: number, limit?: number, search?: string, extra?: Record<string, string|number>, alwaysIncludeEmpty?: string[] }} [options]
 */
export function buildListQueryParams({ page, limit, search, extra = {}, alwaysIncludeEmpty = [] } = {}) {
  const params = new URLSearchParams();
  const safePage = Number(page);

  if (Number.isFinite(safePage) && safePage > 0) {
    params.set("page", String(safePage));
  }
  if (limit != null && limit !== "") {
    params.set("limit", String(clampApiListLimit(limit)));
  }

  const normalizedSearch = normalizeSearchQuery(search);
  if (normalizedSearch) {
    params.set("search", normalizedSearch);
  } else if (alwaysIncludeEmpty?.includes("search")) {
    params.set("search", "");
  }

  Object.entries(extra).forEach(([key, value]) => {
    if (value == null || value === "") {
      if (alwaysIncludeEmpty?.includes(key)) {
        params.set(key, "");
      }
      return;
    }
    params.set(key, String(value));
  });

  return params;
}

/**
 * @param {string} basePath
 * @param {Parameters<typeof buildListQueryParams>[0]} [options]
 */
export function appendListQuery(basePath, options = {}) {
  const query = buildListQueryParams(options).toString();
  return query ? `${basePath}?${query}` : basePath;
}
