/**
 * Project URLs service layer (API-ready shape).
 * Updates go through PUT /api/projects/:id (project fields + URL fields).
 */
import { ApiError } from "../../../services/api/ApiError";
import {
  createMockProjectUrl,
  deleteMockProjectUrl,
  getMockPreScreeners,
  getMockProjectUrlById,
  listMockProjectUrls,
  listMockProjectUrlsByProjectId,
  PROJECT_URL_COUNTRY_OPTIONS,
  PROJECT_URL_LANGUAGE_OPTIONS,
  PROJECT_URL_STATUS_OPTIONS,
  updateMockProjectUrl,
  updateMockProjectUrlById,
} from "../data/mockProjectUrlsData";
import { delay } from "../data/mockSurveyStore";
import { getRecords as getQuestionnaireGroups } from "../../../services/questionnaire-group/questionnaireGroupApi";
import { PRESCREEN_LANGUAGES } from "../../prescreen/data/prescreenLanguages";
import {
  getRecord,
  mapSurveyToProjectDetails,
  updateProjectUrlsViaProjectApi,
} from "./surveyApi";

export {
  PROJECT_URL_COUNTRY_OPTIONS,
  PROJECT_URL_LANGUAGE_OPTIONS,
  PROJECT_URL_STATUS_OPTIONS,
  PRESCREEN_LANGUAGES as PROJECT_URL_PRESCREEN_LANGUAGES,
};

/** Toggle when Project URLs should fall back to local mock store. */
const USE_PROJECT_URLS_MOCK = false;

export function createEmptyProjectUrlForm(projectId = "") {
  return {
    id: "",
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
    preScreen: false,
    surveyGroupId: "",
    preScreenerId: "",
    completeRewardPoints: "",
    validateRewardPoints: "",
    redirectComplete: "",
    redirectTerminate: "",
    redirectOverQuota: "",
    redirectQualityTerm: "",
    redirectSurveyClose: "",
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

  const surveyGroupId =
    record.surveyGroupId ?? record.preScreenerId ?? record.pre_screener_id ?? "";
  const preScreen = Boolean(record.preScreen) || Boolean(surveyGroupId);

  return {
    id: record.id != null ? String(record.id) : "",
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
    preScreen,
    surveyGroupId: surveyGroupId ? String(surveyGroupId) : "",
    preScreenerId: surveyGroupId ? String(surveyGroupId) : "",
    completeRewardPoints:
      record.completeRewardPoints != null ? String(record.completeRewardPoints) : "",
    validateRewardPoints:
      record.validateRewardPoints != null ? String(record.validateRewardPoints) : "",
    redirectComplete: record.redirectComplete ?? "",
    redirectTerminate: record.redirectTerminate ?? "",
    redirectOverQuota: record.redirectOverQuota ?? "",
    redirectQualityTerm: record.redirectQualityTerm ?? "",
    redirectSurveyClose: record.redirectSurveyClose ?? "",
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

  const rawLanguage = String(urlInfo.Language ?? urlInfo.language ?? "").trim();
  const matchedLanguage =
    PRESCREEN_LANGUAGES.find(
      (lang) => lang.toLowerCase() === rawLanguage.toLowerCase()
    ) || rawLanguage;

  const rawStatus = String(urlInfo.Status ?? urlInfo.url_status ?? urlInfo.status ?? "").trim();
  const status =
    rawStatus.toLowerCase() === "active" || rawStatus.toLowerCase() === "open"
      ? "Open"
      : rawStatus || "Open";

  return mapProjectUrlToForm({
    id: urlInfo.id ?? urlInfo.url_id ?? urlInfo.project_url_id ?? "",
    projectId: urlInfo.project_id ?? projectId,
    discussion: urlInfo.description ?? "",
    loi: urlInfo["LOI(Minute)"] ?? urlInfo.LOI ?? urlInfo.loi,
    ir: urlInfo["IR(%)"] ?? urlInfo.IR ?? urlInfo.ir,
    country: urlInfo.country ?? "",
    language: matchedLanguage,
    cpiRate: urlInfo.CPI ?? urlInfo.cpi,
    sampleSize: urlInfo.SampleSize ?? urlInfo.sample_size,
    startDate: toDate(urlInfo.Start_Date ?? urlInfo.start_date),
    endDate: toDate(urlInfo.End_Date ?? urlInfo.end_date),
    status,
    testLink: urlInfo.Test_Link ?? urlInfo.test_link ?? "",
    liveLink: urlInfo.Live_Link ?? urlInfo.live_link ?? "",
    geoLocation: Boolean(Number(urlInfo.GeoLocation ?? urlInfo.geo_location)),
    urlProtection: Boolean(Number(urlInfo.UrlProtection ?? urlInfo.url_protection)),
    uniqueIp: Boolean(Number(urlInfo.UniqueIP ?? urlInfo.unique_ip)),
    fraudDetection: Boolean(Number(urlInfo.FraudDetection ?? urlInfo.fraud_detection)),
    preScreen: Boolean(
      Number(urlInfo.PreScreen ?? urlInfo.pre_screen ?? urlInfo.PreScreenid)
    ),
    preScreenerId: urlInfo.PreScreenid ?? urlInfo.pre_screener_id ?? "",
    completeRewardPoints: urlInfo.CompletionPoint ?? urlInfo.completion_point,
    validateRewardPoints: urlInfo.TerminationPoint ?? urlInfo.termination_point,
    addedBy: urlInfo.action_by || "—",
    addedOn: urlInfo.created_at || "—",
    updatedBy: urlInfo.action_by || "—",
    updatedOn: urlInfo.updated_at || "—",
  });
}

function buildProjectUrlUpdatePayload(form) {
  const surveyGroupId = form.preScreen
    ? String(form.surveyGroupId ?? form.preScreenerId ?? "").trim()
    : "";

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
    preScreen: Boolean(form.preScreen),
    surveyGroupId,
    preScreenerId: surveyGroupId,
    completeRewardPoints:
      form.completeRewardPoints === "" ? null : Number(form.completeRewardPoints),
    validateRewardPoints:
      form.validateRewardPoints === "" ? null : Number(form.validateRewardPoints),
    redirectComplete: String(form.redirectComplete ?? "").trim(),
    redirectTerminate: String(form.redirectTerminate ?? "").trim(),
    redirectOverQuota: String(form.redirectOverQuota ?? "").trim(),
    redirectQualityTerm: String(form.redirectQualityTerm ?? "").trim(),
    redirectSurveyClose: String(form.redirectSurveyClose ?? "").trim(),
  };
}

/** GET all Project URL configs for a project. Prefers GET /api/projects/:id `urlInfo`. */
export async function listProjectUrlsByProject(projectId) {
  if (!USE_PROJECT_URLS_MOCK) {
    try {
      const record = await getRecord(projectId);
      const details = mapSurveyToProjectDetails(record);
      const urlInfo = Array.isArray(details?.urlInfo) ? details.urlInfo : [];
      const rows =
        urlInfo.length > 0
          ? urlInfo.map((row) => mapApiUrlInfoToForm(row, projectId))
          : [createEmptyProjectUrlForm(projectId)];
      return {
        success: true,
        data: rows,
        project: details,
      };
    } catch (error) {
      if (error instanceof ApiError && error.status) {
        throw error;
      }
      // Fall through to mock if the record shape is unexpected.
    }
  }

  await delay();
  return {
    success: true,
    data: listMockProjectUrlsByProjectId(projectId),
  };
}

/** GET single Project URL record. Legacy helper. */
export async function getProjectUrls(projectId) {
  const response = await listProjectUrlsByProject(projectId);
  return {
    success: true,
    data: Array.isArray(response?.data) ? response.data[0] ?? null : null,
  };
}

/** PUT/update a Project URL by url id (mock). */
export async function updateProjectUrlById(urlId, form) {
  await delay(350);
  const payload = buildProjectUrlUpdatePayload(form);
  const record = updateMockProjectUrlById(urlId, payload);
  if (!record) {
    return {
      success: false,
      message: "Project URL not found.",
      data: null,
    };
  }
  return {
    success: true,
    message: "Project URLs updated successfully.",
    data: record,
  };
}

/**
 * PUT /api/projects/:id — persists Project URLs as part of the project update contract.
 * @param {string|number} projectId
 * @param {object} form
 * @param {{ project?: object }} [options] Mapped project details for identity fields
 */
export async function updateProjectUrls(projectId, form, options = {}) {
  if (!USE_PROJECT_URLS_MOCK) {
    let project = options.project;
    if (!project) {
      const record = await getRecord(projectId);
      project = mapSurveyToProjectDetails(record) ?? {};
    }
    return updateProjectUrlsViaProjectApi(projectId, project, form);
  }

  if (form?.id) {
    return updateProjectUrlById(form.id, form);
  }
  await delay(350);
  const payload = buildProjectUrlUpdatePayload(form);
  const record = updateMockProjectUrl(projectId, payload);
  return {
    success: true,
    message: "Project updated successfully!",
    data: record,
  };
}

/** Create a new Project URL config under a project (mock). */
export async function createProjectUrl(projectId, form = {}) {
  await delay(350);
  const payload = buildProjectUrlUpdatePayload({
    ...createEmptyProjectUrlForm(projectId),
    ...form,
    status: form.status || "Open",
  });
  const record = createMockProjectUrl(projectId, payload);
  return {
    success: true,
    message: "Project URL created successfully.",
    data: record,
  };
}

/** Delete a Project URL config (mock). */
export async function deleteProjectUrl(urlId) {
  await delay(200);
  const removed = deleteMockProjectUrl(urlId);
  return {
    success: removed,
    message: removed ? "Project URL deleted successfully." : "Project URL not found.",
  };
}

export async function getProjectUrlById(urlId) {
  await delay();
  return {
    success: true,
    data: getMockProjectUrlById(urlId),
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

/**
 * Survey groups for Pre-Screen, filtered by selected language.
 * Uses Questionnaire Group list API with mock fallback.
 */
export async function getSurveyGroupOptionsForLanguage(language) {
  const languageKey = String(language ?? "").trim().toLowerCase();
  if (!languageKey) {
    return { success: true, data: [] };
  }

  try {
    const response = await getQuestionnaireGroups({ page: 1, limit: 500 });
    const items = Array.isArray(response?.items) ? response.items : [];
    const options = items
      .filter(
        (item) =>
          String(item.language ?? "")
            .trim()
            .toLowerCase() === languageKey
      )
      .map((item) => ({
        value: String(item.id),
        label: String(item.title || item.surveyTitle || item.id),
      }))
      .filter((option) => option.value && option.label);

    if (options.length > 0) {
      return { success: true, data: options };
    }
  } catch {
    // Fall through to mock options.
  }

  await delay(120);
  const mockOptions = getMockPreScreeners({ language }).map((item) => ({
    value: item.value,
    label: item.label,
  }));
  return { success: true, data: mockOptions };
}

/** Optional listing helper for future multi-URL views. */
export async function listProjectUrls() {
  await delay();
  return {
    success: true,
    data: listMockProjectUrls(),
  };
}
