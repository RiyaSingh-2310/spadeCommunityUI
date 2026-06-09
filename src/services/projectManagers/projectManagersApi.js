import { API_ROUTES } from "../../config/api";
import { extractListTotalFromResponse } from "../../modules/shared/utils/listResponse";
import {
  apiStatusToFormValue,
  formValueToApiStatus,
} from "../../modules/shared/utils/statusLabels";
import { apiRequest } from "../api/client";
import { ApiError } from "../api/ApiError";

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

function normalizeProjectManagerId(id) {
  const normalizedId = String(id ?? "").trim();
  if (!normalizedId || normalizedId === "undefined" || normalizedId === "null") {
    throw new ApiError("", null);
  }
  return encodeURIComponent(normalizedId);
}

function extractProjectManagersList(data) {
  if (!data || typeof data !== "object") return [];
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.projectManagers)) return data.projectManagers;
  return [];
}

function extractProjectManagerRecord(data) {
  if (!data || typeof data !== "object") return null;
  if (data.data && typeof data.data === "object" && !Array.isArray(data.data)) {
    return data.data;
  }
  if (data.projectManager && typeof data.projectManager === "object") {
    return data.projectManager;
  }
  if (data.id != null) return data;
  return null;
}

/**
 * @param {object} projectManager
 */
export function mapProjectManagerToRow(projectManager) {
  return {
    id: projectManager?.id,
    code: projectManager?.code ?? "",
    name: projectManager?.name ?? "",
    emailAddress: projectManager?.email ?? "",
    image: projectManager?.profile_image ?? "",
    status: apiStatusToFormValue(projectManager?.status),
    createdAt: projectManager?.created_at ?? "",
  };
}

/**
 * @param {object} projectManager
 */
export function mapProjectManagerToForm(projectManager) {
  return {
    name: projectManager?.name ?? "",
    email: projectManager?.email ?? "",
    password: "",
    confirmPassword: "",
    status: apiStatusToFormValue(projectManager?.status),
  };
}

export function formStatusToApiStatus(status) {
  return formValueToApiStatus(status);
}

/** GET /api/projectmanager/list */
export async function getRecords() {
  const data = await apiRequest(API_ROUTES.projectManagers.list);
  assertSuccess(data);

  const projectManagers = extractProjectManagersList(data);
  const total = extractListTotalFromResponse(data, projectManagers.length);

  return {
    ...data,
    total,
    count: total,
    items: projectManagers.map((projectManager) => mapProjectManagerToRow(projectManager)),
  };
}

/** GET /api/projectmanager/:id */
export async function getRecord(id) {
  const normalizedId = normalizeProjectManagerId(id);
  const data = await apiRequest(API_ROUTES.projectManagers.byId(normalizedId));
  assertSuccess(data);

  const projectManager = extractProjectManagerRecord(data);
  if (!projectManager) {
    throw new ApiError(data?.message ?? "", data);
  }

  return projectManager;
}

/**
 * POST /api/projectmanager/add
 * @param {{
 *   name: string,
 *   email: string,
 *   password: string,
 *   confirmPassword: string,
 *   profileImage?: File | null,
 * }} payload
 */
export async function createProjectManager(payload) {
  const body = new FormData();
  body.append("name", payload.name.trim());
  body.append("email", payload.email.trim());
  body.append("password", payload.password);
  body.append("confirm_password", payload.confirmPassword);

  if (payload.profileImage instanceof File) {
    body.append("profile_image", payload.profileImage);
  }

  const data = await apiRequest(API_ROUTES.projectManagers.create, {
    method: "POST",
    body,
  });

  return assertSuccess(data);
}

/**
 * PUT /api/projectmanager/:id — status toggle from listing table.
 * @param {string|number} id
 * @param {{ name: string, status: string }} payload
 */
export async function updateProjectManagerStatus(id, { name, status }) {
  const normalizedId = normalizeProjectManagerId(id);
  const data = await apiRequest(API_ROUTES.projectManagers.update(normalizedId), {
    method: "PUT",
    body: {
      name: String(name ?? "").trim(),
      status: formValueToApiStatus(status),
    },
  });

  return assertSuccess(data);
}

/**
 * PUT /api/projectmanager/:id
 * @param {string|number} id
 * @param {{
 *   name: string,
 *   email: string,
 *   status: string,
 *   profileImage?: File | null,
 * }} payload
 */
export async function updateProjectManager(id, payload) {
  const normalizedId = normalizeProjectManagerId(id);
  const hasFile = payload.profileImage instanceof File;

  if (hasFile) {
    const body = new FormData();
    body.append("name", payload.name.trim());
    body.append("email", payload.email.trim());
    body.append("status", formValueToApiStatus(payload.status));
    body.append("profile_image", payload.profileImage);

    const data = await apiRequest(API_ROUTES.projectManagers.update(normalizedId), {
      method: "PUT",
      body,
    });

    return assertSuccess(data);
  }

  const data = await apiRequest(API_ROUTES.projectManagers.update(normalizedId), {
    method: "PUT",
    body: {
      name: payload.name.trim(),
      email: payload.email.trim(),
      status: formValueToApiStatus(payload.status),
    },
  });

  return assertSuccess(data);
}
