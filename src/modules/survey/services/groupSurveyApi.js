import { API_ROUTES } from "../../../config/api";
import { extractListTotalFromResponse } from "../../shared/utils/listResponse";
import {
  apiStatusToFormValue,
  formValueToApiStatus,
} from "../../shared/utils/statusLabels";
import { apiRequest } from "../../../services/api/client";
import { ApiError } from "../../../services/api/ApiError";
import { appendListQuery } from "../../shared/utils/listQueryParams";
import { createSurvey, getRecords as getSurveyRecords } from "./surveyApi";

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

function resolveClientIdsFromForm(form) {
  if (form.clientId != null && String(form.clientId).trim() !== "") {
    const singleId = Number(String(form.clientId).trim());
    return Number.isFinite(singleId) ? [singleId] : [];
  }

  return (form.clientIds ?? [])
    .map((id) => Number(String(id).trim()))
    .filter((id) => Number.isFinite(id));
}

function buildGroupProjectPayload(form) {
  return {
    project_name: String(form.projectName ?? "").trim(),
    description: String(form.description ?? ""),
    notes: String(form.notes ?? ""),
    client_ids: resolveClientIdsFromForm(form),
  };
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
    clientName: project?.client_names ?? "",
    projectName: project?.project_name ?? "",
    groupProject: project?.project_name ?? "",
    status: apiStatusToFormValue(project?.status),
    createdAt: project?.created_at ?? "",
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
    clientIds,
  };
}

export function createEmptyGroupProjectForm() {
  return {
    projectName: "",
    description: "",
    notes: "",
    clientId: "",
    clientIds: [],
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
    body: buildGroupProjectPayload(form),
  });

  return assertSuccess(data);
}

/** PUT /api/survey/groupproject/:id */
export async function updateGroupProject(id, form) {
  const normalizedId = normalizeGroupProjectId(id);
  const data = await apiRequest(API_ROUTES.groupSurvey.update(normalizedId), {
    method: "PUT",
    body: buildGroupProjectPayload(form),
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

/** GET /api/survey/list?group_project_id=:id */
export async function getGroupProjectSurveys(groupProjectId, options = {}) {
  return getSurveyRecords({
    ...options,
    groupProjectId,
  });
}

/** POST /api/survey/add — creates a survey under a group project */
export async function createGroupSurveyProject(groupId, form) {
  return createSurvey({
    ...form,
    groupProjectId: groupId,
  });
}
