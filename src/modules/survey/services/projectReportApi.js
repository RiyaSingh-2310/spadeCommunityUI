import { API_ROUTES } from "../../../config/api";
import { apiRequest } from "../../../services/api/client";
import { ApiError } from "../../../services/api/ApiError";
import {
  buildDatedExportFilename,
  downloadCsvExport,
} from "../../../services/api/csvExport";
import { extractListTotalFromResponse } from "../../shared/utils/listResponse";
import {
  appendListQuery,
  clampApiListLimit,
} from "../../shared/utils/listQueryParams";
import {
  normalizeProjectReportType,
  PROJECT_REPORT_TYPES,
} from "../utils/projectReportNavigation";
import { getProjectReportColumns } from "../utils/projectReportColumns";
import {
  filterReportRows,
  toFilterDate,
  toProjectReportApiStatus,
} from "../utils/reportFilterConstants";
import {
  downloadPreScreenReportCsv,
  getPreScreenReport,
} from "./preScreenApi";

function assertSuccess(data) {
  if (data?.success !== true) {
    throw new ApiError(data?.message ?? "", data);
  }
  return data;
}

function pickField(record, keys) {
  if (!record || typeof record !== "object") return undefined;
  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return undefined;
}

function formatCellValue(value) {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

function formatBooleanCell(value) {
  if (value === true || value === "true" || value === 1 || value === "1") return "true";
  if (value === false || value === "false" || value === 0 || value === "0") return "false";
  return formatCellValue(value);
}

function formatReportDateTime(value) {
  if (value === null || value === undefined || value === "") return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
}

function mapReportRows(records, mapRow) {
  if (!Array.isArray(records)) return [];
  return records
    .map((record, index) => {
      try {
        return mapRow(record, index);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function paginateRows(items, page = 1, limit = 10) {
  const safeLimit = clampApiListLimit(limit);
  const parsedPage = Number(page);
  const safePage = Number.isFinite(parsedPage) && parsedPage > 0 ? Math.floor(parsedPage) : 1;
  const start = (safePage - 1) * safeLimit;
  return items.slice(start, start + safeLimit);
}

const SUPPLIER_IDENTIFIER_KEYS = [
  "Supplier Identifier",
  "supplier identifier",
  "supplier_identifier",
  "supplierIdentifier",
  "Supplier_Identifier",
  "SupplierIdentifier",
  "identifier",
];

const UID_KEYS = [
  "uid",
  "UID",
  "uuid",
  "UUID",
  "user_id",
  "userId",
  "respondent_uid",
  "respondentUid",
  "respondent_id",
  "respondentId",
];

function pickUid(record) {
  return pickField(record, [...SUPPLIER_IDENTIFIER_KEYS, ...UID_KEYS]);
}

function mapSharedSurveyRow(record, index = 0) {
  return {
    id: String(pickField(record, ["id", "record_id"]) ?? `row-${index + 1}`),
    supplierId: formatCellValue(
      pickField(record, ["supplier_id", "supplierId", "Supplier_Id", "partner_id"])
    ),
    supplierName: formatCellValue(
      pickField(record, ["supplier_name", "supplierName", "Supplier_Name", "partner_name"])
    ),
    clientId: formatCellValue(
      pickField(record, ["client_id", "clientId", "Client_ID", "ClientId"])
    ),
    uid: formatCellValue(pickUid(record)),
    status: formatCellValue(pickField(record, ["status", "Status"])),
    surveyStartDate: formatReportDateTime(
      pickField(record, [
        "survey_start_date",
        "surveyStartDate",
        "Survey_Start_Date",
        "start_date",
        "startDate",
      ])
    ),
    surveyEndDate: formatReportDateTime(
      pickField(record, [
        "survey_end_date",
        "surveyEndDate",
        "Survey_End_Date",
        "end_date",
        "endDate",
      ])
    ),
    loiMinutes: formatCellValue(
      pickField(record, [
        "loi_minutes",
        "loi",
        "loiMinutes",
        "LOI",
        "LOI_mins",
      ])
    ),
    ipAddress: formatCellValue(
      pickField(record, ["ip_address", "ipAddress", "IP_Address", "ip"])
    ),
    country: formatCellValue(pickField(record, ["country", "Country"])),
    city: formatCellValue(pickField(record, ["city", "City"])),
    device: formatCellValue(pickField(record, ["device", "Device"])),
    reason: formatCellValue(pickField(record, ["reason", "Reason"])),
    _filterDate: toFilterDate(
      pickField(record, [
        "survey_start_date",
        "surveyStartDate",
        "Survey_Start_Date",
        "start_date",
        "startDate",
        "created_at",
        "createdAt",
      ])
    ),
  };
}

/**
 * @param {object} record
 * @param {number} index
 */
export function mapProjectReportRow(record, index = 0) {
  return {
    ...mapSharedSurveyRow(record, index),
    isTestLink: formatBooleanCell(
      pickField(record, [
        "is_test_link",
        "isTestLink",
        "Is_Test_Link",
        "is_text_link",
        "isTextLink",
        "is_test",
        "IsTest",
        "isTest",
      ])
    ),
  };
}

/**
 * @param {object} record
 * @param {number} index
 */
export function mapPrescreenReportRow(record, index = 0) {
  const isTestRaw = pickField(record, [
    "is_test_link",
    "isTestLink",
    "is_test",
    "IsTest",
    "isTest",
  ]);
  return {
    id: String(pickField(record, ["id", "record_id", "client_id", "clientId"]) ?? index + 1),
    slNo: formatCellValue(
      pickField(record, ["sl_no", "slNo", "sno", "serial_no", "serialNo"]) ?? index + 1
    ),
    uid: formatCellValue(pickUid(record)),
    supplierId: formatCellValue(
      pickField(record, ["supplier_id", "supplierId", "vendor_id", "vendorId", "partner_id"])
    ),
    supplierName: formatCellValue(
      pickField(record, [
        "supplier_name",
        "supplierName",
        "supplier",
        "vendor_name",
        "partner_name",
      ])
    ),
    vendorId: formatCellValue(
      pickField(record, ["vendor_id", "vendorId", "Vendor_ID", "supplier_id", "supplierId"])
    ),
    partnerName: formatCellValue(
      pickField(record, ["partner_name", "partnerName", "Partner_Name", "PartnerName"])
    ),
    clientId: formatCellValue(
      pickField(record, ["client_id", "clientId", "Client_ID", "ClientId"])
    ),
    clientName: formatCellValue(
      pickField(record, ["client_name", "clientName", "Client_Name", "ClientName", "Clients"])
    ),
    projectName: formatCellValue(
      pickField(record, ["project_name", "projectName", "survey_title", "surveyTitle"])
    ),
    isTestLink: formatBooleanCell(isTestRaw),
    surveyDate: formatReportDateTime(
      pickField(record, [
        "survey_date",
        "surveyDate",
        "Survey_Date",
        "survey_start_date",
        "surveyStartDate",
      ])
    ),
    answerAt: formatReportDateTime(
      pickField(record, [
        "answer_at",
        "answered_at",
        "answerAt",
        "answeredAt",
        "Answer_At",
        "AnswerAt",
      ])
    ),
    ip: formatCellValue(
      pickField(record, ["ip", "ip_address", "ipAddress", "IP", "IP_Address"])
    ),
    question: formatCellValue(
      pickField(record, ["question", "Question", "question_text", "questionText"])
    ),
    answer: formatCellValue(
      pickField(record, ["answer", "Answer", "response", "Response"])
    ),
    status: formatCellValue(pickField(record, ["status", "Status", "prescreen_status"])),
    _filterDate: toFilterDate(
      pickField(record, [
        "survey_date",
        "surveyDate",
        "survey_start_date",
        "surveyStartDate",
        "answer_at",
        "answered_at",
        "created_at",
        "createdAt",
        "occurred_at",
        "date_time",
        "dateTime",
      ])
    ),
  };
}

/**
 * @param {object} record
 * @param {number} index
 */
export function mapSupplierReportRow(record, index = 0) {
  const partnerId = pickField(record, ["partnerId", "partner_id"]);
  const partnersIdentifier = pickField(record, [
    "partnersIdentifier",
    "partners_identifier",
    "partnerIdentifier",
    "partner_identifier",
  ]);

  return {
    id: String(
      pickField(record, ["id", "record_id"]) ??
        [partnerId, partnersIdentifier, index + 1].filter((value) => value != null).join("-")
    ),
    partnerId: formatCellValue(partnerId),
    partnerName: formatCellValue(
      pickField(record, ["partnerName", "partner_name"])
    ),
    clientName: formatCellValue(
      pickField(record, ["clientName", "client_name"])
    ),
    partnersIdentifier: formatCellValue(partnersIdentifier),
    uid: formatCellValue(pickUid(record) ?? partnersIdentifier),
    status: formatCellValue(pickField(record, ["status", "Status"])),
    surveyStartDate: formatReportDateTime(
      pickField(record, ["surveyStartDate", "survey_start_date"])
    ),
    surveyEndDate: formatReportDateTime(
      pickField(record, ["surveyEndDate", "survey_end_date"])
    ),
    loi: formatCellValue(pickField(record, ["LOI", "loi", "loiMinutes", "loi_minutes"])),
    ipAddress: formatCellValue(
      pickField(record, ["ipAddress", "ip_address", "IP_Address"])
    ),
    geoLocation: formatCellValue(
      pickField(record, ["geoLocation", "geo_location"])
    ),
    isTestLink: formatBooleanCell(
      pickField(record, ["isTestLink", "is_test_link", "Is_Test_Link"])
    ),
    finalIp: formatCellValue(pickField(record, ["finalIp", "final_ip"])),
    multiLinkUrl: formatCellValue(
      pickField(record, ["multiLinkUrl", "multilinkUrl", "multi_link_url", "multilink_url"])
    ),
  };
}

export function mapFraudReportRow(record, index = 0) {
  return {
    id: String(pickField(record, ["id", "record_id"]) ?? `fraud-${index + 1}`),
    uid: formatCellValue(pickUid(record)),
    projectName: formatCellValue(
      pickField(record, ["project_name", "projectName", "survey_title", "surveyTitle"])
    ),
    supplierId: formatCellValue(
      pickField(record, ["supplier_id", "supplierId", "partner_id"])
    ),
    supplierName: formatCellValue(
      pickField(record, ["supplier_name", "supplierName", "supplier", "partner_name"])
    ),
    isTestLink: formatBooleanCell(
      pickField(record, ["is_test", "IsTest", "isTest", "is_test_link", "isTestLink"])
    ),
    ipAddress: formatCellValue(
      pickField(record, ["ip_address", "ipAddress", "ip"])
    ),
    fraudScore: formatCellValue(
      pickField(record, ["fraud_score", "fraudScore", "score"])
    ),
    proxyDetected: formatBooleanCell(
      pickField(record, ["proxy", "proxy_detected", "proxyDetected", "is_proxy"])
    ),
    vpnVps: formatCellValue(
      pickField(record, ["vpn", "vpn_vps", "vpnVps", "vps", "vpn_detected"])
    ),
    isp: formatCellValue(pickField(record, ["isp", "ISP", "isp_name"])),
    blockReason: formatCellValue(
      pickField(record, [
        "block_reason",
        "blockReason",
        "reason",
        "security_reason",
      ])
    ),
    occurredAt: formatReportDateTime(
      pickField(record, ["created_at", "createdAt", "occurred_at", "date_time"])
    ),
    status: formatCellValue(
      pickField(record, ["status", "Status", "action", "final_status"])
    ),
  };
}

export function summarizeFraudReport(rows = []) {
  const items = Array.isArray(rows) ? rows : [];
  const total = items.length;
  const blocked = items.filter((row) => {
    const reason = String(row.blockReason ?? "").trim();
    const status = String(row.status ?? "").toLowerCase();
    return reason && reason !== "—"
      || status.includes("block")
      || status.includes("terminat")
      || status.includes("denied");
  }).length;
  const geo = items.filter((row) =>
    String(row.blockReason ?? "").toLowerCase().includes("geo")
    || String(row.blockReason ?? "").toLowerCase().includes("location")
    || String(row.blockReason ?? "").toLowerCase().includes("country")
  ).length;
  const uniqueIp = items.filter((row) =>
    String(row.blockReason ?? "").toLowerCase().includes("ip")
  ).length;
  const fraud = items.filter((row) =>
    String(row.blockReason ?? "").toLowerCase().includes("fraud")
    || String(row.blockReason ?? "").toLowerCase().includes("proxy")
    || String(row.blockReason ?? "").toLowerCase().includes("vpn")
  ).length;
  const prescreen = items.filter((row) =>
    String(row.blockReason ?? "").toLowerCase().includes("pre-screen")
    || String(row.blockReason ?? "").toLowerCase().includes("prescreen")
  ).length;
  const allowed = Math.max(0, total - blocked);

  return {
    totalChecks: total,
    totalAllowed: allowed,
    totalBlocked: blocked,
    fraudBlocks: fraud,
    geolocationBlocks: geo,
    uniqueIpBlocks: uniqueIp,
    prescreenTerminations: prescreen,
    blockPercentage: total ? Math.round((blocked / total) * 100) : 0,
  };
}

const REPORT_ROW_MAPPERS = {
  [PROJECT_REPORT_TYPES.PROJECT]: mapProjectReportRow,
  [PROJECT_REPORT_TYPES.PRESCREEN]: mapPrescreenReportRow,
  [PROJECT_REPORT_TYPES.FRAUD]: mapFraudReportRow,
  [PROJECT_REPORT_TYPES.SUPPLIER]: mapSupplierReportRow,
  [PROJECT_REPORT_TYPES.TEST]: mapProjectReportRow,
};

function normalizeReportMode(mode) {
  return String(mode ?? "").trim().toLowerCase() === "test" ? "test" : "live";
}

function applyReportFilters(mapped, filters = {}) {
  return filterReportRows(mapped, filters);
}

export function reportFilterQuery({
  mode,
  supplierId,
  status = "",
  startDate = "",
  endDate = "",
} = {}) {
  const resolvedStart = String(startDate ?? "").trim();
  const resolvedEnd = String(endDate ?? "").trim();
  const statusValue = toProjectReportApiStatus(status);
  const resolvedSupplierId = String(supplierId ?? "").trim();
  const isTest = normalizeReportMode(mode) === "test";

  return {
    is_test: isTest ? "1" : "0",
    ...(resolvedSupplierId
      ? { supplier_id: resolvedSupplierId, supplierId: resolvedSupplierId }
      : {}),
    ...(statusValue ? { status: statusValue } : {}),
    ...(resolvedStart ? { start_date: resolvedStart } : {}),
    ...(resolvedEnd ? { end_date: resolvedEnd } : {}),
  };
}

function extractReportRecords(data) {
  if (!data || typeof data !== "object") return [];
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.items)) return data.items;
  if (data.data && typeof data.data === "object") {
    if (Array.isArray(data.data.items)) return data.data.items;
    if (Array.isArray(data.data.records)) return data.data.records;
    if (Array.isArray(data.data.rows)) return data.data.rows;
  }
  if (Array.isArray(data.records)) return data.records;
  if (Array.isArray(data.rows)) return data.rows;
  return [];
}

/**
 * @param {{
 *   projectId: string|number,
 *   reportType?: string,
 *   supplierId?: string|number,
 *   page?: number,
 *   limit?: number,
 *   search?: string,
 * }} params
 */
export async function fetchProjectReportList({
  projectId,
  reportType,
  supplierId,
  mode = "live",
  startDate = "",
  endDate = "",
  status = "",
  page = 1,
  limit = 10,
  search = "",
} = {}) {
  const resolvedProjectId = String(projectId ?? "").trim();
  if (!resolvedProjectId) {
    throw new ApiError("Project id is required.", null);
  }

  const normalizedType = normalizeProjectReportType(reportType);
  const mapRow =
    REPORT_ROW_MAPPERS[normalizedType] ?? REPORT_ROW_MAPPERS[PROJECT_REPORT_TYPES.PROJECT];
  const extra = reportFilterQuery({ mode, supplierId, status, startDate, endDate });

  if (
    normalizedType === PROJECT_REPORT_TYPES.PROJECT ||
    normalizedType === PROJECT_REPORT_TYPES.TEST
  ) {
    const path = appendListQuery(API_ROUTES.projectReports.report(resolvedProjectId), {
      search,
      extra,
    });
    const data = await apiRequest(path);
    assertSuccess(data);

    const records = extractReportRecords(data);
    const mapped = mapReportRows(records, mapProjectReportRow);
    const filtered = filterReportRows(mapped, {
      search,
      mode,
      supplierId,
      status,
      startDate,
      endDate,
    });
    const items = paginateRows(filtered, page, limit);

    return {
      success: true,
      items,
      total: filtered.length,
      page,
      limit,
      projectName: String(data.project_name ?? data.projectName ?? "").trim(),
    };
  }

  if (normalizedType === PROJECT_REPORT_TYPES.PRESCREEN) {
    return getPreScreenReport({
      projectId: resolvedProjectId,
      page,
      limit,
      search,
      mode,
      supplierId,
      status,
      startDate,
      endDate,
    });
  }

  if (normalizedType === PROJECT_REPORT_TYPES.FRAUD) {
    const path = appendListQuery(API_ROUTES.projectReports.fraud(resolvedProjectId), {
      extra,
    });
    const data = await apiRequest(path);
    assertSuccess(data);
    const records = extractReportRecords(data);
    const mapped = mapReportRows(records, mapFraudReportRow);
    const filtered = applyReportFilters(mapped, { search, mode, supplierId, status });
    const items = paginateRows(filtered, page, limit);
    const summary = data?.summary && typeof data.summary === "object"
      ? data.summary
      : summarizeFraudReport(filtered);

    return {
      success: true,
      items,
      total: filtered.length,
      page,
      limit,
      summary,
      projectName: String(data.project_name ?? data.projectName ?? "").trim(),
    };
  }

  if (normalizedType === PROJECT_REPORT_TYPES.SUPPLIER) {
    const resolvedSupplierId = String(supplierId ?? "").trim();
    if (!resolvedSupplierId) {
      throw new ApiError("Supplier id is required.", null);
    }

    const url = appendListQuery(
      API_ROUTES.projectReports.supplierReport(resolvedProjectId, resolvedSupplierId),
      { page, limit, search, extra: { is_test: extra.is_test } }
    );
    const data = await apiRequest(url);
    assertSuccess(data);

    const records = extractReportRecords(data);
    const items = applyReportFilters(mapReportRows(records, mapRow), {
      search: "",
      mode,
      supplierId: resolvedSupplierId,
      status,
    });
    const total = extractListTotalFromResponse(data, items.length);

    return {
      success: true,
      items,
      total,
      page: Number(data.page) || page,
      limit: Number(data.limit) || limit,
    };
  }

  const basePath = API_ROUTES.projects.reportList(resolvedProjectId, normalizedType);
  const url = appendListQuery(basePath, {
    page,
    limit,
    search,
    extra,
  });

  const data = await apiRequest(url);
  assertSuccess(data);

  const records = extractReportRecords(data);
  const items = applyReportFilters(mapReportRows(records, mapRow), {
    search: "",
    mode,
    supplierId,
    status,
  });
  const total = extractListTotalFromResponse(data, items.length);

  return {
    success: true,
    items,
    total,
    page,
    limit,
  };
}

function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function downloadCsvText(content, filename) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function buildReportDownloadFilename(reportType, projectId) {
  return buildDatedExportFilename(
    `${normalizeProjectReportType(reportType)}-report-${projectId}`
  );
}

/**
 * @param {{
 *   projectId: string|number,
 *   reportType?: string,
 *   supplierId?: string|number,
 * }} params
 */
export async function downloadProjectReport({
  projectId,
  reportType,
  supplierId,
  mode = "live",
  startDate = "",
  endDate = "",
  status = "",
} = {}) {
  const resolvedProjectId = String(projectId ?? "").trim();
  if (!resolvedProjectId) {
    throw new ApiError("Project id is required.", null);
  }

  const normalizedType = normalizeProjectReportType(reportType);
  const defaultFilename = buildReportDownloadFilename(normalizedType, resolvedProjectId);
  const extra = reportFilterQuery({ mode, supplierId, status, startDate, endDate });

  if (normalizedType === PROJECT_REPORT_TYPES.PROJECT) {
    return downloadCsvExport(
      appendListQuery(API_ROUTES.projectReports.exportCsv(resolvedProjectId), { extra }),
      { defaultFilename }
    );
  }

  if (normalizedType === PROJECT_REPORT_TYPES.FRAUD) {
    return downloadCsvExport(
      appendListQuery(API_ROUTES.projectReports.fraudExportCsv(resolvedProjectId), { extra }),
      { defaultFilename }
    );
  }

  if (normalizedType === PROJECT_REPORT_TYPES.PRESCREEN) {
    return downloadPreScreenReportCsv({
      projectId: resolvedProjectId,
      mode,
      supplierId,
      status,
      startDate,
      endDate,
    });
  }

  if (normalizedType === PROJECT_REPORT_TYPES.TEST) {
    const result = await fetchProjectReportList({
      projectId: resolvedProjectId,
      reportType: PROJECT_REPORT_TYPES.PROJECT,
      mode: "test",
      supplierId,
      page: 1,
      limit: 10000,
    });
    const columns = getProjectReportColumns(PROJECT_REPORT_TYPES.PROJECT);
    const header = columns.map((column) => csvEscape(column.label)).join(",");
    const lines = (result.items ?? []).map((row) =>
      columns.map((column) => csvEscape(row[column.key])).join(",")
    );
    downloadCsvText([header, ...lines].join("\n"), defaultFilename);
    return { success: true };
  }

  if (normalizedType === PROJECT_REPORT_TYPES.SUPPLIER) {
    const resolvedSupplierId = String(supplierId ?? "").trim();
    if (!resolvedSupplierId) {
      throw new ApiError("Supplier id is required.", null);
    }

    return downloadCsvExport(
      appendListQuery(
        API_ROUTES.projectReports.supplierExportCsv(resolvedProjectId, resolvedSupplierId),
        { extra: { is_test: extra.is_test } }
      ),
      {
        defaultFilename: buildDatedExportFilename(
          `supplier-report-${resolvedProjectId}-${resolvedSupplierId}`
        ),
      }
    );
  }

  const basePath = API_ROUTES.projects.reportDownload(resolvedProjectId, normalizedType);
  const url = appendListQuery(basePath, { extra });

  return downloadCsvExport(url, { defaultFilename });
}
