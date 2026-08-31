export const DEFAULT_PAGE_SIZE = 10;

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export function paginateItems(items, page = 1, pageSize = DEFAULT_PAGE_SIZE) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    currentPage: safePage,
    totalPages,
    totalItems: items.length,
    pageSize,
  };
}

/**
 * When a listing hides the signed-in user on the current page, subtract them
 * from the server total so "Showing X of Y" matches the visible rows.
 */
export function listingTotalAfterExcludingCurrentUser(totalRecords, excludedCount) {
  const total = Number(totalRecords);
  const excluded = Number(excludedCount);
  if (!Number.isFinite(total) || total <= 0) return totalRecords;
  if (!Number.isFinite(excluded) || excluded <= 0) return totalRecords;
  return Math.max(0, total - excluded);
}

/** Items visible on the current page (for "Showing X of Y Entries"). */
export function getVisibleEntryCount(currentPage, pageSize, totalItems) {
  if (totalItems <= 0) return 0;
  const safePage = Math.max(1, currentPage);
  const remaining = totalItems - (safePage - 1) * pageSize;
  return Math.max(0, Math.min(pageSize, remaining));
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
