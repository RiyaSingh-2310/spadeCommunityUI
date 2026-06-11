import { API_ROUTES } from "../../config/api";
import { extractListTotalFromResponse } from "../../modules/shared/utils/listResponse";
import { resolveMediaUrl, splitFullName } from "../../modules/shared/utils/userAvatar";
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

function normalizeSalesManagerId(id) {
  const normalizedId = String(id ?? "").trim();
  if (!normalizedId || normalizedId === "undefined" || normalizedId === "null") {
    throw new ApiError("", null);
  }
  return encodeURIComponent(normalizedId);
}

function extractSalesManagersList(data) {
  if (!data || typeof data !== "object") return [];
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.salesManagers)) return data.salesManagers;
  return [];
}

function extractSalesManagerRecord(data) {
  if (!data || typeof data !== "object") return null;
  if (data.data && typeof data.data === "object" && !Array.isArray(data.data)) {
    return data.data;
  }
  if (data.salesManager && typeof data.salesManager === "object") {
    return data.salesManager;
  }
  if (data.id != null) return data;
  return null;
}

/**
 * @param {object} salesManager
 */
export function mapSalesManagerToRow(salesManager) {
  const { firstName, lastName } = splitFullName(salesManager?.name);
  const imageUrl = resolveMediaUrl(
    salesManager?.image_url ??
      salesManager?.profile_image ??
      salesManager?.imageUrl ??
      null
  );

  return {
    id: salesManager?.id,
    code: salesManager?.code ?? "",
    name: salesManager?.name ?? "",
    firstName,
    lastName,
    emailAddress: salesManager?.email ?? "",
    image: imageUrl || undefined,
    imageUrl,
    profile_image: imageUrl || undefined,
    status: apiStatusToFormValue(salesManager?.status),
    createdAt: salesManager?.created_at ?? "",
  };
}

/**
 * @param {object} salesManager
 */
export function mapSalesManagerToForm(salesManager) {
  return {
    name: salesManager?.name ?? "",
    email: salesManager?.email ?? "",
    password: "",
    confirmPassword: "",
    status: apiStatusToFormValue(salesManager?.status),
  };
}

/** GET /api/salesmanager/:id */
export async function getRecord(id) {
  const normalizedId = normalizeSalesManagerId(id);
  const data = await apiRequest(API_ROUTES.salesManagers.byId(normalizedId));
  assertSuccess(data);

  const salesManager = extractSalesManagerRecord(data);
  if (!salesManager) {
    throw new ApiError(data?.message ?? "", data);
  }

  return salesManager;
}

/** GET /api/salesmanager/list */
export async function getRecords() {
  const data = await apiRequest(API_ROUTES.salesManagers.list);
  assertSuccess(data);

  const salesManagers = extractSalesManagersList(data);
  const total = extractListTotalFromResponse(data, salesManagers.length);

  return {
    ...data,
    total,
    count: total,
    items: salesManagers.map((salesManager) => mapSalesManagerToRow(salesManager)),
  };
}

/**
 * POST /api/salesmanager
 * @param {{
 *   name: string,
 *   email: string,
 *   password: string,
 *   confirmPassword: string,
 *   profileImage?: File | null,
 * }} payload
 */
export async function createSalesManager(payload) {
  const body = new FormData();
  body.append("name", payload.name.trim());
  body.append("email", payload.email.trim());
  body.append("password", payload.password);
  body.append(
    "confirm_password",
    String(payload.confirmPassword ?? payload.password ?? "")
  );

  if (payload.profileImage instanceof File) {
    body.append("profile_image", payload.profileImage);
  }

  const data = await apiRequest(API_ROUTES.salesManagers.create, {
    method: "POST",
    body,
  });

  return assertSuccess(data);
}

/**
 * PATCH /api/salesmanager/status/:id — status toggle from listing table.
 * @param {string|number} id
 * @param {{ status: string }} payload
 */
export async function updateSalesManagerStatus(id, { status }) {
  const normalizedId = normalizeSalesManagerId(id);
  const data = await apiRequest(API_ROUTES.salesManagers.updateStatus(normalizedId), {
    method: "PATCH",
    body: {
      status: formValueToApiStatus(status),
    },
  });

  return assertSuccess(data);
}

/**
 * PUT /api/salesmanager/:id
 * @param {string|number} id
 * @param {{
 *   name: string,
 *   email: string,
 *   status: string,
 *   profileImage?: File | null,
 * }} payload
 */
export async function updateSalesManager(id, payload) {
  const normalizedId = normalizeSalesManagerId(id);
  const hasFile = payload.profileImage instanceof File;

  if (hasFile) {
    const body = new FormData();
    body.append("name", payload.name.trim());
    body.append("email", payload.email.trim());
    body.append("status", formValueToApiStatus(payload.status));
    body.append("profile_image", payload.profileImage);

    const data = await apiRequest(API_ROUTES.salesManagers.update(normalizedId), {
      method: "PUT",
      body,
    });

    return assertSuccess(data);
  }

  const data = await apiRequest(API_ROUTES.salesManagers.update(normalizedId), {
    method: "PUT",
    body: {
      name: payload.name.trim(),
      email: payload.email.trim(),
      status: formValueToApiStatus(payload.status),
    },
  });

  return assertSuccess(data);
}

/** DELETE /api/salesmanager/:id */
export async function deleteSalesManager(id) {
  const normalizedId = normalizeSalesManagerId(id);
  const data = await apiRequest(API_ROUTES.salesManagers.delete(normalizedId), {
    method: "DELETE",
  });

  return assertSuccess(data);
}
