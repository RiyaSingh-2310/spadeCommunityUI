/**
 * Resolves the API base URL from Vite env.
 * Production must set VITE_API_BASE_URL and must never use localhost.
 *
 * @param {{ configuredUrl?: string, isProduction?: boolean }} [options]
 */
export function resolveApiBaseUrl({
  configuredUrl = import.meta.env.VITE_API_BASE_URL,
  isProduction = import.meta.env.PROD,
} = {}) {
  const url = String(configuredUrl ?? "").trim().replace(/\/$/, "");
  if (!url) {
    throw new Error(
      "VITE_API_BASE_URL is required. Set it in .env."
    );
  }

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("VITE_API_BASE_URL must be a valid absolute URL.");
  }

  if (isProduction) {
    const host = parsed.hostname.toLowerCase();
    if (host === "localhost" || host === "127.0.0.1" || host === "[::1]" || host === "::1") {
      throw new Error("Production API base URL must not point to localhost.");
    }
  }

  return url;
}

/** Backend route paths (must match server; always include /api prefix). */
export const API_ROUTES = {
  admin: {
    login: "/api/admin/login",
    logout: "/api/admin/logout",
    me: "/api/admin/me",
    forgotPassword: "/api/admin/forgot-password",
    verifyOtp: "/api/admin/verify-otp",
    resetPassword: "/api/admin/reset-password",
    changePassword: "/api/admin/change-password",
    // TODO(backend): Confirm path + body/response for refresh-token exchange.
    // Expected: POST with { refreshToken }; returns { data: { token, refreshToken? } }.
    refreshToken: "/api/admin/refresh-token",
    all: "/api/admin/all",
    byId: (id) => `/api/admin/${id}`,
    create: "/api/admin/add-user",
    update: (id) => `/api/admin/updateadmin/${id}`,
    updatePermissions: (id) => `/api/admin/permissions/${id}`,
    delete: (id) => `/api/admin/delete/${id}`,
    exportCsv: "/api/admin/export/csv",
  },
  clients: {
    list: "/api/clients/all",
    create: "/api/clients/add",
    update: (id) => `/api/clients/update/${id}`,
    delete: (id) => `/api/clients/delete/${id}`,
    exportCsv: "/api/clients/export/csv",
  },
  countries: {
    list: "/api/countries/list",
  },
  partners: {
    list: "/api/partner/list",
    panelSizes: "/api/partner/panel-sizes",
    byId: (id) => `/api/partner/${id}`,
    create: "/api/partner/add",
    update: (id) => `/api/partner/${id}`,
    delete: (id) => `/api/partner/${id}`,
    exportCsv: "/api/partner/export/csv",
  },
  projectManagers: {
    list: "/api/projectmanager/list",
    create: "/api/projectmanager/add",
    login: "/api/projectmanager/login",
    me: "/api/projectmanager/me",
    byId: (id) => `/api/projectmanager/${id}`,
    update: (id) => `/api/projectmanager/${id}`,
    updateStatus: (id) => `/api/projectmanager/${id}/status`,
    delete: (id) => `/api/projectmanager/${id}`,
    exportCsv: "/api/projectmanager/export/csv",
  },
  salesProjects: {
    list: "/api/sales/project/list",
    create: "/api/sales/project/add",
    byId: (id) => `/api/sales/project/${id}`,
    update: (id) => `/api/sales/project/${id}`,
    delete: (id) => `/api/sales/project/${id}`,
    logs: (id) => `/api/sales/log/${id}/list`,
    viewLog: (projectId, logId) => `/api/sales/log/${projectId}/view/${logId}`,
    createLog: "/api/sales/project/log/add",
    createLogByProjectId: (id) => `/api/sales/log/${id}/add`,
  },
  salesManagers: {
    list: "/api/salesmanager/list",
    create: "/api/salesmanager",
    login: "/api/salesmanager/login",
    me: "/api/salesmanager/me",
    byId: (id) => `/api/salesmanager/${id}`,
    update: (id) => `/api/salesmanager/${id}`,
    updateStatus: (id) => `/api/salesmanager/status/${id}`,
    delete: (id) => `/api/salesmanager/${id}`,
    exportCsv: "/api/salesmanager/export/csv",
  },
  questionaire: {
    create: "/api/questionaire/createQuestionaire",
    list: "/api/questionaire/survey",
    update: (id) => `/api/questionaire/survey/${id}`,
    delete: (id) => `/api/questionaire/survey/${id}`,
  },
  screening: {
    list: "/api/panel-questionnaire/list",
    create: "/api/panel-questionnaire/add",
    byId: (id) => `/api/panel-questionnaire/${id}`,
    byTitle: (title) =>
      `/api/panel-questionnaire/by-title/${encodeURIComponent(String(title ?? "").trim())}`,
    byLanguage: (language) =>
      `/api/panel-questionnaire/language/${encodeURIComponent(String(language ?? "").trim())}`,
    update: (id) => `/api/panel-questionnaire/${id}`,
    updateStatus: (id) => `/api/panel-questionnaire/${id}/status`,
    delete: (id) => `/api/panel-questionnaire/${id}`,
    sortOrder: "/api/panel-questionnaire/sort-order",
  },
  questionLibrary: {
    list: "/api/question-library/list",
    create: "/api/question-library/add",
    byId: (id) => `/api/question-library/${id}`,
    byLanguage: (language) => {
      const slug = encodeURIComponent(String(language ?? "").trim().toLowerCase());
      return `/api/question-library/language/${slug}`;
    },
    update: (id) => `/api/question-library/${id}`,
    updateStatus: (id) => `/api/question-library/${id}/status`,
    sortOrder: "/api/question-library/sort-order",
    delete: (id) => `/api/question-library/${id}`,
    exportCsv: "/api/question-library/export/csv",
  },
  questionnaireGroup: {
    list: "/api/questionnaire-group/list",
    create: "/api/questionnaire-group/add",
    byId: (id) => `/api/questionnaire-group/${id}`,
    update: (id) => `/api/questionnaire-group/${id}`,
    updateStatus: (id) => `/api/questionnaire-group/${id}/status`,
    delete: (id) => `/api/questionnaire-group/${id}`,
    publicQuestions: (id) => `/api/questionnaire-group/public/${id}/questions`,
    publicSubmit: (id) => `/api/questionnaire-group/public/${id}/submit`,
    exportCsv: "/api/questionnaire-group/export/csv",
  },
  survey: {
    list: "/api/survey/list",
    create: "/api/survey/add",
    createUnderGroup: (groupProjectId) => `/api/survey/add/${groupProjectId}`,
    byId: (id) => `/api/survey/${id}`,
    update: (id) => `/api/survey/${id}`,
    delete: (id) => `/api/survey/${id}`,
    eligiblePartners: (id) => `/api/survey/${id}/eligible-partners`,
    partners: (id) => `/api/survey/${id}/partners`,
    assignPartners: (id) => `/api/survey/${id}/assign-partners`,
    partnerAllocation: (surveyId, partnerId) =>
      `/api/survey/${surveyId}/partners/${partnerId}/allocation`,
    removePartner: (surveyId, partnerId) =>
      `/api/survey/${surveyId}/partners/${partnerId}`,
    recontactCreate: "/api/projects/recontact/add",
    recontactSupplierDetails: (projectId) =>
      `/api/projects/${encodeURIComponent(String(projectId ?? "").trim())}/partners`,
    /** Partner URL gateway — store activity before survey start. */
    activity: "/api/survey/activity",
    /** Partner URL gateway — check whether pre-screen is required. */
    prescreen: "/api/survey/prescreen",
    /** Partner URL gateway — save one pre-screen answer. */
    prescreenResponse: "/api/survey/prescreenResponse",
    /** Partner URL gateway — update pre-screen status (COMPLETED | IN_PROGRESS | TERMINATED). */
    prescreenResponseEnd: "/api/survey/prescreenResponseEnd",
    /** Partner URL gateway — resolve live survey redirect URL. */
    link: "/api/survey/link",
    /** Public result-page status updates (pid + uid query). */
    complete: "/api/survey/complete",
    terminate: "/api/survey/terminate",
    quota: "/api/survey/quota",
    quality: "/api/survey/quality",
    closed: "/api/survey/closed",
  },
  projects: {
    list: "/api/projects/list",
    create: "/api/projects/add",
    byId: (id) => `/api/projects/${id}`,
    summary: (id) => `/api/projects/${id}/summary`,
    update: (id) => `/api/projects/${id}`,
    updateStatus: (id) => `/api/projects/${id}/status`,
    delete: (id) => `/api/projects/${id}`,
    createUrl: (id) => `/api/projects/${id}/url`,
    urlList: (id) => `/api/projects/${id}/url/list`,
    generateUrlCode: (id) => `/api/projects/${id}/url/generate-code`,
    // Backend has no GET /api/projects/url/:urlId — use urlList + match by id.
    updateUrl: (urlId) => `/api/projects/url/${urlId}`,
    updateUrlLinkMode: (urlId) => `/api/projects/url/${urlId}/link-mode`,
    deleteUrl: (urlId) => `/api/projects/url/${urlId}`,
    multiUrlList: (id) => `/api/projects/${id}/multiple-url/list`,
    createMultiUrl: (id) => `/api/projects/${id}/multiple-url`,
    updateMultiUrl: (urlId) => `/api/projects/multiple-url/${urlId}`,
    deleteMultiUrl: (urlId) => `/api/projects/multiple-url/${urlId}`,
    multiUrlCsvTemplate: "/api/projects/multiple-url/csv-template",
    uploadMultiUrls: (id) => `/api/projects/${id}/multiple-url/csv-upload`,
    multiLinkStats: (id) => `/api/projects/${id}/multi-link-stats`,
    recontactAdd: "/api/projects/recontact/add",
    partners: (id) =>
      `/api/projects/${encodeURIComponent(String(id ?? "").trim())}/partners`,
    reportList: (id, reportType) =>
      `/api/projects/${encodeURIComponent(String(id ?? "").trim())}/reports/${encodeURIComponent(String(reportType ?? "").trim())}`,
    reportDownload: (id, reportType) =>
      `/api/projects/${encodeURIComponent(String(id ?? "").trim())}/reports/${encodeURIComponent(String(reportType ?? "").trim())}/download`,
  },
  projectReports: {
    report: (id) =>
      `/api/project-reports/${encodeURIComponent(String(id ?? "").trim())}/report`,
    exportCsv: (id) =>
      `/api/project-reports/${encodeURIComponent(String(id ?? "").trim())}/report/export/csv`,
    supplierReport: (projectId, supplierId) =>
      `/api/project-reports/${encodeURIComponent(String(projectId ?? "").trim())}/supplier/${encodeURIComponent(String(supplierId ?? "").trim())}`,
    supplierExportCsv: (projectId, supplierId) =>
      `/api/project-reports/${encodeURIComponent(String(projectId ?? "").trim())}/supplier/${encodeURIComponent(String(supplierId ?? "").trim())}/export/csv`,
    preScreenReport: "/api/project-reports/pre-screen-report",
    preScreenReportExportCsv: "/api/project-reports/pre-screen-report/export/csv",
  },
  supplierMapping: {
    list: "/api/supplier-mapping/list",
    create: "/api/supplier-mapping",
    byId: (id) => `/api/supplier-mapping/${id}`,
    update: (id) => `/api/supplier-mapping/${id}`,
    updateStatus: (id) => `/api/supplier-mapping/status/${id}`,
    updateTestMode: (id) => `/api/supplier-mapping/istest/${id}`,
  },
  /**
   * SPA path helpers only — NOT backend APIs.
   * Backend GET /dosurvey/:token redirects to Live/Test; do not call it from the
   * Partner URL start page. Use /api/survey/activity + /api/survey/prescreen (+ link).
   */
  doSurvey: {
    pagePath: (token) =>
      `/dosurvey/${encodeURIComponent(String(token ?? "").trim())}`,
  },
  groupSurvey: {
    list: "/api/survey/groupproject/list",
    create: "/api/survey/groupproject/add",
    byId: (id) => `/api/survey/groupproject/${id}`,
    update: (id) => `/api/survey/groupproject/${id}`,
    updateStatus: (id) => `/api/survey/groupproject/${id}/status`,
    delete: (id) => `/api/survey/groupproject/${id}`,
  },
  surveyPages: {
    byId: (id) => `/api/survey-pages/${id}`,
    update: (id) => `/api/survey-pages/${id}`,
  },
  activity: {
    list: "/api/activity/list",
    delete: (id) => `/api/activity/${id}`,
  },
  panelist: {
    list: "/api/panelist/list",
    logout: "/api/panelist/logout",
    byId: (id) => `/api/panelist/${id}`,
    updateStatus: (id) => `/api/panelist/${id}/status`,
    resendInvite: (id) => `/api/panelist/${id}/resend-invite`,
    bulkInvite: "/api/panelist/bulk-invite",
    // TODO(backend): Implement GET /api/panelist/export/csv (CSV download with
    // Content-Disposition filename + UTF-8 BOM recommended for Excel).
    exportCsv: "/api/panelist/export/csv",
  },
  emailTemplates: {
    list: "/api/email-templates/list",
    create: "/api/email-templates/add",
    byId: (id) => `/api/email-templates/${id}`,
    update: (id) => `/api/email-templates/${id}`,
    updateStatus: (id) => `/api/email-templates/${id}/status`,
    delete: (id) => `/api/email-templates/${id}`,
  },
  findUser: {
    questions: "/api/find-user/questions",
    questionAnswers: (questionId) =>
      `/api/find-user/questions/${encodeURIComponent(String(questionId ?? "").trim())}/answers`,
    projectUrls: (projectId) =>
      `/api/find-user/${encodeURIComponent(String(projectId ?? "").trim())}/urls`,
    search: (projectId) =>
      `/api/find-user/${encodeURIComponent(String(projectId ?? "").trim())}/search`,
    invite: (projectId) =>
      `/api/find-user/${encodeURIComponent(String(projectId ?? "").trim())}/invite`,
    invited: (projectId) =>
      `/api/find-user/${encodeURIComponent(String(projectId ?? "").trim())}/invited`,
  },
  invoice: {
    settings: "/api/invoice/settings",
    downloadPdf: (id) =>
      `/api/invoice/${encodeURIComponent(String(id ?? "").trim())}/pdf`,
  },
  rewardSettings: {
    get: "/api/reward-settings/get",
    update: "/api/reward-settings/update",
  },
  rewardTransactions: {
    list: "/api/rewards/transactions/list",
    add: "/api/rewards/transactions/add",
    byId: (id) => `/api/rewards/transactions/${id}`,
  },
  rewardHistory: {
    list: "/api/reward-history/list",
    redeemList: "/api/reward-history/redeem/list",
    redeemUpdateStatus: (id) => `/api/reward-history/redeem/${id}/status`,
  },
  // Alias of emailTemplates — System Email UI uses /api/email-templates/*.
  systemEmails: {
    list: "/api/email-templates/list",
    create: "/api/email-templates/add",
    byId: (id) => `/api/email-templates/${id}`,
    update: (id) => `/api/email-templates/${id}`,
    updateStatus: (id) => `/api/email-templates/${id}/status`,
    delete: (id) => `/api/email-templates/${id}`,
  },
  messages: {
    list: "/api/messages/list",
    unreadCount: "/api/messages/unread-count",
    readAll: "/api/messages/read-all",
    byId: (id) => `/api/messages/${encodeURIComponent(String(id ?? "").trim())}`,
    reply: (id) =>
      `/api/messages/${encodeURIComponent(String(id ?? "").trim())}/reply`,
    delete: (id) =>
      `/api/messages/${encodeURIComponent(String(id ?? "").trim())}`,
  },
  homepage: {
    list: "/api/homepage/list",
    bySection: (section) =>
      `/api/homepage/${encodeURIComponent(String(section ?? "").trim())}`,
    updateSection: (section) =>
      `/api/homepage/${encodeURIComponent(String(section ?? "").trim())}`,
  },
  dashboard: {
    summary: "/api/dashboard/summary",
  },
};

export const API_BASE_URL = resolveApiBaseUrl();

/**
 * Optional static Bearer for pre-auth endpoints (login / forgot-password).
 * This value is public in the Vite bundle — not a real secret. Prefer
 * server-side rate limiting / CAPTCHA. Leave empty unless the backend requires it.
 */
export const API_LOGIN_BEARER_TOKEN =
  import.meta.env.VITE_API_LOGIN_BEARER_TOKEN?.trim() ?? "";

/**
 * Dev-only API request/response console logging.
 * Production builds never enable this, even if VITE_API_DEBUG is set.
 * Debug logs must never include tokens, passwords, or request/response payloads.
 */
export const API_DEBUG =
  Boolean(import.meta.env.DEV) && import.meta.env.VITE_API_DEBUG === "true";

/**
 * @param {string} path Path starting with /api/...
 */
export function buildApiUrl(path) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const base = API_BASE_URL;

  if (base.endsWith("/api") && normalizedPath.startsWith("/api/")) {
    return `${base}${normalizedPath.slice(4)}`;
  }

  return `${base}${normalizedPath}`;
}
