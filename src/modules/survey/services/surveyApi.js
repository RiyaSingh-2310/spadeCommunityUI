import { API_ROUTES } from "../../../config/api";
import { extractListTotalFromResponse } from "../../shared/utils/listResponse";
import { apiStatusToFormValue } from "../../shared/utils/statusLabels";
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
  return "unique";
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

/**
 * @param {object} survey
 */
export function mapSurveyToRow(survey) {
  const clientCode = survey?.client_code;
  return {
    id: survey?.survey_id ?? "",
    recordId: survey?.id,
    projectName: survey?.project_name ?? "",
    clientCode: clientCode != null && clientCode !== "" ? String(clientCode) : "—",
    startDate: formatSurveyListDate(survey?.start_date),
    endDate: formatSurveyListDate(survey?.end_date),
    status: apiStatusToFormValue(survey?.status),
    clientName: survey?.client_name ?? "",
    projectManagerName: survey?.project_manager_name ?? "",
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
    term_point: Number(form.userTerminationPoint),
    comp_point: Number(form.userCompletionPoint),
    cpi: Number(form.cpi),
    notes: form.notes?.trim() || undefined,
  };

  const salesManagerId = resolveNumericId(form.salesManager);
  const salesProjectId = resolveNumericId(form.salesProject);
  if (salesManagerId != null) payload.sales_manager_id = salesManagerId;
  if (salesProjectId != null) payload.sales_project_id = salesProjectId;

  if (form.projectLinkType === "Single Link") {
    payload.live_url = form.liveLink?.trim();
    payload.test_url = form.testLink?.trim();
  }

  return payload;
}

/**
 * @param {object} survey
 * @param {object} [fallback]
 */
function resolveSurveyFormId(survey, idKeys, nameKeys, fallback = "") {
  for (const key of idKeys) {
    const value = survey?.[key];
    if (value != null && value !== "") {
      return String(value);
    }
  }

  for (const key of nameKeys) {
    const value = survey?.[key];
    if (value != null && value !== "") {
      return String(value);
    }
  }

  return fallback;
}

export function mapSurveyToForm(survey, fallback = null) {
  const base = fallback ?? createEmptySurveyForm();

  return {
    ...base,
    client: resolveSurveyFormId(
      survey,
      ["client_id"],
      [],
      survey?.client_code != null ? String(survey.client_code) : base.client
    ),
    projectName: pickSurveyFormValue(survey?.project_name, base.projectName),
    projectManager: resolveSurveyFormId(
      survey,
      ["project_manager_id"],
      ["project_manager_name"],
      base.projectManager
    ),
    salesManager: resolveSurveyFormId(
      survey,
      ["sales_manager_id"],
      ["sales_manager_name"],
      base.salesManager
    ),
    salesProject: resolveSurveyFormId(
      survey,
      ["sales_project_id"],
      [],
      base.salesProject
    ),
    projectCountry: pickSurveyFormValue(survey?.project_country, base.projectCountry),
    loi: survey?.loi != null ? String(survey.loi) : base.loi,
    ir: survey?.ir != null ? String(survey.ir) : base.ir,
    sampleSize:
      survey?.sample_size != null ? String(survey.sample_size) : base.sampleSize,
    currency: pickSurveyFormValue(survey?.currency, base.currency),
    cpi: survey?.cpi != null ? String(survey.cpi) : base.cpi,
    startDate: toDateInputValue(survey?.start_date) || base.startDate,
    endDate: toDateInputValue(survey?.end_date) || base.endDate,
    notes: pickSurveyFormValue(survey?.notes, base.notes),
  };
}

/** GET /api/survey/list — resolve a single survey by numeric id or survey_id. */
export async function getRecord(id) {
  const normalizedId = String(id ?? "").trim();
  if (!normalizedId) {
    throw new ApiError("", null);
  }

  const data = await apiRequest(API_ROUTES.survey.list);
  assertSuccess(data);

  const surveys = extractSurveysList(data);
  const record = surveys.find(
    (survey) =>
      String(survey?.id) === normalizedId ||
      String(survey?.survey_id) === normalizedId
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
  return {
    project_name: form.projectName?.trim(),
    project_country: form.projectCountry?.trim(),
    loi: Number(form.loi),
    ir: Number(form.ir),
    sample_size: Number(form.sampleSize),
    currency: form.currency,
    start_date: form.startDate,
    end_date: form.endDate,
    cpi: Number(form.cpi),
    notes: form.notes?.trim() || undefined,
  };
}

/** GET /api/survey/list */
export async function getRecords() {
  const data = await apiRequest(API_ROUTES.survey.list);
  assertSuccess(data);

  const surveys = extractSurveysList(data);
  const total = extractListTotalFromResponse(data, surveys.length);

  return {
    ...data,
    total,
    count: total,
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
