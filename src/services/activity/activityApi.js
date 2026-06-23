import { API_ROUTES } from "../../config/api";
import { extractListTotalFromResponse } from "../../modules/shared/utils/listResponse";
import { appendListQuery } from "../../modules/shared/utils/listQueryParams";
import {
  formatActivityLogDate,
  formatAuditLogDate,
} from "../../modules/shared/utils/dateTime";
import { sortListingRowsByIdAsc } from "../../modules/shared/utils/listingSort";
import { apiRequest } from "../api/client";
import { ApiError } from "../api/ApiError";

export { formatActivityLogDate, formatAuditLogDate };

function assertSuccess(data) {
  if (data?.success !== true) {
    throw new ApiError(data?.message ?? "", data);
  }
  return data;
}

function normalizeActivityId(id) {
  const normalizedId = String(id ?? "").trim();
  if (!normalizedId || normalizedId === "undefined" || normalizedId === "null") {
    throw new ApiError("Invalid activity id.", null);
  }
  return encodeURIComponent(normalizedId);
}

function extractActivityList(data) {
  if (!data || typeof data !== "object") return [];
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.activities)) return data.activities;
  return [];
}

function formatActionLabel(activity) {
  const description = String(activity?.description ?? "").trim();
  if (description) return description;

  const action = String(activity?.action ?? "").trim().toUpperCase();
  const module = String(activity?.module ?? "").trim();

  const labels = {
    LOGIN: "Login",
    LOGOUT: "Logout",
    CREATE: module ? `Create ${module}` : "Create",
    UPDATE: module ? `Update ${module}` : "Update",
    DELETE: module ? `Delete ${module}` : "Delete",
    STATUS_CHANGED: module ? `Status Changed (${module})` : "Status Changed",
  };

  if (labels[action]) return labels[action];
  if (action && module) return `${action} ${module}`;
  return action || module || "—";
}

export function formatActivityNameDisplay(activity) {
  const name = String(activity?.name ?? activity?.admin_name ?? activity?.adminName ?? "").trim();
  const description = String(activity?.description ?? "").trim();

  if (!name && !description) return "—";
  if (!description || description === "—") return name || "—";
  if (!name || name === "—") return description;
  return `${name} - ${description}`;
}

export function resolveActivityStatus(activity) {
  const explicit = String(
    activity?.status ?? activity?.result ?? activity?.state ?? ""
  ).trim();

  if (explicit) {
    const normalized = explicit.toLowerCase();
    if (normalized.includes("fail") || normalized.includes("error")) {
      return "Failed";
    }
    if (normalized.includes("pending") || normalized.includes("progress")) {
      return "Pending";
    }
    if (normalized.includes("success") || normalized.includes("complete")) {
      return "Success";
    }
    return explicit.charAt(0).toUpperCase() + explicit.slice(1).toLowerCase();
  }

  const action = String(activity?.action ?? "").toUpperCase();
  const description = String(activity?.description ?? "").toUpperCase();

  if (
    action.includes("FAIL") ||
    description.includes("FAIL") ||
    description.includes("ERROR")
  ) {
    return "Failed";
  }

  if (action.includes("PENDING") || description.includes("PENDING")) {
    return "Pending";
  }

  return "Success";
}

export function mapActivityToRow(activity) {
  const createdAt = activity?.created_at ?? activity?.createdAt;
  const description = String(activity?.description ?? "").trim();

  return {
    id: activity?.id,
    name: activity?.admin_name ?? activity?.adminName ?? "—",
    email: activity?.admin_email ?? activity?.adminEmail ?? "—",
    description: description || formatActionLabel(activity) || "—",
    nameDisplay: formatActivityNameDisplay({
      name: activity?.admin_name ?? activity?.adminName ?? "—",
      description: description || formatActionLabel(activity) || "—",
    }),
    logDate: formatActivityLogDate(createdAt),
    action: formatActionLabel(activity),
    admin: activity?.admin_name ?? activity?.adminName ?? "—",
    module: activity?.module ?? "—",
    status: resolveActivityStatus(activity),
    auditLogDate: formatAuditLogDate(createdAt),
    createdAt: formatAuditLogDate(createdAt),
  };
}

/** GET /api/activity/list */
export async function getRecords({ page, limit, search } = {}) {
  const data = await apiRequest(
    appendListQuery(API_ROUTES.activity.list, { page, limit, search })
  );
  assertSuccess(data);

  const activities = extractActivityList(data);
  const total = extractListTotalFromResponse(data, activities.length);
  const items = sortListingRowsByIdAsc(
    activities.map((activity) => mapActivityToRow(activity))
  );

  return {
    ...data,
    total,
    count: total,
    items,
  };
}

/** DELETE /api/activity/:id */
export async function deleteRecord(id) {
  const normalizedId = normalizeActivityId(id);
  const data = await apiRequest(API_ROUTES.activity.delete(normalizedId), {
    method: "DELETE",
  });

  return assertSuccess(data);
}
