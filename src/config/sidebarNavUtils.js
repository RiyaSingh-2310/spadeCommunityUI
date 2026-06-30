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

export function matchesCommunityUsersMain(pathname) {
  return matchesPathPrefix(pathname, "/community-users");
}

export function matchesUserScreeningQuestionsMain(pathname) {
  if (matchesPathPrefix(pathname, "/user-screening/create-survey")) return false;
  return matchesPathPrefix(pathname, "/user-screening/questions");
}

/**
 * @param {{ matcher?: RegExp, isActive?: (pathname: string) => boolean }} item
 * @param {string} pathname
 */
export function isSidebarItemActive(item, pathname) {
  const matcherActive = item.matcher ? item.matcher.test(pathname) : true;

  if (typeof item.isActive === "function") {
    const customActive = item.isActive(pathname);
    return item.matcher ? matcherActive && customActive : customActive;
  }

  return matcherActive;
}

/**
 * Returns the label of the single active child within a sidebar group.
 * @param {{ label: string, matcher?: RegExp, isActive?: (pathname: string) => boolean }[]} children
 * @param {string} pathname
 * @returns {string | null}
 */
export function resolveActiveGroupChildLabel(children, pathname) {
  if (!Array.isArray(children)) return null;

  const activeChild = children.find((child) => isSidebarItemActive(child, pathname));
  return activeChild?.label ?? null;
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
