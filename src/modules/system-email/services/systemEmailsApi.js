import { API_ROUTES } from "../../../config/api";
import { apiRequest } from "../../../services/api/client";
import { ApiError } from "../../../services/api/ApiError";
import { normalizeSearchQuery } from "../../shared/utils/searchQuery";
import { sanitizeHtml } from "../../shared/utils/sanitizeHtml";

function assertSuccess(data) {
  if (data?.success !== true) {
    throw new ApiError(data?.message ?? "", data);
  }
  return data;
}

function normalizeSystemEmailId(id) {
  const normalizedId = String(id ?? "").trim();
  if (!normalizedId || normalizedId === "undefined" || normalizedId === "null") {
    throw new ApiError("Invalid system email template id.", null);
  }
  return encodeURIComponent(normalizedId);
}

function extractTemplateList(data) {
  if (!data || typeof data !== "object") return [];
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.templates)) return data.templates;
  return [];
}

function extractTemplateRecord(data) {
  if (!data || typeof data !== "object") return null;
  if (data.data && typeof data.data === "object" && !Array.isArray(data.data)) {
    return data.data;
  }
  if (data.template && typeof data.template === "object") {
    return data.template;
  }
  if (data.id != null) return data;
  return null;
}

function matchesSearch(template, search) {
  if (!search) return true;
  const query = search.toLowerCase();
  return (
    String(template.name ?? template.title ?? "").toLowerCase().includes(query) ||
    String(template.slug ?? "").toLowerCase().includes(query) ||
    String(template.id ?? "").includes(query)
  );
}

export function mapTemplateToListingRow(template, index = 0) {
  return {
    id: template?.id,
    sno: String(index + 1),
    title: template?.name ?? template?.title ?? "",
    name: template?.name ?? template?.title ?? "",
    slug: template?.slug ?? "",
  };
}

export function mapTemplateToDetail(template) {
  return {
    id: template?.id,
    name: template?.name ?? template?.title ?? "",
    title: template?.name ?? template?.title ?? "",
    systemEmail: template?.system_email ?? template?.systemEmail ?? "",
    slug: template?.slug ?? "",
    content: template?.content ?? "",
    createdAt: template?.created_at ?? template?.createdAt ?? "",
    updatedAt: template?.updated_at ?? template?.updatedAt ?? "",
  };
}

/** GET /api/system-emails/list */
export async function getRecords({ page = 1, limit = 10, search } = {}) {
  const data = await apiRequest(API_ROUTES.systemEmails.list);
  assertSuccess(data);

  const normalizedSearch = normalizeSearchQuery(search);
  const allTemplates = extractTemplateList(data).filter((template) =>
    matchesSearch(template, normalizedSearch)
  );

  const total = allTemplates.length;
  const start = (page - 1) * limit;
  const pageItems = allTemplates.slice(start, start + limit);
  const items = pageItems.map((template, index) =>
    mapTemplateToListingRow(template, start + index)
  );

  return { items, total, count: total };
}

/** GET /api/system-emails/:id */
export async function getRecord(id) {
  const normalizedId = normalizeSystemEmailId(id);
  const data = await apiRequest(API_ROUTES.systemEmails.byId(normalizedId));
  assertSuccess(data);

  const template = extractTemplateRecord(data);
  if (!template) {
    throw new ApiError("System email template not found.", data);
  }

  return mapTemplateToDetail(template);
}

/** PUT /api/system-emails/:id */
export async function updateRecord(id, payload) {
  const normalizedId = normalizeSystemEmailId(id);
  const data = await apiRequest(API_ROUTES.systemEmails.byId(normalizedId), {
    method: "PUT",
    body: {
      name: String(payload.name ?? payload.title ?? "").trim(),
      system_email: String(payload.systemEmail ?? payload.system_email ?? "").trim(),
      content: sanitizeHtml(payload.content ?? payload.description).trim(),
    },
  });
  assertSuccess(data);

  const template = extractTemplateRecord(data);
  return {
    ...data,
    template: template ? mapTemplateToDetail(template) : null,
  };
}
