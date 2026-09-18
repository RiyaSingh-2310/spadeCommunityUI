import { API_ROUTES } from "../../../config/api";
import { apiRequest } from "../../../services/api/client";
import { ApiError } from "../../../services/api/ApiError";
import { formatCountryLabel } from "../../../services/countries/countriesApi";
import {
  getRecord,
  getRecords,
  mapSurveyToForm,
  mapSurveyToProjectDetails,
} from "./surveyApi";
import { MAX_API_LIST_LIMIT } from "../../shared/utils/listQueryParams";
import { formatAppDate } from "../../shared/utils/dateTime";
import { matchesSearchQuery, normalizeSearchQuery } from "../../shared/utils/searchQuery";

function assertSuccess(data) {
  if (data?.success !== true) {
    throw new ApiError(data?.message ?? "", data);
  }
  return data;
}

function resolveNumericId(value) {
  if (value == null || value === "") return undefined;
  const num = Number(value);
  if (Number.isFinite(num) && num > 0) return num;
  return undefined;
}

/** Maps form link type to the recontact API enum: SingleLink | MultiLink. */
function toRecontactProjectLinkType(value) {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
  return normalized === "multilink" || normalized === "multi" ? "MultiLink" : "SingleLink";
}

export function createEmptyRecontactSurveyForm() {
  return {
    parentSurveyId: "",
    client: "",
    projectName: "",
    description: "",
    loi: "",
    projectManager: "",
    ir: "",
    projectCountry: "",
    sampleSize: "",
    currency: "",
    respondentClickQuota: "",
    cpi: "",
    startDate: "",
    endDate: "",
    projectLinkType: "Single Link",
    liveUrl: "",
    testUrl: "",
    filters: {
      geoLocation: false,
      uniqueIp: false,
      checksum: false,
      preScreen: false,
    },
    language: "",
    surveyGroup: "",
    notes: "",
  };
}

/**
 * @param {object} survey
 */
export function mapSurveyToRecontactParentOption(survey) {
  const recordId = survey?.recordId ?? survey?.id;
  const surveyCode =
    survey?.projectCode ??
    survey?.Project_code ??
    survey?.id ??
    survey?.survey_id ??
    survey?.surveyId ??
    "";
  const projectName =
    survey?.projectName ?? survey?.Project_Name ?? survey?.project_name ?? "";
  const value = recordId != null ? String(recordId) : "";
  const label = [surveyCode, projectName].filter(Boolean).join(" — ") || value;

  return {
    value,
    label,
    searchText: [surveyCode, projectName, value].filter(Boolean).join(" "),
    projectName,
    surveyCode,
  };
}

function pickNonEmpty(...values) {
  for (const value of values) {
    if (value == null || value === "") continue;
    const text = String(value).trim();
    if (text && text !== "—") return text;
  }
  return "";
}

function resolveProjectCountryLabel(survey, details) {
  const raw = pickNonEmpty(
    details?.projectCountry,
    survey?.project_country,
    survey?.country,
    survey?.Country,
    survey?.country_name,
    survey?.Country_Name
  );
  if (!raw) return "";
  const labeled = formatCountryLabel(raw);
  return labeled && labeled !== "—" ? labeled : raw;
}

/**
 * @param {object} survey
 */
export function mapSurveyToRecontactFormDefaults(survey) {
  if (!survey || typeof survey !== "object") {
    return {};
  }

  const details = mapSurveyToProjectDetails(survey);
  const formMapped = mapSurveyToForm(survey);
  const referenceProjectId =
    survey.recordId ?? survey.record_id ?? survey.id ?? survey.project_id;

  const projectManager = pickNonEmpty(formMapped.projectManager, details?.projectManager);
  const projectManagerLabel = pickNonEmpty(
    details?.projectManager,
    survey.Project_Manager,
    survey.project_manager_name,
    survey.projectManagerName
  );

  const stripPlaceholder = (value) => {
    const text = String(value ?? "").trim();
    return text && text !== "—" ? text : "";
  };

  return {
    parentSurveyId: referenceProjectId != null ? String(referenceProjectId) : "",
    client: pickNonEmpty(
      details?.clientName,
      survey.client_name,
      survey.Clients,
      survey.clientName
    ),
    projectManager,
    projectManagerLabel,
    projectCountry: resolveProjectCountryLabel(survey, details),
    loi: pickNonEmpty(stripPlaceholder(details?.loiMinutes), survey.loi, survey.LOI),
    ir: pickNonEmpty(stripPlaceholder(details?.irPercent), survey.ir, survey.IR),
    sampleSize: pickNonEmpty(
      stripPlaceholder(details?.sampleSize),
      survey.sample_size,
      survey.SampleSize
    ),
    currency: pickNonEmpty(details?.currency, survey.currency),
    cpi: pickNonEmpty(stripPlaceholder(details?.cpiUsd), survey.cpi, survey.CPI),
    liveUrl: pickNonEmpty(details?.liveLink, survey.live_url, survey.Live_Link),
    testUrl: pickNonEmpty(details?.testLink, survey.test_url, survey.Test_Link),
    description: pickNonEmpty(
      formMapped.description,
      details?.description,
      survey.Project_Description,
      survey.project_description,
      survey.description,
      survey.Notes,
      survey.notes
    ),
    notes: pickNonEmpty(formMapped.notes, survey.Notes, survey.notes),
    startDate:
      formMapped.startDate ||
      stripPlaceholder(
        formatAppDate(
          survey.min_start_date ?? survey.Start_Date ?? survey.start_date,
          ""
        )
      ) ||
      "",
    endDate:
      formMapped.endDate ||
      stripPlaceholder(
        formatAppDate(
          survey.max_start_date ?? survey.End_Date ?? survey.end_date,
          ""
        )
      ) ||
      "",
  };
}

function pickPartnerField(record, keys, fallback = "—") {
  if (!record || typeof record !== "object") return fallback;
  for (const key of keys) {
    const value = record[key];
    if (value != null && value !== "") return value;
  }
  return fallback;
}

function extractPartnerRows(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.partners)) return payload.data.partners;
  if (Array.isArray(payload?.partners)) return payload.partners;
  return [];
}

/**
 * Maps GET /api/projects/:id/partners rows for the Supplier Details modal.
 * @param {object[]} partners
 */
export function mapPartnersToSupplierDetailRows(partners = []) {
  if (!Array.isArray(partners)) return [];

  return partners.map((partner, index) => ({
    sno: pickPartnerField(partner, ["s_no", "sNo", "sno"], index + 1),
    supplierId: pickPartnerField(partner, ["supplier_id", "supplierId"], ""),
    supplierCode: pickPartnerField(partner, ["supplier_code", "supplierCode", "code"]),
    supplierName: pickPartnerField(partner, ["supplier_name", "supplierName", "name"]),
    quota: pickPartnerField(partner, ["quota"]),
    totalRespondent: pickPartnerField(partner, [
      "total_respondent",
      "totalRespondent",
      "panel_size",
      "allocated_size",
    ]),
    complete: pickPartnerField(partner, ["complete", "complete_val"]),
    terminate: pickPartnerField(partner, ["terminate", "terminate_val"]),
    overQuota: pickPartnerField(partner, ["over_quota", "overQuota", "over_quota_val"]),
    qualityTerm: pickPartnerField(partner, [
      "quality_term",
      "qualityTerm",
      "quality_term_val",
    ]),
    dropout: pickPartnerField(partner, ["dropout", "dropout_val"]),
  }));
}

/**
 * GET /api/projects/list?hasUrl=true — search projects that have at least one URL.
 * Uses the shared projects list service (Bearer auth via apiRequest).
 * Walks paginated pages using total / totalPages from the API response.
 */
export async function searchRecontactProjects(search = "") {
  const normalized = normalizeSearchQuery(search);
  if (!normalized) {
    return [];
  }

  const limit = MAX_API_LIST_LIMIT;
  const items = [];
  let page = 1;
  let totalPages = 1;

  do {
    const data = await getRecords({
      page,
      limit,
      search: normalized,
      hasUrl: true,
    });
    items.push(...(Array.isArray(data.items) ? data.items : []));
    totalPages = Math.max(1, Number(data.totalPages) || 1);
    page += 1;
  } while (page <= totalPages && page <= 50);

  return items.filter((item) => {
    const haystack = [
      item?.projectName,
      item?.projectCode,
      item?.clientName,
      item?.projectManagerName,
      item?.salesManagerName,
      item?.rfq,
    ]
      .filter((value) => value != null && String(value).trim() !== "")
      .join(" ");
    return matchesSearchQuery(haystack, normalized);
  });
}

/** GET /api/projects/:id/partners — supplier details for the selected project. */
export async function getRecontactSupplierDetails(projectId) {
  const id = resolveNumericId(projectId);
  if (id == null) {
    throw new ApiError("Project is required.", null);
  }

  const data = await apiRequest(API_ROUTES.projects.partners(id));
  assertSuccess(data);
  return mapPartnersToSupplierDetailRows(extractPartnerRows(data));
}

/** @deprecated Use getRecontactSupplierDetails */
export const fetchRecontactSupplierDetails = getRecontactSupplierDetails;

/** GET /api/survey/:id — load parent survey details for form defaults. */
export async function getRecontactParentSurvey(surveyId) {
  return getRecord(surveyId);
}

/**
 * Builds multipart/form-data for POST /api/projects/recontact/add.
 * @param {ReturnType<typeof createEmptyRecontactSurveyForm>} form
 */
export function buildCreateRecontactSurveyFormData(form) {
  const referenceProjectId = resolveNumericId(form.parentSurveyId);
  if (referenceProjectId == null) {
    throw new ApiError("Reference project is required.", null);
  }

  const projectManagerId = resolveNumericId(form.projectManager);
  if (projectManagerId == null) {
    throw new ApiError("Project Manager is required.", null);
  }

  const projectName = String(form.projectName ?? "").trim();
  if (!projectName) {
    throw new ApiError("Project Name is required.", null);
  }

  const body = new FormData();
  body.append("reference_project_id", String(referenceProjectId));
  body.append("Project_Name", projectName);
  body.append("Project_Manager", String(projectManagerId));
  body.append("LOI", String(form.loi ?? "").trim());
  body.append("SampleSize", String(form.sampleSize ?? "").trim());
  body.append("Project_Link_Type", toRecontactProjectLinkType(form.projectLinkType));

  const isSingleLink = toRecontactProjectLinkType(form.projectLinkType) === "SingleLink";
  body.append("Live_Link", isSingleLink ? String(form.liveUrl ?? "").trim() : "");
  body.append("Test_Link", isSingleLink ? String(form.testUrl ?? "").trim() : "");

  return body;
}

/**
 * @deprecated Prefer buildCreateRecontactSurveyFormData for the projects recontact API.
 * @param {ReturnType<typeof createEmptyRecontactSurveyForm>} form
 */
export function buildCreateRecontactSurveyPayload(form) {
  return buildCreateRecontactSurveyFormData(form);
}

/** POST /api/projects/recontact/add (multipart/form-data) */
export async function createRecontactSurvey(form) {
  const data = await apiRequest(API_ROUTES.projects.recontactAdd, {
    method: "POST",
    body: buildCreateRecontactSurveyFormData(form),
  });

  return assertSuccess(data);
}

/**
 * @param {object[]} surveys
 */
export function mapSurveysToParentSelectOptions(surveys = []) {
  return surveys
    .map((survey) => mapSurveyToRecontactParentOption(survey))
    .filter((option) => option.value);
}
