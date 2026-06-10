import { API_ROUTES } from "../../config/api";
import { formatCountryLabel, getCountries } from "../countries/countriesApi";
import { getDefaultPhoneCountryCode } from "../../modules/shared/data/phoneCountries";
import { extractListTotalFromResponse } from "../../modules/shared/utils/listResponse";
import {
  apiStatusToFormValue,
  formValueToApiStatus,
} from "../../modules/shared/utils/statusLabels";
import {
  formatPhoneValue,
  parsePhoneValue,
  sanitizePhoneDigits,
} from "../../modules/shared/utils/phoneValidation";
import { apiRequest } from "../api/client";
import { ApiError } from "../api/ApiError";

function isApiSuccess(data) {
  if (!data || typeof data !== "object") return false;
  const explicit = data.success;
  if (explicit === false || explicit === "false") return false;
  return explicit === true || explicit === "true" || explicit == null;
}

function assertSuccess(data) {
  if (!isApiSuccess(data)) {
    throw new ApiError(data?.message ?? "", data);
  }
  return data;
}

function normalizePartnerId(id) {
  const normalizedId = String(id ?? "").trim();
  if (!normalizedId || normalizedId === "undefined" || normalizedId === "null") {
    throw new ApiError("", null);
  }
  return encodeURIComponent(normalizedId);
}

function extractPartnersList(data) {
  if (!data || typeof data !== "object") return [];
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.partners)) return data.partners;
  return [];
}

function extractPartnerRecord(data) {
  if (!data || typeof data !== "object") return null;
  if (data.data && typeof data.data === "object" && !Array.isArray(data.data)) {
    return data.data;
  }
  if (data.partner && typeof data.partner === "object") {
    return data.partner;
  }
  if (data.id != null) return data;
  return null;
}

function formatPartnerListDate(value) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isPartnerFormPayload(payload) {
  return payload && typeof payload === "object" && "contactPerson" in payload;
}

/**
 * @param {string} contactNo
 * @param {string} [countryLabel]
 */
export function formatPartnerContactForForm(contactNo, countryLabel) {
  const digits = sanitizePhoneDigits(contactNo);
  if (!digits) return "";
  const countryCode = getDefaultPhoneCountryCode(countryLabel);
  return formatPhoneValue(countryCode, digits);
}

/**
 * @param {string} contactNumber Full phone from PhoneInput (e.g. "+91 9876543210")
 * @param {string} [countryLabel]
 */
export function resolvePartnerContactNo(contactNumber, countryLabel) {
  const fallback = getDefaultPhoneCountryCode(countryLabel);
  const parsed = parsePhoneValue(contactNumber, fallback);
  return sanitizePhoneDigits(parsed.nationalNumber);
}

/**
 * @param {object} partner
 */
export function mapPartnerToRow(partner) {
  const country = partner?.country ?? "";
  const createdRaw = partner?.created_at ?? "";

  return {
    id: partner?.id,
    partnerCode: partner?.code ?? "",
    name: partner?.name ?? "",
    emailAddress: partner?.email ?? "",
    country: country ? formatCountryLabel(country) : "—",
    countryValue: country,
    contactNumber: partner?.contact_no ?? "—",
    websiteUrl: partner?.website_url ?? "—",
    status: apiStatusToFormValue(partner?.status),
    createdDate: formatPartnerListDate(createdRaw),
    createdAt: createdRaw,
    contactPerson: partner?.contact_person ?? "",
    panelSize: partner?.panel_size ?? "",
    completeUrl: partner?.complete_val ?? partner?.complete ?? "",
    terminateUrl: partner?.terminate_val ?? partner?.terminate ?? "",
    overQuotaUrl: partner?.over_quota_val ?? partner?.over_quota ?? "",
    qualityTermsUrl: partner?.quality_term_val ?? partner?.quality_term ?? "",
    surveyCloseUrl: partner?.survey_close_val ?? partner?.survey_close ?? "",
    apiBaseUrl: partner?.api_base_url ?? partner?.apiBaseUrl ?? "",
    apiSecretKey: partner?.api_secret_key ?? partner?.apiSecretKey ?? "",
    apiBody: partner?.api_body ?? partner?.apiBody ?? "",
    aboutPartner: partner?.about_partner ?? "",
  };
}

/**
 * @param {object} partner
 */
export function mapPartnerToForm(partner) {
  const country = partner?.country ?? "";
  return {
    code: partner?.code ?? "",
    name: partner?.name ?? "",
    email: partner?.email ?? "",
    country,
    contactPerson: partner?.contact_person ?? "",
    contactNumber: formatPartnerContactForForm(partner?.contact_no, country),
    website: partner?.website_url ?? "",
    panelSize: String(partner?.panel_size ?? ""),
    complete: String(partner?.complete_val ?? partner?.complete ?? ""),
    terminate: String(partner?.terminate_val ?? partner?.terminate ?? ""),
    overQuota: String(partner?.over_quota_val ?? partner?.over_quota ?? ""),
    qualityTerm: String(partner?.quality_term_val ?? partner?.quality_term ?? ""),
    surveyClose: String(partner?.survey_close_val ?? partner?.survey_close ?? ""),
    aboutPartner: partner?.about_partner ?? "",
    status: apiStatusToFormValue(partner?.status),
    apiBaseUrl: partner?.api_base_url ?? partner?.apiBaseUrl ?? "",
    apiSecretKey: partner?.api_secret_key ?? partner?.apiSecretKey ?? "",
    apiBody: partner?.api_body ?? partner?.apiBody ?? "",
  };
}

/**
 * @param {{
 *   code: string,
 *   name: string,
 *   email: string,
 *   country: string,
 *   contactPerson: string,
 *   contactNumber: string,
 *   website: string,
 *   panelSize: string,
 *   complete: string,
 *   terminate: string,
 *   overQuota: string,
 *   qualityTerm: string,
 *   surveyClose: string,
 *   aboutPartner: string,
 *   status?: string,
 * }} form
 */
function buildPartnerSurveyPayload(form) {
  const panelSize = Number.parseInt(String(form.panelSize ?? "").trim(), 10);

  return {
    country: form.country.trim(),
    contact_person: form.contactPerson.trim(),
    contact_no: resolvePartnerContactNo(form.contactNumber, form.country),
    website_url: form.website.trim(),
    panel_size: Number.isFinite(panelSize) ? panelSize : 0,
    complete: String(form.complete ?? "").trim(),
    terminate: String(form.terminate ?? "").trim(),
    over_quota: String(form.overQuota ?? "").trim(),
    quality_term: String(form.qualityTerm ?? "").trim(),
    survey_close: String(form.surveyClose ?? "").trim(),
    about_partner: form.aboutPartner.trim(),
  };
}

function buildPartnerApiFields(form) {
  const apiBaseUrl = String(form.apiBaseUrl ?? "").trim();
  const apiSecretKey = String(form.apiSecretKey ?? "").trim();
  const apiBody = String(form.apiBody ?? "").trim();

  const fields = {};
  if (apiBaseUrl) fields.api_base_url = apiBaseUrl;
  if (apiSecretKey) fields.api_secret_key = apiSecretKey;
  if (apiBody) fields.api_body = apiBody;

  return fields;
}

export function buildCreatePartnerPayload(form) {
  return {
    name: form.name.trim(),
    email: form.email.trim(),
    contact_no: resolvePartnerContactNo(form.contactNumber, form.country),
    country: form.country.trim(),
    contact_person: form.contactPerson.trim(),
    website_url: form.website.trim(),
    complete: String(form.complete ?? "").trim(),
    terminate: String(form.terminate ?? "").trim(),
    over_quota: String(form.overQuota ?? "").trim(),
    quality_term: String(form.qualityTerm ?? "").trim(),
    survey_close: String(form.surveyClose ?? "").trim(),
    about_partner: form.aboutPartner.trim(),
    ...buildPartnerApiFields(form),
  };
}

/**
 * @param {Parameters<typeof buildCreatePartnerPayload>[0]} form
 */
export function buildUpdatePartnerPayload(form) {
  return {
    name: form.name.trim(),
    email: form.email.trim(),
    status: formValueToApiStatus(form.status),
    ...buildPartnerSurveyPayload(form),
    ...buildPartnerApiFields(form),
  };
}

export function formStatusToApiStatus(status) {
  return formValueToApiStatus(status);
}

/** GET /api/partner/list */
export async function getRecords() {
  const [, data] = await Promise.all([getCountries(), apiRequest(API_ROUTES.partners.list)]);
  assertSuccess(data);

  const partners = extractPartnersList(data);
  const total = extractListTotalFromResponse(data, partners.length);

  return {
    ...data,
    total,
    count: total,
    items: partners.map((partner) => mapPartnerToRow(partner)),
  };
}

/** GET /api/partner/:id */
export async function getRecord(id) {
  const normalizedId = normalizePartnerId(id);
  const data = await apiRequest(API_ROUTES.partners.byId(normalizedId));
  assertSuccess(data);

  const partner = extractPartnerRecord(data);
  if (!partner) {
    throw new ApiError(data?.message ?? "", data);
  }

  return partner;
}

/**
 * POST /api/partner/add
 * @param {Parameters<typeof buildCreatePartnerPayload>[0]} payload
 */
export async function createPartner(payload) {
  const body = buildCreatePartnerPayload(payload);

  const data = await apiRequest(API_ROUTES.partners.create, {
    method: "POST",
    body,
  });

  return assertSuccess(data);
}

/**
 * PUT /api/admin/partner/:id — status toggle from partners listing table.
 * @param {string|number} id
 * @param {{ name: string, status: string }} payload
 */
export async function updatePartnerStatus(id, { name, status }) {
  const normalizedId = normalizePartnerId(id);
  const data = await apiRequest(API_ROUTES.partners.update(normalizedId), {
    method: "PUT",
    body: {
      name: String(name ?? "").trim(),
      status: formValueToApiStatus(status),
    },
  });

  return assertSuccess(data);
}

/**
 * PUT /api/admin/partner/:id
 * @param {string|number} id
 * @param {Parameters<typeof buildUpdatePartnerPayload>[0] | Record<string, unknown>} payload
 */
export async function updatePartner(id, payload) {
  const normalizedId = normalizePartnerId(id);
  const body = isPartnerFormPayload(payload)
    ? buildUpdatePartnerPayload(
        /** @type {Parameters<typeof buildUpdatePartnerPayload>[0]} */ (payload)
      )
    : payload;

  const data = await apiRequest(API_ROUTES.partners.update(normalizedId), {
    method: "PUT",
    body,
  });

  return assertSuccess(data);
}

/** DELETE /api/admin/partner/:id */
export async function deleteRecord(id) {
  const normalizedId = normalizePartnerId(id);
  const data = await apiRequest(API_ROUTES.partners.delete(normalizedId), {
    method: "DELETE",
  });

  return assertSuccess(data);
}
