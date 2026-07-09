import { isAdminLoginRole } from "../../../services/auth/loginRole";

export const SETTINGS_TABS = [
  { id: "profile", label: "Profile" },
  { id: "system", label: "System" },
  { id: "notifications", label: "Notifications" },
  { id: "audit-log", label: "Audit Log" },
];

export const DEFAULT_SETTINGS_TAB = "profile";

const ADMIN_ONLY_TAB_IDS = new Set(["audit-log"]);

/**
 * Settings tabs visible for the current login role.
 */
export function getSettingsTabsForRole() {
  if (isAdminLoginRole()) {
    return SETTINGS_TABS;
  }
  return SETTINGS_TABS.filter((tab) => !ADMIN_ONLY_TAB_IDS.has(tab.id));
}

export function isValidSettingsTab(tab, tabs = SETTINGS_TABS) {
  return tabs.some((item) => item.id === tab);
}
