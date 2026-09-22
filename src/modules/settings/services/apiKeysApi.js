import { API_ROUTES } from "../../../config/api";
import { ApiError } from "../../../services/api/ApiError";
import { apiRequest } from "../../../services/api/client";
import { formatAppDateTime } from "../../shared/utils/dateTime";
import { appendListQuery } from "../../shared/utils/listQueryParams";
import { toUiSentenceCase } from "../../shared/utils/uiText";

function assertSuccess(data) {
  if (
    data &&
    typeof data === "object" &&
    "success" in data &&
    data.success !== true &&
    data.success !== "true" &&
    data.success !== 1
  ) {
    throw new ApiError(data?.message ?? "Unable to manage API keys.", data);
  }
  return data;
}

function normalizeStatus(value) {
  const raw = String(value ?? "").trim().toLowerCase();
  if (raw === "inactive" || raw === "disabled" || raw === "0" || raw === "false") {
    return "inactive";
  }
  return "active";
}

function normalizeAuthType(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "Bearer";
  const key = raw.toLowerCase().replace(/[\s_-]+/g, "");
  if (key === "bearertoken" || key === "bearer") return "Bearer";
  if (key === "apikey" || key === "key") return "API Key";
  if (key === "basicauth" || key === "basic") return "Basic";
  if (key === "customheader" || key === "custom") return "Custom Header";
  if (key === "none") return "None";
  return raw;
}

function formatStatusLabel(value) {
  return toUiSentenceCase(normalizeStatus(value));
}

/** True when the value looks like a masked secret from the API (e.g. ***************3456). */
export function isMaskedApiKey(value) {
  const text = String(value ?? "").trim();
  if (!text) return false;
  return /^\*+$/.test(text) || /^\*+\w*$/.test(text) || /^[•]+/.test(text);
}

export function mapApiKeyRecord(record) {
  if (!record || typeof record !== "object") return null;
  const apiKey = String(record.api_key ?? record.apiKey ?? "");
  const createdAt = record.created_at ?? record.createdAt ?? null;
  const updatedAt = record.updated_at ?? record.updatedAt ?? null;
  return {
    id: record.id ?? null,
    apiName: String(record.api_name ?? record.apiName ?? "").trim(),
    apiLabel: String(record.api_label ?? record.apiLabel ?? "").trim(),
    apiUserId: String(record.api_user_id ?? record.apiUserId ?? "").trim(),
    apiKey,
    apiKeyMasked: isMaskedApiKey(apiKey) || Boolean(apiKey),
    apiKeyDisplay: isMaskedApiKey(apiKey)
      ? apiKey
      : apiKey
        ? `${"*".repeat(Math.max(12, apiKey.length - 4))}${apiKey.slice(-4)}`
        : "—",
    baseUrl: String(record.base_url ?? record.baseUrl ?? "").trim(),
    endpoint: String(record.endpoint ?? "").trim(),
    method: String(record.method ?? "GET").trim().toUpperCase() || "GET",
    authType: normalizeAuthType(record.auth_type ?? record.authType),
    headerName: String(record.header_name ?? record.headerName ?? "").trim(),
    description: String(record.description ?? "").trim(),
    status: normalizeStatus(record.status),
    statusLabel: formatStatusLabel(record.status),
    createdAt,
    updatedAt,
    createdAtLabel: formatAppDateTime(createdAt),
    updatedAtLabel: formatAppDateTime(updatedAt),
  };
}

/**
 * Builds POST/PUT body for /api/api-keys.
 * Omits api_key on update when blank or still masked — never send ***************3456.
 */
export function buildApiKeyPayload(form, { isEdit = false } = {}) {
  const apiKey = String(form.apiKey ?? "").trim();
  const includeKey = Boolean(apiKey) && !isMaskedApiKey(apiKey);

  const payload = {
    api_name: String(form.apiName ?? "").trim(),
    api_label: String(form.apiLabel ?? "").trim(),
    api_user_id: String(form.apiUserId ?? "").trim(),
    base_url: String(form.baseUrl ?? "").trim(),
    endpoint: String(form.endpoint ?? "").trim(),
    method: String(form.method ?? "GET").trim().toUpperCase(),
    auth_type: normalizeAuthType(form.authType),
    header_name: String(form.headerName ?? "").trim(),
    status: normalizeStatus(form.status),
    description: String(form.description ?? "").trim(),
  };

  if (!isEdit || includeKey) {
    if (!isEdit && !includeKey) {
      throw new ApiError("API Key is required.");
    }
    if (includeKey) {
      payload.api_key = apiKey;
    }
  }

  return payload;
}

/** GET /api/api-keys/list */
export async function fetchApiKeysList({ page = 1, limit = 10, search } = {}) {
  const path = appendListQuery(API_ROUTES.apiKeys.list, { page, limit, search });
  const data = await apiRequest(path);
  assertSuccess(data);

  const rows = Array.isArray(data?.data) ? data.data : [];
  const total = Number(data?.total);
  const resolvedPage = Number(data?.page) || page;
  const resolvedLimit = Number(data?.limit) || limit;
  const totalPages =
    Number(data?.totalPages) ||
    Math.max(1, Math.ceil((Number.isFinite(total) ? total : rows.length) / resolvedLimit));

  return {
    items: rows.map(mapApiKeyRecord).filter(Boolean),
    total: Number.isFinite(total) ? total : rows.length,
    page: resolvedPage,
    limit: resolvedLimit,
    totalPages,
  };
}

/** GET /api/api-keys/:id */
export async function fetchApiKeyById(id) {
  const normalizedId = String(id ?? "").trim();
  if (!normalizedId) {
    throw new ApiError("API key id is required.");
  }
  const data = await apiRequest(API_ROUTES.apiKeys.byId(normalizedId));
  assertSuccess(data);
  const mapped = mapApiKeyRecord(data?.data);
  if (!mapped) {
    throw new ApiError("API configuration not found.", data);
  }
  return mapped;
}

/** POST /api/api-keys */
export async function createApiKey(form) {
  const body = buildApiKeyPayload(form, { isEdit: false });
  const data = await apiRequest(API_ROUTES.apiKeys.create, {
    method: "POST",
    body,
  });
  return assertSuccess(data);
}

/** PUT /api/api-keys/update/:id */
export async function updateApiKey(id, form) {
  const normalizedId = String(id ?? "").trim();
  if (!normalizedId) {
    throw new ApiError("API key id is required.");
  }
  const body = buildApiKeyPayload(form, { isEdit: true });
  const data = await apiRequest(API_ROUTES.apiKeys.update(normalizedId), {
    method: "PUT",
    body,
  });
  return assertSuccess(data);
}

/** DELETE /api/api-keys/delete/:id */
export async function deleteApiKey(id) {
  const normalizedId = String(id ?? "").trim();
  if (!normalizedId) {
    throw new ApiError("API key id is required.");
  }
  const data = await apiRequest(API_ROUTES.apiKeys.delete(normalizedId), {
    method: "DELETE",
  });
  return assertSuccess(data);
}

/** Aliases matching common service naming. */
export const getApiKeys = fetchApiKeysList;
export const getApiKeyById = fetchApiKeyById;
