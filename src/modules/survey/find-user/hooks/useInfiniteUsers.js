import { useCallback, useEffect, useRef, useState } from "react";
import { DEFAULT_PAGE_SIZE } from "../../../shared/utils/pagination";
import { toastApiError } from "../../../../services/toast/apiToast";
import { searchFindUsers } from "../services/findUserApi";

/**
 * @param {string} surveyId
 * @param {{ questionId: string, answers: string[] }[]} activeFilters
 * @param {number} searchVersion increments on each explicit Search click (0 = idle)
 */
export function useInfiniteUsers(surveyId, activeFilters, searchVersion) {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  /** @type {[string, Function]} idle | success | empty | error */
  const [lastSearchStatus, setLastSearchStatus] = useState("idle");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const requestIdRef = useRef(0);

  const loadPage = useCallback(async () => {
    if (searchVersion < 1) return;

    const requestId = ++requestIdRef.current;
    setIsLoading(true);

    try {
      const result = await searchFindUsers({
        surveyId,
        filters: activeFilters,
        page: currentPage,
        pageSize,
      });

      if (requestId !== requestIdRef.current) return;

      const items = Array.isArray(result.items) ? result.items : [];
      setUsers(items);
      setTotalItems(result.total ?? 0);
      setTotalPages(result.totalPages ?? 0);
      setHasSearched(true);
      setLastSearchStatus(items.length > 0 ? "success" : "empty");
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setUsers([]);
      setTotalItems(0);
      setTotalPages(0);
      setHasSearched(true);
      setLastSearchStatus("error");
      toastApiError(err, "Unable to search users. Please try again.");
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [surveyId, activeFilters, currentPage, pageSize, searchVersion]);

  // Idle (no Search yet / filters reset): never hit the Search API.
  useEffect(() => {
    if (searchVersion < 1) {
      requestIdRef.current += 1;
      setUsers([]);
      setTotalItems(0);
      setTotalPages(1);
      setHasSearched(false);
      setLastSearchStatus("idle");
      setIsLoading(false);
      return;
    }
    loadPage();
  }, [searchVersion, loadPage]);

  const reset = useCallback(() => {
    requestIdRef.current += 1;
    setUsers([]);
    setTotalItems(0);
    setTotalPages(1);
    setHasSearched(false);
    setLastSearchStatus("idle");
    setIsLoading(false);
    setCurrentPage(1);
  }, []);

  const refresh = useCallback(() => {
    if (searchVersion < 1) return;
    loadPage();
  }, [searchVersion, loadPage]);

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  const handlePageSizeChange = useCallback((nextSize) => {
    setPageSize(nextSize);
    setCurrentPage(1);
  }, []);

  return {
    users,
    isLoading,
    hasSearched,
    lastSearchStatus,
    currentPage,
    pageSize,
    totalItems,
    totalPages,
    onPageChange: handlePageChange,
    onPageSizeChange: handlePageSizeChange,
    reset,
    refresh,
  };
}
