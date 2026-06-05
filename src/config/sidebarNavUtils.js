/**
 * Route-based sidebar active detection (includes inner/detail/edit pages).
 */

export function matchesPathPrefix(pathname, prefix) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function matchesSurveyMain(pathname) {
  if (!matchesPathPrefix(pathname, "/survey")) return false;
  if (matchesPathPrefix(pathname, "/survey/group")) return false;
  if (matchesPathPrefix(pathname, "/survey/recontact")) return false;
  if (matchesPathPrefix(pathname, "/survey/settings")) return false;
  return true;
}

export function matchesPrescreenMain(pathname) {
  if (!matchesPathPrefix(pathname, "/prescreen")) return false;
  if (matchesPathPrefix(pathname, "/prescreen/group")) return false;
  return true;
}

/**
 * @param {{ matcher?: RegExp, isActive?: (pathname: string) => boolean }} item
 * @param {string} pathname
 */
export function isSidebarItemActive(item, pathname) {
  if (typeof item.isActive === "function") {
    return item.isActive(pathname);
  }
  return Boolean(item.matcher?.test(pathname));
}

/**
 * @param {typeof import('./sidebarNavConfig').SIDEBAR_NAV_ITEMS[number]} item
 * @param {string} pathname
 */
export function findActiveSidebarGroupKey(items, pathname) {
  const group = items.find(
    (entry) => entry.type === "group" && isSidebarItemActive(entry, pathname)
  );
  return group?.key ?? null;
}
