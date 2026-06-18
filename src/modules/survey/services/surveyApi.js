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

function formatSurveyListDate(value) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  const day = String(parsed.getDate()).padStart(2, "0");
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const year = parsed.getFullYear();
  return `${day}/${month}/${year}`;
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
  const normalized = String(linkType ?? "").toLowerCase();
  if (normalized === "multi") return "Multi Link";
  return "Single Link";
}

function resolveBooleanFlag(survey, keys, fallback = false) {
  for (const key of keys) {
    const value = survey?.[key];
    if (value != null) return Boolean(value);
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
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    const iso = String(value).slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso : "";
  }
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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
 * @param {object} survey
 */
export function mapSurveyToRow(survey) {
  return {
    id: survey?.survey_id ?? "",
    surveyId: survey?.survey_id ?? "",
    recordId: survey?.id,
    projectName: survey?.project_name ?? "",
    clientCode: formatClientCodeDisplay(survey?.client_code, survey?.client_name),
    clientName: survey?.client_name ?? "",
    projectManagerName: survey?.project_manager_name ?? "",
    partnerNames: survey?.partner_names ?? "",
    startDate: formatSurveyListDate(survey?.start_date),
    endDate: formatSurveyListDate(survey?.end_date),
    loi: survey?.loi != null ? String(survey.loi) : "—",
    ir: survey?.ir != null ? String(survey.ir) : "—",
    sampleSize: survey?.sample_size != null ? String(survey.sample_size) : "—",
    cpi: survey?.cpi != null ? String(survey.cpi) : "—",
    currency: survey?.currency ?? "",
    status: apiStatusToFormValue(survey?.status),
  };
}

/**
 * Maps GET /api/survey/:id response for the project details view.
 * @param {object} survey
 */
export function mapSurveyToProjectDetails(survey) {
  if (!survey || typeof survey !== "object") return null;

  return {
    id: survey.survey_id ?? String(survey.id ?? ""),
    recordId: survey.id,
    projectStatus: apiStatusToFormValue(survey.status),
    clientName: survey.client_name ?? "",
    projectName: survey.project_name ?? "",
    projectManager: survey.project_manager_name ?? "",
    projectCountry: survey.project_country ?? "",
    description: survey.description ?? "",
    surveyId: survey.survey_id ?? "",
    salesManager: survey.sales_manager_name ?? "",
    salesProject: survey.sales_project_name ?? "",
    loiMinutes: survey.loi != null ? String(survey.loi) : "—",
    irPercent: survey.ir != null ? String(survey.ir) : "—",
    sampleSize: survey.sample_size != null ? String(survey.sample_size) : "—",
    cpiUsd: survey.cpi != null ? String(survey.cpi) : "—",
    currency: survey.currency ?? "",
    startDate: formatSurveyListDate(survey.start_date),
    endDate: formatSurveyListDate(survey.end_date),
    liveLink: survey.live_url ?? "",
    testLink: survey.test_url ?? "",
    filters: {
      geolocation: resolveBooleanFlag(survey, ["geo_location", "geoLocation"]),
      urlProtection: resolveBooleanFlag(survey, ["url_protection", "urlProtection"]),
      uniqueIp: resolveBooleanFlag(survey, ["unique_ip", "uniqueIp"]),
      prescreen: resolveBooleanFlag(survey, ["prescreen", "pre_screen", "preScreen"]),
    },
    redirectLinks: {
      complete: survey.complete_url ?? survey.redirect_complete ?? "",
      terminate: survey.terminate_url ?? survey.redirect_terminate ?? "",
      overQuota: survey.over_quota_url ?? survey.redirect_over_quota ?? "",
      qualityTerm: survey.quality_term_url ?? survey.redirect_quality_term ?? "",
      surveyClose: survey.survey_close_url ?? survey.redirect_survey_close ?? "",
    },
    userCompletionPoint: survey.comp_point != null ? String(survey.comp_point) : "",
    userTerminationPoint: survey.term_point != null ? String(survey.term_point) : "",
    note: survey.notes ?? "",
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
  const linkType = apiLinkTypeToForm(survey?.link_type);
  const existingCsvFileName = pickSurveyFormValue(
    survey?.survey_file_name ??
      survey?.csv_file_name ??
      survey?.file_name ??
      survey?.survey_file ??
      survey?.uploaded_file_name,
    ""
  );

  return {
    ...base,
    client: resolveNestedSurveyFormId(
      survey,
      ["client_id"],
      "client",
      survey?.client_code != null ? String(survey.client_code) : base.client
    ),
    projectName: pickSurveyFormValue(survey?.project_name, base.projectName),
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
    projectCountry: pickSurveyFormValue(survey?.project_country, base.projectCountry),
    description: pickSurveyFormValue(survey?.description, base.description),
    loi: survey?.loi != null ? String(survey.loi) : base.loi,
    ir: survey?.ir != null ? String(survey.ir) : base.ir,
    sampleSize:
      survey?.sample_size != null ? String(survey.sample_size) : base.sampleSize,
    currency: pickSurveyFormValue(survey?.currency, base.currency),
    cpi: survey?.cpi != null ? String(survey.cpi) : base.cpi,
    startDate: toDateInputValue(survey?.start_date) || base.startDate,
    endDate: toDateInputValue(survey?.end_date) || base.endDate,
    projectLinkType: linkType,
    liveLink: pickSurveyFormValue(survey?.live_url, base.liveLink),
    testLink: pickSurveyFormValue(survey?.test_url, base.testLink),
    surveyCsvFile: null,
    existingSurveyCsvFileName: existingCsvFileName,
    existingMultiLinkSurvey: linkType === "Multi Link",
    filters: {
      geoLocation: resolveBooleanFlag(
        survey,
        ["geo_location", "geoLocation"],
        base.filters.geoLocation
      ),
      urlProtection: resolveBooleanFlag(
        survey,
        ["url_protection", "urlProtection"],
        base.filters.urlProtection
      ),
      uniqueIp: resolveBooleanFlag(
        survey,
        ["unique_ip", "uniqueIp"],
        base.filters.uniqueIp
      ),
      preScreen: resolveBooleanFlag(
        survey,
        ["prescreen", "pre_screen", "preScreen"],
        base.filters.preScreen
      ),
    },
    language: pickSurveyFormValue(survey?.language, base.language),
    surveyGroup: resolveSurveyFormId(
      survey,
      ["prescreen_survey_id", "survey_group_id"],
      base.surveyGroup
    ),
    userTerminationPoint:
      survey?.term_point != null ? String(survey.term_point) : base.userTerminationPoint,
    userCompletionPoint:
      survey?.comp_point != null ? String(survey.comp_point) : base.userCompletionPoint,
    notes: pickSurveyFormValue(survey?.notes, base.notes),
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

/** GET /api/survey/:id — falls back to list lookup when detail endpoint is unavailable. */
export async function getRecord(id) {
  const normalizedId = normalizeSurveyId(id);

  try {
    const data = await apiRequest(API_ROUTES.survey.byId(normalizedId));
    assertSuccess(data);

    const record = extractSurveyRecord(data);
    if (record) return record;
  } catch {
    // Fall back to list lookup below.
  }

  const listId = decodeURIComponent(normalizedId);
  const data = await apiRequest(API_ROUTES.survey.list);
  assertSuccess(data);

  const surveys = extractSurveysList(data);
  const record = surveys.find(
    (survey) =>
      String(survey?.id) === listId || String(survey?.survey_id) === listId
  );

  if (!record) {
    throw new ApiError(data?.message ?? "", data);
  }

  return record;
}

/**
 * @param {object} form
 */
export function buildUpdateSurveyPayload(form) {
  return buildCreateSurveyPayload(form);
}

/** GET /api/survey/list */
export async function getRecords({ page, limit, search, groupProjectId } = {}) {
  const safeGroupProjectId = Number(groupProjectId);
  const data = await apiRequest(
    appendListQuery(API_ROUTES.survey.list, {
      page,
      limit,
      search,
      extra:
        Number.isFinite(safeGroupProjectId) && safeGroupProjectId > 0
          ? { group_project_id: safeGroupProjectId }
          : undefined,
    })
  );
  assertSuccess(data);

  const surveys = extractSurveysList(data);
  const total = extractListTotalFromResponse(data, surveys.length);

  return {
    ...data,
    total,
    count: total,
    page: data.page,
    limit: data.limit,
    totalPages: data.totalPages,
    items: surveys.map((survey) => mapSurveyToRow(survey)),
  };
}

/**
 * POST /api/survey/add
 * @param {object} form
 */
export async function createSurvey(form) {
  const data = await apiRequest(API_ROUTES.survey.create, {
    method: "POST",
    body: buildCreateSurveyPayload(form),
  });
  return assertSuccess(data);
}

/**
 * POST /api/survey/add/:groupProjectId
 * @param {string|number} groupProjectId
 * @param {object} form
 */
export async function createSurveyUnderGroup(groupProjectId, form) {
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
  const data = await apiRequest(API_ROUTES.survey.update(normalizedId), {
    method: "PUT",
    body: {
      status: formValueToApiStatus(status),
    },
  });
  return assertSuccess(data);
}

/** DELETE /api/survey/:id */
export async function deleteSurvey(surveyId) {
  const normalizedId = normalizeSurveyId(surveyId);
  const data = await apiRequest(API_ROUTES.survey.delete(normalizedId), {
    method: "DELETE",
  });
  return assertSuccess(data);
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
  const normalizedId = normalizeSurveyId(surveyId);
  const data = await apiRequest(API_ROUTES.survey.eligiblePartners(normalizedId));
  return assertSuccess(data);
}

/** GET /api/survey/:id/partners */
export async function getAssignedPartners(surveyId) {
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
  const normalizedSurveyId = normalizeSurveyId(surveyId);
  const normalizedPartnerId = normalizeSurveyId(partnerId);
  const data = await apiRequest(
    API_ROUTES.survey.removePartner(normalizedSurveyId, normalizedPartnerId),
    { method: "DELETE" }
  );
  return assertSuccess(data);
}
