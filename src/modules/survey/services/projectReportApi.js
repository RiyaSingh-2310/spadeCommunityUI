import { API_ROUTES } from "../../../config/api";
import { apiRequest } from "../../../services/api/client";
import { ApiError } from "../../../services/api/ApiError";
import {
  extractListTotalFromResponse,
  safeMapListItems,
} from "../../shared/utils/listResponse";
import { appendListQuery } from "../../shared/utils/listQueryParams";
import {
  normalizeProjectReportType,
  PROJECT_REPORT_TYPES,
} from "../utils/projectReportNavigation";

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

function mapSharedSurveyRow(record, index = 0) {
  return {
    id: String(
      pickField(record, ["id", "record_id", "client_id", "clientId"]) ?? index + 1
    ),
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
    surveyStartDate: formatCellValue(
      pickField(record, [
        "survey_start_date",
        "surveyStartDate",
        "Survey_Start_Date",
        "start_date",
        "startDate",
      ])
    ),
    surveyEndDate: formatCellValue(
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
    isTextLink: formatCellValue(
      pickField(record, ["is_text_link", "isTextLink", "Is_Text_Link", "text_link"])
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
  return {
    ...mapSharedSurveyRow(record, index),
    isTestLink: formatCellValue(
      pickField(record, [
        "is_test_link",
        "isTestLink",
        "Is_Test_Link",
        "is_text_link",
        "isTextLink",
      ])
    ),
    multilinkUrl: formatCellValue(
      pickField(record, [
        "multilink_url",
        "multilinkUrl",
        "Multilink_URL",
        "multi_link_url",
        "multiLinkUrl",
      ])
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
  const mapRow =
    REPORT_ROW_MAPPERS[normalizedType] ?? REPORT_ROW_MAPPERS[PROJECT_REPORT_TYPES.PROJECT];
  const items = safeMapListItems(records, mapRow);
  const total = extractListTotalFromResponse(data, items.length);

  return {
    success: true,
    items,
    total,
    page,
    limit,
  };
}

function triggerBlobDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function buildReportDownloadFilename(reportType, projectId) {
  const stamp = new Date().toISOString().slice(0, 10);
  return `${normalizeProjectReportType(reportType)}-report-${projectId}-${stamp}.csv`;
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
  const basePath = API_ROUTES.projects.reportDownload(resolvedProjectId, normalizedType);
  const url = appendListQuery(basePath, {
    extra: supplierId ? { supplierId: String(supplierId).trim() } : {},
  });

  const blob = await apiRequest(url, { responseType: "blob" });
  if (!(blob instanceof Blob)) {
    throw new ApiError("Unable to download report.", null);
  }

  triggerBlobDownload(blob, buildReportDownloadFilename(normalizedType, resolvedProjectId));
}
