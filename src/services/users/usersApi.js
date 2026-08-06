import { API_ROUTES } from "../../config/api";
import { apiRequest } from "../api/client";
import { downloadCsvExport } from "../api/csvExport";
import { ApiError } from "../api/ApiError";
import {
  buildPermissionsPayload,
  resolvePermissionsFromRecord,
} from "../../modules/permissions/permissionsUtils";
import {
  apiStatusToFormValue,
  formValueToApiStatus,
  formatStatusLabel,
} from "../../modules/shared/utils/statusLabels";
import { extractListTotalFromResponse } from "../../modules/shared/utils/listResponse";
import { appendListQuery } from "../../modules/shared/utils/listQueryParams";
import { resolveProfileImageUrl } from "../../modules/shared/utils/userAvatar";
import { encryptValue } from "../../modules/shared/utils/encryption";

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

function resolveAdminId(admin) {
  if (!admin || typeof admin !== "object") return undefined;
  return admin.id ?? admin.admin_id ?? admin.user_id ?? admin.userId;
}

function looksLikeAdminRecord(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return (
    resolveAdminId(value) != null ||
    typeof value.email === "string" ||
    typeof value.name === "string"
  );
}

/**
 * Extracts a single admin/user record from GET-by-id (and similar) payloads.
 * @param {object | null | undefined} data
 */
export function extractAdminFromResponse(data) {
  if (!data || typeof data !== "object") return null;

  const nested = data.data && typeof data.data === "object" ? data.data : null;

  const candidates = [
    data.admin,
    data.user,
    data.adminUser,
    nested?.admin,
    nested?.user,
    nested?.adminUser,
    looksLikeAdminRecord(nested) ? nested : null,
    looksLikeAdminRecord(data) ? data : null,
  ];

  for (const candidate of candidates) {
    if (looksLikeAdminRecord(candidate)) {
      return candidate;
    }
  }

  return null;
}

function extractAdminsList(data) {
  if (!data || typeof data !== "object") return [];

  const nested = data.data && typeof data.data === "object" ? data.data : null;

  const list =
    data.admins ??
    data.users ??
    nested?.admins ??
    nested?.users ??
    (Array.isArray(data.data) ? data.data : null) ??
    (Array.isArray(data) ? data : null);

  return Array.isArray(list) ? list : [];
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

function resolveAdminPermissions(admin) {
  return resolvePermissionsFromRecord(admin);
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
  const imageUrl = resolveProfileImageUrl(admin);

  return {
    id: resolveAdminId(admin),
    name: admin?.name ?? "",
    firstName,
    lastName,
    email: admin?.email ?? "",
    emailAddress: admin?.email ?? "",
    status: apiStatusToFormStatus(admin?.status),
    statusLabel: formatAdminStatusLabel(admin?.status),
    image: imageUrl || undefined,
    imageUrl,
    permission_type: admin?.permission_type ?? admin?.permissionType ?? "user",
    permissions: resolveAdminPermissions(admin),
    contact_no: admin?.contact_no ?? admin?.contactNo ?? "",
    login_count: admin?.login_count ?? admin?.loginCount ?? 0,
  };
}

export function mapAdminToForm(admin) {
  return {
    name: admin?.name ?? "",
    email: admin?.email ?? "",
    password: "",
    confirmPassword: "",
    status: apiStatusToFormStatus(admin?.status),
    permission_type: admin?.permission_type ?? admin?.permissionType ?? "user",
    permissions: resolveAdminPermissions(admin),
  };
}

/**
 * GET /api/admin/all — paginated admin list for listing page.
 * @param {{ page?: number, limit?: number, search?: string }} [options]
 */
export async function getRecords({ page = 1, limit = 10, search } = {}) {
  const data = await apiRequest(
    appendListQuery(API_ROUTES.admin.all, { page, limit, search })
  );
  assertSuccess(data);

  const admins = extractAdminsList(data);
  const total = extractListTotalFromResponse(data, admins.length);

  return {
    ...data,
    total,
    count: total,
    page: Number(data.page) || page,
    limit: Number(data.limit) || limit,
    items: admins.map((admin) => mapAdminToUserRow(admin)),
  };
}

/** GET /api/admin/:id — single admin for edit/details only (not for listing) */
export async function getRecord(id) {
  const normalizedId = String(id ?? "").trim();
  if (!normalizedId || normalizedId === "undefined" || normalizedId === "null") {
    throw new ApiError("Invalid user id.");
  }

  const data = await apiRequest(API_ROUTES.admin.byId(normalizedId));
  const admin = extractAdminFromResponse(data);

  if (!admin) {
    if (!isApiSuccess(data)) {
      throw new ApiError(data?.message ?? "", data);
    }
    throw new ApiError(data?.message ?? "User not found.", data);
  }

  return admin;
}

/**
 * @param {{
 *   name: string,
 *   email: string,
 *   password: string,
 *   confirmPassword?: string,
 *   contact_no?: string,
 *   imageFile?: File | null,
 *   permission_type?: string,
 *   status: string,
 *   permissions?: object
 * }} payload
 */
export async function createUser(payload) {
  const body = new FormData();
  body.append("name", payload.name.trim());
  body.append("email", payload.email.trim());
  body.append("password", encryptValue(payload.password));

  const contactNo = payload.contact_no?.trim() ?? "";
  if (contactNo) {
    body.append("contact_no", contactNo);
    body.append("contact-no", contactNo);
  }

  body.append("permission_type", payload.permission_type ?? "user");
  body.append("status", payload.status);

  const permissionPayload = buildPermissionsPayload(payload.permissions);
  body.append("permissions", JSON.stringify(permissionPayload.permissions));

  if (payload.imageFile instanceof File) {
    body.append("image", payload.imageFile);
  }

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
 *   password?: string,
 *   confirmPassword?: string,
 *   imageFile?: File | null,
 * }} payload
 */
export async function updateRecord(id, payload) {
  const body = new FormData();
  body.append("name", payload.name.trim());
  body.append("permission_type", payload.permission_type ?? "user");
  body.append("status", payload.status);

  const permissionPayload = buildPermissionsPayload(payload.permissions);
  body.append("permissions", JSON.stringify(permissionPayload.permissions));

  if (payload.password?.trim()) {
    body.append("password", encryptValue(payload.password));
  }

  if (payload.imageFile instanceof File) {
    body.append("image", payload.imageFile);
  }

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

/** GET /api/admin/export/csv */
export async function exportAdminUsersCsv() {
  return downloadCsvExport(API_ROUTES.admin.exportCsv, {
    defaultFilename: "admin-users.csv",
  });
}
