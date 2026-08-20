import { PROJECT_REPORT_TYPES } from "./projectReportNavigation";

export const PROJECT_REPORT_COLUMNS = {
  [PROJECT_REPORT_TYPES.PROJECT]: [
    { key: "supplierId", label: "Supplier Id" },
    { key: "supplierName", label: "Supplier Name" },
    { key: "clientId", label: "Client ID" },
    { key: "supplierIdentifier", label: "Supplier Identifier" },
    { key: "status", label: "Status" },
    { key: "surveyStartDate", label: "Survey Start Date" },
    { key: "surveyEndDate", label: "Survey End Date" },
    { key: "loiMinutes", label: "LOI(mins)" },
    { key: "ipAddress", label: "IP Address" },
    { key: "country", label: "Country" },
    { key: "city", label: "City" },
    { key: "isTestLink", label: "Is Test Link" },
  ],
  [PROJECT_REPORT_TYPES.PRESCREEN]: [
    { key: "slNo", label: "Sl.No." },
    { key: "vendorId", label: "Vendor ID" },
    { key: "clientId", label: "Client ID" },
    { key: "ip", label: "IP" },
    { key: "question", label: "Question" },
    { key: "answer", label: "Answer" },
    { key: "status", label: "Status" },
  ],
  [PROJECT_REPORT_TYPES.SUPPLIER]: [
    { key: "partnerId", label: "Partner ID" },
    { key: "partnerName", label: "Partner Name" },
    { key: "clientName", label: "Client Name" },
    { key: "partnersIdentifier", label: "Partner Identifier" },
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

/**
 * @param {string} [reportType]
 */
export function getProjectReportColumns(reportType) {
  return (
    PROJECT_REPORT_COLUMNS[reportType] ??
    PROJECT_REPORT_COLUMNS[PROJECT_REPORT_TYPES.PROJECT]
  );
}
