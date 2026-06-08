import { useCallback, useEffect, useRef, useState } from "react";
import { DEFAULT_PAGE_SIZE } from "../../../shared/utils/pagination";
import { searchFindUsers } from "../services/findUserApi";

/**
 * @param {string} surveyId
 * @param {{ questionId: string, answer: string }[]} activeFilters
 * @param {number} searchVersion increments on each search
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

      setUsers(result.items ?? []);
      setTotalItems(result.total ?? 0);
      setTotalPages(result.totalPages ?? 1);
      setHasSearched(true);
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [surveyId, activeFilters, currentPage, pageSize]);

  useEffect(() => {
    if (searchVersion < 1) return;
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
  };
}
