const SYSTEM_SETTINGS_KEY = "settings.system";
const NOTIFICATION_SETTINGS_KEY = "settings.notifications";

export const DEFAULT_SYSTEM_SETTINGS = {
  applicationName: "Spade Community",
  defaultLanguage: "English",
  dateFormat: "DD/MM/YYYY",
  timeFormat: "12-hour",
  themePreference: "system",
  twoFactorAuth: false,
  loginAlerts: true,
  sessionTimeout: "30",
  rememberMeDuration: "7",
};

export const DEFAULT_NOTIFICATION_SETTINGS = {
  emailNotifications: true,
  systemNotifications: true,
  projectNotifications: true,
  surveyNotifications: true,
  securityAlerts: true,
};

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return { ...fallback };
    const parsed = JSON.parse(raw);
    return { ...fallback, ...(parsed && typeof parsed === "object" ? parsed : {}) };
  } catch {
    return { ...fallback };
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getSystemSettings() {
  return readJson(SYSTEM_SETTINGS_KEY, DEFAULT_SYSTEM_SETTINGS);
}

export function saveSystemSettings(settings) {
  writeJson(SYSTEM_SETTINGS_KEY, settings);
}

export function getNotificationSettings() {
  return readJson(NOTIFICATION_SETTINGS_KEY, DEFAULT_NOTIFICATION_SETTINGS);
}

export function saveNotificationSettings(settings) {
  writeJson(NOTIFICATION_SETTINGS_KEY, settings);
}
