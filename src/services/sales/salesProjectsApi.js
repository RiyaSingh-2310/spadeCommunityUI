import { API_ROUTES } from "../../config/api";
import { extractListTotalFromResponse } from "../../modules/shared/utils/listResponse";
import { apiRequest } from "../api/client";
import { ApiError } from "../api/ApiError";

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

function buildSalesProjectBody(payload) {
  return {
    client_name: payload.clientName.trim(),
    email: payload.email.trim(),
    country: payload.country.trim(),
    email_subject: payload.subject.trim(),
    status: formStatusToApiStatus(payload.status),
    comment: payload.comment.trim(),
  };
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
  return {
    clientName: project?.client_name ?? "",
    email: project?.email ?? "",
    country: project?.country ?? "",
    subject: project?.email_subject ?? "",
    status: apiStatusToFormStatus(project?.status),
    comment: project?.comment ?? "",
  };
}

export function mapSalesProjectToRow(project) {
  const status = String(project?.status ?? "").toLowerCase();
  const isWon = status === "won";

  return {
    id: project?.project_id ?? project?.id,
    name: project?.client_name ?? "",
    emailAddress: project?.email ?? "",
    projectId: isWon ? (project?.project_id ?? "") : "",
    country: project?.country ?? "",
    status: apiStatusToFormStatus(project?.status),
    createdAt: project?.created_at ?? "",
    recordId: project?.id,
  };
}

/** GET /api/sales/project/list */
export async function getRecords() {
  const data = await apiRequest(API_ROUTES.salesProjects.list);
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
