import { API_ROUTES } from "../../../config/api";
import {
  extractListTotalFromResponse,
  safeMapListItems,
} from "../../shared/utils/listResponse";
import { appendListQuery } from "../../shared/utils/listQueryParams";
import { apiRequest } from "../../../services/api/client";
import { ApiError } from "../../../services/api/ApiError";
import { sanitizeHtml } from "../../shared/utils/sanitizeHtml";
import {
  apiStatusToFormValue,
  formValueToApiStatus,
} from "../../shared/utils/statusLabels";
import { normalizeSearchQuery } from "../../shared/utils/searchQuery";

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

/** Normalizes list/detail API shapes (template_key, body) for UI mappers. */
function normalizeTemplateRecord(template) {
  if (!template || typeof template !== "object") return template;

  return {
    ...template,
    slug: template.slug ?? template.template_key ?? "",
    template_key: template.template_key ?? template.slug ?? "",
    content:
      template.content ??
      template.body ??
      template.description ??
      "",
    body: template.body ?? template.content ?? template.description ?? "",
  };
}

function resolveTemplateBody(template) {
  return template?.content ?? template?.body ?? template?.description ?? "";
}

function resolveTemplateSlug(template) {
  return template?.slug ?? template?.template_key ?? "";
}

export function mapTemplateToListingRow(template) {
  const record = normalizeTemplateRecord(template);

  return {
    id: record?.id,
    emailTitle: record?.title ?? "",
    title: record?.title ?? "",
    slug: resolveTemplateSlug(record),
    templateKey: resolveTemplateSlug(record),
    description: resolveTemplateBody(record),
    status: apiStatusToFormValue(record?.status),
  };
}

export function mapTemplateToDetail(template) {
  const record = normalizeTemplateRecord(template);

  return {
    id: record?.id,
    emailTitle: record?.title ?? "",
    title: record?.title ?? "",
    subject: record?.subject ?? "",
    content: resolveTemplateBody(record),
    slug: resolveTemplateSlug(record),
    templateKey: resolveTemplateSlug(record),
    createdAt: record?.created_at ?? record?.createdAt ?? "",
    updatedAt: record?.updated_at ?? record?.updatedAt ?? "",
  };
}

/** GET /api/email-templates/list */
export async function getRecords({ page = 1, limit = 10, search } = {}) {
  const data = await apiRequest(
    appendListQuery(API_ROUTES.emailTemplates.list, {
      page,
      limit,
      search: normalizeSearchQuery(search),
    })
  );
  assertSuccess(data);

  const templates = extractTemplateList(data);
  const total = extractListTotalFromResponse(data, templates.length);
  const items = safeMapListItems(templates, (template) =>
    mapTemplateToListingRow(template)
  );

  return {
    ...data,
    items,
    total,
    count: total,
    page: data.page ?? page,
    limit: data.limit ?? limit,
    totalPages:
      data.totalPages ?? Math.max(1, Math.ceil(total / (Number(limit) || 10)) || 1),
  };
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
    template_key: String(
      payload.templateKey ?? payload.template_key ?? payload.slug ?? ""
    ).trim(),
    title: String(payload.emailTitle ?? payload.title ?? "").trim(),
    subject: String(payload.subject ?? "").trim(),
    body: sanitizeHtml(
      payload.body ?? payload.content ?? payload.description
    ).trim(),
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

/** PATCH /api/email-templates/:id/status */
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
