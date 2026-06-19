const DEFAULT_API_BASE_URL = "http://localhost:5050/api";

/** Backend route paths (must match server; always include /api prefix). */
export const API_ROUTES = {
  admin: {
    login: "/api/admin/login",
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
    byId: (id) => `/api/projectmanager/${id}`,
    update: (id) => `/api/projectmanager/${id}`,
    updateStatus: (id) => `/api/projectmanager/${id}/status`,
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
    byId: (id) => `/api/salesmanager/${id}`,
    update: (id) => `/api/salesmanager/${id}`,
    updateStatus: (id) => `/api/salesmanager/status/${id}`,
    delete: (id) => `/api/salesmanager/${id}`,
  },
  prescreen: {
    list: "/api/prescreen/list",
    create: "/api/prescreen/add",
    byId: (id) => `/api/prescreen/${id}`,
    byLanguage: (language) => `/api/prescreen/language/${encodeURIComponent(language)}`,
    update: (id) => `/api/prescreen/${id}`,
    delete: (id) => `/api/prescreen/${id}`,
  },
  prescreenSurvey: {
    list: "/api/prescreen-survey/list",
    create: "/api/prescreen-survey/add",
    byId: (id) => `/api/prescreen-survey/${id}`,
    update: (id) => `/api/prescreen-survey/${id}`,
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
  emailTemplates: {
    list: "/api/email-templates/list",
    byId: (id) => `/api/email-templates/${id}`,
  },
  invoice: {
    settings: "/api/invoice/settings",
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
