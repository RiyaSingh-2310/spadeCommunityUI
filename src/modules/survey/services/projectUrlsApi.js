/**
 * Project URLs mock service layer (API-ready shape).
 * Swap implementations for real endpoints later with minimal UI changes.
 */
import {
  getMockPreScreeners,
  getMockProjectUrlByProjectId,
  listMockProjectUrls,
  PROJECT_URL_COUNTRY_OPTIONS,
  PROJECT_URL_LANGUAGE_OPTIONS,
  PROJECT_URL_STATUS_OPTIONS,
  updateMockProjectUrl,
} from "../data/mockProjectUrlsData";
import { delay } from "../data/mockSurveyStore";

export {
  PROJECT_URL_COUNTRY_OPTIONS,
  PROJECT_URL_LANGUAGE_OPTIONS,
  PROJECT_URL_STATUS_OPTIONS,
};

export function createEmptyProjectUrlForm(projectId = "") {
  return {
    projectId: projectId ? String(projectId) : "",
    clientProjectId: "",
    clientUrl: "",
    discussion: "",
    loi: "",
    ir: "",
    country: "",
    language: "",
    cpiRate: "",
    sampleSize: "",
    startDate: "",
    endDate: "",
    status: "Open",
    testLink: "",
    liveLink: "",
    geoLocation: false,
    urlProtection: false,
    uniqueIp: false,
    fraudDetection: false,
    preScreenerId: "",
    completeRewardPoints: "",
    validateRewardPoints: "",
    addedBy: "—",
    addedOn: "—",
    updatedBy: "—",
    updatedOn: "—",
    deletedBy: "—",
    deletedOn: "—",
  };
}

export function mapProjectUrlToForm(record) {
  if (!record) return createEmptyProjectUrlForm();

  return {
    projectId: record.projectId != null ? String(record.projectId) : "",
    clientProjectId: record.clientProjectId ?? "",
    clientUrl: record.clientUrl ?? "",
    discussion: record.discussion ?? "",
    loi: record.loi != null ? String(record.loi) : "",
    ir: record.ir != null ? String(record.ir) : "",
    country: record.country ?? "",
    language: record.language ?? "",
    cpiRate: record.cpiRate != null ? String(record.cpiRate) : "",
    sampleSize: record.sampleSize != null ? String(record.sampleSize) : "",
    startDate: record.startDate ?? "",
    endDate: record.endDate ?? "",
    status: record.status || "Open",
    testLink: record.testLink ?? "",
    liveLink: record.liveLink ?? "",
    geoLocation: Boolean(record.geoLocation),
    urlProtection: Boolean(record.urlProtection),
    uniqueIp: Boolean(record.uniqueIp),
    fraudDetection: Boolean(record.fraudDetection),
    preScreenerId: record.preScreenerId ?? "",
    completeRewardPoints:
      record.completeRewardPoints != null ? String(record.completeRewardPoints) : "",
    validateRewardPoints:
      record.validateRewardPoints != null ? String(record.validateRewardPoints) : "",
    addedBy: record.addedBy || "—",
    addedOn: record.addedOn || "—",
    updatedBy: record.updatedBy || "—",
    updatedOn: record.updatedOn || "—",
    deletedBy: record.deletedBy || "—",
    deletedOn: record.deletedOn || "—",
  };
}

/** Maps GET /api/projects/:id `urlInfo[]` row into the Project URLs form. */
export function mapApiUrlInfoToForm(urlInfo, projectId = "") {
  if (!urlInfo || typeof urlInfo !== "object") {
    return createEmptyProjectUrlForm(projectId);
  }

  const toDate = (value) => {
    if (!value) return "";
    const text = String(value);
    return text.length >= 10 ? text.slice(0, 10) : text;
  };

  return mapProjectUrlToForm({
    projectId: urlInfo.project_id ?? projectId,
    discussion: urlInfo.description ?? "",
    loi: urlInfo["LOI(Minute)"] ?? urlInfo.LOI,
    ir: urlInfo["IR(%)"] ?? urlInfo.IR,
    country: urlInfo.country ?? "",
    language: urlInfo.Language ?? "",
    cpiRate: urlInfo.CPI,
    sampleSize: urlInfo.SampleSize,
    startDate: toDate(urlInfo.Start_Date),
    endDate: toDate(urlInfo.End_Date),
    status: urlInfo.Status === "active" ? "Open" : urlInfo.Status || "Open",
    testLink: urlInfo.Test_Link ?? "",
    liveLink: urlInfo.Live_Link ?? "",
    geoLocation: Boolean(Number(urlInfo.GeoLocation)),
    urlProtection: Boolean(Number(urlInfo.UrlProtection)),
    uniqueIp: Boolean(Number(urlInfo.UniqueIP)),
    preScreenerId: urlInfo.PreScreenid ?? "",
    completeRewardPoints: urlInfo.CompletionPoint,
    validateRewardPoints: urlInfo.TerminationPoint,
    addedBy: urlInfo.action_by || "—",
    addedOn: urlInfo.created_at || "—",
    updatedBy: urlInfo.action_by || "—",
    updatedOn: urlInfo.updated_at || "—",
  });
}

function buildProjectUrlUpdatePayload(form) {
  return {
    clientProjectId: String(form.clientProjectId ?? "").trim(),
    clientUrl: String(form.clientUrl ?? "").trim(),
    discussion: String(form.discussion ?? "").trim(),
    loi: form.loi === "" ? null : Number(form.loi),
    ir: form.ir === "" ? null : Number(form.ir),
    country: String(form.country ?? "").trim(),
    language: String(form.language ?? "").trim(),
    cpiRate: form.cpiRate === "" ? null : Number(form.cpiRate),
    sampleSize: form.sampleSize === "" ? null : Number(form.sampleSize),
    startDate: form.startDate ?? "",
    endDate: form.endDate ?? "",
    status: form.status || "Open",
    testLink: String(form.testLink ?? "").trim(),
    liveLink: String(form.liveLink ?? "").trim(),
    geoLocation: Boolean(form.geoLocation),
    urlProtection: Boolean(form.urlProtection),
    uniqueIp: Boolean(form.uniqueIp),
    fraudDetection: Boolean(form.fraudDetection),
    preScreenerId: form.preScreenerId ?? "",
    completeRewardPoints:
      form.completeRewardPoints === "" ? null : Number(form.completeRewardPoints),
    validateRewardPoints:
      form.validateRewardPoints === "" ? null : Number(form.validateRewardPoints),
  };
}

/** GET project URLs record by survey/project id (mock). */
export async function getProjectUrls(projectId) {
  await delay();
  const record = getMockProjectUrlByProjectId(projectId);
  return {
    success: true,
    data: record,
  };
}

/** PUT/update project URLs (mock persistence). */
export async function updateProjectUrls(projectId, form) {
  await delay(350);
  const payload = buildProjectUrlUpdatePayload(form);
  const record = updateMockProjectUrl(projectId, payload);
  return {
    success: true,
    message: "Project URLs updated successfully.",
    data: record,
  };
}

/** Filtered pre-screener options for Country + Language (mock). */
export async function getPreScreenerOptions({ country, language } = {}) {
  await delay(120);
  return {
    success: true,
    data: getMockPreScreeners({ country, language }),
  };
}

/** Optional listing helper for future multi-URL views. */
export async function listProjectUrls() {
  await delay();
  return {
    success: true,
    data: listMockProjectUrls(),
  };
}
