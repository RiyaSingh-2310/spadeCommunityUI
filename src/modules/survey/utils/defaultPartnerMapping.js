/**
 * Default Partner Mapping — frontend helpers.
 *
 * Backend contract (required for automatic default-partner creation):
 * 1. Partners list / eligible-partners / survey partners should mark the
 *    complete-terminate portal partner with one of:
 *    - is_default / isDefault / is_default_partner / default_partner = true|1
 *    - partner_role / partner_type = "default" | "portal" | "complete_terminate"
 * 2. OR GET /api/survey/:id/partners (or supplier-mapping list) should already
 *    include the default partner mapping with quota = survey sample size.
 * 3. Prefer backend auto-create on survey/project-URL creation so every new
 *    survey gets the default partner at full quota without a UI round-trip.
 *
 * This UI never hard-codes a partner ID. Without a backend-provided default,
 * Partner Mapping stays empty until the admin adds partners manually.
 */

function coerceText(value) {
  return String(value ?? "").trim();
}

function toTruthyFlag(value) {
  if (value === true || value === 1) return true;
  const normalized = coerceText(value).toLowerCase();
  return ["1", "true", "yes", "on", "default"].includes(normalized);
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

  return (
    role === "default" ||
    role === "portal" ||
    role === "complete_terminate" ||
    role === "complete-terminate" ||
    role === "default_portal"
  );
}

/**
 * Pick the first backend-flagged default partner from a list.
 * @param {Array<object>|null|undefined} partners
 * @returns {object|null}
 */
export function pickDefaultPartnerFromList(partners) {
  if (!Array.isArray(partners)) return null;
  return partners.find((partner) => isDefaultPartnerRecord(partner)) ?? null;
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
