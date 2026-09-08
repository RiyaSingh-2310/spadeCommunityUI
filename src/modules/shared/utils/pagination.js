export const DEFAULT_PAGE_SIZE = 10;

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

/**
 * 1-based total page count. Zero records still yields one (empty) page.
 * @param {unknown} totalItems
 * @param {unknown} pageSize
 */
export function getTotalPages(totalItems, pageSize = DEFAULT_PAGE_SIZE) {
  const size = Math.max(1, Number(pageSize) || DEFAULT_PAGE_SIZE);
  const total = Math.max(0, Number(totalItems) || 0);
  if (total <= 0) return 1;
  return Math.max(1, Math.ceil(total / size));
}

/**
 * Clamps a 1-based page number into [1, totalPages].
 * @param {unknown} page
 * @param {unknown} totalPages
 */
export function clampPage(page, totalPages = 1) {
  const pages = Math.max(1, Number(totalPages) || 1);
  const parsed = Number(page);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return Math.min(Math.floor(parsed), pages);
}

export function paginateItems(items, page = 1, pageSize = DEFAULT_PAGE_SIZE) {
  const list = Array.isArray(items) ? items : [];
  const size = Math.max(1, Number(pageSize) || DEFAULT_PAGE_SIZE);
  const totalPages = getTotalPages(list.length, size);
  const safePage = clampPage(page, totalPages);
  const start = (safePage - 1) * size;
  return {
    items: list.slice(start, start + size),
    currentPage: safePage,
    totalPages,
    totalItems: list.length,
    pageSize: size,
  };
}

/**
 * When a listing hides the signed-in user on the current page, subtract them
 * from the server total so "Showing X of Y" matches the visible rows.
 *
 * Do not use this value to compute totalPages for server-paginated lists —
 * shrinking the total can hide remaining records on later pages.
 */
export function listingTotalAfterExcludingCurrentUser(totalRecords, excludedCount) {
  const total = Number(totalRecords);
  const excluded = Number(excludedCount);
  if (!Number.isFinite(total) || total <= 0) return totalRecords;
  if (!Number.isFinite(excluded) || excluded <= 0) return totalRecords;
  return Math.max(0, total - excluded);
}

/**
 * Inclusive 1-based range for the current page.
 * startEntry = total === 0 ? 0 : (page - 1) * limit + 1
 * endEntry = Math.min(page * limit, total)
 */
export function getEntryRange(currentPage, pageSize, totalItems) {
  const total = Math.max(0, Number(totalItems) || 0);
  const size = Math.max(1, Number(pageSize) || DEFAULT_PAGE_SIZE);
  if (total <= 0) {
    return { start: 0, end: 0 };
  }
  const page = clampPage(currentPage, getTotalPages(total, size));
  const start = (page - 1) * size + 1;
  const end = Math.min(page * size, total);
  return { start, end };
}

/** Items visible on the current page (for "Showing X of Y Entries"). */
export function getVisibleEntryCount(currentPage, pageSize, totalItems) {
  const { start, end } = getEntryRange(currentPage, pageSize, totalItems);
  if (start === 0 && end === 0) return 0;
  return end - start + 1;
}

export function getPageNumbers(currentPage, totalPages, maxVisible = 5) {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let end = start + maxVisible - 1;

  if (end > totalPages) {
    end = totalPages;
    start = end - maxVisible + 1;
  }

  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}
