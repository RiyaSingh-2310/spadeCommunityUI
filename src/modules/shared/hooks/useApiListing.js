import { useCallback, useEffect, useRef, useState } from "react";
import { toastApiError } from "../../../services/toast/apiToast";
import { sortListingRowsByIdAsc } from "../utils/listingSort";
import { DEFAULT_PAGE_SIZE } from "../utils/pagination";
import { normalizeSearchQuery } from "../utils/searchQuery";

/**
 * Server-driven listing state: search, pagination, loading, and race-safe fetch.
 * @param {{
 *   fetchFn: (params: { page: number, limit: number, search?: string }) => Promise<{ items: unknown[], total?: number, count?: number }>,
 *   initialPageSize?: number,
 *   enabled?: boolean,
 * }} options
 */
export function useApiListing({
  fetchFn,
  initialPageSize = DEFAULT_PAGE_SIZE,
  enabled = true,
}) {
  const [rows, setRows] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const fetchRequestIdRef = useRef(0);

  const fetchList = useCallback(async () => {
    if (!enabled) {
      setIsLoading(false);
      setRows([]);
      setTotalRecords(0);
      return;
    }

    const requestId = ++fetchRequestIdRef.current;
    setIsLoading(true);
    setRows([]);

    try {
      const normalizedSearch = normalizeSearchQuery(search);
      const data = await fetchFn({
        page: currentPage,
        limit: pageSize,
        search: normalizedSearch || undefined,
      });

      if (requestId !== fetchRequestIdRef.current) {
        return;
      }

      const items = sortListingRowsByIdAsc(Array.isArray(data.items) ? data.items : []);
      const total = data.total ?? data.count ?? items.length;
      const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);

      if (items.length === 0 && currentPage > 1 && total > 0) {
        setCurrentPage((prev) => Math.max(1, Math.min(prev, totalPages) - 1));
        return;
      }

      setRows(items);
      setTotalRecords(total);

      if (currentPage > totalPages) {
        setCurrentPage(totalPages);
      }
    } catch (error) {
      if (requestId !== fetchRequestIdRef.current) {
        return;
      }
      toastApiError(error);
      setRows([]);
      setTotalRecords(0);
    } finally {
      if (requestId === fetchRequestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [enabled, fetchFn, currentPage, pageSize, search]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const handleSearch = useCallback((debouncedQuery) => {
    setSearch(normalizeSearchQuery(debouncedQuery));
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback(
    (nextPage) => {
      const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize) || 1);
      if (nextPage < 1 || nextPage > totalPages || nextPage === currentPage) {
        return;
      }
      setCurrentPage(nextPage);
    },
    [currentPage, pageSize, totalRecords]
  );

  const handlePageSizeChange = useCallback((nextSize) => {
    const safeSize = Number(nextSize);
    if (!Number.isFinite(safeSize) || safeSize <= 0) return;
    setPageSize(safeSize);
    setCurrentPage(1);
  }, []);

  const refresh = useCallback(() => {
    fetchList();
  }, [fetchList]);

  return {
    rows,
    setRows,
    totalRecords,
    isLoading,
    currentPage,
    pageSize,
    search,
    handleSearch,
    handlePageChange,
    handlePageSizeChange,
    refresh,
  };
}
