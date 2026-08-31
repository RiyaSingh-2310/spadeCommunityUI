import { toUiSentenceCase } from "./uiText";

/** UI-facing status labels (never send "Activated"/"Deactivated" to the UI). */
export const STATUS_UI_ACTIVE = "Active";
export const STATUS_UI_INACTIVE = "Inactive";

/**
 * Normalizes API/UI status strings to "active" | "inactive" | other.
 * @param {string | null | undefined} status
 */
export function normalizeStatusKey(status) {
  const value = String(status ?? "").toLowerCase().trim();
  if (value === "inactive" || value === "deactivated") return "inactive";
  if (value === "active" || value === "activated") return "active";
  return value;
}

/**
 * Maps API values (active, inactive, activated, deactivated) to UI labels.
 * @param {string | null | undefined} status
 */
export function formatStatusLabel(status) {
  const key = normalizeStatusKey(status);
  if (key === "inactive") return STATUS_UI_INACTIVE;
  if (key === "active") return STATUS_UI_ACTIVE;

  const raw = String(status ?? "").trim();
  if (!raw) return "-";

  if (raw === "Activated") return STATUS_UI_ACTIVE;
  if (raw === "Deactivated") return STATUS_UI_INACTIVE;

  return toUiSentenceCase(raw);
}

/**
 * Form/select value used in the app (Active | Inactive).
 * @param {string | null | undefined} status
 */
export function apiStatusToFormValue(status) {
  return normalizeStatusKey(status) === "inactive"
    ? STATUS_UI_INACTIVE
    : STATUS_UI_ACTIVE;
}

/**
 * API payload status (active | inactive).
 * @param {string | null | undefined} formValue
 */
export function formValueToApiStatus(formValue) {
  return normalizeStatusKey(formValue) === "inactive" ? "inactive" : "active";
}
