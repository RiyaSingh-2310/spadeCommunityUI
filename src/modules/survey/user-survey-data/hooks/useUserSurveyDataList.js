import { useCallback, useEffect, useState } from "react";
import { DEFAULT_PAGE_SIZE } from "../../../shared/utils/pagination";
import { normalizeSearchQuery } from "../../../shared/utils/searchQuery";
import { fetchUserSurveyData } from "../services/userSurveyDataApi";

/**
 * @param {string} surveyId
 */
export function useUserSurveyDataList(surveyId) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [items, setItems] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize) || 1);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchUserSurveyData(surveyId, {
        query: normalizeSearchQuery(debouncedQuery),
        page: currentPage,
        pageSize,
      });
      setItems(data.items ?? []);
      setTotalItems(data.total ?? 0);
    } finally {
      setIsLoading(false);
    }
  }, [surveyId, debouncedQuery, currentPage, pageSize]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedQuery]);

  useEffect(() => {
    const pages = Math.max(1, Math.ceil(totalItems / pageSize) || 1);
    if (currentPage > pages) {
      setCurrentPage(pages);
    }
  }, [totalItems, pageSize, currentPage]);

  const handlePageSizeChange = (nextSize) => {
    setPageSize(nextSize);
    setCurrentPage(1);
  };

  return {
    query,
    setQuery,
    setDebouncedQuery,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize: handlePageSizeChange,
    items,
    totalItems,
    totalPages,
    isLoading,
  };
}
