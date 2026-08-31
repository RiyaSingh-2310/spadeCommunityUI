import { API_ROUTES } from "../../../config/api";
import { apiRequest } from "../../../services/api/client";
import { ApiError } from "../../../services/api/ApiError";
import { formatCountryLabel } from "../../../services/countries/countriesApi";
import { getRecord, getRecords } from "./surveyApi";
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
  const surveyCode = survey?.id ?? survey?.survey_id ?? survey?.surveyId ?? "";
  const projectName = survey?.project_name ?? survey?.projectName ?? "";
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

/**
 * @param {object} survey
 */
export function mapSurveyToRecontactFormDefaults(survey) {
  if (!survey || typeof survey !== "object") {
    return {};
  }

  const referenceProjectId =
    survey.recordId ?? survey.record_id ?? survey.id ?? survey.project_id;

  return {
    parentSurveyId: referenceProjectId != null ? String(referenceProjectId) : "",
    client: survey.client_name ?? survey.Clients ?? survey.clientName ?? "",
    projectManager:
      survey.project_manager_id != null
        ? String(survey.project_manager_id)
        : survey.Project_Manager != null
          ? String(survey.Project_Manager)
          : "",
    projectCountry:
      formatCountryLabel(survey.project_country ?? survey.country) !== "—"
        ? formatCountryLabel(survey.project_country ?? survey.country)
        : (survey.project_country ?? survey.country ?? ""),
    loi: survey.loi != null ? String(survey.loi) : survey.LOI != null ? String(survey.LOI) : "",
    ir: survey.ir != null ? String(survey.ir) : "",
    sampleSize:
      survey.sample_size != null
        ? String(survey.sample_size)
        : survey.SampleSize != null
          ? String(survey.SampleSize)
          : "",
    currency: survey.currency ?? "",
    cpi: survey.cpi != null ? String(survey.cpi) : "",
    liveUrl: survey.live_url ?? survey.Live_Link ?? "",
    testUrl: survey.test_url ?? survey.Test_Link ?? "",
    description: survey.description ?? "",
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

/** GET /api/projects/list — search Survey Projects by project name. */
export async function searchRecontactProjects(search = "") {
  const normalized = normalizeSearchQuery(search);
  if (!normalized) {
    return [];
  }

  const data = await getRecords({ page: 1, limit: 50, search: normalized });
  const items = Array.isArray(data.items) ? data.items : [];

  return items.filter((item) => matchesSearchQuery(item.projectName, normalized));
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
