import {
  DEFAULT_NOTIFICATION_SETTINGS,
  DEFAULT_SYSTEM_SETTINGS,
  getNotificationSettings,
  getSystemSettings,
  saveNotificationSettings,
  saveSystemSettings,
} from "../utils/settingsStorage";
import {
  normalizeThemePreference,
} from "../utils/themePreference";

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
 * Loads notification preferences from local storage only.
 * GET /api/homepage/notification_preferences is intentionally not called (section not seeded).
 */
export async function fetchNotificationSettings() {
  const mapped = mapNotificationSettingsFromApi(getNotificationSettings());
  return mapped;
}

/**
 * Persists notification preferences to local storage only.
 * PUT /api/homepage/notification_preferences is intentionally not called.
 */
export async function updateNotificationSettings(settings) {
  const mapped = mapNotificationSettingsFromApi({
    ...getNotificationSettings(),
    ...(settings && typeof settings === "object" ? settings : {}),
  });
  saveNotificationSettings(mapped);
  return {
    success: true,
    message: "Notification preferences saved successfully.",
    data: mapped,
  };
}
