import { useEffect, useState } from "react";
import {
  getCachedLanguages,
  getLanguages,
  isLanguagesCacheReady,
} from "../../../services/languages/languagesApi";

/**
 * Loads GET /api/languages when a language dropdown is mounted.
 * Reuses the shared in-memory cache to avoid duplicate API calls.
 *
 * @param {{ enabled?: boolean }} [options]
 */
export function useLanguages({ enabled = true } = {}) {
  const [languages, setLanguages] = useState(() =>
    enabled && isLanguagesCacheReady() ? getCachedLanguages() : []
  );
  const [isLoading, setIsLoading] = useState(() => enabled && !isLanguagesCacheReady());
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return undefined;
    }

    if (isLanguagesCacheReady()) {
      setLanguages(getCachedLanguages());
      setIsLoading(false);
      setError(null);
      return undefined;
    }

    let cancelled = false;
    setIsLoading(true);

    getLanguages()
      .then((items) => {
        if (!cancelled) {
          setLanguages(items);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setLanguages(getCachedLanguages());
          setError(err);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return { languages, isLoading, error };
}
