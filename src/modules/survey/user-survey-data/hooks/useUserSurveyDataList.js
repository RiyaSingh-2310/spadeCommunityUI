import { useCallback, useEffect, useState } from "react";
import { USER_SURVEY_DATA_PAGE_SIZE } from "../utils/constants";
import { fetchUserSurveyData } from "../services/userSurveyDataApi";

/**
 * @param {string} surveyId
 */
export function useUserSurveyDataList(surveyId) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [items, setItems] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const totalPages = Math.max(1, Math.ceil(totalItems / USER_SURVEY_DATA_PAGE_SIZE) || 1);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchUserSurveyData(surveyId, {
        query: debouncedQuery,
        page: currentPage,
        pageSize: USER_SURVEY_DATA_PAGE_SIZE,
      });
      setItems(data.items ?? []);
      setTotalItems(data.total ?? 0);
    } finally {
      setIsLoading(false);
    }
  }, [surveyId, debouncedQuery, currentPage]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedQuery]);

  return {
    query,
    setQuery,
    setDebouncedQuery,
    currentPage,
    setCurrentPage,
    items,
    totalItems,
    totalPages,
    isLoading,
    pageSize: USER_SURVEY_DATA_PAGE_SIZE,
  };
}
