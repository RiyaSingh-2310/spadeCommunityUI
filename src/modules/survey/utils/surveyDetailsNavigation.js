/**
 * Survey / Project details navigation helpers (tabs + Project URL views via search params).
 */

export const SURVEY_DETAIL_TAB_IDS = {
  PROJECT_DETAILS: "project-details",
  PROJECT_URLS: "project-urls",
  PARTNER_MAPPING: "partner-mapping",
  PROJECT_MULTI_URL: "project-multi-url",
};

export const PROJECT_URL_VIEW_IDS = {
  LIST: "list",
  ADD: "add",
  EDIT: "edit",
};

export const SURVEY_DETAIL_TAB_LABELS = {
  [SURVEY_DETAIL_TAB_IDS.PROJECT_DETAILS]: "Project Information",
  [SURVEY_DETAIL_TAB_IDS.PROJECT_URLS]: "Project URL",
  [SURVEY_DETAIL_TAB_IDS.PARTNER_MAPPING]: "Partner Mapping",
  [SURVEY_DETAIL_TAB_IDS.PROJECT_MULTI_URL]: "Multi URL",
};

/**
 * @param {string} [tab]
 * @returns {string}
 */
export function getSurveyDetailTabLabel(tab) {
  const key = String(tab ?? "").trim();
  if (SURVEY_DETAIL_TAB_LABELS[key]) return SURVEY_DETAIL_TAB_LABELS[key];
  if (!key) return SURVEY_DETAIL_TAB_LABELS[SURVEY_DETAIL_TAB_IDS.PROJECT_DETAILS];
  return key
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

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

/**
 * Breadcrumbs for the Edit Project page based on where the user navigated from.
 * @param {{
 *   id: string|number,
 *   from?: string,
 *   fromTab?: string,
 *   groupId?: string|number,
 *   listPath?: string,
 *   listLabel?: string,
 * }} options
 */
export function getSurveyEditBreadcrumbs({
  id,
  from,
  fromTab,
  groupId,
  listPath = "/survey",
  listLabel = "Projects",
} = {}) {
  if (from === "list") {
    return [
      { label: listLabel, to: listPath },
      { label: "Edit Project" },
    ];
  }

  const tab = String(fromTab || "").trim() || SURVEY_DETAIL_TAB_IDS.PROJECT_DETAILS;
  const tabLabel = getSurveyDetailTabLabel(tab);

  return [
    { label: listLabel, to: listPath },
    {
      label: tabLabel,
      to: getSurveyDetailsPath({ id, groupId, tab }),
    },
    { label: "Edit Project" },
  ];
}
