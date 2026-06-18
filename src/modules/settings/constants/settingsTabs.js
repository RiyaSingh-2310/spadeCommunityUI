export const SETTINGS_TABS = [
  { id: "profile", label: "Profile" },
  { id: "system", label: "System" },
  { id: "notifications", label: "Notifications" },
  { id: "audit-log", label: "Audit Log" },
];

export const DEFAULT_SETTINGS_TAB = "profile";

export function isValidSettingsTab(tab) {
  return SETTINGS_TABS.some((item) => item.id === tab);
}
