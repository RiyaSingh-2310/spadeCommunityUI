import { useEffect, useRef } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { parseRedirectQueryParams } from "../utils/parseRedirectQueryParams";

/**
 * Reads all URL query parameters dynamically and notifies the parent.
 * Renders nothing — used as a side-effect orchestrator for redirect pages.
 *
 * @param {{
 *   onProcessed: (result: {
 *     params: Record<string, string>,
 *     entries: Array<{ key: string, value: string }>,
 *     isEmpty: boolean,
 *     search: string,
 *   }) => void,
 *   onError?: (error: Error) => void,
 * }} props
 */
function QueryParameterHandler({ onProcessed, onError }) {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const onProcessedRef = useRef(onProcessed);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onProcessedRef.current = onProcessed;
    onErrorRef.current = onError;
  }, [onProcessed, onError]);

  useEffect(() => {
    try {
      const parsed = parseRedirectQueryParams(searchParams);
      onProcessedRef.current?.({
        ...parsed,
        search: location.search || "",
      });
    } catch (error) {
      const safeError =
        error instanceof Error ? error : new Error("Failed to read redirect query parameters.");
      onErrorRef.current?.(safeError);
    }
  }, [searchParams, location.search]);

  return null;
}

export default QueryParameterHandler;
