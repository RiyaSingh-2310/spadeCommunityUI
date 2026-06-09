import { API_ROUTES } from "../../config/api";
import { extractListTotalFromResponse } from "../../modules/shared/utils/listResponse";
import { apiStatusToFormValue } from "../../modules/shared/utils/statusLabels";
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

function extractProjectManagersList(data) {
  if (!data || typeof data !== "object") return [];
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.projectManagers)) return data.projectManagers;
  return [];
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
