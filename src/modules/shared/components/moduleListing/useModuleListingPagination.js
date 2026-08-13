import { useCallback, useMemo, useState } from "react";
import { DEFAULT_PAGE_SIZE, paginateItems } from "../../utils/pagination";
import { normalizeSearchQuery, rowMatchesSearchQuery } from "../../utils/searchQuery";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";

/**
 * Pagination, search query, and filtered/paginated rows for listings.
 */
export function useModuleListingPagination({
  rows,
  rowIdKey,
  isExternallyManaged,
  internalData,
  setInternalData,
  serverPaginated,
  serverSearch,
  paginationPage,
  paginationPageSize,
  initialPageSize,
  onPaginationPageChange,
  onPaginationPageSizeChange,
  totalRecords,
  searchFields,
}) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query);
  const [internalCurrentPage, setInternalCurrentPage] = useState(1);
  const [internalPageSize, setInternalPageSize] = useState(initialPageSize);
  const usesServerListing = serverPaginated || serverSearch;
  const currentPage = usesServerListing ? paginationPage : internalCurrentPage;
  const pageSize = usesServerListing
    ? (paginationPageSize ?? initialPageSize)
    : internalPageSize;

  const safeRows = (Array.isArray(rows) ? rows : []).filter(Boolean);
  const rowsSignature = safeRows
    .map((row) => row?.[rowIdKey] ?? row?.id ?? "")
    .join(",");
  const [prevRowsSignature, setPrevRowsSignature] = useState(rowsSignature);
  if (!isExternallyManaged && rowsSignature !== prevRowsSignature) {
    setPrevRowsSignature(rowsSignature);
    setInternalData(safeRows);
  }

  const rawData = isExternallyManaged ? safeRows : internalData;
  const data = Array.isArray(rawData) ? rawData.filter(Boolean) : [];

  const handlePageChange = useCallback(
    (nextPage) => {
      if (usesServerListing) {
        onPaginationPageChange?.(nextPage);
        return;
      }
      setInternalCurrentPage(nextPage);
    },
    [usesServerListing, onPaginationPageChange]
  );

  const handlePageSizeChange = useCallback(
    (nextSize) => {
      if (usesServerListing) {
        onPaginationPageSizeChange?.(nextSize);
        return;
      }
      setInternalPageSize(nextSize);
      setInternalCurrentPage(1);
    },
    [usesServerListing, onPaginationPageSizeChange]
  );

  const handleQueryChange = (value) => {
    setQuery(value);
    if (!usesServerListing) {
      setInternalCurrentPage(1);
    }
  };

  const normalizedQuery = normalizeSearchQuery(debouncedQuery).toLowerCase();
  const filtered = usesServerListing
    ? data
    : data.filter((row) =>
        rowMatchesSearchQuery(row, debouncedQuery, searchFields)
      );

  const paginationTotalItems = usesServerListing
    ? totalRecords ?? filtered.length
    : normalizedQuery
      ? filtered.length
      : totalRecords ?? filtered.length;

  const pagination = useMemo(() => {
    if (usesServerListing) {
      const totalPages = Math.max(
        1,
        Math.ceil(paginationTotalItems / pageSize) || 1
      );
      const safePage = Math.min(Math.max(1, currentPage), totalPages);
      return {
        items: filtered,
        currentPage: safePage,
        totalPages,
        totalItems: paginationTotalItems,
        pageSize,
      };
    }

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize) || 1);
    const safePage = Math.min(currentPage, totalPages);
    const slice = paginateItems(filtered, safePage, pageSize);
    return {
      ...slice,
      totalItems: paginationTotalItems,
    };
  }, [filtered, currentPage, pageSize, paginationTotalItems, usesServerListing]);

  return {
    query,
    handleQueryChange,
    pageSize,
    usesServerListing,
    normalizedQuery,
    filtered,
    pagination,
    handlePageChange,
    handlePageSizeChange,
    DEFAULT_PAGE_SIZE,
  };
}
