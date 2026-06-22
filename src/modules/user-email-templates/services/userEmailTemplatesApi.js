import { API_ROUTES } from "../../../config/api";
import { apiRequest } from "../../../services/api/client";
import { ApiError } from "../../../services/api/ApiError";
import {
  apiStatusToFormValue,
  formValueToApiStatus,
} from "../../shared/utils/statusLabels";
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
  const description = template?.content ?? template?.description ?? "";
  return (
    String(template.title ?? "").toLowerCase().includes(query) ||
    String(template.slug ?? "").toLowerCase().includes(query) ||
    String(description).toLowerCase().includes(query) ||
    String(template.id ?? "").includes(query)
  );
}

export function mapTemplateToListingRow(template) {
  return {
    id: template?.id,
    emailTitle: template?.title ?? "",
    title: template?.title ?? "",
    slug: template?.slug ?? "",
    description: template?.content ?? template?.description ?? "",
    status: apiStatusToFormValue(template?.status),
  };
}

export function mapTemplateToDetail(template) {
  return {
    id: template?.id,
    emailTitle: template?.title ?? "",
    title: template?.title ?? "",
    subject: template?.subject ?? "",
    content: template?.content ?? template?.description ?? "",
    slug: template?.slug ?? "",
    createdAt: template?.created_at ?? template?.createdAt ?? "",
    updatedAt: template?.updated_at ?? template?.updatedAt ?? "",
  };
}

async function enrichTemplateForListing(template) {
  if (template?.content ?? template?.description) {
    return mapTemplateToListingRow(template);
  }

  try {
    const normalizedId = normalizeTemplateId(template?.id);
    const data = await apiRequest(API_ROUTES.emailTemplates.byId(normalizedId));
    assertSuccess(data);
    const record = extractTemplateRecord(data);
    return mapTemplateToListingRow({ ...template, ...record });
  } catch {
    return mapTemplateToListingRow(template);
  }
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
  const pageItems = allTemplates.slice(start, start + limit);
  const items = await Promise.all(pageItems.map((template) => enrichTemplateForListing(template)));

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

function buildTemplatePayload(payload) {
  return {
    email_title: String(payload.emailTitle ?? payload.title ?? "").trim(),
    description: String(payload.content ?? payload.description ?? "").trim(),
  };
}

/** POST /api/email-templates/add */
export async function createRecord(payload) {
  const data = await apiRequest(API_ROUTES.emailTemplates.create, {
    method: "POST",
    body: buildTemplatePayload(payload),
  });
  assertSuccess(data);

  const template = extractTemplateRecord(data);
  return {
    ...data,
    template: template ? mapTemplateToDetail(template) : null,
  };
}

/** PUT /api/email-templates/:id */
export async function updateRecord(id, payload) {
  const normalizedId = normalizeTemplateId(id);
  const data = await apiRequest(API_ROUTES.emailTemplates.byId(normalizedId), {
    method: "PUT",
    body: buildTemplatePayload(payload),
  });
  assertSuccess(data);

  const template = extractTemplateRecord(data);
  return {
    ...data,
    template: template ? mapTemplateToDetail(template) : null,
  };
}

/** DELETE /api/email-templates/:id */
export async function deleteRecord(id) {
  const normalizedId = normalizeTemplateId(id);
  const data = await apiRequest(API_ROUTES.emailTemplates.byId(normalizedId), {
    method: "DELETE",
  });
  return assertSuccess(data);
}

/** PATCH /api/email-templates/:id/status — status toggle from listing table. */
export async function updateStatus(id, { status }) {
  const normalizedId = normalizeTemplateId(id);
  const data = await apiRequest(API_ROUTES.emailTemplates.updateStatus(normalizedId), {
    method: "PATCH",
    body: {
      status: formValueToApiStatus(status),
    },
  });
  return assertSuccess(data);
}
