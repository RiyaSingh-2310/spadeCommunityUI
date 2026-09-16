import { PROJECT_REPORT_TYPES } from "./projectReportNavigation";

export const PROJECT_REPORT_COLUMNS = {
  [PROJECT_REPORT_TYPES.PROJECT]: [
    { key: "supplierId", label: "Supplier ID" },
    { key: "supplierName", label: "Supplier Name" },
    { key: "clientId", label: "Client ID" },
    { key: "uid", label: "UID" },
    { key: "status", label: "Status" },
    { key: "surveyStartDate", label: "Survey Start Date" },
    { key: "surveyEndDate", label: "Survey End Date" },
    { key: "loiMinutes", label: "LOI(mins)" },
    { key: "ipAddress", label: "IP Address" },
    { key: "country", label: "Country" },
    { key: "city", label: "City" },
    { key: "isTestLink", label: "Mode" },
    { key: "ipCountryCode", label: "IP Country Code" },
    { key: "ipCountryName", label: "IP Country Name" },
    { key: "ipStateName", label: "IP State Name" },
    { key: "ipTimeZone", label: "IP Time Zone" },
    { key: "isVpn", label: "Is VPN" },
    { key: "fraudScore", label: "Fraud Score" },
    { key: "fraudRisk", label: "Fraud Risk" },
  ],
  [PROJECT_REPORT_TYPES.PRESCREEN]: [
    { key: "slNo", label: "Sl.No." },
    { key: "uid", label: "UID" },
    { key: "supplierName", label: "Supplier" },
    { key: "projectName", label: "Project / Survey" },
    { key: "partnerName", label: "Partner Name" },
    { key: "clientName", label: "Client Name" },
    { key: "isTestLink", label: "Mode" },
    { key: "status", label: "Pre-Screen Status" },
    { key: "surveyDate", label: "Survey Date" },
    { key: "answerAt", label: "Answer At" },
    { key: "ip", label: "IP" },
    { key: "question", label: "Question" },
    { key: "answer", label: "Answer" },
  ],
  [PROJECT_REPORT_TYPES.FRAUD]: [
    { key: "uid", label: "UID" },
    { key: "projectName", label: "Project / Survey" },
    { key: "supplierName", label: "Supplier" },
    { key: "isTestLink", label: "Test / Live" },
    { key: "ipAddress", label: "IP Address" },
    { key: "fraudScore", label: "Fraud Score" },
    { key: "proxyDetected", label: "Proxy Detected" },
    { key: "vpnVps", label: "VPN / VPS" },
    { key: "isp", label: "ISP" },
    { key: "blockReason", label: "Block Reason" },
    { key: "occurredAt", label: "Date/Time" },
    { key: "status", label: "Final Status / Action" },
  ],
  [PROJECT_REPORT_TYPES.SUPPLIER]: [
    { key: "partnerId", label: "Partner ID" },
    { key: "partnerName", label: "Partner Name" },
    { key: "clientName", label: "Client Name" },
    { key: "uid", label: "UID" },
    { key: "status", label: "Status" },
    { key: "surveyStartDate", label: "Survey Start Date" },
    { key: "surveyEndDate", label: "Survey End Date" },
    { key: "loi", label: "LOI" },
    { key: "ipAddress", label: "IP Address" },
    { key: "geoLocation", label: "Geo Location" },
    { key: "isTestLink", label: "Test Link" },
    { key: "finalIp", label: "Final IP" },
    { key: "multiLinkUrl", label: "Multi Link" },
  ],
};

PROJECT_REPORT_COLUMNS[PROJECT_REPORT_TYPES.TEST] =
  PROJECT_REPORT_COLUMNS[PROJECT_REPORT_TYPES.PROJECT];

/**
 * @param {string} [reportType]
 */
export function getProjectReportColumns(reportType) {
  return (
    PROJECT_REPORT_COLUMNS[reportType] ??
    PROJECT_REPORT_COLUMNS[PROJECT_REPORT_TYPES.PROJECT]
  );
}
