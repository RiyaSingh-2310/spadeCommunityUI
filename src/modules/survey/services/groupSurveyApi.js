import { API_ROUTES } from "../../../config/api";
import { extractListTotalFromResponse } from "../../shared/utils/listResponse";
import {
  apiStatusToFormValue,
  formValueToApiStatus,
} from "../../shared/utils/statusLabels";
import { apiRequest } from "../../../services/api/client";
import { ApiError } from "../../../services/api/ApiError";
import { appendListQuery } from "../../shared/utils/listQueryParams";
import { createSurveyUnderGroup, mapSurveyToRow } from "./surveyApi";
import { formatSurveyListDate } from "../../shared/utils/dateTime";
import { sanitizeHtml } from "../../shared/utils/sanitizeHtml";

function assertSuccess(data) {
  if (data?.success !== true) {
    throw new ApiError(data?.message ?? "", data);
  }
  return data;
}

function normalizeGroupProjectId(id) {
  const normalizedId = String(id ?? "").trim();
  if (!normalizedId || normalizedId === "undefined" || normalizedId === "null") {
    throw new ApiError("Invalid group project id.", null);
  }
  return encodeURIComponent(normalizedId);
}


function extractGroupProjectsList(data) {
  if (!data || typeof data !== "object") return [];
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.groupProjects)) return data.groupProjects;
  return [];
}

function extractGroupProjectRecord(data) {
  if (!data || typeof data !== "object") return null;
  if (data.data && typeof data.data === "object" && !Array.isArray(data.data)) {
    return data.data;
  }
  if (data.groupProject && typeof data.groupProject === "object") {
    return data.groupProject;
  }
  if (data.id != null) return data;
  return null;
}

function resolveClientIds(project) {
  if (Array.isArray(project?.clients) && project.clients.length > 0) {
    return project.clients
      .map((client) => String(client?.id ?? ""))
      .filter(Boolean);
  }

  if (Array.isArray(project?.client_ids) && project.client_ids.length > 0) {
    return project.client_ids.map((id) => String(id)).filter(Boolean);
  }

  const singleId = project?.client_id ?? project?.clientId;
  if (singleId != null && String(singleId).trim() !== "") {
    return [String(singleId)];
  }

  return [];
}

function resolveClientIdFromForm(form) {
  if (form.clientId != null && String(form.clientId).trim() !== "") {
    const singleId = Number(String(form.clientId).trim());
    return Number.isFinite(singleId) ? singleId : undefined;
  }

  return undefined;
}

function buildCreateGroupProjectPayload(form) {
  const payload = {
    project_name: String(form.projectName ?? "").trim(),
    description: sanitizeHtml(form.description).trim(),
    status: "active",
  };

  const clientId = resolveClientIdFromForm(form);
  if (clientId != null) payload.client_id = clientId;

  return payload;
}

function buildUpdateGroupProjectPayload(form) {
  const payload = {
    project_name: String(form.projectName ?? "").trim(),
    description: sanitizeHtml(form.description).trim(),
    notes: String(form.notes ?? ""),
  };

  const clientId = resolveClientIdFromForm(form);
  if (clientId != null) payload.client_id = clientId;

  return payload;
}

export function resolveGroupClientNames(project) {
  if (Array.isArray(project?.clients) && project.clients.length > 0) {
    return project.clients
      .map((client) => client?.name)
      .filter(Boolean)
      .join(", ");
  }

  return project?.client_names ?? "";
}

export function resolveGroupPrimaryClientId(project) {
  if (Array.isArray(project?.clients) && project.clients.length > 0) {
    const firstClientId = project.clients[0]?.id;
    return firstClientId != null ? String(firstClientId) : "";
  }

  if (Array.isArray(project?.client_ids) && project.client_ids.length > 0) {
    return String(project.client_ids[0]);
  }

  return "";
}

/**
 * @param {object} project
 */
export function mapGroupProjectToRow(project) {
  return {
    id: project?.id,
    recordId: project?.id,
    clientName: project?.client_names ?? "",
    projectName: project?.project_name ?? "",
    groupProject: project?.project_name ?? "",
    status: apiStatusToFormValue(project?.status),
    createdAt: project?.created_at ?? "",
    createdDate: formatSurveyListDate(project?.created_at),
  };
}

/**
 * @param {object} project
 */
export function mapGroupProjectToForm(project) {
  const clientIds = resolveClientIds(project);

  return {
    projectName: project?.project_name ?? "",
    description: project?.description ?? "",
    notes: project?.notes ?? "",
    clientId: clientIds[0] ?? "",
  };
}

/**
 * @param {object | null | undefined} project
 */
export function mapGroupProjectToDetailsView(project) {
  if (!project || typeof project !== "object") return null;

  return {
    id: project.id,
    projectName: project.project_name ?? "",
    clientName: resolveGroupClientNames(project),
    description: project.description ?? "",
    notes: project.notes ?? "",
    status: apiStatusToFormValue(project.status),
    createdAt: formatSurveyListDate(project.created_at),
  };
}

export function createEmptyGroupProjectForm() {
  return {
    projectName: "",
    description: "",
    notes: "",
    clientId: "",
  };
}

/** GET /api/survey/groupproject/list */
export async function getRecords({ page, limit, search } = {}) {
  const data = await apiRequest(
    appendListQuery(API_ROUTES.groupSurvey.list, { page, limit, search })
  );
  assertSuccess(data);

  const projects = extractGroupProjectsList(data);
  const total = extractListTotalFromResponse(data, projects.length);

  return {
    ...data,
    total,
    count: total,
    page: data.page,
    limit: data.limit,
    totalPages: data.totalPages,
    items: projects.map((project) => mapGroupProjectToRow(project)),
  };
}

/** GET /api/survey/groupproject/:id */
export async function getRecord(id) {
  const normalizedId = normalizeGroupProjectId(id);
  const data = await apiRequest(API_ROUTES.groupSurvey.byId(normalizedId));
  assertSuccess(data);

  const project = extractGroupProjectRecord(data);
  if (!project) {
    throw new ApiError(data?.message ?? "Group project not found.", data);
  }

  return project;
}

/** POST /api/survey/groupproject/add */
export async function createGroupProject(form) {
  const data = await apiRequest(API_ROUTES.groupSurvey.create, {
    method: "POST",
    body: buildCreateGroupProjectPayload(form),
  });

  return assertSuccess(data);
}

/** PUT /api/survey/groupproject/:id */
export async function updateGroupProject(id, form) {
  const normalizedId = normalizeGroupProjectId(id);
  const data = await apiRequest(API_ROUTES.groupSurvey.update(normalizedId), {
    method: "PUT",
    body: buildUpdateGroupProjectPayload(form),
  });

  return assertSuccess(data);
}

/** PATCH /api/survey/groupproject/:id/status — status toggle from listing table. */
export async function updateGroupProjectStatus(id, { status }) {
  const normalizedId = normalizeGroupProjectId(id);
  const data = await apiRequest(API_ROUTES.groupSurvey.updateStatus(normalizedId), {
    method: "PATCH",
    body: {
      status: formValueToApiStatus(status),
    },
  });

  return assertSuccess(data);
}

/** DELETE /api/survey/groupproject/:id */
export async function deleteGroupProject(id) {
  const normalizedId = normalizeGroupProjectId(id);
  const data = await apiRequest(API_ROUTES.groupSurvey.delete(normalizedId), {
    method: "DELETE",
  });

  return assertSuccess(data);
}

/**
 * Surveys linked to a group project — from GET /api/survey/groupproject/:id.
 * @param {string|number} groupProjectId
 * @param {{ page?: number, limit?: number, search?: string }} [options]
 */
export async function getGroupProjectSurveys(groupProjectId, options = {}) {
  const project = await getRecord(groupProjectId);
  const surveys = Array.isArray(project?.surveys) ? project.surveys : [];
  const search = String(options.search ?? "").trim().toLowerCase();

  const filtered = search
    ? surveys.filter((survey) => {
        const name = String(survey?.project_name ?? survey?.Project_Name ?? "").toLowerCase();
        const code = String(survey?.survey_id ?? survey?.Project_code ?? "").toLowerCase();
        return name.includes(search) || code.includes(search);
      })
    : surveys;

  const page = Math.max(1, Number(options.page) || 1);
  const limit = Math.max(1, Number(options.limit) || 10);
  const total = filtered.length;
  const start = (page - 1) * limit;
  const pageItems = filtered.slice(start, start + limit);

  return {
    success: true,
    total,
    count: total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit) || 1),
    items: pageItems.map((survey) => mapSurveyToRow(survey)),
  };
}

/** POST /api/survey/add/:groupProjectId */
export async function createGroupSurveyProject(groupId, form) {
  return createSurveyUnderGroup(groupId, form);
}
