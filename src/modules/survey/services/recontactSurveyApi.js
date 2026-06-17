import { API_ROUTES } from "../../../config/api";
import { apiRequest } from "../../../services/api/client";
import { ApiError } from "../../../services/api/ApiError";
import { formatCountryLabel } from "../../../services/countries/countriesApi";
import { getAssignedPartners, getRecord, getRecords } from "./surveyApi";

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

  return {
    parentSurveyId: survey.id != null ? String(survey.id) : "",
    client: survey.client_name ?? "",
    projectManager:
      survey.project_manager_id != null ? String(survey.project_manager_id) : "",
    projectCountry:
      formatCountryLabel(survey.project_country) !== "—"
        ? formatCountryLabel(survey.project_country)
        : (survey.project_country ?? ""),
    loi: survey.loi != null ? String(survey.loi) : "",
    ir: survey.ir != null ? String(survey.ir) : "",
    sampleSize: survey.sample_size != null ? String(survey.sample_size) : "",
    currency: survey.currency ?? "",
    cpi: survey.cpi != null ? String(survey.cpi) : "",
    liveUrl: survey.live_url ?? "",
    testUrl: survey.test_url ?? "",
    description: survey.description ?? "",
  };
}

/**
 * @param {object[]} partners
 */
export function mapPartnersToSupplierDetailRows(partners = []) {
  return partners.map((partner, index) => ({
    sno: index + 1,
    supplierCode: partner?.code ?? "—",
    supplierName: partner?.name ?? "—",
    totalRespondent: partner?.panel_size ?? partner?.allocated_size ?? "—",
    complete: partner?.complete_val ?? "—",
    terminate: partner?.terminate_val ?? "—",
    overQuota: partner?.over_quota_val ?? "—",
    qualityTerm: partner?.quality_term_val ?? "—",
    dropout: partner?.dropout ?? partner?.dropout_val ?? "—",
  }));
}

/** GET /api/survey/list — search Survey Projects by project name. */
export async function searchRecontactProjects(search = "") {
  const trimmed = String(search ?? "").trim();
  if (!trimmed) {
    return [];
  }

  const data = await getRecords({ page: 1, limit: 50, search: trimmed });
  const items = Array.isArray(data.items) ? data.items : [];
  const query = trimmed.toLowerCase();

  return items.filter((item) =>
    String(item.projectName ?? "")
      .toLowerCase()
      .includes(query)
  );
}

/** GET /api/survey/:id/partners — supplier details for selected parent survey. */
export async function getRecontactSupplierDetails(surveyId) {
  const partners = await getAssignedPartners(surveyId);
  return mapPartnersToSupplierDetailRows(partners);
}

/** @deprecated Use getRecontactSupplierDetails */
export const fetchRecontactSupplierDetails = getRecontactSupplierDetails;

/** GET /api/survey/:id — load parent survey details for form defaults. */
export async function getRecontactParentSurvey(surveyId) {
  return getRecord(surveyId);
}

/**
 * @param {ReturnType<typeof createEmptyRecontactSurveyForm>} form
 */
export function buildCreateRecontactSurveyPayload(form) {
  const payload = {
    parent_survey_id: resolveNumericId(form.parentSurveyId),
    project_name: String(form.projectName ?? "").trim(),
    description: String(form.description ?? ""),
    loi: Number(form.loi),
    ir: Number(form.ir),
    sample_size: Number(form.sampleSize),
    currency: form.currency,
    start_date: form.startDate,
    end_date: form.endDate,
    cpi: Number(form.cpi),
  };

  const notes = String(form.notes ?? "").trim();
  if (notes) payload.notes = notes;

  if (form.projectLinkType === "Single Link") {
    payload.live_url = String(form.liveUrl ?? "").trim();
    payload.test_url = String(form.testUrl ?? "").trim();
  }

  return payload;
}

/** POST /api/survey/recontact/add */
export async function createRecontactSurvey(form) {
  const data = await apiRequest(API_ROUTES.survey.recontactCreate, {
    method: "POST",
    body: buildCreateRecontactSurveyPayload(form),
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
