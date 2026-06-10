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

function extractSalesManagersList(data) {
  if (!data || typeof data !== "object") return [];
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.salesManagers)) return data.salesManagers;
  return [];
}

/**
 * @param {object} salesManager
 */
export function mapSalesManagerToRow(salesManager) {
  return {
    id: salesManager?.id,
    code: salesManager?.code ?? "",
    name: salesManager?.name ?? "",
    emailAddress: salesManager?.email ?? "",
    image: salesManager?.image_url ?? salesManager?.profile_image ?? "",
    status: apiStatusToFormValue(salesManager?.status),
    createdAt: salesManager?.created_at ?? "",
  };
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
  body.append("confirm_password", payload.confirmPassword);

  if (payload.profileImage instanceof File) {
    body.append("profile_image", payload.profileImage);
  }

  const data = await apiRequest(API_ROUTES.salesManagers.create, {
    method: "POST",
    body,
  });

  return assertSuccess(data);
}
