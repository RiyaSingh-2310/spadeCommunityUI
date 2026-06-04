import { useEffect, useState } from "react";

/**
 * @param {string} query - CSS media query, e.g. "(max-width: 1023px)"
 */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}

/** Matches Tailwind `lg` breakpoint — tablet and below use mobile admin shell. */
export const ADMIN_MOBILE_MEDIA_QUERY = "(max-width: 1023px)";
