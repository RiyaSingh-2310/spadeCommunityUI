export const SEARCH_DEBOUNCE_MS = 500;

/**
 * Returns a debounced function that delays invoking fn until after delay ms
 * have elapsed since the last call. Each new call cancels the previous timer.
 */
export function debounce(fn, delay = SEARCH_DEBOUNCE_MS) {
  let timeoutId = null;

  const debounced = (...args) => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      timeoutId = null;
      fn(...args);
    }, delay);
  };

  debounced.cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return debounced;
}
