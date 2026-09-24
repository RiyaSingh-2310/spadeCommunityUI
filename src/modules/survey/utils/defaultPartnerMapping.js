/**
 * Default Partner Mapping — frontend helpers.
 *
 * Resolution order for the default/complete-terminate portal partner:
 * 1. Explicit backend flags: is_default / isDefault / partner_type=portal|default|…
 * 2. Optional env: VITE_DEFAULT_PARTNER_ID or VITE_DEFAULT_PARTNER_CODE
 * 3. Name/code heuristics (default, portal, spade community, complete-terminate)
 * 4. Sole partner in the list (only when exactly one partner exists)
 *
 * Prefer backend auto-create on Project URL creation with quota = sample size.
 * This UI never hard-codes a partner ID in source.
 */

function coerceText(value) {
  return String(value ?? "").trim();
}

function toTruthyFlag(value) {
  if (value === true || value === 1) return true;
  const normalized = coerceText(value).toLowerCase();
  return ["1", "true", "yes", "on", "default"].includes(normalized);
}

function readConfiguredDefaultPartnerId() {
  try {
    return coerceText(import.meta.env?.VITE_DEFAULT_PARTNER_ID);
  } catch {
    return "";
  }
}

function readConfiguredDefaultPartnerCode() {
  try {
    return coerceText(import.meta.env?.VITE_DEFAULT_PARTNER_CODE).toLowerCase();
  } catch {
    return "";
  }
}

/**
 * @param {object|null|undefined} partner
 * @returns {boolean}
 */
export function isDefaultPartnerRecord(partner) {
  if (!partner || typeof partner !== "object") return false;

  if (
    toTruthyFlag(partner.is_default) ||
    toTruthyFlag(partner.isDefault) ||
    toTruthyFlag(partner.is_default_partner) ||
    toTruthyFlag(partner.isDefaultPartner) ||
    toTruthyFlag(partner.default_partner) ||
    toTruthyFlag(partner.defaultPartner)
  ) {
    return true;
  }

  const role = coerceText(
    partner.partner_role ??
      partner.partnerRole ??
      partner.partner_type ??
      partner.partnerType ??
      partner.role ??
      partner.type
  ).toLowerCase();

  if (
    role === "default" ||
    role === "portal" ||
    role === "complete_terminate" ||
    role === "complete-terminate" ||
    role === "default_portal"
  ) {
    return true;
  }

  const configuredId = readConfiguredDefaultPartnerId();
  const partnerId = resolvePartnerId(partner);
  if (configuredId && partnerId && configuredId === partnerId) {
    return true;
  }

  const configuredCode = readConfiguredDefaultPartnerCode();
  const code = coerceText(partner.code ?? partner.partner_code).toLowerCase();
  if (configuredCode && code && configuredCode === code) {
    return true;
  }

  const name = coerceText(partner.name ?? partner.partner_name).toLowerCase();
  const haystack = `${name} ${code}`.trim();
  if (!haystack) return false;

  return (
    haystack.includes("default partner") ||
    haystack === "default" ||
    haystack.includes("complete terminate") ||
    haystack.includes("complete-terminate") ||
    haystack.includes("complete_terminate") ||
    /\bportal\b/.test(haystack) ||
    haystack.includes("spade community")
  );
}

/**
 * Pick the default partner from a list using resolution order above.
 * @param {Array<object>|null|undefined} partners
 * @returns {object|null}
 */
export function pickDefaultPartnerFromList(partners) {
  if (!Array.isArray(partners) || partners.length === 0) return null;

  const flagged = partners.find((partner) => isDefaultPartnerRecord(partner));
  if (flagged) return flagged;

  // Last safe fallback: a single partner in the system is treated as default.
  if (partners.length === 1) {
    return partners[0];
  }

  return null;
}

/**
 * Resolve partner id from flexible partner / mapping shapes.
 * @param {object|null|undefined} partner
 * @returns {string}
 */
export function resolvePartnerId(partner) {
  if (!partner || typeof partner !== "object") return "";
  return coerceText(
    partner.partner_id ??
      partner.partnerId ??
      partner.partnerid ??
      partner.id
  );
}

/**
 * Default partner should receive the full survey / project-URL sample size.
 * @param {number|null|undefined} sampleSize
 * @returns {string}
 */
export function resolveDefaultPartnerQuota(sampleSize) {
  const size = Number(sampleSize);
  if (!Number.isFinite(size) || size <= 0) return "";
  return String(Math.floor(size));
}

/**
 * True when mappings already include the given partner id.
 * @param {Array<{ partnerId?: unknown }>|null|undefined} rows
 * @param {unknown} partnerId
 */
export function mappingRowsIncludePartner(rows, partnerId) {
  const target = coerceText(partnerId);
  if (!target || !Array.isArray(rows)) return false;
  return rows.some((row) => coerceText(row?.partnerId) === target);
}

/**
 * Whether Add Partner should be offered given remaining quota.
 * Hidden when full quota is already assigned (e.g. default partner has 100%).
 * @param {{
 *   allowWrite?: boolean,
 *   hasProjectUrl?: boolean,
 *   urlEligible?: boolean,
 *   isLoadingStats?: boolean,
 *   addPartnerFlag?: boolean|null,
 *   remainingQuota?: number|null,
 *   availableQuota?: number|null,
 * }} input
 */
export function shouldShowAddPartnerButton({
  allowWrite = false,
  hasProjectUrl = false,
  urlEligible = false,
  isLoadingStats = false,
  addPartnerFlag = null,
  remainingQuota = null,
  availableQuota = null,
} = {}) {
  if (!allowWrite || !hasProjectUrl || !urlEligible || isLoadingStats) {
    return false;
  }

  if (addPartnerFlag === false) return false;

  if (remainingQuota != null && Number.isFinite(Number(remainingQuota))) {
    if (Number(remainingQuota) <= 0) return false;
  }

  if (availableQuota != null && Number.isFinite(Number(availableQuota))) {
    if (Number(availableQuota) <= 0) return false;
  }

  if (addPartnerFlag == null) {
    // No stats yet — only show when local remaining quota is known and positive.
    return availableQuota != null && Number(availableQuota) > 0;
  }

  return Boolean(addPartnerFlag);
}
