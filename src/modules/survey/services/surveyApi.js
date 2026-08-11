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

/** Set true to force mock survey data instead of live APIs. */
const USE_SURVEY_MOCK_DATA = false;

function toNullableNumber(value) {
  if (value === "" || value == null) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function resolveOptionLabel(options, value) {
  const normalized = String(value ?? "").trim();
  if (!normalized) return "";
  const match = (options ?? []).find((option) => String(option.value) === normalized);
  return String(match?.label ?? normalized).trim();
}

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
  const clientDisplay =
    formatClientCodeDisplay(project?.client_code, clientName) || clientName || "—";
  const urlInfo = getPrimaryUrlInfo(project);
  const startDate = pickField(
    urlInfo,
    ["Start_Date", "start_date", "startDate"],
    project?.Start_Date ?? project?.start_date ?? project?.startDate
  );
  const endDate = pickField(
    urlInfo,
    ["End_Date", "end_date", "endDate"],
    project?.End_Date ?? project?.end_date ?? project?.endDate
  );
  const urlMinStartDate = pickField(
    project,
    ["min_start_date", "minStartDate", "url_min_start_date", "urlMinStartDate"],
    null
  );
  const urlMaxStartDate = pickField(
    project,
    ["max_start_date", "maxStartDate", "url_max_start_date", "urlMaxStartDate"],
    null
  );
  const status = project?.Status ?? project?.status;
  const loi = project?.LOI ?? project?.loi;
  const ir = project?.IR ?? project?.ir;
  const sampleSize = project?.SampleSize ?? project?.sample_size;
  const cpi = project?.CPI ?? project?.cpi;

  return {
    id: project?.id != null && project?.id !== "" ? String(project.id) : "",
    surveyId: projectCode || (project?.id != null ? String(project.id) : ""),
    projectCode: projectCode || "",
    recordId: project?.id,
    projectName,
    client: clientDisplay,
    clientCode: clientDisplay,
    clientName,
    projectManagerName: project?.Project_Manager ?? project?.project_manager_name ?? "",
    partnerNames: project?.partner_names ?? "",
    startDate: formatSurveyListDate(startDate),
    endDate: formatSurveyListDate(endDate),
    urlMinStartDate: formatSurveyListDate(urlMinStartDate),
    urlMaxStartDate: formatSurveyListDate(urlMaxStartDate),
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
  const linkTypeRaw = survey.Project_Link_Type ?? survey.link_type ?? "";
  const projectLinkType = apiLinkTypeToForm(linkTypeRaw) || "Single Link";

  return {
    id: projectCode,
    recordId: survey.id,
    projectStatus: apiStatusToFormValue(survey.Status ?? survey.status),
    clientName: survey.Clients ?? survey.client_name ?? "",
    projectName: survey.Project_Name ?? survey.project_name ?? "",
    projectCode,
    projectManager: survey.Project_Manager ?? survey.project_manager_name ?? "",
    projectCountry: country ?? "",
    description: survey.Project_Description ?? survey.description ?? "",
    surveyId: projectCode,
    salesManager: survey.Sales_Manager ?? survey.sales_manager_name ?? "",
    salesProject:
      survey.sales_project_id ??
      survey.rfq_id ??
      survey.RFQ ??
      survey.sales_project_name ??
      "",
    rfq:
      survey.sales_project_id ??
      survey.rfq_id ??
      survey.RFQ ??
      survey.sales_project_name ??
      "",
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
    projectLinkType,
    actionBy:
      survey.action_by ??
      survey.Action_By ??
      survey.updated_by ??
      survey.created_by ??
      "—",
    createdAt: formatSurveyListDate(survey.created_at ?? survey.Created_At),
    updatedAt: formatSurveyListDate(survey.updated_at ?? survey.Updated_At),
    deletedAt: survey.deleted_at ?? survey.Deleted_At
      ? formatSurveyListDate(survey.deleted_at ?? survey.Deleted_At)
      : "—",
    urlInfo: (() => {
      const info = survey.urlInfo;
      if (Array.isArray(info)) return info;
      if (info && typeof info === "object") return [info];
      return [];
    })(),
    multipleUrls: Array.isArray(survey.multipleUrls) ? survey.multipleUrls : [],
  };
}

/**
 * URL / survey-matrix fields for PUT /api/projects/:id.
 * @param {object} form Project URLs form shape
 */
export function buildProjectUrlApiFields(form = {}) {
  const language = String(form.language ?? "").trim();

  return {
    description: String(form.discussion ?? "").trim(),
    loi: toNullableNumber(form.loi),
    ir: toNullableNumber(form.ir),
    country: String(form.country ?? "").trim(),
    cpi: toNullableNumber(form.cpiRate ?? form.cpi),
    sample_size: toNullableNumber(form.sampleSize),
    start_date: form.startDate || null,
    end_date: form.endDate || null,
    url_status: form.status || "Open",
    live_link: String(form.liveLink ?? "").trim(),
    test_link: String(form.testLink ?? "").trim(),
    geo_location: Boolean(form.geoLocation),
    url_protection: Boolean(form.urlProtection),
    unique_ip: Boolean(form.uniqueIp),
    pre_screen: Boolean(form.preScreen),
    language: language.toLowerCase(),
    termination_point: toNullableNumber(form.terminationRewardPoints),
    completion_point: toNullableNumber(form.completeRewardPoints),
  };
}

/**
 * Builds PUT /api/projects/:id body from the survey edit form.
 * Matches the project fields in the projects update API contract.
 * @param {object} form
 * @param {{
 *   clientOptions?: Array<{ value: string, label: string }>,
 *   projectManagerOptions?: Array<{ value: string, label: string }>,
 *   salesManagerOptions?: Array<{ value: string, label: string }>,
 * }} [selectOptions]
 * @param {object | null} [urlForm] Optional Project URLs form to merge
 */
export function buildUpdateProjectApiPayload(form, selectOptions = {}, urlForm = null) {
  const {
    clientOptions = [],
    projectManagerOptions = [],
    salesManagerOptions = [],
  } = selectOptions;

  const salesProjectId = String(form.salesProject ?? form.rfq ?? "").trim();

  const payload = {
    Project_Name: String(form.projectName ?? "").trim(),
    Clients: resolveOptionLabel(clientOptions, form.client),
    Project_Manager: resolveOptionLabel(projectManagerOptions, form.projectManager),
    Sales_Manager: resolveOptionLabel(salesManagerOptions, form.salesManager),
    RFQ: salesProjectId,
    Project_Description: String(form.description ?? "").trim(),
    Project_Link_Type: form.projectLinkType || "Single Link",
    link_type: formLinkTypeToApi(form.projectLinkType),
    Notes: String(form.notes ?? "").trim(),
    Status: formValueToApiStatus(form.status),
  };

  // Omit empty dates so MySQL never receives '' for DATE columns; preserves existing values when untouched.
  const startDate = String(form.startDate ?? "").trim();
  const endDate = String(form.endDate ?? "").trim();
  if (startDate) payload.startDate = startDate;
  if (endDate) payload.endDate = endDate;

  if (urlForm) {
    Object.assign(payload, buildProjectUrlApiFields(urlForm));
  }

  return payload;
}

/**
 * Builds PUT /api/projects/:id body when updating from Project URLs tab.
 * Sends current project identity fields plus URL/matrix fields.
 * @param {object} project Mapped project details (`mapSurveyToProjectDetails`)
 * @param {object} urlForm Project URLs form
 */
export function buildUpdateProjectPayloadFromDetails(project, urlForm) {
  return {
    Project_Name: String(project?.projectName ?? "").trim(),
    Clients: String(project?.clientName ?? "").trim(),
    Project_Manager: String(project?.projectManager ?? "").trim(),
    Sales_Manager: String(project?.salesManager ?? "").trim(),
    RFQ: String(project?.salesProject ?? project?.rfq ?? "").trim(),
    Project_Description: String(project?.description ?? "").trim(),
    Project_Link_Type: project?.projectLinkType || "Single Link",
    link_type: formLinkTypeToApi(project?.projectLinkType),
    Notes: String(project?.note ?? "").trim(),
    Status: formValueToApiStatus(project?.projectStatus),
    ...buildProjectUrlApiFields(urlForm),
  };
}

/**
 * Builds POST /api/projects/add body from the survey create form.
 * @param {object} form
 * @param {{
 *   clientOptions?: Array<{ value: string, label: string }>,
 *   projectManagerOptions?: Array<{ value: string, label: string }>,
 *   salesManagerOptions?: Array<{ value: string, label: string }>,
 * }} [selectOptions]
 */
export function buildCreateProjectPayload(form, selectOptions = {}) {
  const {
    clientOptions = [],
    projectManagerOptions = [],
    salesManagerOptions = [],
  } = selectOptions;

  const salesProjectId = String(form.salesProject ?? form.rfq ?? "").trim();

  const payload = {
    Project_Name: String(form.projectName ?? "").trim(),
    Project_code: String(form.projectCode ?? "").trim(),
    Clients: resolveOptionLabel(clientOptions, form.client),
    client_id: resolveNumericId(form.client),
    Project_Manager: resolveOptionLabel(projectManagerOptions, form.projectManager),
    project_manager_id: resolveNumericId(form.projectManager),
    Sales_Manager: resolveOptionLabel(salesManagerOptions, form.salesManager),
    sales_manager_id: resolveNumericId(form.salesManager),
    sales_project_id: salesProjectId,
    RFQ: salesProjectId,
    rfq_id: salesProjectId,
    Project_Description: String(form.description ?? "").trim(),
    Project_Link_Type: form.projectLinkType || "Single Link",
    link_type: formLinkTypeToApi(form.projectLinkType),
    Notes: String(form.notes ?? "").trim(),
    Status: formValueToApiStatus(form.status),
  };

  const startDate = String(form.startDate ?? "").trim();
  const endDate = String(form.endDate ?? "").trim();
  if (startDate) payload.startDate = startDate;
  if (endDate) payload.endDate = endDate;

  return payload;
}

/**
 * @param {object} form
 */
export function buildCreateSurveyPayload(form) {
  const salesProjectId = String(form.salesProject ?? form.rfq ?? "").trim();
  const statusValue =
    String(form.status ?? "Active").toLowerCase() === "inactive"
      ? "inactive"
      : "active";

  const payload = {
    Project_Name: form.projectName?.trim(),
    project_name: form.projectName?.trim(),
    Project_code: form.projectCode?.trim(),
    project_code: form.projectCode?.trim(),
    client_id: resolveNumericId(form.client),
    project_manager_id: resolveNumericId(form.projectManager),
    Project_Description: form.description ?? "",
    description: form.description ?? "",
    Project_Link_Type: form.projectLinkType || "Single Link",
    link_type: formLinkTypeToApi(form.projectLinkType),
    Notes: form.notes?.trim() ?? "",
    notes: form.notes?.trim() ?? "",
    Status: statusValue,
    status: statusValue,
  };

  const salesManagerId = resolveNumericId(form.salesManager);
  if (salesManagerId != null) payload.sales_manager_id = salesManagerId;
  if (salesProjectId) {
    payload.rfq_id = salesProjectId;
    payload.sales_project_id = salesProjectId;
  }

  const startDate = String(form.startDate ?? "").trim();
  const endDate = String(form.endDate ?? "").trim();
  if (startDate) payload.startDate = startDate;
  if (endDate) payload.endDate = endDate;

  const groupProjectId = resolveNumericId(form.groupProjectId);
  if (groupProjectId != null) payload.survey_group_project_id = groupProjectId;

  return payload;
}

/**
 * Payload for POST /api/survey/add/:groupProjectId (group survey add project).
 * @param {object} form
 */
export function buildGroupSurveyProjectPayload(form) {
  return buildCreateSurveyPayload(form);
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

  // CamelCase nested objects (projectManager / salesManager / client)
  const camelKey = String(nestedKey ?? "").replace(/_([a-z])/g, (_, c) =>
    c.toUpperCase()
  );
  if (camelKey && camelKey !== nestedKey) {
    const camelNested = survey?.[camelKey];
    if (
      camelNested &&
      typeof camelNested === "object" &&
      camelNested.id != null &&
      camelNested.id !== ""
    ) {
      return String(camelNested.id);
    }
  }

  return fallback;
}

/**
 * Extracts a display label from common project API name fields.
 * @param {object} survey
 * @param {string[]} keys
 */
function resolveSurveyFormLabel(survey, keys = []) {
  for (const key of keys) {
    const value = survey?.[key];
    if (value != null && String(value).trim() !== "") {
      return String(value).trim();
    }
  }
  return "";
}

export function mapSurveyToForm(survey, fallback = null) {
  const base = fallback ?? createEmptySurveyForm();
  const linkType = apiLinkTypeToForm(
    survey?.Project_Link_Type ?? survey?.link_type ?? base.projectLinkType
  );

  const clientId = resolveNestedSurveyFormId(
    survey,
    ["client_id", "Client_id", "ClientId"],
    "client",
    ""
  );
  const clientLabel = resolveSurveyFormLabel(survey, [
    "Clients",
    "client_name",
    "clientName",
    "Client",
  ]);

  const projectManagerId = resolveNestedSurveyFormId(
    survey,
    ["project_manager_id", "Project_Manager_id", "projectManagerId"],
    "project_manager",
    ""
  );
  const projectManagerLabel = resolveSurveyFormLabel(survey, [
    "Project_Manager",
    "project_manager_name",
    "projectManagerName",
    "projectManager",
  ]);

  const salesManagerId = resolveNestedSurveyFormId(
    survey,
    ["sales_manager_id", "Sales_Manager_id", "salesManagerId"],
    "sales_manager",
    ""
  );
  const salesManagerLabel = resolveSurveyFormLabel(survey, [
    "Sales_Manager",
    "sales_manager_name",
    "salesManagerName",
    "salesManager",
  ]);

  const salesProjectId = resolveSurveyFormId(
    survey,
    ["sales_project_id", "rfq_id", "RFQ", "sales_project_name", "rfq"],
    base.salesProject
  );

  return {
    ...base,
    // Prefer IDs; keep labels as temporary values so SearchableSelect can still match
    // once options load (SurveyFormPage resolves label → id via ensureSelectOption).
    client: clientId || clientLabel || base.client,
    projectName: pickSurveyFormValue(
      survey?.Project_Name ?? survey?.project_name,
      base.projectName
    ),
    projectCode: pickSurveyFormValue(
      survey?.Project_code ?? survey?.survey_id ?? survey?.project_code,
      base.projectCode
    ),
    projectManager:
      projectManagerId || projectManagerLabel || base.projectManager,
    salesManager: salesManagerId || salesManagerLabel || base.salesManager,
    salesProject: salesProjectId,
    description: pickSurveyFormValue(
      survey?.Project_Description ?? survey?.description,
      base.description
    ),
    projectLinkType: linkType,
    startDate: toDateInputValue(
      pickField(survey, ["Start_Date", "start_date", "startDate"]) ?? base.startDate
    ),
    endDate: toDateInputValue(
      pickField(survey, ["End_Date", "end_date", "endDate"]) ?? base.endDate
    ),
    notes: pickSurveyFormValue(survey?.Notes ?? survey?.notes, base.notes),
    status: apiStatusToFormValue(survey?.Status ?? survey?.status) || base.status || "Active",
    groupProjectId: resolveSurveyFormId(
      survey,
      ["survey_group_project_id", "group_project_id"],
      base.groupProjectId ?? ""
    ),
  };
}

/** GET /api/projects/:id */
export async function getRecord(id) {
  if (USE_SURVEY_MOCK_DATA) {
    await mockDelay();
    const record = getMockSurveyById(id);
    if (!record) {
      throw new ApiError("Project not found.", null, 404);
    }
    return record;
  }

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
 * @param {object} [selectOptions]
 * @param {object | null} [urlForm]
 */
export function buildUpdateSurveyPayload(form, selectOptions = {}, urlForm = null) {
  return buildUpdateProjectApiPayload(form, selectOptions, urlForm);
}

/** GET /api/projects/list */
export async function getRecords({ page, limit, search, groupProjectId } = {}) {
  if (USE_SURVEY_MOCK_DATA) {
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
  if (USE_SURVEY_MOCK_DATA) {
    await mockDelay(350);
    const payload = buildCreateProjectPayload(form, selectOptions);
    const record = createMockSurvey(payload);
    return {
      success: true,
      message: "Project created successfully (mock).",
      data: record,
    };
  }

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
 * PUT /api/projects/:id
 * @param {string|number} surveyId
 * @param {object} form
 * @param {object} [selectOptions]
 * @param {object | null} [urlForm]
 */
export async function updateSurvey(surveyId, form, selectOptions = {}, urlForm = null) {
  const payload = buildUpdateProjectApiPayload(form, selectOptions, urlForm);

  if (USE_SURVEY_MOCK_DATA) {
    await mockDelay(350);
    const record = updateMockSurvey(surveyId, {
      ...buildCreateProjectPayload(form, selectOptions),
      ...payload,
    });
    if (!record) {
      throw new ApiError("Project not found.", null, 404);
    }
    return {
      success: true,
      message: "Project updated successfully!",
      data: record,
    };
  }

  const normalizedId = normalizeSurveyId(surveyId);
  const data = await apiRequest(API_ROUTES.projects.update(normalizedId), {
    method: "PUT",
    body: payload,
  });
  return assertSuccess(data);
}

/**
 * PUT /api/projects/:id — update only Project Link Type.
 * @param {string|number} projectId
 * @param {string} projectLinkType
 */
export async function updateProjectLinkType(projectId, projectLinkType) {
  const linkType = projectLinkType || "Single Link";
  const payload = {
    Project_Link_Type: linkType,
    link_type: formLinkTypeToApi(linkType),
  };

  if (USE_SURVEY_MOCK_DATA) {
    await mockDelay(250);
    const record = updateMockSurvey(projectId, payload);
    if (!record) {
      throw new ApiError("Project not found.", null, 404);
    }
    return {
      success: true,
      message: "Project link type updated successfully.",
      data: record,
    };
  }

  const normalizedId = normalizeSurveyId(projectId);
  const data = await apiRequest(API_ROUTES.projects.update(normalizedId), {
    method: "PUT",
    body: payload,
  });
  return assertSuccess(data);
}

/**
 * PUT /api/projects/:id — update from Project URLs tab (project fields + URL fields).
 * @param {string|number} projectId
 * @param {object} project Mapped project details
 * @param {object} urlForm Project URLs form
 */
export async function updateProjectUrlsViaProjectApi(projectId, project, urlForm) {
  const payload = buildUpdateProjectPayloadFromDetails(project, urlForm);

  if (USE_SURVEY_MOCK_DATA) {
    await mockDelay(350);
    const record = updateMockSurvey(projectId, payload);
    return {
      success: true,
      message: "Project updated successfully!",
      data: record,
    };
  }

  const normalizedId = normalizeSurveyId(projectId);
  const data = await apiRequest(API_ROUTES.projects.update(normalizedId), {
    method: "PUT",
    body: payload,
  });
  return assertSuccess(data);
}

/** PUT /api/survey/:id — status toggle from listing table. */
export async function updateSurveyStatus(surveyId, { status }) {
  if (USE_SURVEY_MOCK_DATA) {
    await mockDelay(250);
    const record = updateMockSurvey(surveyId, {
      Status: formValueToApiStatus(status),
    });
    if (!record) {
      throw new ApiError("Project not found.", null, 404);
    }
    return {
      success: true,
      message: "Project status updated successfully (mock).",
      data: record,
    };
  }

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

const CLONE_OMIT_KEYS = new Set([
  "id",
  "url_id",
  "Url_Id",
  "URL_Id",
  "project_url_id",
  "Project_Url_Id",
  "projectUrlId",
  "project_id",
  "created_at",
  "updated_at",
  "deleted_at",
  "deleted_by",
  "action_by",
  "updated_by",
  "Project_code",
  "project_code",
]);

function stripCloneIdentifiers(record) {
  if (!record || typeof record !== "object") return null;
  const next = {};
  Object.entries(record).forEach(([key, value]) => {
    if (CLONE_OMIT_KEYS.has(key)) return;
    next[key] = value;
  });
  return next;
}

function normalizeCloneUrlInfoList(record) {
  const info = record?.urlInfo;
  if (Array.isArray(info)) return info.filter((row) => row && typeof row === "object");
  if (info && typeof info === "object") return [info];
  return [];
}

function pickCloneText(...values) {
  for (const value of values) {
    if (value == null) continue;
    const text = String(value).trim();
    if (text) return text;
  }
  return null;
}

function buildCloneUrlInfoPayload(urlRow) {
  if (!urlRow || typeof urlRow !== "object") return null;

  const startRaw = urlRow.Start_Date ?? urlRow.start_date ?? urlRow.startDate ?? null;
  const endRaw = urlRow.End_Date ?? urlRow.end_date ?? urlRow.endDate ?? null;

  const payload = {
    description: urlRow.description ?? urlRow.Description ?? null,
    LOI: urlRow["LOI(Minute)"] ?? urlRow.LOI ?? urlRow.loi ?? null,
    IR: urlRow["IR(%)"] ?? urlRow.IR ?? urlRow.ir ?? null,
    country: urlRow.country ?? urlRow.Country ?? null,
    CPI: urlRow.CPI ?? urlRow.cpi ?? null,
    SampleSize: urlRow.SampleSize ?? urlRow.sample_size ?? urlRow.sampleSize ?? null,
    Start_Date: toDateInputValue(startRaw) || startRaw || null,
    End_Date: toDateInputValue(endRaw) || endRaw || null,
    Status: urlRow.Status ?? urlRow.url_status ?? urlRow.status ?? "active",
    Live_Link: urlRow.Live_Link ?? urlRow.live_link ?? urlRow.liveLink ?? null,
    Test_Link: urlRow.Test_Link ?? urlRow.test_link ?? urlRow.testLink ?? null,
    GeoLocation: Number(urlRow.GeoLocation ?? urlRow.geo_location ?? urlRow.geoLocation ?? 0) || 0,
    UrlProtection:
      Number(urlRow.UrlProtection ?? urlRow.url_protection ?? urlRow.urlProtection ?? 0) || 0,
    UniqueIP: Number(urlRow.UniqueIP ?? urlRow.unique_ip ?? urlRow.uniqueIp ?? 0) || 0,
    PreScreen: Number(urlRow.PreScreen ?? urlRow.pre_screen ?? urlRow.preScreen ?? 0) || 0,
    FraudDetection:
      Number(urlRow.FraudDetection ?? urlRow.fraud_detection ?? urlRow.fraudDetection ?? 0) || 0,
    Language: urlRow.Language ?? urlRow.language ?? null,
    PreScreenid: urlRow.PreScreenid ?? urlRow.pre_screener_id ?? urlRow.preScreenerId ?? null,
    PreScreenName: urlRow.PreScreenName ?? urlRow.pre_screen_name ?? null,
    TerminationPoint:
      urlRow.TerminationPoint ?? urlRow.termination_point ?? null,
    CompletionPoint: urlRow.CompletionPoint ?? urlRow.completion_point ?? null,
    CompleteURL: urlRow.CompleteURL ?? urlRow.complete_url ?? null,
    TerminateURL: urlRow.TerminateURL ?? urlRow.terminate_url ?? null,
    OverQuotaURL: urlRow.OverQuotaURL ?? urlRow.over_quota_url ?? null,
    QualityTermURL: urlRow.QualityTermURL ?? urlRow.quality_term_url ?? null,
    SurveyCloseURL: urlRow.SurveyCloseURL ?? urlRow.survey_close_url ?? null,
  };

  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined)
  );
}

function buildCloneMultipleUrlPayload(row) {
  if (!row || typeof row !== "object") return null;
  return {
    Live_Link: row.Live_Link ?? row.live_link ?? row.liveLink ?? null,
    VenderURL: row.VenderURL ?? row.vender_url ?? row.vendorUrl ?? null,
    Venderid_Userid:
      row.Venderid_Userid ?? row.venderid_userid ?? row.vendorUserId ?? null,
    UserType: row.UserType ?? row.user_type ?? row.userType ?? null,
    Status: row.Status ?? row.status ?? "active",
  };
}

/**
 * Builds POST /api/projects/add body from an existing project record (clone).
 * Omits id, Project_code, and timestamps — backend generates those.
 * @param {object} record
 */
function buildCloneProjectPayload(record) {
  const linkType = apiLinkTypeToForm(
    record?.Project_Link_Type ?? record?.link_type ?? "Single Link"
  );

  const payload = {
    Project_Name: pickCloneText(record?.Project_Name, record?.project_name) || "",
    Clients: pickCloneText(record?.Clients, record?.client_name),
    Project_Manager: pickCloneText(
      record?.Project_Manager,
      record?.project_manager_name
    ),
    Sales_Manager: pickCloneText(
      record?.Sales_Manager,
      record?.sales_manager_name
    ),
    RFQ: pickCloneText(record?.RFQ, record?.sales_project_id, record?.rfq_id),
    Project_Description: pickCloneText(
      record?.Project_Description,
      record?.description
    ),
    Project_Link_Type: linkType,
    Notes: pickCloneText(record?.Notes, record?.notes),
    Status: formValueToApiStatus(
      apiStatusToFormValue(record?.Status ?? record?.status)
    ),
  };

  const urlRows = normalizeCloneUrlInfoList(record);
  if (urlRows.length > 0) {
    const urlInfo = buildCloneUrlInfoPayload(urlRows[0]);
    if (urlInfo) payload.urlInfo = urlInfo;
  }

  const multipleUrls = Array.isArray(record?.multipleUrls)
    ? record.multipleUrls
        .map((row) => buildCloneMultipleUrlPayload(stripCloneIdentifiers(row)))
        .filter(Boolean)
    : [];
  if (multipleUrls.length > 0) {
    payload.multipleUrls = multipleUrls;
  }

  return { payload, urlRows };
}

/**
 * Clone a project by re-submitting its data to POST /api/projects/add.
 * Backend generates a new project id and Project_code.
 * @param {string|number} surveyId
 */
export async function cloneSurvey(surveyId) {
  if (USE_SURVEY_MOCK_DATA) {
    await mockDelay(350);
    const record = cloneMockSurvey(surveyId);
    if (!record) {
      throw new ApiError("Survey not found.", null, 404);
    }
    return {
      success: true,
      message: "Project cloned successfully!",
      data: record,
    };
  }

  const record = await getRecord(surveyId);
  const { payload, urlRows } = buildCloneProjectPayload(record);

  if (!payload.Project_Name) {
    throw new ApiError("Project name is required to clone.", null, 400);
  }

  const data = await apiRequest(API_ROUTES.projects.create, {
    method: "POST",
    body: payload,
  });
  const created = assertSuccess(data);
  const newProjectId = created?.data?.id;

  // Create Project accepts a single urlInfo; clone any additional URL configs.
  if (newProjectId && urlRows.length > 1) {
    for (const urlRow of urlRows.slice(1)) {
      const urlInfo = buildCloneUrlInfoPayload(urlRow);
      if (!urlInfo) continue;
      await apiRequest(API_ROUTES.projects.createUrl(normalizeSurveyId(newProjectId)), {
        method: "POST",
        body: urlInfo,
      });
    }
  }

  return {
    ...created,
    message: created?.message || "Project cloned successfully!",
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

function toPartnerMappingBoolean(value, fallback = false) {
  if (typeof value === "boolean") return value;
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();
  if (!normalized) return fallback;
  if (["1", "true", "yes", "on", "active"].includes(normalized)) return true;
  if (["0", "false", "no", "off", "inactive"].includes(normalized)) return false;
  return fallback;
}

/**
 * Maps GET /api/survey/:id/partners row into Partner Mapping table shape.
 * @param {object} partner
 * @param {number} index
 */
export function mapPartnerToMappingRow(partner, index = 0) {
  const partnerCode = String(
    partner?.code ?? partner?.partner_code ?? partner?.supplierCode ?? ""
  ).trim();
  const partnerUrl = String(
    partner?.vendor_url ??
      partner?.partner_url ??
      partner?.supplier_url ??
      partner?.url ??
      partner?.supplierUrl ??
      ""
  ).trim();

  return {
    sno: index + 1,
    id: resolvePartnerRecordId(partner),
    partnerCode: partnerCode || "—",
    partnerName: String(partner?.name ?? partner?.partner_name ?? "").trim() || "—",
    quota:
      partner?.allocated_size ??
      partner?.panel_size ??
      partner?.quota ??
      partner?.supplier_quota ??
      "—",
    cpi: partner?.cpi ?? partner?.cpi_rate ?? partner?.cpi_usd ?? "—",
    partnerUrl,
    statusActive: toPartnerMappingBoolean(
      partner?.status ?? partner?.is_active ?? partner?.active,
      true
    ),
    isTest: toPartnerMappingBoolean(partner?.is_test ?? partner?.isTest ?? partner?.test_mode),
    record: partner,
  };
}

/** GET partner mapping details (supplier-mapping API). */
export async function fetchPartnerMappingDetails(projectId, partnerCode) {
  return fetchSupplierMappingDetails(projectId, partnerCode);
}

/**
 * PUT partner mapping (supplier-mapping API).
 * @param {string|number} projectId
 * @param {{
 *   partnerCode?: string,
 *   quota?: string|number,
 *   cpi?: string|number,
 *   statusActive?: boolean,
 *   isTest?: boolean,
 *   redirects?: Record<string, string>,
 * }} payload
 */
export async function upsertPartnerMapping(projectId, payload = {}) {
  const redirects = payload.redirects ?? {};
  const body = {
    supplierCode: String(payload.partnerCode ?? "").trim(),
    supplierQuota: payload.quota,
    cpi: payload.cpi,
    status: payload.statusActive ? "Active" : "Inactive",
    is_test: payload.isTest ? 1 : 0,
    redirects: {
      complete: redirects.complete ?? "",
      terminate: redirects.terminate ?? "",
      overQuota: redirects.overQuota ?? "",
      qualityTerm: redirects.qualityTerm ?? "",
      surveyClose: redirects.surveyClose ?? "",
      postbackUrl: redirects.postbackUrl ?? "",
    },
  };

  const data = await updateSupplierMapping(projectId, body);
  return {
    ...data,
    message: data?.message || "Partner mapping saved successfully.",
  };
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
