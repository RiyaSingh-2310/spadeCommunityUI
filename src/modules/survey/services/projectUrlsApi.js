/**
 * Project URLs service layer (API-ready shape).
 * Create: POST /api/projects/:id/url
 * Update: PUT /api/projects/url/:urlId
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
import { MAX_API_LIST_LIMIT } from "../../shared/utils/listQueryParams";
import {
  getRecord,
  mapSurveyToProjectDetails,
} from "./surveyApi";
import { normalizeProjectUrlStatus, normalizeProjectUrlFormForState } from "../utils/projectUrlFormValidation";
import { dedupeSelectOptions } from "../utils/dedupeSelectOptions";

function normalizeUrlInfoList(record) {
  const info = record?.urlInfo;
  if (Array.isArray(info)) return info;
  if (info && typeof info === "object") return [info];
  return [];
}

function pickUrlInfoField(source, keys) {
  if (!source || typeof source !== "object") return undefined;
  for (const key of keys) {
    const value = source[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return undefined;
}

function pickRedirectField(urlInfo, projectRecord, formKeys, projectKeys) {
  return (
    pickUrlInfoField(urlInfo, formKeys) ??
    pickUrlInfoField(projectRecord, projectKeys) ??
    ""
  );
}

/**
 * Fills empty target fields from a fallback form without overwriting populated values.
 * @param {object} target
 * @param {object | null | undefined} fallback
 */
export function mergeProjectUrlForms(target, fallback) {
  if (!target || !fallback || typeof fallback !== "object") return target;
  const merged = { ...target };
  for (const key of Object.keys(merged)) {
    if (typeof merged[key] === "boolean") continue;
    const current = merged[key];
    const fallbackValue = fallback[key];
    if (
      (current === "" || current == null) &&
      fallbackValue !== "" &&
      fallbackValue != null
    ) {
      merged[key] = fallbackValue;
    }
  }
  return merged;
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

/**
 * Resolves the Project URL record id used by PUT /api/projects/url/:urlId.
 * Prefer url-specific keys over generic `id`, which may be the project id.
 */
export function resolveProjectUrlRecordId(urlInfo) {
  if (!urlInfo || typeof urlInfo !== "object") return "";

  const candidates = [
    urlInfo.url_id,
    urlInfo.Url_Id,
    urlInfo.URL_Id,
    urlInfo.project_url_id,
    urlInfo.Project_Url_Id,
    urlInfo.projectUrlId,
    urlInfo.id,
  ];

  for (const value of candidates) {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value).trim();
    }
  }

  return "";
}

function resolveUrlRecordId(urlInfo) {
  return resolveProjectUrlRecordId(urlInfo);
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

function normalizeUrlId(urlId) {
  const normalizedId = String(urlId ?? "").trim();
  if (!normalizedId || normalizedId === "undefined" || normalizedId === "null") {
    throw new ApiError("Project URL ID is required.", null);
  }
  return encodeURIComponent(normalizedId);
}

function toApiNumber(value) {
  if (value === "" || value == null) return undefined;
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
}

function toApiFlag(value) {
  return value ? 1 : 0;
}

function normalizeLinkMode(value) {
  const mode = String(value ?? "test").trim().toLowerCase();
  return mode === "live" ? "live" : "test";
}

/** Normalizes Project_Link_Type from API / form values to "Single Link" | "Multi Link". */
export function normalizeProjectLinkType(value) {
  const normalized = String(value ?? "")
    .toLowerCase()
    .trim()
    .replace(/[\s_-]+/g, "");
  if (!normalized || normalized === "—" || normalized === "-" || normalized === "null") {
    return "Single Link";
  }
  if (normalized === "multilink" || normalized === "multi") return "Multi Link";
  return "Single Link";
}

/** Maps form link type to the Project URL API enum: SingleLink | MultiLink. */
export function projectLinkTypeToApi(value) {
  return normalizeProjectLinkType(value) === "Multi Link" ? "MultiLink" : "SingleLink";
}

/** Removes undefined keys so the API receives only populated fields. */
function compactApiPayload(payload) {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined)
  );
}

export function createEmptyProjectUrlForm(projectId = "") {
  return {
    id: "",
    projectId: projectId ? String(projectId) : "",
    projectUrlCode: "",
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
    projectLinkType: "Single Link",
    linkMode: "test",
    testLink: "",
    liveLink: "",
    geoLocation: false,
    urlProtection: false,
    uniqueIp: false,
    fraudDetection: false,
    preScreen: false,
    surveyGroupId: "",
    preScreenerId: "",
    preScreenerName: "",
    completeRewardPoints: "",
    terminationRewardPoints: "",
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
    projectUrlCode: String(
      record.projectUrlCode ?? record.project_url_code ?? record.urlCode ?? ""
    ).trim(),
    clientProjectId: record.clientProjectId ?? "",
    clientUrl: record.clientUrl ?? "",
    discussion: record.discussion ?? "",
    loi: record.loi != null ? String(record.loi) : "",
    ir: record.ir != null ? String(record.ir) : "",
    country: record.country ?? "",
    language: record.language ?? "",
    cpiRate: record.cpiRate != null ? String(record.cpiRate) : "",
    sampleSize: record.sampleSize != null ? String(record.sampleSize) : "",
    multiLinkCount:
      record.multiLinkCount != null ? String(record.multiLinkCount) : "",
    startDate: record.startDate ?? "",
    endDate: record.endDate ?? "",
    status: normalizeProjectUrlStatus(record.status),
    projectLinkType: normalizeProjectLinkType(
      record.projectLinkType ??
        record.Project_Link_Type ??
        record.project_link_type
    ),
    linkMode: normalizeLinkMode(record.linkMode ?? record.link_mode),
    testLink: record.testLink ?? "",
    liveLink: record.liveLink ?? "",
    geoLocation: Boolean(record.geoLocation),
    urlProtection: Boolean(record.urlProtection),
    uniqueIp: Boolean(record.uniqueIp),
    fraudDetection: Boolean(record.fraudDetection),
    preScreen,
    surveyGroupId: surveyGroupId ? String(surveyGroupId) : "",
    preScreenerId: surveyGroupId ? String(surveyGroupId) : "",
    preScreenerName: String(
      record.preScreenerName ??
        record.preScreenName ??
        record.PreScreenName ??
        record.pre_screen_name ??
        ""
    ).trim(),
    completeRewardPoints:
      record.completeRewardPoints != null ? String(record.completeRewardPoints) : "",
    terminationRewardPoints:
      record.terminationRewardPoints != null
        ? String(record.terminationRewardPoints)
        : "",
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
export function mapApiUrlInfoToForm(urlInfo, projectId = "", projectRecord = null) {
  if (!urlInfo || typeof urlInfo !== "object") {
    return createEmptyProjectUrlForm(projectId);
  }

  const rawLanguage = String(
    pickUrlInfoField(urlInfo, ["Language", "language"]) ??
      pickUrlInfoField(projectRecord, ["Language", "language"]) ??
      ""
  ).trim();
  const matchedLanguage =
    PRESCREEN_LANGUAGES.find(
      (lang) => lang.toLowerCase() === rawLanguage.toLowerCase()
    ) || rawLanguage;

  const rawStatus = String(
    pickUrlInfoField(urlInfo, ["Status", "url_status", "status"]) ??
      pickUrlInfoField(projectRecord, ["Status", "url_status", "status"]) ??
      ""
  ).trim();
  const status = normalizeProjectUrlStatus(rawStatus);

  const rawCountry = String(
    pickUrlInfoField(urlInfo, ["country", "Country"]) ??
      pickUrlInfoField(projectRecord, ["country", "Country", "project_country"]) ??
      ""
  ).trim();
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
    projectId: urlInfo.project_id ?? projectRecord?.id ?? projectId,
    projectUrlCode: String(
      pickUrlInfoField(urlInfo, [
        "project_url_code",
        "Project_URL_Code",
        "projectUrlCode",
        "url_code",
        "Url_Code",
        "urlCode",
      ]) ?? ""
    ).trim(),
    discussion:
      pickUrlInfoField(urlInfo, ["description", "Description"]) ??
      pickUrlInfoField(projectRecord, ["description", "Description"]) ??
      "",
    loi:
      pickUrlInfoField(urlInfo, ["LOI(Minute)", "LOI", "loi"]) ??
      pickUrlInfoField(projectRecord, ["LOI(Minute)", "LOI", "loi"]),
    ir:
      pickUrlInfoField(urlInfo, ["IR(%)", "IR", "ir"]) ??
      pickUrlInfoField(projectRecord, ["IR(%)", "IR", "ir"]),
    country: matchedCountry,
    language: matchedLanguage,
    cpiRate:
      pickUrlInfoField(urlInfo, ["CPI", "cpi", "cpiRate"]) ??
      pickUrlInfoField(projectRecord, ["CPI", "cpi", "cpiRate"]),
    sampleSize:
      pickUrlInfoField(urlInfo, ["SampleSize", "sample_size", "sampleSize"]) ??
      pickUrlInfoField(projectRecord, ["SampleSize", "sample_size", "sampleSize"]),
    multiLinkCount: toFormNumberValue(
      pickUrlInfoField(urlInfo, [
        "multi_link_count",
        "multiLinkCount",
        "Multi_Link_Count",
        "multiple_url_count",
        "multipleUrlCount",
      ])
    ),
    startDate: toFormDateValue(
      pickUrlInfoField(urlInfo, ["Start_Date", "start_date", "Start Date", "startDate"]) ??
        pickUrlInfoField(projectRecord, ["Start_Date", "start_date", "Start Date", "startDate"])
    ),
    endDate: toFormDateValue(
      pickUrlInfoField(urlInfo, ["End_Date", "end_date", "End Date", "endDate"]) ??
        pickUrlInfoField(projectRecord, ["End_Date", "end_date", "End Date", "endDate"])
    ),
    status,
    projectLinkType: normalizeProjectLinkType(
      pickUrlInfoField(urlInfo, [
        "Project_Link_Type",
        "project_link_type",
        "projectLinkType",
      ])
    ),
    linkMode: normalizeLinkMode(
      pickUrlInfoField(urlInfo, ["link_mode", "linkMode", "Link_Mode"]) ??
        pickUrlInfoField(projectRecord, ["link_mode", "linkMode", "Link_Mode"])
    ),
    testLink:
      pickUrlInfoField(urlInfo, ["Test_Link", "test_link", "testLink"]) ??
      pickUrlInfoField(projectRecord, ["Test_Link", "test_link", "testLink"]) ??
      "",
    liveLink:
      pickUrlInfoField(urlInfo, ["Live_Link", "live_link", "liveLink"]) ??
      pickUrlInfoField(projectRecord, ["Live_Link", "live_link", "liveLink"]) ??
      "",
    geoLocation: Boolean(
      Number(
        pickUrlInfoField(urlInfo, ["GeoLocation", "geo_location", "geoLocation"]) ??
          pickUrlInfoField(projectRecord, ["GeoLocation", "geo_location", "geoLocation"]) ??
          0
      )
    ),
    urlProtection: Boolean(
      Number(
        pickUrlInfoField(urlInfo, ["UrlProtection", "url_protection", "urlProtection"]) ??
          pickUrlInfoField(projectRecord, ["UrlProtection", "url_protection", "urlProtection"]) ??
          0
      )
    ),
    uniqueIp: Boolean(
      Number(
        pickUrlInfoField(urlInfo, ["UniqueIP", "unique_ip", "uniqueIp"]) ??
          pickUrlInfoField(projectRecord, ["UniqueIP", "unique_ip", "uniqueIp"]) ??
          0
      )
    ),
    fraudDetection: Boolean(
      Number(
        pickUrlInfoField(urlInfo, ["FraudDetection", "fraud_detection", "fraudDetection"]) ??
          pickUrlInfoField(projectRecord, ["FraudDetection", "fraud_detection", "fraudDetection"]) ??
          0
      )
    ),
    preScreen: Boolean(Number(preScreenFlag ?? 0)) || Boolean(preScreenerId),
    preScreenerId: preScreenerId != null ? String(preScreenerId) : "",
    preScreenerName: String(
      pickUrlInfoField(urlInfo, [
        "PreScreenName",
        "pre_screen_name",
        "preScreenerName",
        "survey_group_name",
      ]) ?? ""
    ).trim(),
    completeRewardPoints: toFormNumberValue(
      pickUrlInfoField(urlInfo, [
        "CompletionPoint",
        "completion_point",
        "completeRewardPoints",
        "comp_point",
      ]) ??
        pickUrlInfoField(projectRecord, [
          "CompletionPoint",
          "completion_point",
          "completeRewardPoints",
          "comp_point",
        ])
    ),
    terminationRewardPoints: toFormNumberValue(
      pickUrlInfoField(urlInfo, [
        "TerminationPoint",
        "termination_point",
        "terminationRewardPoints",
        "term_point",
        "termPoint",
      ]) ??
        pickUrlInfoField(projectRecord, [
          "TerminationPoint",
          "termination_point",
          "terminationRewardPoints",
          "term_point",
          "termPoint",
        ])
    ),
    redirectComplete: pickRedirectField(
      urlInfo,
      projectRecord,
      [
        "CompleteURL",
        "Complete URL",
        "Complete_Url",
        "complete_url",
        "completeUrl",
        "redirectComplete",
        "redirect_complete",
      ],
      [
        "CompleteURL",
        "Complete URL",
        "Complete_Url",
        "complete_url",
        "completeUrl",
        "redirect_complete",
      ]
    ),
    redirectTerminate: pickRedirectField(
      urlInfo,
      projectRecord,
      [
        "TerminateURL",
        "Terminated URL",
        "Terminate_Url",
        "terminate_url",
        "terminateUrl",
        "redirectTerminate",
        "redirect_terminate",
      ],
      [
        "TerminateURL",
        "Terminated URL",
        "Terminate_Url",
        "terminate_url",
        "terminateUrl",
        "redirect_terminate",
      ]
    ),
    redirectOverQuota: pickRedirectField(
      urlInfo,
      projectRecord,
      [
        "OverQuotaURL",
        "Over Quota URL",
        "Over_Quota_Url",
        "over_quota_url",
        "overQuotaUrl",
        "redirectOverQuota",
        "redirect_over_quota",
      ],
      [
        "OverQuotaURL",
        "Over Quota URL",
        "Over_Quota_Url",
        "over_quota_url",
        "overQuotaUrl",
        "redirect_over_quota",
      ]
    ),
    redirectQualityTerm: pickRedirectField(
      urlInfo,
      projectRecord,
      [
        "QualityTermURL",
        "Quality Term URL",
        "Quality_Term_Url",
        "quality_term_url",
        "qualityTermUrl",
        "redirectQualityTerm",
        "redirect_quality_term",
      ],
      [
        "QualityTermURL",
        "Quality Term URL",
        "Quality_Term_Url",
        "quality_term_url",
        "qualityTermUrl",
        "redirect_quality_term",
      ]
    ),
    redirectSurveyClose: pickRedirectField(
      urlInfo,
      projectRecord,
      [
        "SurveyCloseURL",
        "Survey Closed URL",
        "Survey_Close_Url",
        "survey_close_url",
        "surveyCloseUrl",
        "redirectSurveyClose",
        "redirect_survey_close",
      ],
      [
        "SurveyCloseURL",
        "Survey Closed URL",
        "Survey_Close_Url",
        "survey_close_url",
        "surveyCloseUrl",
        "redirect_survey_close",
      ]
    ),
    addedBy: urlInfo.action_by || projectRecord?.action_by || "—",
    addedOn: urlInfo.created_at || projectRecord?.created_at || "—",
    updatedBy: urlInfo.action_by || projectRecord?.updated_by || "—",
    updatedOn: urlInfo.updated_at || projectRecord?.updated_at || "—",
  });
}

/**
 * Loads a single Project URL form for edit.
 * Uses GET /api/projects/:id/url/list (backend has no GET /api/projects/url/:urlId).
 * @param {string|number} projectId
 * @param {string|number} urlId
 * @param {object | null} [fallbackForm] Optional cached list row
 */
export async function getProjectUrlFormForEdit(projectId, urlId, fallbackForm = null) {
  const normalizedUrlId = String(urlId ?? "").trim();
  if (!normalizedUrlId) return null;

  if (USE_PROJECT_URLS_MOCK) {
    await delay();
    const record = getMockProjectUrlById(normalizedUrlId);
    const mapped = record ? mapProjectUrlToForm(record) : null;
    return mapped
      ? normalizeProjectUrlFormForState(
          mergeProjectUrlForms(mapped, fallbackForm)
        )
      : fallbackForm
        ? normalizeProjectUrlFormForState(mapProjectUrlToForm(fallbackForm))
        : null;
  }

  try {
    const listResponse = await listProjectUrlsByProject(projectId);
    const rows = Array.isArray(listResponse?.data) ? listResponse.data : [];
    const matched = rows.find(
      (row) => String(row?.id ?? "") === normalizedUrlId
    );
    if (matched) {
      const mapped = mapApiUrlInfoToForm(matched, projectId);
      return normalizeProjectUrlFormForState(
        mergeProjectUrlForms(mapped, fallbackForm)
      );
    }
  } catch {
    // Fall through to project details urlInfo.
  }

  const record = await getRecord(projectId);
  const urlInfo = normalizeUrlInfoList(record);
  const raw = urlInfo.find((row) => resolveUrlRecordId(row) === normalizedUrlId);
  if (!raw && !fallbackForm) return null;

  const mapped = raw
    ? mapApiUrlInfoToForm(raw, projectId, record)
    : mapProjectUrlToForm({
        ...createEmptyProjectUrlForm(projectId),
        ...fallbackForm,
        id: normalizedUrlId,
      });

  return normalizeProjectUrlFormForState(
    mergeProjectUrlForms(mapped, fallbackForm)
  );
}

function buildProjectUrlUpdatePayload(form) {
  const surveyGroupId = form.preScreen
    ? String(form.surveyGroupId ?? form.preScreenerId ?? "").trim()
    : "";
  const preScreenName = form.preScreen
    ? String(form.preScreenerName ?? form.preScreenName ?? "").trim()
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
    preScreenerName: preScreenName,
    PreScreenName: preScreenName || undefined,
    completeRewardPoints:
      form.completeRewardPoints === "" ? null : Number(form.completeRewardPoints),
    terminationRewardPoints:
      form.terminationRewardPoints === ""
        ? null
        : Number(form.terminationRewardPoints),
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
  const preScreenerId = String(form.preScreenerId || form.surveyGroupId || "").trim();
  const preScreenName = String(
    form.preScreenerName ?? form.preScreenName ?? form.PreScreenName ?? ""
  ).trim();

  return compactApiPayload({
    description: String(form.discussion ?? "").trim(),
    LOI: toApiNumber(form.loi),
    IR: toApiNumber(form.ir),
    country: String(form.country ?? "").trim(),
    Language: String(form.language ?? "").trim(),
    CPI: toApiNumber(form.cpiRate ?? form.cpi),
    SampleSize: toApiNumber(form.sampleSize),
    Start_Date: form.startDate || "",
    End_Date: form.endDate || "",
    Status: form.status || "Open",
    Project_Link_Type: projectLinkTypeToApi(form.projectLinkType),
    Live_Link: String(form.liveLink ?? "").trim(),
    Test_Link: String(form.testLink ?? "").trim(),
    GeoLocation: toApiFlag(form.geoLocation),
    UrlProtection: toApiFlag(form.urlProtection),
    UniqueIP: toApiFlag(form.uniqueIp),
    FraudDetection: toApiFlag(form.fraudDetection),
    PreScreen: toApiFlag(form.preScreen),
    PreScreenid: form.preScreen && preScreenerId ? preScreenerId : undefined,
    PreScreenName:
      form.preScreen && preScreenName ? preScreenName : undefined,
    CompleteURL: String(form.redirectComplete ?? "").trim(),
    TerminateURL: String(form.redirectTerminate ?? "").trim(),
    OverQuotaURL: String(form.redirectOverQuota ?? "").trim(),
    QualityTermURL: String(form.redirectQualityTerm ?? "").trim(),
    SurveyCloseURL: String(form.redirectSurveyClose ?? "").trim(),
    CompletionPoint: toApiNumber(form.completeRewardPoints),
    TerminationPoint: toApiNumber(form.terminationRewardPoints),
    project_url_code: String(form.projectUrlCode ?? "").trim() || undefined,
    Project_URL_Code: String(form.projectUrlCode ?? "").trim() || undefined,
  });
}

/**
 * Builds multipart/form-data for Multi Link Project URL create/update.
 * Parts: `metadata` (JSON) + optional `csvFile` (CSV upload).
 * @param {object} form
 * @param {{ csvFiles?: File[]|File|null }} [options]
 */
export function buildProjectUrlMultipartFormData(form = {}, options = {}) {
  const metadata = buildCreateProjectUrlApiPayload(form);
  const body = new FormData();
  // Send as a text field (not a file part) so multer exposes it on req.body.metadata.
  body.append("metadata", JSON.stringify(metadata));

  const rawFiles = options.csvFiles;
  const files = Array.isArray(rawFiles)
    ? rawFiles.filter(Boolean)
    : rawFiles
      ? [rawFiles]
      : [];

  files.forEach((file) => {
    body.append("csvFile", file);
  });

  return body;
}

function normalizeCsvFilesOption(csvFiles) {
  if (!csvFiles) return [];
  return Array.isArray(csvFiles) ? csvFiles.filter(Boolean) : [csvFiles];
}

/**
 * GET /api/projects/:id/url/generate-code
 * Backend is the source of truth for unique Project URL codes.
 * @param {string|number} projectId
 * @returns {Promise<string>}
 */
export async function generateProjectUrlCode(projectId) {
  const rawId = String(projectId ?? "").trim();
  if (!rawId || rawId === "undefined" || rawId === "null") {
    throw new ApiError(
      "Project ID is required to generate Project URL Code.",
      null
    );
  }

  const normalizedId = normalizeProjectId(projectId);
  const data = await apiRequest(
    API_ROUTES.projects.generateUrlCode(normalizedId)
  );
  assertSuccess(data);

  const payload =
    data?.data && typeof data.data === "object" && !Array.isArray(data.data)
      ? data.data
      : data;

  const code = String(
    payload?.project_url_code ??
      payload?.projectUrlCode ??
      payload?.Project_URL_Code ??
      payload?.url_code ??
      payload?.urlCode ??
      ""
  ).trim();

  if (!code) {
    throw new ApiError(
      "Project URL Code was not returned by the server.",
      data
    );
  }

  return code;
}

/** GET all Project URL configs for a project. Uses GET /api/projects/:id/url/list. */
export async function listProjectUrlsByProject(projectId) {
  if (!USE_PROJECT_URLS_MOCK) {
    const normalizedId = normalizeProjectId(projectId);

    try {
      const listData = await apiRequest(API_ROUTES.projects.urlList(normalizedId));
      assertSuccess(listData);
      const rawRows = Array.isArray(listData?.data) ? listData.data : [];
      return {
        success: true,
        data: rawRows.map((row) => mapApiUrlInfoToForm(row, projectId, null)),
      };
    } catch (listError) {
      // Fallback: project details payload may still include urlInfo.
      try {
        const record = await getRecord(projectId);
        const urlInfo = normalizeUrlInfoList(record);
        return {
          success: true,
          data: urlInfo.map((row) => mapApiUrlInfoToForm(row, projectId, record)),
          project: mapSurveyToProjectDetails(record),
        };
      } catch {
        throw listError;
      }
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
 * Builds PUT /api/projects/url/:urlId body from the Project URL form.
 * Uses the same field contract as create.
 * @param {object} form
 */
export function buildUpdateProjectUrlApiPayload(form = {}) {
  return buildCreateProjectUrlApiPayload(form);
}

/**
 * PUT /api/projects/url/:urlId — update an existing Project URL config.
 * Single Link: JSON body.
 * Multi Link: multipart/form-data with `metadata` + optional `csvFile`.
 * @param {string|number} urlId
 * @param {object} form
 * @param {{ isMultiLink?: boolean, csvFiles?: File[]|File|null }} [options]
 */
export async function updateProjectUrl(urlId, form = {}, options = {}) {
  const isMultiLink = Boolean(options.isMultiLink);
  const csvFiles = normalizeCsvFilesOption(options.csvFiles);
  const normalizedForm = {
    ...createEmptyProjectUrlForm(form.projectId),
    ...form,
    status: form.status || "Open",
  };

  if (USE_PROJECT_URLS_MOCK) {
    return updateProjectUrlById(urlId, form);
  }

  const normalizedUrlId = normalizeUrlId(urlId);
  const body = isMultiLink
    ? buildProjectUrlMultipartFormData(normalizedForm, { csvFiles })
    : buildUpdateProjectUrlApiPayload(normalizedForm);

  const data = await apiRequest(API_ROUTES.projects.updateUrl(normalizedUrlId), {
    method: "PUT",
    body,
  });
  return assertSuccess(data);
}

/**
 * Persists Project URL changes (create or update).
 * @param {string|number} projectId
 * @param {object} form
 * @param {{ project?: object, urlId?: string|number, isMultiLink?: boolean, csvFiles?: File[]|File|null }} [options]
 */
export async function updateProjectUrls(projectId, form, options = {}) {
  const urlId = String(form?.id ?? options?.urlId ?? "").trim();
  if (!USE_PROJECT_URLS_MOCK) {
    if (!urlId) {
      throw new ApiError("Project URL ID is required for update.", null);
    }
    return updateProjectUrl(
      urlId,
      {
        ...form,
        id: urlId,
        projectId: form.projectId || projectId,
      },
      {
        isMultiLink: options.isMultiLink,
        csvFiles: options.csvFiles,
      }
    );
  }

  if (urlId) {
    return updateProjectUrlById(urlId, form);
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
 * Single Link: JSON body.
 * Multi Link: multipart/form-data with `metadata` + optional `csvFile`.
 * @param {string|number} projectId
 * @param {object} form
 * @param {{ isMultiLink?: boolean, csvFiles?: File[]|File|null }} [options]
 */
export async function createProjectUrl(projectId, form = {}, options = {}) {
  const isMultiLink = Boolean(options.isMultiLink);
  const csvFiles = normalizeCsvFilesOption(options.csvFiles);
  const normalizedForm = {
    ...createEmptyProjectUrlForm(projectId),
    ...form,
    status: form.status || "Open",
  };

  if (USE_PROJECT_URLS_MOCK) {
    await delay(350);
    const record = createMockProjectUrl(projectId, {
      ...buildProjectUrlUpdatePayload(normalizedForm),
    });
    return {
      success: true,
      message: "Project URL added successfully!",
      data: { id: record.id },
    };
  }

  const normalizedId = normalizeProjectId(projectId);
  const body = isMultiLink
    ? buildProjectUrlMultipartFormData(normalizedForm, { csvFiles })
    : buildCreateProjectUrlApiPayload(normalizedForm);

  const data = await apiRequest(API_ROUTES.projects.createUrl(normalizedId), {
    method: "POST",
    body,
  });
  return assertSuccess(data);
}

/** DELETE /api/projects/url/:urlId */
export async function deleteProjectUrl(urlId) {
  const normalizedUrlId = normalizeUrlId(urlId);

  if (USE_PROJECT_URLS_MOCK) {
    await delay(200);
    const removed = deleteMockProjectUrl(normalizedUrlId);
    return {
      success: removed,
      message: removed
        ? "Project URL deleted successfully!"
        : "Project URL not found.",
    };
  }

  const data = await apiRequest(API_ROUTES.projects.deleteUrl(normalizedUrlId), {
    method: "DELETE",
  });
  return assertSuccess(data);
}

/**
 * PATCH /api/projects/url/:urlId/link-mode — switch between test and live survey links.
 * @param {string|number} urlId
 * @param {"test" | "live"} linkMode
 */
export async function updateProjectUrlLinkMode(urlId, linkMode) {
  const normalizedUrlId = normalizeUrlId(urlId);
  const nextMode = normalizeLinkMode(linkMode);

  if (USE_PROJECT_URLS_MOCK) {
    await delay(200);
    const record = updateMockProjectUrlById(normalizedUrlId, { linkMode: nextMode });
    if (!record) {
      return {
        success: false,
        message: "Project URL not found.",
        data: null,
      };
    }
    return {
      success: true,
      message: `Link mode switched to ${nextMode}!`,
      data: record,
    };
  }

  const data = await apiRequest(API_ROUTES.projects.updateUrlLinkMode(normalizedUrlId), {
    method: "PATCH",
    body: { link_mode: nextMode },
  });
  return assertSuccess(data);
}

/**
 * Resolves a Project URL by id via the project URL list endpoint.
 * Backend does not expose GET /api/projects/url/:urlId.
 * @param {string|number} urlId
 * @param {string|number} [projectId]
 */
export async function getProjectUrlById(urlId, projectId) {
  const rawUrlId = String(urlId ?? "").trim();
  if (!rawUrlId || rawUrlId === "undefined" || rawUrlId === "null") {
    throw new ApiError("Project URL ID is required.", null);
  }

  if (USE_PROJECT_URLS_MOCK) {
    await delay();
    return {
      success: true,
      data: getMockProjectUrlById(rawUrlId),
    };
  }

  const normalizedProjectId = String(projectId ?? "").trim();
  if (!normalizedProjectId) {
    throw new ApiError("Project id is required to load a Project URL.", null);
  }

  const listResponse = await listProjectUrlsByProject(normalizedProjectId);
  const rows = Array.isArray(listResponse?.data) ? listResponse.data : [];
  const matched = rows.find((row) => String(row?.id ?? "") === rawUrlId);
  if (!matched) {
    throw new ApiError("Project URL not found.", null, 404);
  }

  return { success: true, data: matched };
}

/** Filtered pre-screener options for Country + Language (mock). */
export async function getPreScreenerOptions({ country, language } = {}) {
  await delay(120);
  return {
    success: true,
    data: getMockPreScreeners({ country, language }),
  };
}

async function fetchAllQuestionnaireGroupItems() {
  const limit = MAX_API_LIST_LIMIT;
  const items = [];
  const seenIds = new Set();
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages && page <= 50) {
    const response = await getQuestionnaireGroups({ page, limit });
    const pageItems = Array.isArray(response?.items) ? response.items : [];
    for (const item of pageItems) {
      const id = String(item?.id ?? "").trim();
      if (id) {
        if (seenIds.has(id)) continue;
        seenIds.add(id);
      }
      items.push(item);
    }
    totalPages = Math.max(1, Number(response?.totalPages) || 1);
    page += 1;
  }

  return items;
}

/**
 * Survey groups for Pre-Screen, filtered by selected language.
 * Uses Questionnaire Group list API; displays Survey Title (never IDs).
 */
export async function getSurveyGroupOptionsForLanguage(language) {
  const languageKey = String(language ?? "").trim().toLowerCase();
  if (!languageKey) {
    return { success: true, data: [] };
  }

  try {
    const items = await fetchAllQuestionnaireGroupItems();
    const options = dedupeSelectOptions(
      items
        .filter(
          (item) =>
            String(item.language ?? "")
              .trim()
              .toLowerCase() === languageKey
        )
        .map((item) => {
          const label = String(item.surveyTitle || item.title || "").trim();
          const value = String(item.id ?? "").trim();
          if (!value || !label) return null;
          return { value, label };
        })
        .filter(Boolean)
    );

    if (options.length > 0) {
      return { success: true, data: options };
    }
  } catch {
    // Fall through to empty options in production; mock options in development only.
  }

  if (import.meta.env.PROD) {
    return { success: true, data: [] };
  }

  await delay(120);
  const mockOptions = dedupeSelectOptions(
    getMockPreScreeners({ language })
      .map((item) => {
        const label = String(item.label ?? "").trim();
        const value = String(item.value ?? "").trim();
        if (!value || !label) return null;
        return { value, label };
      })
      .filter(Boolean)
  );
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
