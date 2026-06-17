import { useEffect, useState } from "react";
import {
  getCachedCountries,
  getCountries,
  isCountriesCacheReady,
} from "../../../services/countries/countriesApi";

/**
 * Lazily loads the countries list when a country dropdown is mounted.
 * Reuses the shared in-memory cache to avoid duplicate API calls.
 *
 * @param {{ enabled?: boolean }} [options]
 */
export function useCountries({ enabled = true } = {}) {
  const [countries, setCountries] = useState(() =>
    enabled && isCountriesCacheReady() ? getCachedCountries() : []
  );
  const [isLoading, setIsLoading] = useState(() => enabled && !isCountriesCacheReady());
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return undefined;
    }

    if (isCountriesCacheReady()) {
      setCountries(getCachedCountries());
      setIsLoading(false);
      setError(null);
      return undefined;
    }

    let cancelled = false;
    setIsLoading(true);

    getCountries()
      .then((items) => {
        if (!cancelled) {
          setCountries(items);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setCountries(getCachedCountries());
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

  return { countries, isLoading, error };
}
