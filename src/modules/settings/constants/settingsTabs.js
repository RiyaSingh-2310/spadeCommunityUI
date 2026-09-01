export const SETTINGS_TABS = [
  { id: "profile", label: "Profile" },
  { id: "system", label: "System" },
  { id: "notifications", label: "Notifications" },
];

export const DEFAULT_SETTINGS_TAB = "profile";

/**
 * Settings tabs visible for the current login role.
 */
export function getSettingsTabsForRole() {
  return SETTINGS_TABS;
}

export function isValidSettingsTab(tab, tabs = SETTINGS_TABS) {
  return tabs.some((item) => item.id === tab);
}
