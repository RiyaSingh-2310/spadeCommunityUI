import { API_ROUTES } from "../../../config/api";
import { apiRequest } from "../../../services/api/client";
import { ApiError } from "../../../services/api/ApiError";
import { normalizeSearchQuery } from "../../shared/utils/searchQuery";

function assertSuccess(data) {
  if (data?.success !== true) {
    throw new ApiError(data?.message ?? "", data);
  }
  return data;
}

function normalizeTemplateId(id) {
  const normalizedId = String(id ?? "").trim();
  if (!normalizedId || normalizedId === "undefined" || normalizedId === "null") {
    throw new ApiError("Invalid email template id.", null);
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
    String(template.title ?? "").toLowerCase().includes(query) ||
    String(template.slug ?? "").toLowerCase().includes(query) ||
    String(template.id ?? "").includes(query)
  );
}

export function mapTemplateToListingRow(template) {
  return {
    id: template?.id,
    emailTitle: template?.title ?? "",
    title: template?.title ?? "",
    slug: template?.slug ?? "",
  };
}

export function mapTemplateToDetail(template) {
  return {
    id: template?.id,
    emailTitle: template?.title ?? "",
    title: template?.title ?? "",
    subject: template?.subject ?? "",
    content: template?.content ?? "",
    slug: template?.slug ?? "",
    createdAt: template?.created_at ?? template?.createdAt ?? "",
    updatedAt: template?.updated_at ?? template?.updatedAt ?? "",
  };
}

/** GET /api/email-templates/list */
export async function getRecords({ page = 1, limit = 10, search } = {}) {
  const data = await apiRequest(API_ROUTES.emailTemplates.list);
  assertSuccess(data);

  const normalizedSearch = normalizeSearchQuery(search);
  const allTemplates = extractTemplateList(data).filter((template) =>
    matchesSearch(template, normalizedSearch)
  );

  const total = allTemplates.length;
  const start = (page - 1) * limit;
  const items = allTemplates
    .slice(start, start + limit)
    .map((template) => mapTemplateToListingRow(template));

  return { items, total, count: total };
}

/** GET /api/email-templates/:id */
export async function getRecord(id) {
  const normalizedId = normalizeTemplateId(id);
  const data = await apiRequest(API_ROUTES.emailTemplates.byId(normalizedId));
  assertSuccess(data);

  const template = extractTemplateRecord(data);
  if (!template) {
    throw new ApiError("Email template not found.", data);
  }

  return mapTemplateToDetail(template);
}
