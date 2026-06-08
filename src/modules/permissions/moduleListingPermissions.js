/**
 * Per-module listing behavior when the user has read-only access (no write).
 * Write access always shows full actions configured on the page.
 */

/** @typedef {'hide-action-column' | 'view-only-crud' | 'survey-read' | 'group-survey-view' | 'pdf-only' | 'reward-pending-read' | 'details-only' | 'default'} ModuleListingReadMode */

/** @type {Record<string, ModuleListingReadMode>} */
export const MODULE_LISTING_READ_MODES = {
  users: "view-only-crud",
  clients: "view-only-crud",
  partners: "view-only-crud",
  project_managers: "view-only-crud",
  survey: "survey-read",
  group_survey: "group-survey-view",
  recontact_survey: "hide-action-column",
  messages: "hide-action-column",
  user_screening_management: "hide-action-column",
  system_email_templates: "hide-action-column",
  log_activity: "hide-action-column",
  invoices: "pdf-only",
  pending_rewards: "reward-pending-read",
  completed_rewards: "details-only",
};

/**
 * @param {string | null | undefined} moduleKey
 * @returns {ModuleListingReadMode}
 */
export function getModuleListingReadMode(moduleKey) {
  if (!moduleKey) return "default";
  return MODULE_LISTING_READ_MODES[moduleKey] ?? "default";
}

/**
 * @param {string | null | undefined} moduleKey
 * @param {boolean} allowWrite
 */
export function shouldHideActionColumnWhenReadOnly(moduleKey, allowWrite) {
  if (allowWrite) return false;
  return getModuleListingReadMode(moduleKey) === "hide-action-column";
}

/**
 * @param {string | null | undefined} moduleKey
 * @param {boolean} allowRead
 * @param {boolean} allowWrite
 */
export function shouldShowViewOnlyCrudActions(moduleKey, allowRead, allowWrite) {
  if (!allowRead || allowWrite) return false;
  return getModuleListingReadMode(moduleKey) === "view-only-crud";
}
