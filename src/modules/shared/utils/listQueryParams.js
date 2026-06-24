import { normalizeSearchQuery } from "./searchQuery";

/**
 * Builds URLSearchParams for paginated list APIs with optional search.
 * @param {{ page?: number, limit?: number, search?: string, extra?: Record<string, string|number>, alwaysIncludeEmpty?: string[] }} [options]
 */
export function buildListQueryParams({ page, limit, search, extra = {}, alwaysIncludeEmpty = [] } = {}) {
  const params = new URLSearchParams();
  const safePage = Number(page);
  const safeLimit = Number(limit);

  if (Number.isFinite(safePage) && safePage > 0) {
    params.set("page", String(safePage));
  }
  if (Number.isFinite(safeLimit) && safeLimit > 0) {
    params.set("limit", String(safeLimit));
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
