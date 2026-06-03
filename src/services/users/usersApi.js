import { apiRequest } from "../api/client";
import { ApiError } from "../api/ApiError";

function assertSuccess(data, fallbackMessage) {
  if (data?.success !== true) {
    throw new ApiError(data?.message || fallbackMessage, data);
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
  return String(status ?? "").toLowerCase() === "inactive" ? "Inactive" : "Active";
}

export function formatAdminStatusLabel(status) {
  const normalized = String(status ?? "").toLowerCase();
  if (normalized === "inactive") return "Inactive";
  if (normalized === "active") return "Active";
  return status ? String(status) : "-";
}

export function formStatusToApiStatus(status) {
  return status === "Inactive" ? "inactive" : "active";
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
    permission_type: admin?.permission_type ?? "admin",
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
    permission_type: admin?.permission_type ?? "admin",
  };
}

/** GET /api/admin/all — full admin list for listing page only */
export async function getRecords() {
  const data = await apiRequest("/api/admin/all");
  assertSuccess(data, "Failed to load users");

  const admins = Array.isArray(data.admins) ? data.admins : [];

  return {
    ...data,
    count: data.count ?? admins.length,
    items: admins.map((admin) => mapAdminToUserRow(admin)),
  };
}

/** GET /api/admin/:id — single admin for edit/details only (not for listing) */
export async function getRecord(id) {
  const data = await apiRequest(`/api/admin/${id}`);
  assertSuccess(data, "Failed to load user");
  if (!data.admin) {
    throw new ApiError(data?.message || "Failed to load user", data);
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
 *   status: string
 * }} payload
 */
export async function createUser(payload) {
  const data = await apiRequest("/api/admin/add-user", {
    method: "POST",
    body: {
      name: payload.name.trim(),
      email: payload.email.trim(),
      password: payload.password,
      contact_no: payload.contact_no?.trim() ?? "",
      permission_type: payload.permission_type ?? "admin",
      status: payload.status,
    },
  });

  return assertSuccess(data, "Failed to create user");
}

/**
 * @param {string|number} id
 * @param {{ name: string, permission_type: string, status: string }} payload
 */
export async function updateRecord(id, payload) {
  const data = await apiRequest(`/api/admin/updateadmin/${id}`, {
    method: "PUT",
    body: {
      name: payload.name.trim(),
      permission_type: payload.permission_type,
      status: payload.status,
    },
  });

  return assertSuccess(data, "Failed to update user");
}

export async function deleteRecord(id) {
  const data = await apiRequest(`/api/admin/delete/${id}`, {
    method: "DELETE",
  });

  return assertSuccess(data, "Failed to delete user");
}
