import { useEffect, useState } from "react";
import { getCountries } from "../../../services/countries/countriesApi";

/**
 * Loads and caches the countries list for dropdowns and display formatting.
 */
export function useCountries() {
  const [countries, setCountries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
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
          setCountries([]);
          setError(err);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { countries, isLoading, error };
}
