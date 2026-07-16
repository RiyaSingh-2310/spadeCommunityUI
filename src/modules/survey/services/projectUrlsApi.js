/**
 * Project URLs service layer (API-ready shape).
 * Create: POST /api/projects/:id/url
 * Update: PUT /api/projects/:id (project fields + URL fields).
 */
import { API_ROUTES } from "../../../config/api";
import { apiRequest } from "../../../services/api/client";
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
import { parseUtcToIst } from "../../shared/utils/dateTime";
import {
  getRecord,
  mapSurveyToProjectDetails,
  updateProjectUrlsViaProjectApi,
} from "./surveyApi";
import { normalizeProjectUrlStatus } from "../utils/projectUrlFormValidation";

function pickUrlInfoField(urlInfo, keys) {
  if (!urlInfo || typeof urlInfo !== "object") return undefined;
  for (const key of keys) {
    const value = urlInfo[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return undefined;
}

function toFormDateValue(value) {
  if (!value) return "";
  const text = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10);
  const ist = parseUtcToIst(value);
  return ist ? ist.format("YYYY-MM-DD") : text.slice(0, 10);
}

function toFormNumberValue(value) {
  if (value === null || value === undefined || value === "") return "";
  return String(value);
}

function resolveUrlRecordId(urlInfo) {
  const id =
    urlInfo?.id ?? urlInfo?.url_id ?? urlInfo?.project_url_id ?? urlInfo?.Url_Id ?? "";
  return id != null && id !== "" ? String(id) : "";
}

export {
  PROJECT_URL_COUNTRY_OPTIONS,
  PROJECT_URL_LANGUAGE_OPTIONS,
  PROJECT_URL_STATUS_OPTIONS,
  PRESCREEN_LANGUAGES as PROJECT_URL_PRESCREEN_LANGUAGES,
};

/** Toggle when Project URLs should fall back to local mock store. */
const USE_PROJECT_URLS_MOCK = false;

function assertSuccess(data) {
  if (data?.success !== true) {
    throw new ApiError(data?.message ?? "", data);
  }
  return data;
}

function normalizeProjectId(id) {
  const normalizedId = String(id ?? "").trim();
  if (!normalizedId || normalizedId === "undefined" || normalizedId === "null") {
    throw new ApiError("", null);
  }
  return encodeURIComponent(normalizedId);
}

function toApiNumber(value) {
  if (value === "" || value == null) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function toApiFlag(value) {
  return value ? 1 : 0;
}

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
    status: normalizeProjectUrlStatus(record.status),
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

  const rawLanguage = String(
    pickUrlInfoField(urlInfo, ["Language", "language"]) ?? ""
  ).trim();
  const matchedLanguage =
    PRESCREEN_LANGUAGES.find(
      (lang) => lang.toLowerCase() === rawLanguage.toLowerCase()
    ) || rawLanguage;

  const rawStatus = String(
    pickUrlInfoField(urlInfo, ["Status", "url_status", "status"]) ?? ""
  ).trim();
  const status = normalizeProjectUrlStatus(rawStatus);

  const rawCountry = String(pickUrlInfoField(urlInfo, ["country", "Country"]) ?? "").trim();
  const matchedCountry =
    PROJECT_URL_COUNTRY_OPTIONS.find(
      (country) => country.toLowerCase() === rawCountry.toLowerCase()
    ) || rawCountry;

  const preScreenerId = pickUrlInfoField(urlInfo, [
    "PreScreenid",
    "pre_screener_id",
    "preScreenerId",
    "survey_group_id",
    "surveyGroupId",
  ]);
  const preScreenFlag = pickUrlInfoField(urlInfo, [
    "PreScreen",
    "pre_screen",
    "preScreen",
  ]);

  return mapProjectUrlToForm({
    id: resolveUrlRecordId(urlInfo),
    projectId: urlInfo.project_id ?? projectId,
    discussion: pickUrlInfoField(urlInfo, ["description", "Description"]) ?? "",
    loi: pickUrlInfoField(urlInfo, ["LOI(Minute)", "LOI", "loi"]),
    ir: pickUrlInfoField(urlInfo, ["IR(%)", "IR", "ir"]),
    country: matchedCountry,
    language: matchedLanguage,
    cpiRate: pickUrlInfoField(urlInfo, ["CPI", "cpi", "cpiRate"]),
    sampleSize: pickUrlInfoField(urlInfo, ["SampleSize", "sample_size", "sampleSize"]),
    startDate: toFormDateValue(
      pickUrlInfoField(urlInfo, ["Start_Date", "start_date", "Start Date", "startDate"])
    ),
    endDate: toFormDateValue(
      pickUrlInfoField(urlInfo, ["End_Date", "end_date", "End Date", "endDate"])
    ),
    status,
    testLink: pickUrlInfoField(urlInfo, ["Test_Link", "test_link", "testLink"]) ?? "",
    liveLink: pickUrlInfoField(urlInfo, ["Live_Link", "live_link", "liveLink"]) ?? "",
    geoLocation: Boolean(
      Number(pickUrlInfoField(urlInfo, ["GeoLocation", "geo_location", "geoLocation"]) ?? 0)
    ),
    urlProtection: Boolean(
      Number(pickUrlInfoField(urlInfo, ["UrlProtection", "url_protection", "urlProtection"]) ?? 0)
    ),
    uniqueIp: Boolean(
      Number(pickUrlInfoField(urlInfo, ["UniqueIP", "unique_ip", "uniqueIp"]) ?? 0)
    ),
    fraudDetection: Boolean(
      Number(
        pickUrlInfoField(urlInfo, ["FraudDetection", "fraud_detection", "fraudDetection"]) ?? 0
      )
    ),
    preScreen: Boolean(Number(preScreenFlag ?? 0)) || Boolean(preScreenerId),
    preScreenerId: preScreenerId != null ? String(preScreenerId) : "",
    completeRewardPoints: toFormNumberValue(
      pickUrlInfoField(urlInfo, ["CompletionPoint", "completion_point", "completeRewardPoints"])
    ),
    validateRewardPoints: toFormNumberValue(
      pickUrlInfoField(urlInfo, [
        "ValidatePoint",
        "validate_point",
        "validateRewardPoints",
        "TerminationPoint",
        "termination_point",
      ])
    ),
    redirectComplete:
      pickUrlInfoField(urlInfo, [
        "CompleteURL",
        "Complete URL",
        "complete_url",
        "completeUrl",
        "redirectComplete",
      ]) ?? "",
    redirectTerminate:
      pickUrlInfoField(urlInfo, [
        "TerminateURL",
        "Terminated URL",
        "terminate_url",
        "terminateUrl",
        "redirectTerminate",
      ]) ?? "",
    redirectOverQuota:
      pickUrlInfoField(urlInfo, [
        "OverQuotaURL",
        "Over Quota URL",
        "over_quota_url",
        "overQuotaUrl",
        "redirectOverQuota",
      ]) ?? "",
    redirectQualityTerm:
      pickUrlInfoField(urlInfo, [
        "QualityTermURL",
        "Quality Term URL",
        "quality_term_url",
        "qualityTermUrl",
        "redirectQualityTerm",
      ]) ?? "",
    redirectSurveyClose:
      pickUrlInfoField(urlInfo, [
        "SurveyCloseURL",
        "Survey Closed URL",
        "survey_close_url",
        "surveyCloseUrl",
        "redirectSurveyClose",
      ]) ?? "",
    addedBy: urlInfo.action_by || "—",
    addedOn: urlInfo.created_at || "—",
    updatedBy: urlInfo.action_by || "—",
    updatedOn: urlInfo.updated_at || "—",
  });
}

/**
 * Loads a single Project URL form for edit from GET /api/projects/:id `urlInfo`.
 * @param {string|number} projectId
 * @param {string|number} urlId
 */
export async function getProjectUrlFormForEdit(projectId, urlId) {
  const normalizedUrlId = String(urlId ?? "").trim();
  if (!normalizedUrlId) return null;

  if (USE_PROJECT_URLS_MOCK) {
    await delay();
    const record = getMockProjectUrlById(normalizedUrlId);
    return record ? mapProjectUrlToForm(record) : null;
  }

  const record = await getRecord(projectId);
  const urlInfo = Array.isArray(record?.urlInfo) ? record.urlInfo : [];
  const raw = urlInfo.find((row) => resolveUrlRecordId(row) === normalizedUrlId);
  return raw ? mapApiUrlInfoToForm(raw, projectId) : null;
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

/**
 * Builds POST /api/projects/:id/url body from the Project URL form.
 * Matches the create Project URL API contract.
 * @param {object} form
 */
export function buildCreateProjectUrlApiPayload(form = {}) {
  return {
    description: String(form.discussion ?? "").trim(),
    LOI: toApiNumber(form.loi),
    IR: toApiNumber(form.ir),
    country: String(form.country ?? "").trim(),
    CPI: toApiNumber(form.cpiRate ?? form.cpi),
    SampleSize: toApiNumber(form.sampleSize),
    Start_Date: form.startDate || "",
    End_Date: form.endDate || "",
    Status: form.status || "Open",
    Live_Link: String(form.liveLink ?? "").trim(),
    Test_Link: String(form.testLink ?? "").trim(),
    GeoLocation: toApiFlag(form.geoLocation),
    UrlProtection: toApiFlag(form.urlProtection),
    UniqueIP: toApiFlag(form.uniqueIp),
    FraudDetection: toApiFlag(form.fraudDetection),
    PreScreen: toApiFlag(form.preScreen),
    CompleteURL: String(form.redirectComplete ?? "").trim(),
    TerminateURL: String(form.redirectTerminate ?? "").trim(),
    OverQuotaURL: String(form.redirectOverQuota ?? "").trim(),
    QualityTermURL: String(form.redirectQualityTerm ?? "").trim(),
    SurveyCloseURL: String(form.redirectSurveyClose ?? "").trim(),
    CompletionPoint: toApiNumber(form.completeRewardPoints),
    ValidatePoint: toApiNumber(form.validateRewardPoints),
  };
}

/** GET all Project URL configs for a project. Prefers GET /api/projects/:id `urlInfo`. */
export async function listProjectUrlsByProject(projectId) {
  if (!USE_PROJECT_URLS_MOCK) {
    try {
      const record = await getRecord(projectId);
      const urlInfo = Array.isArray(record?.urlInfo) ? record.urlInfo : [];
      const rows =
        urlInfo.length > 0
          ? urlInfo.map((row) => mapApiUrlInfoToForm(row, projectId))
          : [];
      const details = mapSurveyToProjectDetails(record);
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

/**
 * POST /api/projects/:id/url — create a Project URL config under a project.
 * @param {string|number} projectId
 * @param {object} form
 */
export async function createProjectUrl(projectId, form = {}) {
  const payload = buildCreateProjectUrlApiPayload({
    ...createEmptyProjectUrlForm(projectId),
    ...form,
    status: form.status || "Open",
  });

  if (USE_PROJECT_URLS_MOCK) {
    await delay(350);
    const record = createMockProjectUrl(projectId, {
      ...buildProjectUrlUpdatePayload({
        ...createEmptyProjectUrlForm(projectId),
        ...form,
        status: form.status || "Open",
      }),
    });
    return {
      success: true,
      message: "Project URL added successfully!",
      data: { id: record.id },
    };
  }

  const normalizedId = normalizeProjectId(projectId);
  const data = await apiRequest(API_ROUTES.projects.createUrl(normalizedId), {
    method: "POST",
    body: payload,
  });
  return assertSuccess(data);
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
