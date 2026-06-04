import { useEffect, useRef } from "react";

/**
 * @param {{ onLoadMore: () => void, enabled: boolean }} options
 */
export function useIntersectionLoadMore({ onLoadMore, enabled }) {
  const sentinelRef = useRef(null);

  useEffect(() => {
    if (!enabled) return undefined;

    const node = sentinelRef.current;
    if (!node) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          onLoadMore();
        }
      },
      { root: null, rootMargin: "120px", threshold: 0 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [onLoadMore, enabled]);

  return sentinelRef;
}
