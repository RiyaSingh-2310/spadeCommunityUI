import { API_ROUTES } from "../../../config/api";
import { apiRequest } from "../../../services/api/client";
import { ApiError } from "../../../services/api/ApiError";

function assertSuccess(data) {
  if (data?.success !== true && data?.success !== "true") {
    throw new ApiError(data?.message ?? "", data);
  }
  return data;
}

function extractSettingsRecord(data) {
  if (!data || typeof data !== "object") return null;
  if (data.data && typeof data.data === "object" && !Array.isArray(data.data)) {
    return data.data;
  }
  if (data.id != null) return data;
  return null;
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
    amazon: apiFlagToYesNo(record?.amazon_enabled ?? record?.amazonEnabled),
    flipkart: apiFlagToYesNo(record?.flipkart_enabled ?? record?.flipkartEnabled),
    paypal: apiFlagToYesNo(record?.paypal_enabled ?? record?.paypalEnabled),
  };
}

/**
 * PUT body matches:
 * {
 *   registration_reward_points, minimum_payout,
 *   amazon_enabled, flipkart_enabled, paypal_enabled
 * }
 */
export function buildRewardSettingsPayload(form) {
  return {
    registration_reward_points: toApiNumber(form.registrationReward),
    minimum_payout: toApiNumber(form.minimumPayout),
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
