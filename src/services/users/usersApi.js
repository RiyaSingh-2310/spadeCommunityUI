import { API_ROUTES } from "../../config/api";
import { apiRequest } from "../api/client";
import { ApiError } from "../api/ApiError";
import {
  buildPermissionsPayload,
  normalizePermissions,
} from "../../modules/permissions/permissionsUtils";
import {
  apiStatusToFormValue,
  formValueToApiStatus,
  formatStatusLabel,
} from "../../modules/shared/utils/statusLabels";

function assertSuccess(data) {
  if (data?.success !== true) {
    throw new ApiError(data?.message ?? "", data);
  }
  return data;
}

function splitNameParts(name) {
  const parts = String(name ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

export function apiStatusToFormStatus(status) {
  return apiStatusToFormValue(status);
}

export function formatAdminStatusLabel(status) {
  return formatStatusLabel(status);
}

export function formStatusToApiStatus(status) {
  return formValueToApiStatus(status);
}

/**
 * Maps GET /api/admin/all (or /api/admin/:id) admin object to table row.
 * @param {object} admin
 */
export function mapAdminToUserRow(admin) {
  const { firstName, lastName } = splitNameParts(admin?.name);
  const imageUrl = admin?.image_url ?? null;

  return {
    id: admin?.id,
    name: admin?.name ?? "",
    firstName,
    lastName,
    email: admin?.email ?? "",
    emailAddress: admin?.email ?? "",
    status: apiStatusToFormStatus(admin?.status),
    statusLabel: formatAdminStatusLabel(admin?.status),
    image: imageUrl || undefined,
    imageUrl,
    permission_type: admin?.permission_type ?? "user",
    permissions: normalizePermissions(admin?.permissions),
    contact_no: admin?.contact_no ?? "",
    login_count: admin?.login_count ?? 0,
  };
}

export function mapAdminToForm(admin) {
  return {
    name: admin?.name ?? "",
    email: admin?.email ?? "",
    password: "",
    confirmPassword: "",
    status: apiStatusToFormStatus(admin?.status),
    permission_type: admin?.permission_type ?? "user",
    permissions: normalizePermissions(admin?.permissions),
  };
}

/** GET /api/admin/all — full admin list for listing page only */
export async function getRecords() {
  const data = await apiRequest(API_ROUTES.admin.all);
  assertSuccess(data);

  const admins = Array.isArray(data.admins) ? data.admins : [];

  return {
    ...data,
    count: data.count ?? admins.length,
    items: admins.map((admin) => mapAdminToUserRow(admin)),
  };
}

/** GET /api/admin/:id — single admin for edit/details only (not for listing) */
export async function getRecord(id) {
  const data = await apiRequest(API_ROUTES.admin.byId(id));
  assertSuccess(data);
  if (!data.admin) {
    throw new ApiError(data?.message ?? "", data);
  }
  return data.admin;
}

/**
 * @param {{
 *   name: string,
 *   email: string,
 *   password: string,
 *   contact_no?: string,
 *   permission_type?: string,
 *   status: string,
 *   permissions?: object
 * }} payload
 */
export async function createUser(payload) {
  const body = {
    name: payload.name.trim(),
    email: payload.email.trim(),
    password: payload.password,
    contact_no: payload.contact_no?.trim() ?? "",
    permission_type: payload.permission_type ?? "user",
    status: payload.status,
    ...buildPermissionsPayload(payload.permissions),
  };

  const data = await apiRequest(API_ROUTES.admin.create, {
    method: "POST",
    body,
  });

  return assertSuccess(data);
}

/**
 * @param {string|number} id
 * @param {{
 *   name: string,
 *   permission_type?: string,
 *   status: string,
 *   permissions?: object
 * }} payload
 */
export async function updateRecord(id, payload) {
  const body = {
    name: payload.name.trim(),
    permission_type: payload.permission_type ?? "user",
    status: payload.status,
    ...buildPermissionsPayload(payload.permissions),
  };

  const data = await apiRequest(API_ROUTES.admin.update(id), {
    method: "PUT",
    body,
  });

  return assertSuccess(data);
}

/**
 * PUT /api/admin/permissions/:id
 * @param {string|number} id
 * @param {object} permissions
 */
export async function updatePermissions(id, permissions) {
  const data = await apiRequest(API_ROUTES.admin.updatePermissions(id), {
    method: "PUT",
    body: buildPermissionsPayload(permissions),
  });

  return assertSuccess(data);
}

export async function deleteRecord(id) {
  const data = await apiRequest(API_ROUTES.admin.delete(id), {
    method: "DELETE",
  });

  return assertSuccess(data);
}
