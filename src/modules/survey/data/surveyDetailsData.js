export const PROJECT_STATUS_OPTIONS = ["Active", "Paused", "Invoiced", "Closed"];

export const SUPPLIER_OPTIONS = [
  { code: "P1028", name: "Social Media" },
  { code: "P1032", name: "Amreendra" },
];

const LIVE_BASE = "https://speed-community.com/survey/live";
const TEST_BASE = "https://speed-community.com/survey/test";

/**
 * @param {string | undefined} id
 */
export function getSurveyProjectDetails(id) {
  const numId = Number(String(id).replace(/\D/g, "")) || 1;

  return {
    id: String(id ?? `SV-${1000 + numId}`),
    projectStatus: PROJECT_STATUS_OPTIONS[numId % PROJECT_STATUS_OPTIONS.length],
    clientName: "Alpha Corp International",
    projectName: "Brand Tracker Q2 2026",
    projectManager: "Priya Desai",
    projectCountry: "United States",
    description:
      "Quarterly brand tracking study measuring awareness, consideration, and NPS across key demographic segments.",
    surveyId: `SRV-${10000 + numId}`,
    salesManager: "Arun Kumar",
    salesProject: "SP-2026-014",
    loiMinutes: 15,
    irPercent: 35,
    sampleSize: 1000,
    cpiUsd: "2.50",
    startDate: "01/03/2026",
    endDate: "30/04/2026",
    liveLink: `${LIVE_BASE}/${id ?? numId}`,
    testLink: `${TEST_BASE}/${id ?? numId}`,
    filters: {
      geolocation: true,
      urlProtection: true,
      uniqueIp: false,
      prescreen: true,
    },
    redirectLinks: {
      complete: `${LIVE_BASE}/redirect/complete?id=${numId}`,
      terminate: `${LIVE_BASE}/redirect/terminate?id=${numId}`,
      overQuota: `${LIVE_BASE}/redirect/over-quota?id=${numId}`,
      qualityTerm: `${LIVE_BASE}/redirect/quality-term?id=${numId}`,
      surveyClose: `${LIVE_BASE}/redirect/survey-close?id=${numId}`,
    },
    note: "Ensure supplier postbacks are validated before go-live. Test links expire 48 hours after creation unless extended by PM.",
  };
}

export function getSupplierMappedLiveRows() {
  return [
    {
      sno: 1,
      supplierCode: "P1028",
      supplierName: "Social Media",
      totalRespondent: 420,
      complete: 310,
      dropout: 45,
      terminate: 32,
      overQuota: 18,
      qualityTerm: 10,
      surveyClose: 5,
    },
    {
      sno: 2,
      supplierCode: "P1032",
      supplierName: "Amreendra",
      totalRespondent: 380,
      complete: 290,
      dropout: 40,
      terminate: 28,
      overQuota: 12,
      qualityTerm: 7,
      surveyClose: 3,
    },
  ];
}

export function getSupplierMappedTestRows() {
  return getSupplierMappedLiveRows().map((row) => ({
    sno: row.sno,
    supplierCode: row.supplierCode,
    supplierName: row.supplierName,
    totalRespondent: 42,
    complete: 31,
    dropout: 5,
    terminate: 3,
    overQuota: 2,
    qualityTerm: 1,
  }));
}

export function getSupplierLinksRows() {
  return [
    {
      sno: 1,
      supplierCode: "P1028",
      supplierName: "Social Media",
      link: "https://speed-community.com/do-survey/p1028/live",
      supplierQuota: 500,
      cpi: "2.50",
      costRatio: "1.00",
      loiMinutes: 15,
      ir: "35%",
    },
    {
      sno: 2,
      supplierCode: "P1032",
      supplierName: "Amreendra",
      link: "https://speed-community.com/do-survey/p1032/live",
      supplierQuota: 500,
      cpi: "2.45",
      costRatio: "0.98",
      loiMinutes: 15,
      ir: "35%",
    },
  ];
}

export function getSupplierMappingRows() {
  return [
    {
      sno: 1,
      supplierCode: "P1028",
      supplierName: "Social Media",
      quota: 500,
      cpi: "2.50",
      supplierUrl: "https://speed-community.com/do-survey/p1028/live?pid=xxxxx",
      status: "Active",
    },
    {
      sno: 2,
      supplierCode: "P1032",
      supplierName: "Amreendra",
      quota: 500,
      cpi: "2.45",
      supplierUrl: "https://speed-community.com/do-survey/p1032/live?pid=yyyyy",
      status: "Inactive",
    },
  ];
}

/**
 * @param {string} supplierCode
 */
export function getSupplierMappingDetail(supplierCode) {
  const base = getSupplierMappingRows().find((r) => r.supplierCode === supplierCode);
  if (!base) return null;

  return {
    supplierName: base.supplierName,
    supplierQuota: base.quota,
    cpi: base.cpi,
    complete: 310,
    terminate: 32,
    overQuota: 18,
    qualityTerm: 10,
    surveyClose: 5,
    postbackUrl: `https://speed-community.com/postback/${supplierCode}`,
    vendorUrl: base.supplierUrl,
  };
}

/**
 * @param {string} supplierCode
 */
export function getSupplierEditForm(supplierCode) {
  const row = getSupplierMappingRows().find((r) => r.supplierCode === supplierCode);
  if (!row) return null;

  return {
    supplierCode: row.supplierCode,
    supplierName: row.supplierName,
    supplierQuota: row.quota,
    cpi: row.cpi,
    redirects: {
      complete: `https://speed-community.com/redirect/${supplierCode}/complete`,
      terminate: `https://speed-community.com/redirect/${supplierCode}/terminate`,
      overQuota: `https://speed-community.com/redirect/${supplierCode}/over-quota`,
      qualityTerm: `https://speed-community.com/redirect/${supplierCode}/quality-term`,
      surveyClose: `https://speed-community.com/redirect/${supplierCode}/survey-close`,
      postbackUrl: `https://speed-community.com/postback/${supplierCode}`,
    },
  };
}
