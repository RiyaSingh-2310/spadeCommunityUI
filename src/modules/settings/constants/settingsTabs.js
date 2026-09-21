export const SETTINGS_TABS = [
  { id: "profile", label: "Profile" },
  { id: "system", label: "Appearance" },
  { id: "notifications", label: "Notifications" },
];

export const DEFAULT_SETTINGS_TAB = "profile";

/** Legacy tab ids that now live on standalone routes. */
const LEGACY_TAB_REDIRECTS = {
  "api-keys": "/api-management",
  "api-management": "/api-management",
};

/**
 * Settings tabs visible for the current login role.
 */
export function getSettingsTabsForRole() {
  return SETTINGS_TABS;
}

export function resolveSettingsTab(tab, tabs = SETTINGS_TABS) {
  return tabs.some((item) => item.id === tab) ? tab : null;
}

export function isValidSettingsTab(tab, tabs = SETTINGS_TABS) {
  return Boolean(resolveSettingsTab(tab, tabs));
}

/** @returns {string | null} Absolute path to redirect to, if this tab moved. */
export function getLegacySettingsTabRedirect(tab) {
  return LEGACY_TAB_REDIRECTS[String(tab ?? "").trim()] ?? null;
}
