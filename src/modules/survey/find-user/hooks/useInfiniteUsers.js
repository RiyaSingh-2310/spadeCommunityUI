import { useCallback, useEffect, useRef, useState } from "react";
import { searchFindUsers } from "../services/findUserApi";

const PAGE_SIZE = 10;

/**
 * @param {string} surveyId
 * @param {{ questionId: string, answer: string }[]} activeFilters
 * @param {number} searchVersion increments on each search
 */
export function useInfiniteUsers(surveyId, activeFilters, searchVersion) {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const offsetRef = useRef(0);
  const requestIdRef = useRef(0);

  const loadPage = useCallback(
    async (reset = false) => {
      const requestId = ++requestIdRef.current;
      const offset = reset ? 0 : offsetRef.current;

      if (reset) {
        setIsLoading(true);
        setUsers([]);
        offsetRef.current = 0;
      } else {
        setIsLoadingMore(true);
      }

      try {
        const result = await searchFindUsers({
          surveyId,
          filters: activeFilters,
          offset,
          limit: PAGE_SIZE,
        });

        if (requestId !== requestIdRef.current) return;

        setUsers((prev) => (reset ? result.items : [...prev, ...result.items]));
        offsetRef.current = offset + result.items.length;
        setHasMore(result.hasMore);
        setHasSearched(true);
      } finally {
        if (requestId === requestIdRef.current) {
          setIsLoading(false);
          setIsLoadingMore(false);
        }
      }
    },
    [surveyId, activeFilters]
  );

  useEffect(() => {
    if (searchVersion < 1) return;
    loadPage(true);
  }, [searchVersion, loadPage]);

  const loadMore = useCallback(() => {
    if (!hasMore || isLoading || isLoadingMore || !hasSearched) return;
    loadPage(false);
  }, [hasMore, isLoading, isLoadingMore, hasSearched, loadPage]);

  const reset = useCallback(() => {
    requestIdRef.current += 1;
    setUsers([]);
    setHasMore(false);
    setHasSearched(false);
    setIsLoading(false);
    setIsLoadingMore(false);
    offsetRef.current = 0;
  }, []);

  return {
    users,
    isLoading,
    isLoadingMore,
    hasMore,
    hasSearched,
    loadMore,
    reset,
  };
}
