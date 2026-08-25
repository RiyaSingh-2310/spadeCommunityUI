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
import { normalizeSearchQuery } from "../../shared/utils/searchQuery";
import {
  normalizeProjectReportType,
  PROJECT_REPORT_TYPES,
} from "../utils/projectReportNavigation";
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
  if (value === true || value === "true") return "true";
  if (value === false || value === "false") return "false";
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

function filterRowsBySearch(items, search) {
  const query = normalizeSearchQuery(search).toLowerCase();
  if (!query) return items;
  return items.filter((row) =>
    Object.values(row).some((value) => String(value ?? "").toLowerCase().includes(query))
  );
}

function paginateRows(items, page = 1, limit = 10) {
  const safeLimit = clampApiListLimit(limit);
  const parsedPage = Number(page);
  const safePage = Number.isFinite(parsedPage) && parsedPage > 0 ? Math.floor(parsedPage) : 1;
  const start = (safePage - 1) * safeLimit;
  return items.slice(start, start + safeLimit);
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
    supplierIdentifier: formatCellValue(
      pickField(record, [
        "supplier_identifier",
        "supplierIdentifier",
        "Supplier_Identifier",
        "identifier",
      ])
    ),
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
      pickField(record, ["loi", "loi_minutes", "loiMinutes", "LOI", "LOI_mins"])
    ),
    ipAddress: formatCellValue(
      pickField(record, ["ip_address", "ipAddress", "IP_Address", "ip"])
    ),
    country: formatCellValue(pickField(record, ["country", "Country"])),
    city: formatCellValue(pickField(record, ["city", "City"])),
    device: formatCellValue(pickField(record, ["device", "Device"])),
    reason: formatCellValue(pickField(record, ["reason", "Reason"])),
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
      ])
    ),
  };
}

/**
 * @param {object} record
 * @param {number} index
 */
export function mapPrescreenReportRow(record, index = 0) {
  return {
    id: String(pickField(record, ["id", "record_id", "client_id", "clientId"]) ?? index + 1),
    slNo: formatCellValue(
      pickField(record, ["sl_no", "slNo", "sno", "serial_no", "serialNo"]) ?? index + 1
    ),
    vendorId: formatCellValue(
      pickField(record, ["vendor_id", "vendorId", "Vendor_ID", "supplier_id", "supplierId"])
    ),
    clientId: formatCellValue(
      pickField(record, ["client_id", "clientId", "Client_ID", "ClientId"])
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
    status: formatCellValue(pickField(record, ["status", "Status"])),
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

const REPORT_ROW_MAPPERS = {
  [PROJECT_REPORT_TYPES.PROJECT]: mapProjectReportRow,
  [PROJECT_REPORT_TYPES.PRESCREEN]: mapPrescreenReportRow,
  [PROJECT_REPORT_TYPES.SUPPLIER]: mapSupplierReportRow,
};

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

  if (normalizedType === PROJECT_REPORT_TYPES.PROJECT) {
    const data = await apiRequest(API_ROUTES.projectReports.report(resolvedProjectId));
    assertSuccess(data);

    const records = extractReportRecords(data);
    const mapped = mapReportRows(records, mapRow);
    const filtered = filterRowsBySearch(mapped, search);
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

  if (normalizedType === PROJECT_REPORT_TYPES.SUPPLIER) {
    const resolvedSupplierId = String(supplierId ?? "").trim();
    if (!resolvedSupplierId) {
      throw new ApiError("Supplier id is required.", null);
    }

    const url = appendListQuery(
      API_ROUTES.projectReports.supplierReport(resolvedProjectId, resolvedSupplierId),
      { page, limit, search }
    );
    const data = await apiRequest(url);
    assertSuccess(data);

    const records = extractReportRecords(data);
    const items = mapReportRows(records, mapRow);
    const total = extractListTotalFromResponse(data, items.length);

    return {
      success: true,
      items,
      total,
      page: Number(data.page) || page,
      limit: Number(data.limit) || limit,
    };
  }

  if (normalizedType === PROJECT_REPORT_TYPES.PRESCREEN) {
    return getPreScreenReport({
      projectId: resolvedProjectId,
      page,
      limit,
      search,
    });
  }

  const basePath = API_ROUTES.projects.reportList(resolvedProjectId, normalizedType);
  const url = appendListQuery(basePath, {
    page,
    limit,
    search,
    extra: supplierId ? { supplierId: String(supplierId).trim() } : {},
  });

  const data = await apiRequest(url);
  assertSuccess(data);

  const records = extractReportRecords(data);
  const items = mapReportRows(records, mapRow);
  const total = extractListTotalFromResponse(data, items.length);

  return {
    success: true,
    items,
    total,
    page,
    limit,
  };
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
} = {}) {
  const resolvedProjectId = String(projectId ?? "").trim();
  if (!resolvedProjectId) {
    throw new ApiError("Project id is required.", null);
  }

  const normalizedType = normalizeProjectReportType(reportType);
  const defaultFilename = buildReportDownloadFilename(normalizedType, resolvedProjectId);

  if (normalizedType === PROJECT_REPORT_TYPES.PROJECT) {
    return downloadCsvExport(API_ROUTES.projectReports.exportCsv(resolvedProjectId), {
      defaultFilename,
    });
  }

  if (normalizedType === PROJECT_REPORT_TYPES.SUPPLIER) {
    const resolvedSupplierId = String(supplierId ?? "").trim();
    if (!resolvedSupplierId) {
      throw new ApiError("Supplier id is required.", null);
    }

    return downloadCsvExport(
      API_ROUTES.projectReports.supplierExportCsv(resolvedProjectId, resolvedSupplierId),
      {
        defaultFilename: buildDatedExportFilename(
          `supplier-report-${resolvedProjectId}-${resolvedSupplierId}`
        ),
      }
    );
  }

  if (normalizedType === PROJECT_REPORT_TYPES.PRESCREEN) {
    return downloadPreScreenReportCsv({ projectId: resolvedProjectId });
  }

  const basePath = API_ROUTES.projects.reportDownload(resolvedProjectId, normalizedType);
  const url = appendListQuery(basePath, {
    extra: supplierId ? { supplierId: String(supplierId).trim() } : {},
  });

  return downloadCsvExport(url, { defaultFilename });
}
