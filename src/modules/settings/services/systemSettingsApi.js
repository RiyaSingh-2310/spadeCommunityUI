import { API_ROUTES } from "../../../config/api";
import { apiRequest } from "../../../services/api/client";
import { ApiError } from "../../../services/api/ApiError";
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  DEFAULT_SYSTEM_SETTINGS,
  getSystemSettings,
  saveNotificationSettings,
  saveSystemSettings,
} from "../utils/settingsStorage";
import {
  normalizeThemePreference,
} from "../utils/themePreference";

const NOTIFICATION_SETTINGS_SECTION = "notification_preferences";

function assertSuccess(data) {
  if (data?.success !== true) {
    throw new ApiError(data?.message ?? "", data);
  }
  return data;
}

function toBoolean(value, fallback = false) {
  if (typeof value === "boolean") return value;
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();
  if (!normalized) return fallback;
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return fallback;
}

function extractSectionFields(data) {
  if (!data || typeof data !== "object") return {};

  const nested = data.data;
  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    if (nested.data && typeof nested.data === "object" && !Array.isArray(nested.data)) {
      return nested.data;
    }
    if (nested.section && nested.data && typeof nested.data === "object") {
      return nested.data;
    }
    // Section payload may be the fields object itself.
    if (!("success" in nested) && !("message" in nested)) {
      const keys = Object.keys(nested);
      if (keys.some((key) => key !== "section")) {
        const { section: _section, ...fields } = nested;
        return fields;
      }
    }
  }

  return {};
}

function mapSystemSettingsFromApi(fields = {}) {
  return {
    applicationName:
      String(fields.applicationName ?? fields.application_name ?? "").trim() ||
      DEFAULT_SYSTEM_SETTINGS.applicationName,
    defaultLanguage:
      String(fields.defaultLanguage ?? fields.default_language ?? "").trim() ||
      DEFAULT_SYSTEM_SETTINGS.defaultLanguage,
    dateFormat:
      String(fields.dateFormat ?? fields.date_format ?? "").trim() ||
      DEFAULT_SYSTEM_SETTINGS.dateFormat,
    timeFormat:
      String(fields.timeFormat ?? fields.time_format ?? "").trim() ||
      DEFAULT_SYSTEM_SETTINGS.timeFormat,
    themePreference: normalizeThemePreference(
      fields.themePreference ?? fields.theme_preference
    ),
    twoFactorAuth: toBoolean(
      fields.twoFactorAuth ?? fields.two_factor_auth,
      DEFAULT_SYSTEM_SETTINGS.twoFactorAuth
    ),
    loginAlerts: toBoolean(
      fields.loginAlerts ?? fields.login_alerts,
      DEFAULT_SYSTEM_SETTINGS.loginAlerts
    ),
    sessionTimeout: String(
      fields.sessionTimeout ??
        fields.session_timeout ??
        fields.session_timeout_minutes ??
        DEFAULT_SYSTEM_SETTINGS.sessionTimeout
    ),
    rememberMeDuration: String(
      fields.rememberMeDuration ??
        fields.remember_me_duration ??
        fields.remember_me_days ??
        DEFAULT_SYSTEM_SETTINGS.rememberMeDuration
    ),
  };
}

function mapNotificationSettingsFromApi(fields = {}) {
  return {
    emailNotifications: toBoolean(
      fields.emailNotifications ?? fields.email_notifications,
      DEFAULT_NOTIFICATION_SETTINGS.emailNotifications
    ),
    systemNotifications: toBoolean(
      fields.systemNotifications ?? fields.system_notifications,
      DEFAULT_NOTIFICATION_SETTINGS.systemNotifications
    ),
    projectNotifications: toBoolean(
      fields.projectNotifications ?? fields.project_notifications,
      DEFAULT_NOTIFICATION_SETTINGS.projectNotifications
    ),
    surveyNotifications: toBoolean(
      fields.surveyNotifications ?? fields.survey_notifications,
      DEFAULT_NOTIFICATION_SETTINGS.surveyNotifications
    ),
    securityAlerts: toBoolean(
      fields.securityAlerts ?? fields.security_alerts,
      DEFAULT_NOTIFICATION_SETTINGS.securityAlerts
    ),
  };
}

function toApiNotificationPayload(settings) {
  return {
    emailNotifications: String(Boolean(settings.emailNotifications)),
    systemNotifications: String(Boolean(settings.systemNotifications)),
    projectNotifications: String(Boolean(settings.projectNotifications)),
    surveyNotifications: String(Boolean(settings.surveyNotifications)),
    securityAlerts: String(Boolean(settings.securityAlerts)),
  };
}

async function fetchSection(section) {
  const data = await apiRequest(API_ROUTES.homepage.bySection(section));
  assertSuccess(data);
  return extractSectionFields(data);
}

async function updateSection(section, fields) {
  const data = await apiRequest(API_ROUTES.homepage.updateSection(section), {
    method: "PUT",
    body: fields,
  });
  return assertSuccess(data);
}

function isNotFoundError(error) {
  if (error?.status === 404 || error?.response?.status === 404) return true;
  const message = String(error?.message ?? "").toLowerCase();
  return message.includes("not found");
}

/**
 * Loads system settings from local storage only.
 * GET /api/system-settings is intentionally not called.
 */
export async function fetchSystemSettings() {
  const mapped = mapSystemSettingsFromApi(getSystemSettings());
  return mapped;
}

/**
 * Persists system settings to local storage only.
 * PUT /api/system-settings is intentionally not called.
 */
export async function updateSystemSettings(settings) {
  const mapped = mapSystemSettingsFromApi({
    ...getSystemSettings(),
    ...(settings && typeof settings === "object" ? settings : {}),
  });
  saveSystemSettings(mapped);
  return {
    success: true,
    message: "System settings saved successfully.",
    data: mapped,
  };
}

/**
 * Loads notification preferences from the homepage settings API.
 */
export async function fetchNotificationSettings() {
  try {
    const fields = await fetchSection(NOTIFICATION_SETTINGS_SECTION);
    const mapped = mapNotificationSettingsFromApi(fields);
    saveNotificationSettings(mapped);
    return mapped;
  } catch (error) {
    if (isNotFoundError(error)) {
      return { ...DEFAULT_NOTIFICATION_SETTINGS };
    }
    throw error;
  }
}

export async function updateNotificationSettings(settings) {
  const payload = toApiNotificationPayload(settings);
  const data = await updateSection(NOTIFICATION_SETTINGS_SECTION, payload);
  const mapped = mapNotificationSettingsFromApi(payload);
  saveNotificationSettings(mapped);
  return data;
}
