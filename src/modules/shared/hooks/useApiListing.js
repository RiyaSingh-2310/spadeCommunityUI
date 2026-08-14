import { useCallback, useEffect, useRef, useState } from "react";
import { sortListingRowsByIdAsc } from "../utils/listingSort";
import { DEFAULT_PAGE_SIZE } from "../utils/pagination";
import { normalizeSearchQuery } from "../utils/searchQuery";

/**
 * Server-driven listing state: search, pagination, loading, and race-safe fetch.
 * @param {{
 *   fetchFn: (params: { page: number, limit: number, search?: string, signal?: AbortSignal }) => Promise<{ items: unknown[], total?: number, count?: number }>,
 *   initialPageSize?: number,
 *   enabled?: boolean,
 *   preserveRowOrder?: boolean,
 * }} options
 *
 * Default listing order is the API response order (typically newest first).
 * Do not alphabetize or re-sort by id unless preserveRowOrder is false.
 */
export function useApiListing({
  fetchFn,
  initialPageSize = DEFAULT_PAGE_SIZE,
  enabled = true,
  preserveRowOrder = true,
}) {
  const [rows, setRows] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [listError, setListError] = useState("");
  const fetchRequestIdRef = useRef(0);
  const abortControllerRef = useRef(null);

  const fetchList = useCallback(async () => {
    if (!enabled) {
      setIsLoading(false);
      setRows([]);
      setTotalRecords(0);
      setListError("");
      return;
    }

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const requestId = ++fetchRequestIdRef.current;
    setIsLoading(true);
    setRows([]);
    setListError("");
    let keepLoadingForPageCorrection = false;

    try {
      const normalizedSearch = normalizeSearchQuery(search);
      const data = await fetchFn({
        page: currentPage,
        limit: pageSize,
        search: normalizedSearch,
        signal: controller.signal,
      });

      if (
        requestId !== fetchRequestIdRef.current ||
        controller.signal.aborted
      ) {
        return;
      }

      const rawItems = Array.isArray(data.items) ? data.items : [];
      const items = preserveRowOrder ? rawItems : sortListingRowsByIdAsc(rawItems);
      const total = data.total ?? data.count ?? items.length;
      const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);

      if (items.length === 0 && currentPage > 1 && total > 0) {
        // Keep isLoading true; the currentPage update will re-fetch immediately (M5).
        keepLoadingForPageCorrection = true;
        setCurrentPage((prev) => Math.max(1, Math.min(prev, totalPages) - 1));
        return;
      }

      setRows(items);
      setTotalRecords(total);

      if (currentPage > totalPages) {
        keepLoadingForPageCorrection = true;
        setCurrentPage(totalPages);
      }
    } catch (error) {
      if (
        requestId !== fetchRequestIdRef.current ||
        controller.signal.aborted ||
        error?.name === "CanceledError" ||
        error?.name === "AbortError" ||
        error?.code === "ERR_CANCELED"
      ) {
        return;
      }
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Unable to load records.";
      setListError(message);
      setRows([]);
      setTotalRecords(0);
    } finally {
      if (
        requestId === fetchRequestIdRef.current &&
        !keepLoadingForPageCorrection &&
        !controller.signal.aborted
      ) {
        setIsLoading(false);
      }
    }
  }, [enabled, fetchFn, currentPage, pageSize, search, preserveRowOrder]);

  useEffect(() => {
    // Data-fetching effect: sync loading/error state with server responses.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional list fetch
    fetchList();
    return () => {
      abortControllerRef.current?.abort();
    };
  }, [fetchList]);

  const handleSearch = useCallback((debouncedQuery) => {
    const nextSearch = normalizeSearchQuery(debouncedQuery);
    setSearch((prev) => (prev === nextSearch ? prev : nextSearch));
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
    listError,
    handleSearch,
    handlePageChange,
    handlePageSizeChange,
    refresh,
  };
}
