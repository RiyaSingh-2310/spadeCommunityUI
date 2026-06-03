const COLUMN_KEY_MAP = {
  "S.No": "sno",
  ID: "id",
  "Profile Image": "profileImage",
  "Partner Code": "partnerCode",
  "Email Address": "emailAddress",
  "Contact Number": "contactNumber",
  "Website URL": "websiteUrl",
  "Project ID": "projectId",
  "Project ID (if won)": "projectId",
  "Client Code": "clientCode",
  "Survey Title": "surveyTitle",
  Title: "title",
  "Template Title": "title",
  Language: "language",
  "Right Answer": "rightAnswer",
  Subject: "subject",
  Date: "date",
  Username: "username",
  "Redeem Points": "redeemPoints",
  "Redeem From": "redeemFrom",
  "Requested Date": "requestedDate",
  "Action Taken On": "actionTakenOn",
  Details: "details",
  "Question Title": "questionTitle",
  "Created Date": "createdDate",
  "Question Type": "questionType",
  "Sort Order": "sortOrder",
};

const NOWRAP_DATA_KEYS = new Set([
  "id",
  "sno",
  "partnerCode",
  "emailAddress",
  "email",
  "projectId",
  "clientCode",
  "code",
  "country",
  "contactNumber",
  "contact",
  "websiteUrl",
  "website",
  "surveyTitle",
  "title",
  "language",
  "rightAnswer",
  "subject",
  "date",
  "username",
  "redeemPoints",
  "redeemFrom",
  "requestedDate",
  "actionTakenOn",
  "questionTitle",
  "createdDate",
  "questionType",
  "sortOrder",
]);

export function getColumnKey(columnLabel) {
  if (COLUMN_KEY_MAP[columnLabel]) {
    return COLUMN_KEY_MAP[columnLabel];
  }
  return columnLabel.toLowerCase().replace(/\s/g, "").replace(/\./g, "");
}

const VALUE_FALLBACKS = {
  emailAddress: ["email"],
  contactNumber: ["contact"],
  websiteUrl: ["website"],
  clientCode: ["code"],
  sno: ["id"],
};

export function getRowValue(row, columnLabel) {
  const key = getColumnKey(columnLabel);
  const keysToTry = [key, ...(VALUE_FALLBACKS[key] || [])];
  for (const k of keysToTry) {
    const value = row[k];
    if (value !== undefined && value !== null && value !== "") {
      return value;
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

export function isProfileImageColumn(columnLabel) {
  return getColumnKey(columnLabel) === "profileimage";
}

export const TABLE_HEAD_BASE =
  "px-4 py-3 text-xs font-semibold uppercase tracking-wide whitespace-nowrap";

export const TABLE_STATUS_COL = "min-w-[140px] w-[140px]";
