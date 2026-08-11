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

      setUsers(Array.isArray(result.items) ? result.items : []);
      setTotalItems(result.total ?? 0);
      setTotalPages(result.totalPages ?? 0);
      setHasSearched(true);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setUsers([]);
      setTotalItems(0);
      setTotalPages(0);
      setHasSearched(true);
      toastApiError(err);
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
