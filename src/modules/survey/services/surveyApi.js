import { API_ROUTES } from "../../../config/api";
import { extractListTotalFromResponse } from "../../shared/utils/listResponse";
import { appendListQuery } from "../../shared/utils/listQueryParams";
import {
  apiStatusToFormValue,
  formValueToApiStatus,
} from "../../shared/utils/statusLabels";
import { apiRequest } from "../../../services/api/client";
import { ApiError } from "../../../services/api/ApiError";
import { createEmptySurveyForm } from "../data/surveyFormData";
import {
  getSupplierMappingDetail,
  getSurveyProjectDetails,
} from "../data/surveyDetailsData";
import {
  cloneMockSurvey,
  createMockSurvey,
  delay as mockDelay,
  deleteMockSurvey,
  filterMockSurveys,
  getMockSurveyById,
  MOCK_SURVEY_PARTNERS,
  updateMockSurvey,
} from "../data/mockSurveyStore";
import { formatSurveyListDate, parseUtcToIst } from "../../shared/utils/dateTime";

/** Toggle when real survey APIs are ready. Keep false to use mock data. */
const USE_SURVEY_MOCK_DATA = true;

function assertSuccess(data) {
  if (data?.success !== true) {
    throw new ApiError(data?.message ?? "", data);
  }
  return data;
}

function normalizeSurveyId(id) {
  const normalizedId = String(id ?? "").trim();
  if (!normalizedId || normalizedId === "undefined" || normalizedId === "null") {
    throw new ApiError("", null);
  }
  return encodeURIComponent(normalizedId);
}

function extractSurveysList(data) {
  if (!data || typeof data !== "object") return [];
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.surveys)) return data.surveys;
  return [];
}

function resolveNumericId(value) {
  if (value == null || value === "") return undefined;
  const num = Number(value);
  if (Number.isFinite(num) && num > 0) return num;
  return undefined;
}

function formLinkTypeToApi(projectLinkType) {
  if (projectLinkType === "Multi Link") return "multi";
  return "single";
}

function apiLinkTypeToForm(linkType) {
  const normalized = String(linkType ?? "").toLowerCase().trim();
  if (normalized === "multi" || normalized === "multi link") return "Multi Link";
  return "Single Link";
}

function resolveBooleanFlag(survey, keys, fallback = false) {
  for (const key of keys) {
    const value = survey?.[key];
    if (value === undefined || value === null) continue;
    if (value === true || value === 1 || value === "1") return true;
    if (value === false || value === 0 || value === "0") return false;
    return Boolean(value);
  }
  return fallback;
}

/** Prefer the first urlInfo row from GET /api/projects/:id. */
function getPrimaryUrlInfo(project) {
  const info = project?.urlInfo;
  if (Array.isArray(info) && info.length > 0) return info[0];
  if (info && typeof info === "object") return info;
  return null;
}

function pickField(source, keys, fallback = undefined) {
  if (!source || typeof source !== "object") return fallback;
  for (const key of keys) {
    const value = source[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return fallback;
}

function extractSurveyRecord(data) {
  if (!data || typeof data !== "object") return null;
  if (data.data && typeof data.data === "object" && !Array.isArray(data.data)) {
    return data.data;
  }
  if (data.survey && typeof data.survey === "object") {
    return data.survey;
  }
  if (data.id != null) return data;
  return null;
}

function toDateInputValue(value) {
  if (!value) return "";
  const ist = parseUtcToIst(value);
  if (!ist) {
    const iso = String(value).slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso : "";
  }
  return ist.format("YYYY-MM-DD");
}

function pickSurveyFormValue(apiValue, fallbackValue) {
  if (apiValue === undefined || apiValue === null || apiValue === "") {
    return fallbackValue;
  }
  return apiValue;
}

function formatClientCodeDisplay(clientCode, clientName) {
  const code =
    clientCode != null && String(clientCode).trim() !== "" ? String(clientCode).trim() : "";
  const name =
    clientName != null && String(clientName).trim() !== "" ? String(clientName).trim() : "";

  if (code && name) return `${code} - ${name}`;
  if (code) return code;
  if (name) return name;
  return "—";
}

/**
 * Maps GET /api/projects/list item to survey listing row.
 * @param {object} project
 */
export function mapSurveyToRow(project) {
  const projectCode = project?.Project_code ?? project?.survey_id ?? "";
  const projectName = project?.Project_Name ?? project?.project_name ?? "";
  const clientName = project?.Clients ?? project?.client_name ?? "";
  const startDate = project?.Start_Date ?? project?.start_date;
  const endDate = project?.End_Date ?? project?.end_date;
  const status = project?.Status ?? project?.status;
  const loi = project?.LOI ?? project?.loi;
  const ir = project?.IR ?? project?.ir;
  const sampleSize = project?.SampleSize ?? project?.sample_size;
  const cpi = project?.CPI ?? project?.cpi;

  return {
    id: projectCode || String(project?.id ?? ""),
    surveyId: projectCode || String(project?.id ?? ""),
    recordId: project?.id,
    projectName,
    clientCode: formatClientCodeDisplay(project?.client_code, clientName) || clientName || "—",
    clientName,
    projectManagerName: project?.Project_Manager ?? project?.project_manager_name ?? "",
    partnerNames: project?.partner_names ?? "",
    startDate: formatSurveyListDate(startDate),
    endDate: formatSurveyListDate(endDate),
    loi: loi != null && loi !== "" ? String(loi) : "—",
    ir: ir != null && ir !== "" ? String(ir) : "—",
    sampleSize: sampleSize != null && sampleSize !== "" ? String(sampleSize) : "—",
    cpi: cpi != null && cpi !== "" ? String(cpi) : "—",
    currency: project?.currency ?? "",
    status: apiStatusToFormValue(status),
  };
}

/**
 * Maps GET /api/projects/:id response for the project details view.
 * @param {object} survey
 */
export function mapSurveyToProjectDetails(survey) {
  if (!survey || typeof survey !== "object") return null;

  const urlInfo = getPrimaryUrlInfo(survey);
  const loi = pickField(urlInfo, ["LOI(Minute)", "LOI", "loi"], survey.loi);
  const ir = pickField(urlInfo, ["IR(%)", "IR", "ir"], survey.ir);
  const sampleSize = pickField(
    urlInfo,
    ["SampleSize", "sample_size", "sampleSize"],
    survey.sample_size
  );
  const cpi = pickField(urlInfo, ["CPI", "cpi"], survey.cpi);
  const startDate = pickField(
    urlInfo,
    ["Start_Date", "start_date", "startDate"],
    survey.start_date
  );
  const endDate = pickField(urlInfo, ["End_Date", "end_date", "endDate"], survey.end_date);
  const country = pickField(
    urlInfo,
    ["country", "project_country"],
    survey.project_country
  );
  const liveLink = pickField(
    urlInfo,
    ["Live_Link", "live_url", "liveLink"],
    survey.live_url
  );
  const testLink = pickField(
    urlInfo,
    ["Test_Link", "test_url", "testLink"],
    survey.test_url
  );
  const completionPoint = pickField(
    urlInfo,
    ["CompletionPoint", "comp_point", "compPoint"],
    survey.comp_point
  );
  const terminationPoint = pickField(
    urlInfo,
    ["TerminationPoint", "term_point", "termPoint"],
    survey.term_point
  );

  const filterSource = urlInfo ?? survey;
  const projectCode =
    survey.Project_code ?? survey.survey_id ?? String(survey.id ?? "");

  return {
    id: projectCode,
    recordId: survey.id,
    projectStatus: apiStatusToFormValue(survey.Status ?? survey.status),
    clientName: survey.Clients ?? survey.client_name ?? "",
    projectName: survey.Project_Name ?? survey.project_name ?? "",
    projectManager: survey.Project_Manager ?? survey.project_manager_name ?? "",
    projectCountry: country ?? "",
    description: survey.Project_Description ?? survey.description ?? "",
    surveyId: projectCode,
    salesManager: survey.Sales_Manager ?? survey.sales_manager_name ?? "",
    salesProject: survey.RFQ ?? survey.sales_project_name ?? "",
    loiMinutes: loi != null ? String(loi) : "—",
    irPercent: ir != null ? String(ir) : "—",
    sampleSize: sampleSize != null ? String(sampleSize) : "—",
    cpiUsd: cpi != null ? String(cpi) : "—",
    currency: survey.currency ?? "",
    startDate: formatSurveyListDate(startDate),
    endDate: formatSurveyListDate(endDate),
    liveLink: liveLink ?? "",
    testLink: testLink ?? "",
    filters: {
      geolocation: resolveBooleanFlag(filterSource, [
        "GeoLocation",
        "geo_location",
        "geoLocation",
      ]),
      urlProtection: resolveBooleanFlag(filterSource, [
        "UrlProtection",
        "url_protection",
        "urlProtection",
      ]),
      uniqueIp: resolveBooleanFlag(filterSource, ["UniqueIP", "unique_ip", "uniqueIp"]),
      prescreen: resolveBooleanFlag(filterSource, [
        "PreScreen",
        "prescreen",
        "pre_screen",
        "preScreen",
      ]),
    },
    redirectLinks: {
      complete: survey.complete_url ?? survey.redirect_complete ?? "",
      terminate: survey.terminate_url ?? survey.redirect_terminate ?? "",
      overQuota: survey.over_quota_url ?? survey.redirect_over_quota ?? "",
      qualityTerm: survey.quality_term_url ?? survey.redirect_quality_term ?? "",
      surveyClose: survey.survey_close_url ?? survey.redirect_survey_close ?? "",
    },
    userCompletionPoint: completionPoint != null ? String(completionPoint) : "",
    userTerminationPoint: terminationPoint != null ? String(terminationPoint) : "",
    note: survey.Notes ?? survey.notes ?? "",
    projectLinkType: survey.Project_Link_Type ?? survey.link_type ?? "",
    urlInfo: Array.isArray(survey.urlInfo) ? survey.urlInfo : [],
    multipleUrls: Array.isArray(survey.multipleUrls) ? survey.multipleUrls : [],
  };
}

/**
 * Builds POST /api/projects/add body from the survey create form.
 * @param {object} form
 * @param {{
 *   clientOptions?: Array<{ value: string, label: string }>,
 *   projectManagerOptions?: Array<{ value: string, label: string }>,
 *   salesManagerOptions?: Array<{ value: string, label: string }>,
 *   surveyGroupOptions?: Array<{ value: string, label: string }>,
 * }} [selectOptions]
 */
export function buildCreateProjectPayload(form, selectOptions = {}) {
  const {
    clientOptions = [],
    projectManagerOptions = [],
    salesManagerOptions = [],
    surveyGroupOptions = [],
  } = selectOptions;

  const resolveLabel = (options, value) => {
    const normalized = String(value ?? "").trim();
    if (!normalized) return "";
    const match = options.find((option) => String(option.value) === normalized);
    return String(match?.label ?? normalized).trim();
  };

  const urlInfo = {
    LOI: Number(form.loi),
    IR: Number(form.ir),
    country: String(form.projectCountry ?? "").trim(),
    CPI: Number(form.cpi),
    SampleSize: Number(form.sampleSize),
    Start_Date: form.startDate,
    End_Date: form.endDate,
    GeoLocation: form.filters?.geoLocation ? 1 : 0,
    UrlProtection: form.filters?.urlProtection ? 1 : 0,
    UniqueIP: form.filters?.uniqueIp ? 1 : 0,
    PreScreen: form.filters?.preScreen ? 1 : 0,
    TerminationPoint: Number(form.userTerminationPoint),
    CompletionPoint: Number(form.userCompletionPoint),
  };

  if (form.projectLinkType === "Single Link") {
    urlInfo.Live_Link = String(form.liveLink ?? "").trim();
    urlInfo.Test_Link = String(form.testLink ?? "").trim();
  }

  if (form.filters?.preScreen) {
    if (form.language) urlInfo.Language = form.language;
    const preScreenLabel = resolveLabel(surveyGroupOptions, form.surveyGroup);
    if (form.surveyGroup) urlInfo.PreScreenid = String(form.surveyGroup);
    if (preScreenLabel) urlInfo.PreScreenName = preScreenLabel;
  }

  return {
    Project_Name: String(form.projectName ?? "").trim(),
    Clients: resolveLabel(clientOptions, form.client),
    Project_Manager: resolveLabel(projectManagerOptions, form.projectManager),
    Sales_Manager: resolveLabel(salesManagerOptions, form.salesManager),
    Project_Description: String(form.description ?? "").trim(),
    Project_Link_Type: form.projectLinkType || "Single Link",
    Notes: String(form.notes ?? "").trim(),
    Status: "active",
    urlInfo,
  };
}

/**
 * @param {object} form
 */
export function buildCreateSurveyPayload(form) {
  const payload = {
    project_name: form.projectName?.trim(),
    client_id: resolveNumericId(form.client),
    project_manager_id: resolveNumericId(form.projectManager),
    project_country: form.projectCountry?.trim(),
    description: form.description ?? "",
    loi: Number(form.loi),
    ir: Number(form.ir),
    sample_size: Number(form.sampleSize),
    currency: form.currency,
    start_date: form.startDate,
    end_date: form.endDate,
    link_type: formLinkTypeToApi(form.projectLinkType),
    term_point: String(form.userTerminationPoint ?? "").trim(),
    comp_point: String(form.userCompletionPoint ?? "").trim(),
    cpi: Number(form.cpi),
    notes: form.notes?.trim() ?? "",
    status: "active",
  };

  const salesManagerId = resolveNumericId(form.salesManager);
  const salesProjectId = resolveNumericId(form.salesProject);
  if (salesManagerId != null) payload.sales_manager_id = salesManagerId;
  if (salesProjectId != null) payload.sales_project_id = salesProjectId;

  if (form.projectLinkType === "Single Link") {
    payload.live_url = form.liveLink?.trim();
    payload.test_url = form.testLink?.trim();
  }

  payload.geo_location = Boolean(form.filters?.geoLocation);
  payload.url_protection = Boolean(form.filters?.urlProtection);
  payload.unique_ip = Boolean(form.filters?.uniqueIp);
  payload.prescreen = Boolean(form.filters?.preScreen);

  if (form.filters?.preScreen) {
    if (form.language) payload.language = form.language;
    const prescreenSurveyId = resolveNumericId(form.surveyGroup);
    if (prescreenSurveyId != null) payload.prescreen_survey_id = prescreenSurveyId;
  }

  const groupProjectId = resolveNumericId(form.groupProjectId);
  if (groupProjectId != null) payload.survey_group_project_id = groupProjectId;

  return payload;
}

/**
 * Payload for POST /api/survey/add/:groupProjectId (group survey add project).
 * @param {object} form
 */
export function buildGroupSurveyProjectPayload(form) {
  const payload = {
    project_name: form.projectName?.trim(),
    client_id: resolveNumericId(form.client),
    project_manager_id: resolveNumericId(form.projectManager),
    project_country: form.projectCountry?.trim(),
    description: form.description ?? "",
    loi: Number(form.loi),
    ir: Number(form.ir),
    sample_size: Number(form.sampleSize),
    currency: form.currency,
    start_date: form.startDate,
    end_date: form.endDate,
    link_type: formLinkTypeToApi(form.projectLinkType),
    term_point: String(form.userTerminationPoint ?? "").trim(),
    comp_point: String(form.userCompletionPoint ?? "").trim(),
    notes: form.notes?.trim() ?? "",
    cpi: Number(form.cpi),
    status: "active",
  };

  if (form.projectLinkType === "Single Link") {
    payload.live_url = form.liveLink?.trim();
    payload.test_url = form.testLink?.trim();
  }

  return payload;
}

/**
 * @param {object} survey
 * @param {string[]} idKeys
 * @param {string} [fallback]
 */
function resolveSurveyFormId(survey, idKeys, fallback = "") {
  for (const key of idKeys) {
    const value = survey?.[key];
    if (value != null && value !== "") {
      return String(value);
    }
  }

  return fallback;
}

function resolveNestedSurveyFormId(survey, idKeys, nestedKey, fallback = "") {
  const direct = resolveSurveyFormId(survey, idKeys, "");
  if (direct) return direct;

  const nested = survey?.[nestedKey];
  if (nested && typeof nested === "object" && nested.id != null && nested.id !== "") {
    return String(nested.id);
  }

  return fallback;
}

export function mapSurveyToForm(survey, fallback = null) {
  const base = fallback ?? createEmptySurveyForm();
  const urlInfo = getPrimaryUrlInfo(survey);
  const linkType = apiLinkTypeToForm(
    survey?.Project_Link_Type ?? survey?.link_type ?? base.projectLinkType
  );
  const existingCsvFileName = pickSurveyFormValue(
    survey?.survey_file_name ??
      survey?.csv_file_name ??
      survey?.file_name ??
      survey?.survey_file ??
      survey?.uploaded_file_name,
    ""
  );

  const loi = pickField(urlInfo, ["LOI(Minute)", "LOI", "loi"], survey?.loi);
  const ir = pickField(urlInfo, ["IR(%)", "IR", "ir"], survey?.ir);
  const sampleSize = pickField(
    urlInfo,
    ["SampleSize", "sample_size", "sampleSize"],
    survey?.sample_size
  );
  const cpi = pickField(urlInfo, ["CPI", "cpi"], survey?.cpi);
  const startDate = pickField(
    urlInfo,
    ["Start_Date", "start_date", "startDate"],
    survey?.start_date
  );
  const endDate = pickField(urlInfo, ["End_Date", "end_date", "endDate"], survey?.end_date);
  const country = pickField(
    urlInfo,
    ["country", "project_country"],
    survey?.project_country
  );
  const liveLink = pickField(
    urlInfo,
    ["Live_Link", "live_url", "liveLink"],
    survey?.live_url
  );
  const testLink = pickField(
    urlInfo,
    ["Test_Link", "test_url", "testLink"],
    survey?.test_url
  );
  const terminationPoint = pickField(
    urlInfo,
    ["TerminationPoint", "term_point", "termPoint"],
    survey?.term_point
  );
  const completionPoint = pickField(
    urlInfo,
    ["CompletionPoint", "comp_point", "compPoint"],
    survey?.comp_point
  );
  const filterSource = urlInfo ?? survey;

  return {
    ...base,
    client: resolveNestedSurveyFormId(
      survey,
      ["client_id"],
      "client",
      survey?.client_code != null ? String(survey.client_code) : base.client
    ),
    projectName: pickSurveyFormValue(
      survey?.Project_Name ?? survey?.project_name,
      base.projectName
    ),
    projectManager: resolveNestedSurveyFormId(
      survey,
      ["project_manager_id"],
      "project_manager",
      base.projectManager
    ),
    salesManager: resolveNestedSurveyFormId(
      survey,
      ["sales_manager_id"],
      "sales_manager",
      base.salesManager
    ),
    salesProject: resolveNestedSurveyFormId(
      survey,
      ["sales_project_id"],
      "sales_project",
      base.salesProject
    ),
    projectCountry: pickSurveyFormValue(country, base.projectCountry),
    description: pickSurveyFormValue(
      survey?.Project_Description ?? survey?.description,
      base.description
    ),
    loi: loi != null ? String(loi) : base.loi,
    ir: ir != null ? String(ir) : base.ir,
    sampleSize: sampleSize != null ? String(sampleSize) : base.sampleSize,
    currency: pickSurveyFormValue(survey?.currency, base.currency),
    cpi: cpi != null ? String(cpi) : base.cpi,
    startDate: toDateInputValue(startDate) || base.startDate,
    endDate: toDateInputValue(endDate) || base.endDate,
    projectLinkType: linkType,
    liveLink: pickSurveyFormValue(liveLink, base.liveLink),
    testLink: pickSurveyFormValue(testLink, base.testLink),
    surveyCsvFile: null,
    existingSurveyCsvFileName: existingCsvFileName,
    existingMultiLinkSurvey: linkType === "Multi Link",
    filters: {
      geoLocation: resolveBooleanFlag(
        filterSource,
        ["GeoLocation", "geo_location", "geoLocation"],
        base.filters.geoLocation
      ),
      urlProtection: resolveBooleanFlag(
        filterSource,
        ["UrlProtection", "url_protection", "urlProtection"],
        base.filters.urlProtection
      ),
      uniqueIp: resolveBooleanFlag(
        filterSource,
        ["UniqueIP", "unique_ip", "uniqueIp"],
        base.filters.uniqueIp
      ),
      preScreen: resolveBooleanFlag(
        filterSource,
        ["PreScreen", "prescreen", "pre_screen", "preScreen"],
        base.filters.preScreen
      ),
    },
    language: pickSurveyFormValue(
      pickField(urlInfo, ["Language", "language"], survey?.language),
      base.language
    ),
    surveyGroup: resolveSurveyFormId(
      {
        ...survey,
        prescreen_survey_id: pickField(
          urlInfo,
          ["PreScreenid", "prescreen_survey_id"],
          survey?.prescreen_survey_id
        ),
      },
      ["prescreen_survey_id", "survey_group_id"],
      base.surveyGroup
    ),
    userTerminationPoint:
      terminationPoint != null ? String(terminationPoint) : base.userTerminationPoint,
    userCompletionPoint:
      completionPoint != null ? String(completionPoint) : base.userCompletionPoint,
    notes: pickSurveyFormValue(survey?.Notes ?? survey?.notes, base.notes),
    groupProjectId: resolveSurveyFormId(
      survey,
      ["survey_group_project_id", "group_project_id"],
      base.groupProjectId ?? ""
    ),
    partners: Array.isArray(survey?.partner_ids)
      ? survey.partner_ids.map((partnerId) => String(partnerId))
      : base.partners,
    partnerAllocations:
      survey?.partner_allocations && typeof survey.partner_allocations === "object"
        ? Object.fromEntries(
            Object.entries(survey.partner_allocations).map(([key, value]) => [
              String(key),
              value != null ? String(value) : "",
            ])
          )
        : base.partnerAllocations,
  };
}

/** GET /api/projects/:id */
export async function getRecord(id) {
  const normalizedId = normalizeSurveyId(id);
  const data = await apiRequest(API_ROUTES.projects.byId(normalizedId));
  assertSuccess(data);

  const record = extractSurveyRecord(data);
  if (!record) {
    throw new ApiError(data?.message ?? "Project not found.", data, 404);
  }

  return record;
}

/**
 * @param {object} form
 */
export function buildUpdateSurveyPayload(form) {
  return buildCreateSurveyPayload(form);
}

/** GET /api/projects/list */
export async function getRecords({ page, limit, search, groupProjectId } = {}) {
  // Group survey project lists still use mock until a dedicated API is available.
  if (groupProjectId) {
    await mockDelay();
    const result = filterMockSurveys({ page, limit, search, groupProjectId });
    return {
      success: true,
      ...result,
      total: result.total,
      count: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      items: result.data.map((survey) => mapSurveyToRow(survey)),
    };
  }

  const data = await apiRequest(
    appendListQuery(API_ROUTES.projects.list, {
      page,
      limit,
      search,
    })
  );
  assertSuccess(data);

  const projects = extractSurveysList(data);
  const total = extractListTotalFromResponse(data, projects.length);

  return {
    ...data,
    total,
    count: total,
    page: data.page ?? page,
    limit: data.limit ?? limit,
    totalPages:
      data.totalPages ?? Math.max(1, Math.ceil(total / (Number(limit) || 10)) || 1),
    items: projects.map((project) => mapSurveyToRow(project)),
  };
}

/**
 * POST /api/projects/add
 * @param {object} form
 * @param {{
 *   clientOptions?: Array<{ value: string, label: string }>,
 *   projectManagerOptions?: Array<{ value: string, label: string }>,
 *   salesManagerOptions?: Array<{ value: string, label: string }>,
 *   surveyGroupOptions?: Array<{ value: string, label: string }>,
 * }} [selectOptions]
 */
export async function createSurvey(form, selectOptions = {}) {
  const data = await apiRequest(API_ROUTES.projects.create, {
    method: "POST",
    body: buildCreateProjectPayload(form, selectOptions),
  });
  return assertSuccess(data);
}

/**
 * POST /api/survey/add/:groupProjectId
 * @param {string|number} groupProjectId
 * @param {object} form
 */
export async function createSurveyUnderGroup(groupProjectId, form) {
  if (USE_SURVEY_MOCK_DATA) {
    await mockDelay(350);
    const payload = buildGroupSurveyProjectPayload(form);
    const record = createMockSurvey({
      ...payload,
      group_project_id: groupProjectId,
    });
    return {
      success: true,
      message: "Survey created under group successfully (mock).",
      data: record,
    };
  }

  const normalizedId = normalizeSurveyId(groupProjectId);
  const data = await apiRequest(API_ROUTES.survey.createUnderGroup(normalizedId), {
    method: "POST",
    body: buildGroupSurveyProjectPayload(form),
  });
  return assertSuccess(data);
}

/**
 * PUT /api/survey/:id
 * @param {string|number} surveyId
 * @param {object} form
 */
export async function updateSurvey(surveyId, form) {
  if (USE_SURVEY_MOCK_DATA) {
    await mockDelay(350);
    const payload = buildUpdateSurveyPayload(form);
    const record = updateMockSurvey(surveyId, payload);
    if (!record) {
      throw new ApiError("Survey not found.", null, 404);
    }
    return {
      success: true,
      message: "Survey updated successfully (mock).",
      data: record,
    };
  }

  const normalizedId = normalizeSurveyId(surveyId);
  const data = await apiRequest(API_ROUTES.survey.update(normalizedId), {
    method: "PUT",
    body: buildUpdateSurveyPayload(form),
  });
  return assertSuccess(data);
}

/** PUT /api/survey/:id — status toggle from listing table. */
export async function updateSurveyStatus(surveyId, { status }) {
  const normalizedId = normalizeSurveyId(surveyId);
  const data = await apiRequest(API_ROUTES.projects.updateStatus(normalizedId), {
    method: "PATCH",
    body: {
      Status: formValueToApiStatus(status),
    },
  });
  return assertSuccess(data);
}

/** DELETE /api/survey/:id */
export async function deleteSurvey(surveyId) {
  if (USE_SURVEY_MOCK_DATA) {
    await mockDelay(250);
    const removed = deleteMockSurvey(surveyId);
    if (!removed) {
      throw new ApiError("Survey not found.", null, 404);
    }
    return {
      success: true,
      message: "Survey deleted successfully (mock).",
    };
  }

  const normalizedId = normalizeSurveyId(surveyId);
  const data = await apiRequest(API_ROUTES.survey.delete(normalizedId), {
    method: "DELETE",
  });
  return assertSuccess(data);
}

/** Clone survey (mock). Wired for list Survey Clone action. */
export async function cloneSurvey(surveyId) {
  await mockDelay(350);
  const record = cloneMockSurvey(surveyId);
  if (!record) {
    throw new ApiError("Survey not found.", null, 404);
  }
  return {
    success: true,
    message: "Survey cloned successfully (mock).",
    data: record,
  };
}

/**
 * GET supplier mapping details (falls back to demo data when API unavailable).
 * @param {string} surveyId
 * @param {string} supplierCode
 */
export async function fetchSupplierMappingDetails(surveyId, supplierCode) {
  try {
    const data = await apiRequest(
      `/api/survey/${encodeURIComponent(surveyId)}/supplier-mapping/${encodeURIComponent(supplierCode)}`,
      { method: "GET" }
    );
    return data?.supplier ?? data?.data ?? data;
  } catch {
    await new Promise((r) => setTimeout(r, 200));
    const detail = getSupplierMappingDetail(supplierCode);
    if (!detail) {
      throw new ApiError("Supplier mapping not found.");
    }
    return detail;
  }
}

/**
 * PUT project status (demo fallback).
 * @param {string} surveyId
 * @param {string} status
 */
export async function updateSurveyProjectStatus(surveyId, status) {
  try {
    const data = await apiRequest(
      `/api/survey/${encodeURIComponent(surveyId)}/status`,
      {
        method: "PUT",
        body: { status },
      }
    );
    return assertSuccess(data);
  } catch (err) {
    if (err instanceof ApiError && err.status) {
      throw err;
    }
    await new Promise((r) => setTimeout(r, 350));
    const project = getSurveyProjectDetails(surveyId);
    if (!project) {
      throw new ApiError("Survey not found.");
    }
    return {
      success: true,
      message: `Project status updated to ${status}.`,
    };
  }
}

export async function updateSupplierMapping(surveyId, payload) {
  try {
    const data = await apiRequest(
      `/api/survey/${encodeURIComponent(surveyId)}/supplier-mapping`,
      {
        method: "PUT",
        body: payload,
      }
    );
    return assertSuccess(data);
  } catch (err) {
    if (err instanceof ApiError && err.status) {
      throw err;
    }
    await new Promise((r) => setTimeout(r, 350));
    return {
      success: true,
      message: "Supplier mapping updated successfully.",
    };
  }
}

function extractPartnersList(data) {
  if (!data || typeof data !== "object") return [];
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.partners)) return data.partners;
  return [];
}

function resolvePartnerRecordId(partner) {
  const value =
    partner?.partner_id ??
    partner?.partnerId ??
    partner?.id ??
    partner?.pid;
  if (value == null || value === "") return "";
  return String(value);
}

/**
 * @param {object[]} partners
 */
export function mapPartnersToSelectOptions(partners = []) {
  return partners
    .map((partner) => {
      const value = resolvePartnerRecordId(partner);
      const name = partner?.name ?? "";
      const code = partner?.code ?? "";
      const label = [code, name].filter(Boolean).join(" — ") || name || code || value;
      return {
        value,
        label,
        searchText: [code, name, partner?.email].filter(Boolean).join(" "),
      };
    })
    .filter((option) => option.value);
}

/**
 * @param {object[]} partners
 */
export function mapAssignedPartnersToForm(partners = []) {
  const partnerIds = [];
  const partnerAllocations = {};

  for (const partner of partners) {
    const partnerId = resolvePartnerRecordId(partner);
    if (!partnerId) continue;
    partnerIds.push(partnerId);
    const allocated =
      partner?.allocated_size ?? partner?.allocatedSize ?? partner?.allocation;
    if (allocated != null && allocated !== "") {
      partnerAllocations[partnerId] = String(allocated);
    }
  }

  return { partners: partnerIds, partnerAllocations };
}

/**
 * Resolves numeric survey id for partner APIs.
 * @param {string|number|object} idOrRecord
 */
export function resolveSurveyNumericId(idOrRecord) {
  if (idOrRecord && typeof idOrRecord === "object") {
    const recordId = idOrRecord?.id ?? idOrRecord?.recordId;
    if (recordId != null && recordId !== "") {
      const numeric = Number(recordId);
      if (Number.isFinite(numeric) && numeric > 0) return numeric;
    }
  }

  const normalized = String(idOrRecord ?? "").trim();
  if (!normalized) return null;

  const numeric = Number(normalized);
  if (Number.isFinite(numeric) && numeric > 0) return numeric;

  return null;
}

/** GET /api/survey/:id/eligible-partners */
export async function getEligiblePartners(surveyId) {
  if (USE_SURVEY_MOCK_DATA) {
    await mockDelay();
    void surveyId;
    return {
      success: true,
      data: MOCK_SURVEY_PARTNERS.map((partner) => ({ ...partner })),
    };
  }

  const normalizedId = normalizeSurveyId(surveyId);
  const data = await apiRequest(API_ROUTES.survey.eligiblePartners(normalizedId));
  return assertSuccess(data);
}

/** GET /api/survey/:id/partners */
export async function getAssignedPartners(surveyId) {
  if (USE_SURVEY_MOCK_DATA) {
    await mockDelay();
    const record = getMockSurveyById(surveyId);
    const assignedIds = Array.isArray(record?.partner_ids)
      ? record.partner_ids.map(String)
      : [];
    const partners = MOCK_SURVEY_PARTNERS.filter((partner) =>
      assignedIds.includes(String(partner.partner_id))
    );
    return partners.map((partner) => ({ ...partner }));
  }

  const normalizedId = normalizeSurveyId(surveyId);
  const data = await apiRequest(API_ROUTES.survey.partners(normalizedId));
  assertSuccess(data);
  return extractPartnersList(data);
}

/**
 * POST /api/survey/:id/assign-partners
 * @param {string|number} surveyId
 * @param {Array<string|number>} partnerIds
 */
export async function assignPartners(surveyId, partnerIds = []) {
  if (USE_SURVEY_MOCK_DATA) {
    await mockDelay(300);
    const ids = partnerIds
      .map((partnerId) => resolveNumericId(partnerId))
      .filter((partnerId) => partnerId != null);
    const names = MOCK_SURVEY_PARTNERS.filter((partner) =>
      ids.includes(partner.partner_id)
    )
      .map((partner) => partner.name)
      .join(", ");
    const record = updateMockSurvey(surveyId, {
      partner_ids: ids,
      partner_names: names,
    });
    if (!record) {
      throw new ApiError("Survey not found.", null, 404);
    }
    return {
      success: true,
      message: "Partners assigned successfully (mock).",
      data: record,
    };
  }

  const normalizedId = normalizeSurveyId(surveyId);
  const ids = partnerIds
    .map((partnerId) => resolveNumericId(partnerId))
    .filter((partnerId) => partnerId != null);

  const data = await apiRequest(API_ROUTES.survey.assignPartners(normalizedId), {
    method: "POST",
    body: { partner_ids: ids },
  });
  return assertSuccess(data);
}

/**
 * PATCH /api/survey/:id/partners/:pid/allocation
 * @param {string|number} surveyId
 * @param {string|number} partnerId
 * @param {string|number} allocatedSize
 */
export async function updatePartnerAllocation(surveyId, partnerId, allocatedSize) {
  if (USE_SURVEY_MOCK_DATA) {
    await mockDelay(250);
    const record = getMockSurveyById(surveyId);
    if (!record) {
      throw new ApiError("Survey not found.", null, 404);
    }
    const allocations = {
      ...(record.partner_allocations ?? {}),
      [String(partnerId)]: String(allocatedSize ?? ""),
    };
    updateMockSurvey(surveyId, { partner_allocations: allocations });
    return {
      success: true,
      message: "Partner allocation updated (mock).",
    };
  }

  const normalizedSurveyId = normalizeSurveyId(surveyId);
  const normalizedPartnerId = normalizeSurveyId(partnerId);
  const data = await apiRequest(
    API_ROUTES.survey.partnerAllocation(normalizedSurveyId, normalizedPartnerId),
    {
      method: "PATCH",
      body: { allocated_size: Number(allocatedSize) },
    }
  );
  return assertSuccess(data);
}

/** DELETE /api/survey/:id/partners/:pid */
export async function removeSurveyPartner(surveyId, partnerId) {
  if (USE_SURVEY_MOCK_DATA) {
    await mockDelay(250);
    const record = getMockSurveyById(surveyId);
    if (!record) {
      throw new ApiError("Survey not found.", null, 404);
    }
    const ids = (record.partner_ids ?? []).filter(
      (id) => String(id) !== String(partnerId)
    );
    const names = MOCK_SURVEY_PARTNERS.filter((partner) =>
      ids.map(String).includes(String(partner.partner_id))
    )
      .map((partner) => partner.name)
      .join(", ");
    updateMockSurvey(surveyId, { partner_ids: ids, partner_names: names });
    return {
      success: true,
      message: "Partner removed (mock).",
    };
  }

  const normalizedSurveyId = normalizeSurveyId(surveyId);
  const normalizedPartnerId = normalizeSurveyId(partnerId);
  const data = await apiRequest(
    API_ROUTES.survey.removePartner(normalizedSurveyId, normalizedPartnerId),
    { method: "DELETE" }
  );
  return assertSuccess(data);
}
