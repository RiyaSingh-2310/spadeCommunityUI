/**
 * Dynamically read every query parameter from a URLSearchParams (or search string).
 * Does not hardcode parameter names — any key present in the URL is included.
 *
 * @param {URLSearchParams | string | null | undefined} search
 * @returns {{ params: Record<string, string>, entries: Array<{ key: string, value: string }>, isEmpty: boolean }}
 */
export function parseRedirectQueryParams(search) {
  const params = {};
  const entries = [];

  try {
    let searchParams;

    if (search instanceof URLSearchParams) {
      searchParams = search;
    } else if (typeof search === "string") {
      const query = search.startsWith("?") ? search.slice(1) : search;
      searchParams = new URLSearchParams(query);
    } else {
      searchParams = new URLSearchParams();
    }

    searchParams.forEach((value, key) => {
      // Keep the last value when a key appears more than once.
      params[key] = value;
      entries.push({ key, value });
    });
  } catch {
    return { params: {}, entries: [], isEmpty: true };
  }

  return {
    params,
    entries,
    isEmpty: entries.length === 0,
  };
}
