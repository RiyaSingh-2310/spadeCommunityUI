import { useCallback, useEffect, useRef, useState } from "react";
import { sortListingRowsByIdAsc } from "../utils/listingSort";
import { resolveListingPagination } from "../utils/listResponse";
import { clampPage, DEFAULT_PAGE_SIZE } from "../utils/pagination";
import { normalizeSearchQuery } from "../utils/searchQuery";

/**
 * Server-driven listing state: search, pagination, loading, and race-safe fetch.
 * Page buttons follow API metadata: Previous when page > 1, Next when page < totalPages.
 *
 * @param {{
 *   fetchFn: (params: { page: number, limit: number, search?: string, signal?: AbortSignal }) => Promise<{ items: unknown[], total?: number, page?: number, limit?: number, totalPages?: number }>,
 *   initialPageSize?: number,
 *   enabled?: boolean,
 *   preserveRowOrder?: boolean,
 * }} options
 */
export function useApiListing({
  fetchFn,
  initialPageSize = DEFAULT_PAGE_SIZE,
  enabled = true,
  preserveRowOrder = true,
}) {
  const [rows, setRows] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
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
      setTotalPages(1);
      setListError("");
      return;
    }

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const requestId = ++fetchRequestIdRef.current;
    setIsLoading(true);
    setListError("");

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
      const resolved = resolveListingPagination({
        data,
        itemCount: items.length,
        requestedPage: currentPage,
        requestedLimit: pageSize,
      });

      setRows(items);
      setTotalRecords(resolved.total);
      setTotalPages(resolved.totalPages);

      if (currentPage > resolved.totalPages) {
        setCurrentPage(resolved.totalPages);
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
    } finally {
      if (
        requestId === fetchRequestIdRef.current &&
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
      const safePage = clampPage(nextPage, totalPages);
      if (safePage === currentPage) return;
      setCurrentPage(safePage);
    },
    [currentPage, totalPages]
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
    totalPages,
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
