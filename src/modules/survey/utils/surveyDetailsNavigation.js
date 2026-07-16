/**
 * Survey / Project details navigation helpers (tabs + Project URL views via search params).
 */

export const SURVEY_DETAIL_TAB_IDS = {
  PROJECT_DETAILS: "project-details",
  PROJECT_URLS: "project-urls",
  PROJECT_MULTI_URL: "project-multi-url",
};

export const PROJECT_URL_VIEW_IDS = {
  LIST: "list",
  ADD: "add",
  EDIT: "edit",
};

/**
 * @param {{ id: string|number, groupId?: string|number, salesViewMode?: boolean }} options
 */
export function getSurveyDetailsBasePath({ id, groupId, salesViewMode = false }) {
  const encodedId = encodeURIComponent(String(id ?? ""));
  if (salesViewMode) {
    return `/sales/projects/view/${encodedId}`;
  }
  if (groupId != null && String(groupId).trim() !== "") {
    return `/survey/group/${encodeURIComponent(String(groupId))}/projects/view/${encodedId}`;
  }
  return `/survey/view/${encodedId}`;
}

/**
 * @param {{
 *   tab?: string,
 *   urlView?: string,
 *   urlId?: string|number,
 * }} [options]
 */
export function buildSurveyDetailsSearch({
  tab = SURVEY_DETAIL_TAB_IDS.PROJECT_DETAILS,
  urlView = PROJECT_URL_VIEW_IDS.LIST,
  urlId = "",
} = {}) {
  const params = new URLSearchParams();
  const normalizedTab = String(tab || SURVEY_DETAIL_TAB_IDS.PROJECT_DETAILS);

  if (normalizedTab !== SURVEY_DETAIL_TAB_IDS.PROJECT_DETAILS) {
    params.set("tab", normalizedTab);
  }

  if (normalizedTab === SURVEY_DETAIL_TAB_IDS.PROJECT_URLS) {
    const normalizedView = String(urlView || PROJECT_URL_VIEW_IDS.LIST);
    if (
      normalizedView === PROJECT_URL_VIEW_IDS.ADD ||
      normalizedView === PROJECT_URL_VIEW_IDS.EDIT
    ) {
      params.set("urlView", normalizedView);
      if (normalizedView === PROJECT_URL_VIEW_IDS.EDIT && urlId != null && String(urlId).trim()) {
        params.set("urlId", String(urlId));
      }
    }
  }

  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

/**
 * @param {{
 *   id: string|number,
 *   groupId?: string|number,
 *   salesViewMode?: boolean,
 *   tab?: string,
 *   urlView?: string,
 *   urlId?: string|number,
 * }} options
 */
export function getSurveyDetailsPath(options) {
  return `${getSurveyDetailsBasePath(options)}${buildSurveyDetailsSearch(options)}`;
}

/**
 * @param {URLSearchParams | { get: (key: string) => string | null }} searchParams
 */
export function parseSurveyDetailsSearch(searchParams) {
  const tab =
    searchParams.get("tab") || SURVEY_DETAIL_TAB_IDS.PROJECT_DETAILS;
  const rawView = searchParams.get("urlView") || PROJECT_URL_VIEW_IDS.LIST;
  const urlView =
    rawView === PROJECT_URL_VIEW_IDS.ADD || rawView === PROJECT_URL_VIEW_IDS.EDIT
      ? rawView
      : PROJECT_URL_VIEW_IDS.LIST;
  const urlId = searchParams.get("urlId") || "";

  return { tab, urlView, urlId };
}

/**
 * @param {{
 *   listPath: string,
 *   listLabel: string,
 *   detailsPath: string,
 *   tab: string,
 *   tabLabel: string,
 *   urlView?: string,
 * }} options
 */
export function getSurveyDetailsBreadcrumbs({
  listPath,
  listLabel,
  detailsPath,
  tab,
  tabLabel,
  urlView = PROJECT_URL_VIEW_IDS.LIST,
}) {
  const crumbs = [{ label: listLabel, to: listPath }];

  const isProjectUrlTab = tab === SURVEY_DETAIL_TAB_IDS.PROJECT_URLS;
  const isUrlForm =
    isProjectUrlTab &&
    (urlView === PROJECT_URL_VIEW_IDS.ADD || urlView === PROJECT_URL_VIEW_IDS.EDIT);

  if (isUrlForm) {
    crumbs.push({
      label: "Project URL",
      to: getSurveyDetailsPathFromBase(detailsPath, {
        tab: SURVEY_DETAIL_TAB_IDS.PROJECT_URLS,
      }),
    });
    crumbs.push({
      label:
        urlView === PROJECT_URL_VIEW_IDS.EDIT
          ? "Edit Project URL"
          : "Add Project URL",
    });
    return crumbs;
  }

  crumbs.push({ label: tabLabel || "Project Information" });
  return crumbs;
}

/**
 * @param {string} basePath path without search
 * @param {{ tab?: string, urlView?: string, urlId?: string|number }} options
 */
export function getSurveyDetailsPathFromBase(basePath, options = {}) {
  return `${basePath}${buildSurveyDetailsSearch(options)}`;
}
