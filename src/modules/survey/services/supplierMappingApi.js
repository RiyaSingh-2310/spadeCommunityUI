import { API_ROUTES } from "../../../config/api";
import { apiRequest } from "../../../services/api/client";
import { ApiError } from "../../../services/api/ApiError";
import {
  appendListQuery,
  MAX_API_LIST_LIMIT,
} from "../../shared/utils/listQueryParams";

function assertSuccess(data) {
  if (data?.success !== true) {
    throw new ApiError(data?.message ?? "", data);
  }
  return data;
}

function toBoolean(value, fallback = false) {
  if (typeof value === "boolean") return value;
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();
  if (!normalized) return fallback;
  if (["1", "true", "yes", "on", "active"].includes(normalized)) return true;
  if (["0", "false", "no", "off", "inactive"].includes(normalized)) return false;
  return fallback;
}

function pickField(record, keys) {
  if (!record || typeof record !== "object") return undefined;
  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return undefined;
}

function toApiNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
}

/**
 * Maps a supplier-mapping API record into the Partner Mapping table row shape.
 * @param {object} record
 * @param {number} index
 */
export function mapSupplierMappingToRow(record, index = 0) {
  const partnerCode = String(
    pickField(record, ["partner_code", "code", "supplierCode"]) ?? ""
  ).trim();

  const partnerUrl = String(
    pickField(record, [
      "dynamic_url",
      "Dynamic_URL",
      "partner_url",
      "supplier_url",
      "VenderURL",
      "vendor_url",
    ]) ?? ""
  ).trim();

  const statusRaw = pickField(record, ["status", "Status"]);
  const statusActive =
    statusRaw == null || statusRaw === ""
      ? true
      : toBoolean(statusRaw, false) ||
        String(statusRaw).trim().toLowerCase() === "active";

  const partnerNameRaw = String(
    pickField(record, ["partner_name", "name", "partnerName"]) ?? ""
  ).trim();

  return {
    sno: index + 1,
    id: String(pickField(record, ["id", "mapping_id"]) ?? ""),
    mappingCode: String(pickField(record, ["mapping_code"]) ?? "").trim(),
    partnerId: String(pickField(record, ["partnerid", "partner_id", "partnerId"]) ?? ""),
    partnerCode: partnerCode || "—",
    partnerName: partnerNameRaw || partnerCode || "—",
    quota: pickField(record, ["quota", "Quota"]) ?? "—",
    cpi: pickField(record, ["CPI", "cpi", "cpi_rate"]) ?? "—",
    linksToAssign:
      pickField(record, [
        "LinksToAssign",
        "links_to_assign",
        "linksToAssign",
        "link_count",
        "LinkCount",
      ]) ?? "—",
    partnerUrl,
    statusActive,
    isTest: toBoolean(
      pickField(record, ["IsTest", "is_test", "isTest", "test_mode"]),
      false
    ),
    record,
  };
}

/** Maps supplier-mapping API record into view/detail shape. */
export function mapSupplierMappingToDetail(record) {
  if (!record || typeof record !== "object") return null;

  return {
    mappingCode: pickField(record, ["mapping_code"]),
    partnerName: pickField(record, ["partner_name", "name", "partnerName"]),
    quota: pickField(record, ["quota", "Quota"]),
    cpi: pickField(record, ["CPI", "cpi"]),
    linksToAssign: pickField(record, [
      "LinksToAssign",
      "links_to_assign",
      "linksToAssign",
      "link_count",
      "LinkCount",
    ]),
    complete: pickField(record, ["CompleteURL", "complete_url", "complete"]),
    terminate: pickField(record, ["TerminateURL", "terminate_url", "terminate"]),
    overQuota: pickField(record, ["OverQuotaURL", "over_quota_url", "overQuota"]),
    qualityTerm: pickField(record, ["QualityTermURL", "quality_term_url", "qualityTerm"]),
    surveyClose: pickField(record, ["SurveyCloseURL", "survey_close_url", "surveyClose"]),
    postbackUrl: pickField(record, ["VenderURL", "postback_url", "postbackUrl"]),
    partnerUrl: pickField(record, ["dynamic_url", "vendor_url", "partner_url"]),
    statusActive:
      toBoolean(pickField(record, ["status", "Status"]), true) ||
      String(pickField(record, ["status", "Status"]) ?? "")
        .trim()
        .toLowerCase() === "active",
    isTest: toBoolean(
      pickField(record, ["IsTest", "is_test", "isTest", "test_mode"]),
      false
    ),
  };
}

/** Maps supplier-mapping API record into the Partner Mapping form shape. */
export function mapSupplierMappingToForm(record) {
  const detail = mapSupplierMappingToDetail(record);
  if (!detail) return null;

  return {
    mappingId: String(pickField(record, ["id", "mapping_id"]) ?? ""),
    partnerId: String(pickField(record, ["partnerid", "partner_id", "partnerId"]) ?? ""),
    partnerCode: String(
      pickField(record, ["partner_code", "code", "mapping_code"]) ?? ""
    ).trim(),
    partnerRedirectUrl: String(
      pickField(record, [
        "dynamic_url",
        "Dynamic_URL",
        "partner_url",
        "supplier_url",
        "VenderURL",
        "vendor_url",
      ]) ?? ""
    ).trim(),
    quota: detail.quota != null ? String(detail.quota) : "",
    cpi: detail.cpi != null ? String(detail.cpi) : "",
    linksToAssign:
      detail.linksToAssign != null && detail.linksToAssign !== ""
        ? String(detail.linksToAssign)
        : "",
    statusActive:
      toBoolean(pickField(record, ["status", "Status"]), true) ||
      String(pickField(record, ["status", "Status"]) ?? "")
        .trim()
        .toLowerCase() === "active",
    isTest: toBoolean(
      pickField(record, ["IsTest", "is_test", "isTest", "test_mode"]),
      false
    ),
    redirects: {
      complete: String(detail.complete ?? ""),
      terminate: String(detail.terminate ?? ""),
      overQuota: String(detail.overQuota ?? ""),
      qualityTerm: String(detail.qualityTerm ?? ""),
      surveyClose: String(detail.surveyClose ?? ""),
      postbackUrl: String(detail.postbackUrl ?? ""),
    },
  };
}

/**
 * Builds POST/PUT /api/supplier-mapping body from the Partner Mapping form.
 * Matches backend contract: partnerid, projectid, projectUrlId, quota, CPI, redirect URLs, status, IsTest.
 */
export function buildSupplierMappingApiPayload({
  partnerId,
  projectId,
  projectUrlId,
  quota,
  cpi,
  linksToAssign,
  redirects = {},
  statusActive = true,
  isTest = false,
}) {
  const payload = {
    partnerid: toApiNumber(partnerId),
    projectid: toApiNumber(projectId),
    projectUrlId: toApiNumber(projectUrlId),
    quota: toApiNumber(quota),
    CPI: toApiNumber(cpi),
    CompleteURL: String(redirects.complete ?? "").trim(),
    TerminateURL: String(redirects.terminate ?? "").trim(),
    OverQuotaURL: String(redirects.overQuota ?? "").trim(),
    QualityTermURL: String(redirects.qualityTerm ?? "").trim(),
    SurveyCloseURL: String(redirects.surveyClose ?? "").trim(),
    VenderURL: String(redirects.postbackUrl ?? "").trim(),
    status: statusActive ? "active" : "inactive",
    IsTest: isTest ? 1 : 0,
  };

  const linksCount = toApiNumber(linksToAssign);
  if (linksCount != null) {
    payload.linksToAssign = linksCount;
  }

  return payload;
}

/**
 * GET /api/supplier-mapping/list
 * Matches provided cURL:
 *   curl --location 'http://localhost:5050/api/supplier-mapping/list'
 *     --header 'Authorization: Bearer …'
 * Response: { success, data: [...], total, page, limit, totalPages }
 */
export async function listSupplierMappings({ projectId, projectUrlId } = {}) {
  // Matches backend list contract:
  // GET /api/supplier-mapping/list?page&limit&projectid&partnerid&status&search
  const normalizedProjectId = String(projectId ?? "").trim();
  const normalizedUrlId = String(projectUrlId ?? "").trim();
  const url = appendListQuery(API_ROUTES.supplierMapping.list, {
    page: 1,
    limit: MAX_API_LIST_LIMIT,
    extra: {
      ...(normalizedProjectId ? { projectid: normalizedProjectId } : {}),
    },
  });

  const data = await apiRequest(url, { method: "GET" });
  assertSuccess(data);

  const rows = Array.isArray(data?.data) ? data.data : [];
  if (!normalizedUrlId) return rows;

  // Backend has no projectUrlId query filter — narrow client-side after projectid filter.
  // Require an exact match so mappings without projectUrlId do not leak across URL tabs.
  return rows.filter((row) => {
    const rowUrlId = String(
      pickField(row, ["projectUrlId", "project_url_id", "projecturlid", "ProjectUrlId"]) ??
        ""
    ).trim();
    return rowUrlId === normalizedUrlId;
  });
}

function dynamicUrlMatchesDoSurveyToken(dynamicUrl, token) {
  const url = String(dynamicUrl ?? "").trim();
  const normalizedToken = String(token ?? "").trim();
  if (!url || !normalizedToken) return false;

  if (url.includes(`/dosurvey/${normalizedToken}`)) return true;

  try {
    const parsed = new URL(url, "http://localhost");
    const segments = parsed.pathname.split("/").filter(Boolean);
    const pathToken = segments[segments.length - 1];
    return pathToken === normalizedToken;
  } catch {
    return false;
  }
}

/**
 * Finds a supplier-mapping row whose dynamic_url points at /dosurvey/:token.
 * Used by the public start page until GET /api/dosurvey/:token is available.
 */
export async function findSupplierMappingByDoSurveyToken(token) {
  const normalizedToken = String(token ?? "").trim();
  if (!normalizedToken) return null;

  const rows = await listSupplierMappings();
  return (
    rows.find((row) =>
      dynamicUrlMatchesDoSurveyToken(
        pickField(row, [
          "dynamic_url",
          "Dynamic_URL",
          "partner_url",
          "supplier_url",
          "VenderURL",
          "vendor_url",
        ]),
        normalizedToken
      )
    ) ?? null
  );
}

/** Appends IsTest query flag so the public /dosurvey page can show Test vs Live. */
export function appendIsTestToPartnerUrl(url, isTest) {
  const raw = String(url ?? "").trim();
  if (!raw) return raw;

  try {
    const isAbsolute = /^https?:\/\//i.test(raw);
    const base =
      typeof window !== "undefined" && window.location?.origin
        ? window.location.origin
        : "https://spade-community.com";
    const parsed = isAbsolute ? new URL(raw) : new URL(raw, base);
    parsed.searchParams.set("IsTest", isTest ? "1" : "0");
    if (isAbsolute) return parsed.toString();
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return raw;
  }
}

/** GET /api/supplier-mapping/:id */
export async function getSupplierMappingById(mappingId) {
  const normalizedId = String(mappingId ?? "").trim();
  if (!normalizedId) {
    throw new ApiError("Mapping ID is required.", null);
  }

  const data = await apiRequest(
    API_ROUTES.supplierMapping.byId(encodeURIComponent(normalizedId))
  );
  assertSuccess(data);
  return data?.data ?? data;
}

/** POST /api/supplier-mapping */
export async function createSupplierMapping(payload) {
  const data = await apiRequest(API_ROUTES.supplierMapping.create, {
    method: "POST",
    body: payload,
  });
  return assertSuccess(data);
}

/** PUT /api/supplier-mapping/:id — supports partial updates. */
export async function updateSupplierMappingRecord(mappingId, payload) {
  const normalizedId = String(mappingId ?? "").trim();
  if (!normalizedId) {
    throw new ApiError("Mapping ID is required.", null);
  }

  const data = await apiRequest(
    API_ROUTES.supplierMapping.update(encodeURIComponent(normalizedId)),
    {
      method: "PUT",
      body: payload,
    }
  );
  return assertSuccess(data);
}

/** PATCH /api/supplier-mapping/status/:id */
export async function updateSupplierMappingStatus(mappingId, statusActive) {
  const normalizedId = String(mappingId ?? "").trim();
  if (!normalizedId) {
    throw new ApiError("Mapping ID is required.", null);
  }

  const data = await apiRequest(
    API_ROUTES.supplierMapping.updateStatus(encodeURIComponent(normalizedId)),
    {
      method: "PATCH",
      body: {
        status: statusActive ? "active" : "inactive",
      },
    }
  );
  return assertSuccess(data);
}

/** PATCH IsTest via partial PUT /api/supplier-mapping/:id */
export async function updateSupplierMappingTestMode(mappingId, isTest) {
  return updateSupplierMappingRecord(mappingId, { IsTest: isTest ? 1 : 0 });
}
