import { useEffect, useState } from "react";
import { SEARCH_DEBOUNCE_MS } from "../utils/debounce";

/**
 * Debounces a value. When the source changes, waits `delay` ms before updating.
 * Previous pending updates are cancelled (cleanup clears the timer).
 */
export function useDebouncedValue(value, delay = SEARCH_DEBOUNCE_MS) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [value, delay]);

  return debouncedValue;
}
