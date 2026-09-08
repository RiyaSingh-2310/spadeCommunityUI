import { DEFAULT_PAGE_SIZE, getTotalPages } from "./pagination";

function nestedObject(data) {
  return data?.data && typeof data.data === "object" && !Array.isArray(data.data)
    ? data.data
    : null;
}

function firstFiniteNonNegative(values) {
  for (const value of values) {
    const num = Number(value);
    if (Number.isFinite(num) && num >= 0) {
      return num;
    }
  }
  return null;
}

function getPreferredTotalCandidates(data) {
  const nested = nestedObject(data);
  return [
    data.total,
    data.totalCount,
    data.totalRecords,
    data.total_count,
    data.total_records,
    nested?.total,
    nested?.totalCount,
    nested?.totalRecords,
    nested?.total_count,
    nested?.total_records,
    data.pagination?.total,
    data.pagination?.totalCount,
    data.meta?.total,
    data.meta?.totalCount,
  ];
}

/**
 * Resolves total record count from common API list response shapes.
 * @param {object | null | undefined} data
 * @param {number} [fallbackLength=0]
 */
export function extractListTotalFromResponse(data, fallbackLength = 0) {
  if (!data || typeof data !== "object") {
    return fallbackLength;
  }

  const nested = nestedObject(data);
  const resolved = firstFiniteNonNegative([
    ...getPreferredTotalCandidates(data),
    data.count,
    nested?.count,
  ]);

  return resolved ?? fallbackLength;
}

/**
 * Prefers `data` arrays from list APIs (`{ data: [...] }`) over nested object shapes.
 * @param {object | null | undefined} payload
 * @param {string[]} [collectionKeys]
 */
export function extractListItemsFromResponse(
  payload,
  collectionKeys = ["items", "admins", "users", "rows", "records", "list"]
) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];

  if (Array.isArray(payload.data)) return payload.data;

  for (const key of collectionKeys) {
    if (Array.isArray(payload[key])) return payload[key];
  }

  const nested = nestedObject(payload);
  if (nested) {
    for (const key of collectionKeys) {
      if (Array.isArray(nested[key])) return nested[key];
    }
  }

  return [];
}

/**
 * Resolves 1-based totalPages from common API list response shapes.
 * @param {object | null | undefined} data
 * @returns {number | null}
 */
export function extractListTotalPagesFromResponse(data) {
  if (!data || typeof data !== "object") return null;

  const nested = nestedObject(data);
  return firstFiniteNonNegative([
    data.totalPages,
    data.total_pages,
    nested?.totalPages,
    nested?.total_pages,
    data.pagination?.totalPages,
    data.pagination?.total_pages,
    data.meta?.totalPages,
    data.meta?.total_pages,
  ]);
}

/**
 * Normalizes list pagination so Next/Previous and page counts stay in sync
 * with 1-based `page` + `limit` APIs.
 *
 * @param {{
 *   data?: object | null,
 *   itemCount?: number,
 *   requestedPage?: number,
 *   requestedLimit?: number,
 *   previousTotal?: number,
 * }} [options]
 */
export function resolveListingPagination({
  data = null,
  itemCount = 0,
  requestedPage = 1,
  requestedLimit = DEFAULT_PAGE_SIZE,
  previousTotal = 0,
} = {}) {
  const payload = data && typeof data === "object" ? data : {};
  const nested = nestedObject(payload);

  const limitCandidate = firstFiniteNonNegative([
    payload.limit,
    payload.pageSize,
    payload.page_size,
    nested?.limit,
    nested?.pageSize,
    requestedLimit,
  ]);
  const pageSize = Math.max(1, limitCandidate || DEFAULT_PAGE_SIZE);

  const pageCandidate = firstFiniteNonNegative([
    payload.page,
    nested?.page,
    payload.pagination?.page,
    requestedPage,
  ]);
  const page = Math.max(1, pageCandidate || 1);

  const preferredTotal = firstFiniteNonNegative(getPreferredTotalCandidates(payload));
  const countTotal = firstFiniteNonNegative([payload.count, nested?.count]);
  const apiPages = extractListTotalPagesFromResponse(payload);
  const countLooksLikePageSize =
    countTotal != null &&
    itemCount > 0 &&
    countTotal === itemCount &&
    ((apiPages != null && apiPages > 1) ||
      page > 1 ||
      previousTotal > countTotal);

  let total = preferredTotal;
  if (total == null && countTotal != null && !countLooksLikePageSize) {
    total = countTotal;
  }

  if (total == null) {
    if (apiPages != null && apiPages > 0) {
      total =
        page >= apiPages
          ? (apiPages - 1) * pageSize + Math.max(0, itemCount)
          : Math.max((page - 1) * pageSize + itemCount, (apiPages - 1) * pageSize + 1);
    } else if (itemCount > 0) {
      total = page > 1 ? Math.max(previousTotal, (page - 1) * pageSize + itemCount) : itemCount;
    } else if (page > 1 && previousTotal > 0) {
      total = previousTotal;
    } else {
      total = 0;
    }
  }

  const computedPages = getTotalPages(total, pageSize);
  const totalPages =
    apiPages != null && apiPages > 0 ? apiPages : computedPages;

  return {
    total,
    totalPages,
    page,
    pageSize,
  };
}

/**
 * Maps list records defensively so one bad row cannot break listing pages.
 * @template T
 * @param {unknown[]} records
 * @param {(record: unknown) => T | null | undefined} mapper
 */
export function safeMapListItems(records, mapper) {
  if (!Array.isArray(records)) return [];

  return records
    .map((record) => {
      try {
        return mapper(record);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}
