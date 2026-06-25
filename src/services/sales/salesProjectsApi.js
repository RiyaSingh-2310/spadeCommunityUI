import { API_ROUTES } from "../../config/api";
import { extractListTotalFromResponse } from "../../modules/shared/utils/listResponse";
import { appendListQuery } from "../../modules/shared/utils/listQueryParams";
import { apiRequest } from "../api/client";
import { ApiError } from "../api/ApiError";
import {
  formatLocaleDateLabel,
  formatLocaleDateTime,
  formatLocaleTimeLabel,
} from "../../modules/shared/utils/dateTime";

const FORM_STATUS_TO_API = {
  WIP: "wip",
  Won: "won",
  Lost: "lost",
};

const API_STATUS_TO_FORM = {
  wip: "WIP",
  won: "Won",
  lost: "Lost",
};

function isApiSuccess(data) {
  if (!data || typeof data !== "object") return false;
  const explicit = data.success;
  if (explicit === false || explicit === "false") return false;
  return explicit === true || explicit === "true" || explicit == null;
}

function assertSuccess(data) {
  if (!isApiSuccess(data)) {
    throw new ApiError(data?.message ?? "", data);
  }
  return data;
}

function extractSalesProjectsList(data) {
  if (!data || typeof data !== "object") return [];
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.projects)) return data.projects;
  return [];
}

function extractSalesProjectRecord(data) {
  if (!data || typeof data !== "object") return null;
  if (data.data && typeof data.data === "object" && !Array.isArray(data.data)) {
    return data.data;
  }
  if (data.project && typeof data.project === "object") {
    return data.project;
  }
  if (data.id != null) return data;
  return null;
}

function normalizeSalesProjectId(id) {
  const normalizedId = String(id ?? "").trim();
  if (!normalizedId || normalizedId === "undefined" || normalizedId === "null") {
    throw new ApiError("", null);
  }
  return encodeURIComponent(normalizedId);
}

function resolveNumericId(value) {
  if (value == null || value === "") return undefined;
  const num = Number(value);
  if (Number.isFinite(num) && num > 0) return num;
  return undefined;
}

function buildSalesProjectBody(payload) {
  const body = {
    client_name: String(payload.clientName ?? "").trim(),
    email: String(payload.email ?? "").trim(),
    country: String(payload.country ?? "").trim(),
    email_subject: String(payload.subject ?? "").trim(),
    status: formStatusToApiStatus(payload.status),
    comment: String(payload.comment ?? "").trim(),
  };

  const clientId = resolveNumericId(payload.clientId);
  if (clientId != null) {
    body.client_id = clientId;
  }

  const salesManagerId = resolveNumericId(payload.salesManagerId);
  if (salesManagerId != null) {
    body.sales_manager_id = salesManagerId;
  }

  const salesManagerName = String(payload.salesManagerName ?? "").trim();
  if (salesManagerName) {
    body.sales_manager_name = salesManagerName;
  }

  return body;
}

export function formStatusToApiStatus(status) {
  const raw = String(status ?? "").trim();
  if (FORM_STATUS_TO_API[raw]) return FORM_STATUS_TO_API[raw];
  return raw.toLowerCase();
}

export function apiStatusToFormStatus(status) {
  const normalized = String(status ?? "").trim().toLowerCase();
  return API_STATUS_TO_FORM[normalized] ?? status ?? "";
}

/**
 * @param {object} project
 */
/**
 * @param {object} project
 */
export function mapSalesProjectToForm(project) {
  const clientId =
    project?.client_id ??
    project?.clientId ??
    project?.client?.id ??
    "";
  const salesManagerId =
    project?.sales_manager_id ??
    project?.salesManagerId ??
    project?.sales_manager?.id ??
    (typeof project?.sales_manager === "object" ? "" : "");

  const salesManagerName =
    project?.sales_manager_name ??
    (typeof project?.sales_manager === "object"
      ? project?.sales_manager?.name ?? ""
      : project?.sales_manager ?? "");

  return {
    clientId: clientId != null && clientId !== "" ? String(clientId) : "",
    clientName: project?.client_name ?? project?.client?.name ?? "",
    salesManagerName,
    email: project?.email ?? "",
    country: project?.country ?? "",
    subject: project?.email_subject ?? "",
    status: apiStatusToFormStatus(project?.status),
    comment: project?.comment ?? "",
    salesManagerId:
      salesManagerId != null && salesManagerId !== "" ? String(salesManagerId) : "",
  };
}

function extractSalesLogRecord(data) {
  if (!data || typeof data !== "object") return null;
  if (data.data && typeof data.data === "object" && !Array.isArray(data.data)) {
    return data.data;
  }
  if (data.log && typeof data.log === "object") {
    return data.log;
  }
  if (data.id != null) return data;
  return null;
}

function resolveLogCreatedBy(log) {
  if (log?.created_by_name) {
    return String(log.created_by_name).trim();
  }

  const createdBy = log?.created_by ?? log?.createdBy;
  if (typeof createdBy === "string" && createdBy.trim()) {
    return createdBy.trim();
  }

  return "";
}

export function mapSalesLogToCard(log) {
  const createdAt = log?.created_at ?? log?.createdAt ?? "";
  return {
    id: log?.id,
    projectId: log?.project_id ?? log?.projectId ?? "",
    emailSubject: log?.email_subject ?? log?.emailSubject ?? "",
    commentHtml: log?.comment ?? "",
    commentBy: apiCommentByToForm(log?.comment_by ?? log?.commentBy),
    createdBy: resolveLogCreatedBy(log),
    createdAt,
    createdDateLabel: formatLocaleDateLabel(createdAt),
    createdTimeLabel: formatLocaleTimeLabel(createdAt),
    createdDateTime: formatLocaleDateTime(createdAt),
  };
}

function stripHtmlContent(value) {
  const plain = String(value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  return plain || "—";
}

function extractSalesLogsList(data) {
  if (!data || typeof data !== "object") return [];
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.logs)) return data.logs;
  if (Array.isArray(data.sales_logs)) return data.sales_logs;
  if (data.data && typeof data.data === "object" && Array.isArray(data.data.logs)) {
    return data.data.logs;
  }
  return [];
}

function resolveSalesProjectLogId(project) {
  const recordId = String(project?.recordId ?? "").trim();
  if (recordId && recordId !== "undefined" && recordId !== "null") {
    return recordId;
  }

  const numericCandidates = [project?.id, project?.project_id];
  for (const candidate of numericCandidates) {
    const normalized = String(candidate ?? "").trim();
    if (!normalized || normalized === "undefined" || normalized === "null") continue;
    if (/^\d+$/.test(normalized)) return normalized;
  }

  return "";
}

function formCommentByToApi(commentBy) {
  return String(commentBy ?? "Sales").trim().toLowerCase() === "client" ? "Client" : "Sales";
}

function apiCommentByToForm(commentBy) {
  return String(commentBy ?? "").trim().toLowerCase() === "client" ? "Client" : "Sales";
}

function resolveLinkedSurveyProjectId(project) {
  return (
    project?.survey_id ??
    project?.survey_project_id ??
    project?.linked_survey_id ??
    ""
  );
}

export function mapSalesProjectToRow(project) {
  const status = String(project?.status ?? "").toLowerCase();
  const isWon = status === "won";
  const linkedSurveyProjectId = resolveLinkedSurveyProjectId(project);

  return {
    id: project?.project_id ?? project?.id,
    name: project?.client_name ?? "",
    emailAddress: project?.email ?? "",
    projectId: isWon ? String(linkedSurveyProjectId || "") : "",
    linkedSurveyRecordId: project?.survey_record_id ?? project?.survey_db_id ?? "",
    country: project?.country ?? "",
    status: project?.status ?? "",
    statusRaw: project?.status ?? "",
    emailSubject: project?.email_subject ?? "",
    salesManager: project?.sales_manager_name ?? project?.sales_manager ?? "",
    createdAt: project?.created_at ?? "",
    recordId: project?.id,
  };
}

/**
 * @param {object} log
 */
export function mapSalesLogToRow(log) {
  return {
    id: log?.id,
    emailSubject: log?.email_subject ?? log?.emailSubject ?? "",
    comment: stripHtmlContent(log?.comment),
    commentBy: apiCommentByToForm(log?.comment_by ?? log?.commentBy),
    createdBy: resolveLogCreatedBy(log),
    createdDate: formatLocaleDateTime(log?.created_at ?? log?.createdAt),
    createdAt: log?.created_at ?? log?.createdAt ?? "",
  };
}

export { resolveSalesProjectLogId };

/** GET /api/sales/project/list */
export async function getRecords({ page, limit, search } = {}) {
  const data = await apiRequest(
    appendListQuery(API_ROUTES.salesProjects.list, { page, limit, search })
  );
  assertSuccess(data);

  const projects = extractSalesProjectsList(data);
  const total = extractListTotalFromResponse(data, projects.length);

  return {
    ...data,
    total,
    count: total,
    items: projects.map((project) => mapSalesProjectToRow(project)),
  };
}

/** GET /api/sales/project/:id — falls back to list lookup when detail endpoint is unavailable. */
export async function getRecord(id) {
  const normalizedId = normalizeSalesProjectId(id);

  try {
    const data = await apiRequest(API_ROUTES.salesProjects.byId(normalizedId));
    assertSuccess(data);
    const record = extractSalesProjectRecord(data);
    if (record) return record;
  } catch {
    // Fall back to list lookup below.
  }

  const data = await apiRequest(API_ROUTES.salesProjects.list);
  assertSuccess(data);

  const projects = extractSalesProjectsList(data);
  const match = projects.find((project) => String(project.id) === String(id));
  if (!match) {
    throw new ApiError("Sales project not found", null);
  }

  return match;
}

/**
 * POST /api/sales/project/add
 * @param {{
 *   clientName: string,
 *   email: string,
 *   country: string,
 *   subject: string,
 *   status: string,
 *   comment: string,
 *   clientId?: string|number,
 *   salesManagerId?: string|number,
 *   salesManagerName?: string,
 * }} payload
 */
export async function createSalesProject(payload) {
  const data = await apiRequest(API_ROUTES.salesProjects.create, {
    method: "POST",
    body: buildSalesProjectBody(payload),
  });

  return assertSuccess(data);
}

/**
 * PUT /api/sales/project/:id
 * @param {string|number} id
 * @param {{
 *   clientName: string,
 *   email: string,
 *   country: string,
 *   subject: string,
 *   status: string,
 *   comment: string,
 *   clientId?: string|number,
 *   salesManagerId?: string|number,
 *   salesManagerName?: string,
 * }} payload
 */
export async function updateSalesProject(id, payload) {
  const normalizedId = normalizeSalesProjectId(id);
  const data = await apiRequest(API_ROUTES.salesProjects.update(normalizedId), {
    method: "PUT",
    body: buildSalesProjectBody(payload),
  });

  return assertSuccess(data);
}

/** DELETE /api/sales/project/:id */
export async function deleteSalesProject(id) {
  const normalizedId = normalizeSalesProjectId(id);
  const data = await apiRequest(API_ROUTES.salesProjects.delete(normalizedId), {
    method: "DELETE",
  });

  return assertSuccess(data);
}

function normalizeSalesLogProjectId(projectId) {
  const normalized = String(projectId ?? "").trim();
  if (!normalized || normalized === "undefined" || normalized === "null") {
    throw new ApiError("Invalid sales project id.", null);
  }
  return normalized;
}

/** GET /api/sales/log/:id/list */
export async function getSalesLogs(projectId) {
  const normalizedId = normalizeSalesLogProjectId(projectId);
  const data = await apiRequest(API_ROUTES.salesProjects.logs(normalizedId));
  assertSuccess(data);

  const logs = extractSalesLogsList(data);
  const total = extractListTotalFromResponse(data, logs.length);

  return {
    ...data,
    total,
    count: total,
    items: logs.map((log) => mapSalesLogToRow(log)),
    cards: logs.map((log) => mapSalesLogToCard(log)),
  };
}

/** GET /api/sales/log/:projectId/view/:logId */
export async function getSalesLogDetail(projectId, logId) {
  const normalizedProjectId = normalizeSalesLogProjectId(projectId);
  const normalizedLogId = String(logId ?? "").trim();
  if (!normalizedLogId || normalizedLogId === "undefined" || normalizedLogId === "null") {
    throw new ApiError("Invalid sales log id.", null);
  }

  const data = await apiRequest(
    API_ROUTES.salesProjects.viewLog(normalizedProjectId, encodeURIComponent(normalizedLogId))
  );
  assertSuccess(data);

  const log = extractSalesLogRecord(data);
  if (!log) {
    throw new ApiError(data?.message ?? "Sales log not found.", data);
  }

  return {
    ...data,
    item: mapSalesLogToCard(log),
  };
}

/**
 * Loads RFQ log list, then fetches each log's full detail via the view API.
 * GET /api/sales/log/:projectId/list
 * GET /api/sales/log/:projectId/view/:logId
 */
export async function getSalesLogListWithDetails(projectId) {
  const listData = await getSalesLogs(projectId);
  const summaries = listData.cards ?? [];

  if (summaries.length === 0) {
    return { ...listData, items: [] };
  }

  const items = await Promise.all(
    summaries.map(async (summary) => {
      if (summary.id == null) return summary;

      try {
        const detail = await getSalesLogDetail(projectId, summary.id);
        const item = detail.item ?? summary;
        return {
          ...item,
          createdBy: summary.createdBy || item.createdBy,
        };
      } catch {
        return summary;
      }
    })
  );

  return {
    ...listData,
    items,
  };
}

/**
 * POST /api/sales/project/log/add
 * @param {string|number} projectId
 * @param {{ subject: string, comment: string, commentBy: string }} payload
 */
export async function createSalesLog(projectId, payload) {
  const normalizedId = normalizeSalesLogProjectId(projectId);
  const data = await apiRequest(API_ROUTES.salesProjects.createLogByProjectId(normalizedId), {
    method: "POST",
    body: {
      email_subject: payload.subject.trim(),
      comment: payload.comment ?? "",
      comment_by: formCommentByToApi(payload.commentBy),
    },
  });

  return assertSuccess(data);
}
