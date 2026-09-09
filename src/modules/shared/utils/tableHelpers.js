const COLUMN_KEY_MAP = {
  "S.No": "sno",
  "S. No.": "sno",
  "#": "sno",
  Name: "name",
  "Sender Name": "name",
  "Sender Email": "email",
  "Read Status": "readStatus",
  Country: "country",
  "Email Subject": "emailSubject",
  "Sales Manager": "salesManager",
  LOI: "loi",
  IR: "ir",
  CPI: "cpiRate",
  "Multi Link Count": "multiLinkCount",
  "Link Type": "projectLinkType",
  "Project Link Type": "projectLinkType",
  ID: "id",
  URL: "url",
  "Project Name": "projectName",
  "Client Name": "clientName",
  "Client Code": "clientCode",
  "Start Date": "startDate",
  "End Date": "endDate",
  "Updated Date": "updatedDate",
  "URL Minimum Start Date": "urlMinStartDate",
  "URL Maximum Start Date": "urlMaxStartDate",
  "Project URL Code": "projectUrlCode",
  Client: "client",
  "Invoice Date": "invoiceDate",
  "Due Date": "dueDate",
  "Gross Amount": "grossAmount",
  "Partner Code": "partnerCode",
  "Partner Name": "partnerName",
  "Partner URL": "partnerUrl",
  "Partner Quota": "quota",
  "Allocated Size": "allocatedSize",
  "Email Address": "emailAddress",
  "Email Title": "emailTitle",
  "Email Template": "emailTitle",
  Slug: "slug",
  "Mobile Number": "mobileNumber",
  Question: "question",
  "Answer Opted": "answerOpted",
  Description: "description",
  "Reward Points": "rewardPoints",
  Reason: "reason",
  Date: "date",
  "Contact Number": "contactNumber",
  "Panel Size": "panelSize",
  "Website URL": "websiteUrl",
  "Question Count": "questionCount",
  "Project ID": "projectId",
  "Project ID (if won)": "projectId",
  "Survey Title": "surveyTitle",
  "Group Title": "surveyTitle",
  "Questionnaire Group": "surveyTitle",
  Title: "title",
  "Template Title": "title",
  Language: "language",
  "Right Answer": "rightAnswer",
  Subject: "subject",
  "Date & Time": "dateTime",
  Username: "username",
  "User Name": "userName",
  "Panelist Name": "panelistName",
  "Reward Type": "rewardType",
  "Total Reward Credit": "totalRewardCredit",
  "Total Reward Debit": "totalRewardDebit",
  "Total Reward Balance": "totalRewardBalance",
  "Created At": "createdAt",
  "Redeem Points": "redeemPoints",
  "Redeem From": "redeemFrom",
  "Requested Date": "requestedDate",
  "Action Taken On": "actionTakenOn",
  Details: "details",
  "Question Title": "questionTitle",
  "Created Date": "createdDate",
  "Completed Date": "completedDate",
  "Question Type": "questionType",
  "Sort Order": "sortOrder",
  "Admin Name": "adminName",
  "Admin Email": "adminEmail",
  "Action Type": "actionType",
  "IP Address": "ipAddress",
  "Log Date": "logDate",
};

const NOWRAP_DATA_KEYS = new Set([
  "id",
  "sno",
  "partnerCode",
  "emailAddress",
  "email",
  "projectId",
  "clientCode",
  "projectUrlCode",
  "urlMinStartDate",
  "urlMaxStartDate",
  "code",
  "country",
  "contactNumber",
  "contact",
  "panelSize",
  "websiteUrl",
  "website",
  "url",
  "questionCount",
  "surveyTitle",
  "title",
  "language",
  "rightAnswer",
  "subject",
  "date",
  "username",
  "userName",
  "panelistName",
  "rewardType",
  "totalRewardCredit",
  "totalRewardDebit",
  "totalRewardBalance",
  "createdAt",
  "redeemPoints",
  "redeemFrom",
  "requestedDate",
  "actionTakenOn",
  "questionTitle",
  "createdDate",
  "updatedDate",
  "projectLinkType",
  "completedDate",
  "questionType",
  "sortOrder",
  "projectName",
  "clientName",
  "startDate",
  "endDate",
  "invoiceDate",
  "dueDate",
  "grossAmount",
  "salesManager",
  "emailSubject",
  "slug",
  "loi",
  "ir",
  "cpiRate",
  "startDate",
  "endDate",
  "multiLinkCount",
  "name",
  "email",
  "readStatus",
  "client",
  "adminName",
  "adminEmail",
  "actionType",
  "module",
  "ipAddress",
  "logDate",
]);

import { formatStatusLabel } from "./statusLabels";
import { toUiSentenceCase, UI_SENTENCE_CASE_VALUE_KEYS } from "./uiText";

export function getColumnKey(columnLabel) {
  if (COLUMN_KEY_MAP[columnLabel]) {
    return COLUMN_KEY_MAP[columnLabel];
  }
  return columnLabel.toLowerCase().replace(/\s/g, "").replace(/\./g, "");
}

const VALUE_FALLBACKS = {
  emailAddress: ["email"],
  name: ["senderName"],
  email: ["senderEmail"],
  mobileNumber: ["mobile"],
  emailTitle: ["title"],
  description: ["content"],
  contactNumber: ["contact"],
  websiteUrl: ["website"],
  clientCode: ["code"],
  client: ["clientCode", "clientName", "code"],
  projectUrlCode: ["urlCode", "project_url_code"],
  sno: ["id"],
  surveyTitle: ["title", "groupTitle", "group_title"],
  createdDate: ["createdAt"],
  createdAt: ["createdDate", "date"],
  updatedDate: ["updatedOn", "updated_at", "updatedAt"],
  dateTime: ["datetime", "date", "createdAt", "created_at"],
  credit: ["totalRewardCredit"],
  debit: ["totalRewardDebit"],
  balance: ["totalRewardBalance"],
};

/**
 * Coerce a cell value to a React-safe primitive (avoids "Objects are not valid as a React child").
 * @param {unknown} value
 */
export function formatCellDisplayValue(value) {
  if (value === undefined || value === null || value === "") return "-";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }
  if (Array.isArray(value)) {
    const parts = value
      .map((item) => {
        if (item == null) return "";
        if (typeof item === "string" || typeof item === "number") return String(item);
        if (typeof item === "object") {
          return String(item.label ?? item.name ?? item.title ?? item.code ?? "");
        }
        return "";
      })
      .filter(Boolean);
    return parts.length ? parts.join(", ") : "-";
  }
  if (typeof value === "object") {
    const label = value.label ?? value.name ?? value.title ?? value.code ?? value.Clients;
    if (label != null && label !== "") return String(label);
    return "-";
  }
  return String(value);
}

export function getRowValue(row, columnLabel) {
  if (!row || typeof row !== "object") return "-";
  const key = getColumnKey(columnLabel);
  const keysToTry = [key, ...(VALUE_FALLBACKS[key] || [])];
  for (const k of keysToTry) {
    const value = row[k];
    if (value !== undefined && value !== null && value !== "") {
      if (key === "status" || k === "status") {
        return formatStatusLabel(row.statusLabel ?? value);
      }
      const formatted = formatCellDisplayValue(value);
      if (
        UI_SENTENCE_CASE_VALUE_KEYS.has(key) &&
        typeof formatted === "string" &&
        formatted !== "-"
      ) {
        return toUiSentenceCase(formatted);
      }
      return formatted;
    }
  }
  return "-";
}

export function isNowrapDataColumn(columnLabel) {
  return NOWRAP_DATA_KEYS.has(getColumnKey(columnLabel));
}

export function isStatusColumn(columnLabel) {
  return getColumnKey(columnLabel) === "status";
}

export function isActionColumn(columnLabel) {
  const key = getColumnKey(columnLabel);
  return key === "action" || key === "actions";
}

export function isDetailsColumn(columnLabel) {
  return getColumnKey(columnLabel) === "details";
}

export function isSnoColumn(columnLabel) {
  return getColumnKey(columnLabel) === "sno";
}

export function isIdColumn(columnLabel) {
  return getColumnKey(columnLabel) === "id";
}

export function isCheckboxColumn(columnLabel) {
  return columnLabel === "";
}

export function isDescriptionColumn(columnLabel) {
  return getColumnKey(columnLabel) === "description";
}

export function isProfileImageColumn(columnLabel) {
  return getColumnKey(columnLabel) === "profileimage";
}

/** Shared max-widths (px) for long text that must not expand table columns. */
export const TABLE_ELLIPSIS_PX = Object.freeze({
  title: 250,
  email: 200,
  rightAnswer: 200,
  name: 200,
  url: 280,
  default: 200,
});

const ELLIPSIS_MAX_WIDTH_BY_KEY = {
  surveyTitle: TABLE_ELLIPSIS_PX.title,
  title: TABLE_ELLIPSIS_PX.title,
  questionTitle: TABLE_ELLIPSIS_PX.title,
  emailSubject: TABLE_ELLIPSIS_PX.title,
  subject: TABLE_ELLIPSIS_PX.title,
  projectName: TABLE_ELLIPSIS_PX.title,
  question: TABLE_ELLIPSIS_PX.title,
  reason: TABLE_ELLIPSIS_PX.title,
  emailTitle: TABLE_ELLIPSIS_PX.title,
  clientName: TABLE_ELLIPSIS_PX.title,
  rightAnswer: TABLE_ELLIPSIS_PX.rightAnswer,
  emailAddress: TABLE_ELLIPSIS_PX.email,
  email: TABLE_ELLIPSIS_PX.email,
  name: TABLE_ELLIPSIS_PX.name,
  partnerName: TABLE_ELLIPSIS_PX.name,
  username: TABLE_ELLIPSIS_PX.name,
  userName: TABLE_ELLIPSIS_PX.name,
  panelistName: TABLE_ELLIPSIS_PX.name,
  adminName: TABLE_ELLIPSIS_PX.name,
  adminEmail: TABLE_ELLIPSIS_PX.email,
  slug: TABLE_ELLIPSIS_PX.email,
  answerOpted: TABLE_ELLIPSIS_PX.email,
  client: TABLE_ELLIPSIS_PX.name,
  salesManager: TABLE_ELLIPSIS_PX.name,
  websiteUrl: TABLE_ELLIPSIS_PX.url,
  url: TABLE_ELLIPSIS_PX.url,
  partnerUrl: 260,
  ipAddress: 160,
  partnerCode: 140,
  clientCode: 140,
  projectUrlCode: 160,
};

const ELLIPSIS_SKIP_KEYS = new Set([
  "sno",
  "id",
  "status",
  "action",
  "actions",
  "details",
  "profileimage",
  "description",
  "questionCount",
  "loi",
  "ir",
  "cpiRate",
  "panelSize",
  "allocatedSize",
  "grossAmount",
  "multiLinkCount",
  "sortOrder",
  "sampleSize",
  "rewardPoints",
  "redeemPoints",
  "totalRewardCredit",
  "totalRewardDebit",
  "totalRewardBalance",
  "readStatus",
  "language",
]);

const DATE_LIKE_KEYS = new Set([
  "createdAt",
  "createdDate",
  "updatedDate",
  "startDate",
  "endDate",
  "invoiceDate",
  "dueDate",
  "requestedDate",
  "actionTakenOn",
  "completedDate",
  "logDate",
  "date",
  "dateTime",
  "urlMinStartDate",
  "urlMaxStartDate",
]);

/**
 * Max width in px for a listing column, or null when the cell should not ellipsize.
 * @param {string} columnLabel
 * @returns {number|null}
 */
export function getColumnEllipsisMaxWidthPx(columnLabel) {
  if (
    !columnLabel ||
    isCheckboxColumn(columnLabel) ||
    isActionColumn(columnLabel) ||
    isStatusColumn(columnLabel) ||
    isSnoColumn(columnLabel) ||
    isDetailsColumn(columnLabel) ||
    isProfileImageColumn(columnLabel) ||
    isDescriptionColumn(columnLabel)
  ) {
    return null;
  }

  const key = getColumnKey(columnLabel);
  if (ELLIPSIS_SKIP_KEYS.has(key) || DATE_LIKE_KEYS.has(key)) return null;
  if (ELLIPSIS_MAX_WIDTH_BY_KEY[key] != null) return ELLIPSIS_MAX_WIDTH_BY_KEY[key];
  return TABLE_ELLIPSIS_PX.default;
}

export function getEllipsisCellStyle(maxWidthPx) {
  if (!maxWidthPx) return undefined;
  return {
    maxWidth: `${maxWidthPx}px`,
    "--admin-ellipsis-max": `${maxWidthPx}px`,
  };
}

export function getEllipsisCellClassName(maxWidthPx, extra = "") {
  if (!maxWidthPx) return extra;
  return extra ? `admin-table-ellipsis-cell ${extra}` : "admin-table-ellipsis-cell";
}

export const TABLE_HEAD_BASE =
  "px-4 py-3.5 text-[12px] font-semibold tracking-[0.02em] whitespace-nowrap";

/** Nested / inner tables (expandable rows, detail sections, modals). */
export const ADMIN_TABLE_INNER_CLASS = "admin-table admin-table-inner min-w-full text-sm";

export const ADMIN_TABLE_INNER_SHELL_CLASS = "admin-table-inner-shell";

export const ADMIN_TABLE_EXPANDED_PANEL_CLASS = "admin-table-expanded-panel";

export const TABLE_STATUS_COL = "min-w-[140px] w-[140px]";

export const TABLE_STATUS_COL_COMPACT = "admin-table-status-col-compact";
