const DEFAULT_API_BASE_URL = "http://localhost:5050/api";

/** Backend route paths (must match server; always include /api prefix). */
export const API_ROUTES = {
  admin: {
    login: "/api/admin/login",
    logout: "/api/admin/logout",
    forgotPassword: "/api/admin/forgot-password",
    verifyOtp: "/api/admin/verify-otp",
    resetPassword: "/api/admin/reset-password",
    changePassword: "/api/admin/change-password",
    all: "/api/admin/all",
    byId: (id) => `/api/admin/${id}`,
    create: "/api/admin/add-user",
    update: (id) => `/api/admin/updateadmin/${id}`,
    updatePermissions: (id) => `/api/admin/permissions/${id}`,
    delete: (id) => `/api/admin/delete/${id}`,
  },
  clients: {
    list: "/api/clients/all",
    create: "/api/clients/add",
    update: (id) => `/api/clients/update/${id}`,
    delete: (id) => `/api/clients/delete/${id}`,
  },
  countries: {
    list: "/api/countries/list",
  },
  partners: {
    list: "/api/partner/list",
    byId: (id) => `/api/partner/${id}`,
    create: "/api/partner/add",
    update: (id) => `/api/partner/${id}`,
    delete: (id) => `/api/admin/partner/${id}`,
  },
  projectManagers: {
    list: "/api/projectmanager/list",
    create: "/api/projectmanager/add",
    login: "/api/projectmanager/login",
    byId: (id) => `/api/projectmanager/${id}`,
    update: (id) => `/api/projectmanager/${id}`,
    updateStatus: (id) => `/api/projectmanager/${id}/status`,
    delete: (id) => `/api/projectmanager/${id}`,
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
    byId: (id) => `/api/salesmanager/${id}`,
    update: (id) => `/api/salesmanager/${id}`,
    updateStatus: (id) => `/api/salesmanager/status/${id}`,
    delete: (id) => `/api/salesmanager/${id}`,
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
    recontactCreate: "/api/survey/recontact/add",
    recontactSupplierDetails: (surveyId) =>
      `/api/survey/recontact/${encodeURIComponent(surveyId)}/supplier-details`,
  },
  projects: {
    list: "/api/projects/list",
    create: "/api/projects/add",
    byId: (id) => `/api/projects/${id}`,
    update: (id) => `/api/projects/${id}`,
    updateStatus: (id) => `/api/projects/${id}/status`,
    delete: (id) => `/api/projects/${id}`,
    createUrl: (id) => `/api/projects/${id}/url`,
    urlList: (id) => `/api/projects/${id}/url/list`,
    urlById: (urlId) => `/api/projects/url/${urlId}`,
    updateUrl: (urlId) => `/api/projects/url/${urlId}`,
    deleteUrl: (urlId) => `/api/projects/url/${urlId}`,
    multiUrlList: (id) => `/api/projects/${id}/multiple-url/list`,
    createMultiUrl: (id) => `/api/projects/${id}/multiple-url`,
    updateMultiUrl: (urlId) => `/api/projects/multiple-url/${urlId}`,
    deleteMultiUrl: (urlId) => `/api/projects/multiple-url/${urlId}`,
    multiUrlCsvTemplate: "/api/projects/multiple-url/csv-template",
    uploadMultiUrls: (id) => `/api/projects/${id}/multiple-url/csv-upload`,
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
  },
  emailTemplates: {
    list: "/api/email-templates/list",
    create: "/api/email-templates/add",
    byId: (id) => `/api/email-templates/${id}`,
    updateStatus: (id) => `/api/email-templates/${id}/status`,
  },
  findUser: {
    questions: "/api/find-user/questions",
    questionAnswers: (questionId) =>
      `/api/find-user/questions/${encodeURIComponent(String(questionId ?? "").trim())}/answers`,
    search: (projectId) =>
      `/api/find-user/${encodeURIComponent(String(projectId ?? "").trim())}/search`,
    invite: (projectId) =>
      `/api/find-user/${encodeURIComponent(String(projectId ?? "").trim())}/invite`,
    invited: (projectId) =>
      `/api/find-user/${encodeURIComponent(String(projectId ?? "").trim())}/invited`,
  },
  invoice: {
    settings: "/api/invoice/settings",
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
  systemEmails: {
    list: "/api/system-emails/list",
    byId: (id) => `/api/system-emails/${id}`,
  },
};

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.trim()?.replace(/\/$/, "") ||
  DEFAULT_API_BASE_URL;

export const API_LOGIN_BEARER_TOKEN =
  import.meta.env.VITE_API_LOGIN_BEARER_TOKEN?.trim() ?? "";

export const API_DEBUG =
  import.meta.env.DEV && import.meta.env.VITE_API_DEBUG === "true";

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
