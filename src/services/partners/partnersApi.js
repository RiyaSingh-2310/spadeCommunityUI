import { API_ROUTES } from "../../config/api";
import { formatCountryLabel } from "../countries/countriesApi";
import { getDefaultPhoneCountryCode } from "../../modules/shared/data/phoneCountries";
import { extractListTotalFromResponse } from "../../modules/shared/utils/listResponse";
import { appendListQuery } from "../../modules/shared/utils/listQueryParams";
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
import { formatLocaleDateTime } from "../../modules/shared/utils/dateTime";
import { encryptValue } from "../../modules/shared/utils/encryption";

export const PARTNER_PANEL_SIZE_MAX_DIGITS = 9;

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
    createdDate: formatLocaleDateTime(createdRaw),
    createdAt: createdRaw,
    contactPerson: partner?.contact_person ?? "",
    panelSize:
      partner?.panel_size != null && String(partner.panel_size).trim() !== ""
        ? String(partner.panel_size)
        : "—",
    completeUrl: partner?.complete_val ?? partner?.complete ?? "",
    terminateUrl: partner?.terminate_val ?? partner?.terminate ?? "",
    overQuotaUrl: partner?.over_quota_val ?? partner?.over_quota ?? "",
    qualityTermsUrl: partner?.quality_term_val ?? partner?.quality_term ?? "",
    surveyCloseUrl: partner?.survey_close_val ?? partner?.survey_close ?? "",
    apiBaseUrl: partner?.api_base_url ?? partner?.apiBaseUrl ?? "",
    apiSecretKey: partner?.api_secret_key ?? partner?.apiSecretKey ?? "",
    apiBody: partner?.api_body ?? partner?.apiBody ?? "",
    aboutPartner: partner?.about_partner ?? "",
    updatedAt: partner?.updated_at ?? "",
    updatedDate: formatLocaleDateTime(partner?.updated_at ?? ""),
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
  const panelSizeMax = 10 ** PARTNER_PANEL_SIZE_MAX_DIGITS - 1;

  return {
    country: form.country.trim(),
    contact_person: form.contactPerson.trim(),
    contact_no: resolvePartnerContactNo(form.contactNumber, form.country),
    website_url: form.website.trim(),
    panel_size:
      Number.isFinite(panelSize) && panelSize > 0
        ? Math.min(panelSize, panelSizeMax)
        : 0,
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
  const apiBody = String(form.apiBody ?? form.apiHeaderKey ?? "").trim();
  const apiHeaderKey = String(form.apiHeaderKey ?? "").trim();

  const fields = {};
  if (apiBaseUrl) fields.api_base_url = apiBaseUrl;
  if (apiHeaderKey) fields.api_header_key = apiHeaderKey;
  if (apiSecretKey) fields.api_secret_key = encryptValue(apiSecretKey);
  if (apiBody) fields.api_body = apiBody;

  return fields;
}

export function buildCreatePartnerPayload(form) {
  const panelSize = Number.parseInt(String(form.panelSize ?? "").trim(), 10);
  const panelSizeMax = 10 ** PARTNER_PANEL_SIZE_MAX_DIGITS - 1;

  return {
    name: form.name.trim(),
    email: form.email.trim(),
    contact_no: resolvePartnerContactNo(form.contactNumber, form.country),
    country: form.country.trim(),
    contact_person: form.contactPerson.trim(),
    website_url: form.website.trim(),
    panel_size:
      Number.isFinite(panelSize) && panelSize > 0
        ? Math.min(panelSize, panelSizeMax)
        : 0,
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
export async function getRecords({ page, limit, search } = {}) {
  const data = await apiRequest(appendListQuery(API_ROUTES.partners.list, { page, limit, search }));
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

const partnerDetailCache = new Map();

/** Clears cached partner detail responses (all rows or one id). */
export function clearPartnerDetailCache(id) {
  if (id == null || String(id).trim() === "") {
    partnerDetailCache.clear();
    return;
  }
  partnerDetailCache.delete(String(id));
}

/**
 * GET /api/partner/:id with in-memory cache for expandable rows.
 * @param {string|number} id
 * @param {{ force?: boolean }} [options]
 */
export async function getPartnerDetailCached(id, { force = false } = {}) {
  const cacheKey = String(id ?? "").trim();
  if (!cacheKey) {
    throw new ApiError("Invalid partner id.", null);
  }

  if (!force && partnerDetailCache.has(cacheKey)) {
    return partnerDetailCache.get(cacheKey);
  }

  const partner = await getRecord(id);
  partnerDetailCache.set(cacheKey, partner);
  return partner;
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

const PARTNER_INFO_FIELD_CONFIG = [
  { label: "Contact Person", rowKey: "contactPerson", apiKeys: ["contact_person"] },
  { label: "Panel Size", rowKey: "panelSize", apiKeys: ["panel_size"] },
  {
    label: "Created At",
    rowKey: "createdDate",
    apiKeys: ["created_at"],
    isDate: true,
  },
  {
    label: "Updated At",
    rowKey: "updatedDate",
    apiKeys: ["updated_at"],
    isDate: true,
  },
];

const PARTNER_URL_FIELD_CONFIG = [
  {
    label: "Complete URL",
    rowKey: "completeUrl",
    apiKeys: ["complete_val", "complete"],
    isUrl: true,
  },
  {
    label: "Terminate URL",
    rowKey: "terminateUrl",
    apiKeys: ["terminate_val", "terminate"],
    isUrl: true,
  },
  {
    label: "Over Quota URL",
    rowKey: "overQuotaUrl",
    apiKeys: ["over_quota_val", "over_quota"],
    isUrl: true,
  },
  {
    label: "Quality Term URL",
    rowKey: "qualityTermsUrl",
    apiKeys: ["quality_term_val", "quality_term"],
    isUrl: true,
  },
  {
    label: "Survey Closed URL",
    rowKey: "surveyCloseUrl",
    apiKeys: ["survey_close_val", "survey_close"],
    isUrl: true,
  },
];

const PARTNER_EXPANDABLE_FIELD_CONFIG = [
  ...PARTNER_INFO_FIELD_CONFIG,
  ...PARTNER_URL_FIELD_CONFIG,
];

function formatPartnerDetailExtraValue(key, value) {
  if (key.endsWith("_at") && value) {
    return formatLocaleDateTime(value);
  }
  return String(value);
}

function buildPartnerExpandableFields(partner, config) {
  if (!partner || typeof partner !== "object") return [];

  const row = mapPartnerToRow(partner);

  return config.map((fieldConfig) => {
    let value = row[fieldConfig.rowKey] ?? "";
    if (fieldConfig.isDate && !value) {
      const rawKey = fieldConfig.apiKeys[0];
      const raw = partner[rawKey];
      value = raw ? formatPartnerDetailExtraValue(rawKey, raw) : "";
    }

    return {
      label: fieldConfig.label,
      value,
      isUrl: Boolean(fieldConfig.isUrl),
    };
  });
}

/**
 * Builds expandable-row fields from Partner Detail API response.
 * @param {object} partner
 */
export function getPartnerExpandableFields(partner) {
  return buildPartnerExpandableFields(partner, PARTNER_EXPANDABLE_FIELD_CONFIG);
}

/**
 * @param {object} partner
 */
export function getPartnerExpandableSections(partner) {
  return {
    partnerInfo: buildPartnerExpandableFields(partner, PARTNER_INFO_FIELD_CONFIG),
    urlInfo: buildPartnerExpandableFields(partner, PARTNER_URL_FIELD_CONFIG),
  };
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
 * PUT /api/partner/:id — status toggle from partners listing table.
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
 * PUT /api/partner/:id
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
