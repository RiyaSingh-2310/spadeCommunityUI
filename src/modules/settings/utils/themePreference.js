import { getSystemSettings, saveSystemSettings } from "./settingsStorage";

export const THEME_PREFERENCE_CHANGED_EVENT = "theme-preference-changed";

export const THEME_PREFERENCES = {
  LIGHT: "light",
  DARK: "dark",
};

export const THEME_PREFERENCE_OPTIONS = [
  { label: "Light Theme", value: THEME_PREFERENCES.LIGHT },
  { label: "Dark Theme", value: THEME_PREFERENCES.DARK },
];

/**
 * Normalizes stored/API theme values to supported app preferences.
 * Legacy "system" values resolve to light.
 * @param {string | null | undefined} value
 */
export function normalizeThemePreference(value) {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (normalized === THEME_PREFERENCES.DARK) return THEME_PREFERENCES.DARK;
  return THEME_PREFERENCES.LIGHT;
}

export function getStoredThemePreference() {
  const settings = getSystemSettings();
  return normalizeThemePreference(settings.themePreference);
}

export function isDarkThemePreference(preference) {
  return normalizeThemePreference(preference) === THEME_PREFERENCES.DARK;
}

/**
 * Persists theme preference inside existing system settings storage.
 * @param {string} preference
 */
export function persistThemePreference(preference) {
  const normalized = normalizeThemePreference(preference);
  const settings = getSystemSettings();
  if (normalizeThemePreference(settings.themePreference) === normalized) {
    return normalized;
  }

  saveSystemSettings({ ...settings, themePreference: normalized });
  return normalized;
}
