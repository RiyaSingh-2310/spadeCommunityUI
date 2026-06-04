import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export const ADMIN_MAIN_SCROLL_ID = "admin-main-scroll";

/**
 * Scrolls the admin content area (or window fallback) to the top.
 * @param {ScrollBehavior} [behavior]
 */
export function scrollPageToTop(behavior = "instant") {
  const main = document.getElementById(ADMIN_MAIN_SCROLL_ID);
  if (main) {
    main.scrollTo({ top: 0, left: 0, behavior });
    return;
  }
  window.scrollTo({ top: 0, left: 0, behavior });
}

/**
 * Resets scroll on route pathname change (sidebar, links, programmatic navigate).
 * Does not run for modals, dropdowns, or sidebar expand/collapse.
 */
function ScrollToTopOnNavigate() {
  const { pathname } = useLocation();

  useEffect(() => {
    scrollPageToTop("instant");
  }, [pathname]);

  return null;
}

export default ScrollToTopOnNavigate;
