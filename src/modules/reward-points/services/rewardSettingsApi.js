import { API_ROUTES } from "../../../config/api";
import { apiRequest } from "../../../services/api/client";
import { ApiError } from "../../../services/api/ApiError";

/**
 * Only reject when the API explicitly reports failure.
 * Some deployed responses omit `success` while still returning settings data.
 */
function assertSuccess(data) {
  if (
    data &&
    typeof data === "object" &&
    "success" in data &&
    data.success !== true &&
    data.success !== "true" &&
    data.success !== 1
  ) {
    throw new ApiError(data?.message || "Unable to load reward settings.", data);
  }
  return data;
}

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : null;
}

function extractSettingsRecord(data) {
  if (!data || typeof data !== "object") return null;

  const nested = asObject(data.data);
  if (nested) {
    const deeper =
      asObject(nested.settings) ||
      asObject(nested.reward_settings) ||
      asObject(nested.rewardSettings) ||
      asObject(nested.record);
    if (deeper) return deeper;
    return nested;
  }

  if (Array.isArray(data.data) && data.data.length > 0) {
    return asObject(data.data[0]);
  }

  if (data.id != null || data.registration_reward_points != null || data.registrationRewardPoints != null) {
    return data;
  }

  return (
    asObject(data.settings) ||
    asObject(data.reward_settings) ||
    asObject(data.rewardSettings) ||
    null
  );
}

function apiFlagToYesNo(value) {
  if (value === true || value === 1 || value === "1" || value === "true") {
    return "Yes";
  }
  return "No";
}

function yesNoToApiFlag(value) {
  return String(value ?? "").trim().toLowerCase() === "yes";
}

function toFormNumber(value) {
  if (value == null || value === "") return "";
  return String(value);
}

function toApiNumber(value) {
  const num = Number(String(value ?? "").trim());
  return Number.isFinite(num) ? num : 0;
}

export function mapRewardSettingsToForm(record) {
  return {
    id: record?.id ?? null,
    registrationReward: toFormNumber(
      record?.registration_reward_points ?? record?.registrationRewardPoints
    ),
    minimumPayout: toFormNumber(record?.minimum_payout ?? record?.minimumPayout),
    maximumRedeemPoints: toFormNumber(
      record?.max_redeem_points ??
        record?.maxRedeemPoints ??
        record?.maximum_redeem_points ??
        record?.maximumRedeemPoints ??
        record?.maximum_redeem ??
        record?.max_redeem
    ),
    amazon: apiFlagToYesNo(record?.amazon_enabled ?? record?.amazonEnabled),
    flipkart: apiFlagToYesNo(record?.flipkart_enabled ?? record?.flipkartEnabled),
    paypal: apiFlagToYesNo(record?.paypal_enabled ?? record?.paypalEnabled),
  };
}

/**
 * PUT /api/reward-settings/update body:
 * {
 *   registration_reward_points, minimum_payout, max_redeem_points,
 *   amazon_enabled, flipkart_enabled, paypal_enabled
 * }
 */
export function buildRewardSettingsPayload(form) {
  return {
    registration_reward_points: toApiNumber(form.registrationReward),
    minimum_payout: toApiNumber(form.minimumPayout),
    max_redeem_points: toApiNumber(form.maximumRedeemPoints),
    amazon_enabled: yesNoToApiFlag(form.amazon),
    flipkart_enabled: yesNoToApiFlag(form.flipkart),
    paypal_enabled: yesNoToApiFlag(form.paypal),
  };
}

/** GET /api/reward-settings/get */
export async function fetchRewardSettings() {
  const data = await apiRequest(API_ROUTES.rewardSettings.get);
  assertSuccess(data);

  const record = extractSettingsRecord(data);
  if (!record) {
    throw new ApiError("Reward settings not found.", data);
  }

  return mapRewardSettingsToForm(record);
}

/** PUT /api/reward-settings/update */
export async function updateRewardSettings(form) {
  const data = await apiRequest(API_ROUTES.rewardSettings.update, {
    method: "PUT",
    body: buildRewardSettingsPayload(form),
  });

  assertSuccess(data);

  const record = extractSettingsRecord(data);
  return {
    ...data,
    form: record ? mapRewardSettingsToForm(record) : null,
  };
}
