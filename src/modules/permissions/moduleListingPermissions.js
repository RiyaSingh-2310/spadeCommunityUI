/**
 * Per-module listing behavior when the user has read-only access (no write).
 * Write access always shows full actions configured on the page.
 */

/** @typedef {'hide-action-column' | 'survey-read' | 'group-survey-view' | 'pdf-only' | 'reward-pending-read' | 'details-only' | 'default'} ModuleListingReadMode */

/** @type {Record<string, ModuleListingReadMode>} */
export const MODULE_LISTING_READ_MODES = {
  users: "hide-action-column",
  clients: "hide-action-column",
  partners: "hide-action-column",
  project_managers: "hide-action-column",
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
 * Modules whose original UI has no View action — hide Action column on read.
 * @param {string | null | undefined} moduleKey
 * @param {boolean} allowWrite
 */
export function shouldHideActionColumnWhenReadOnly(moduleKey, allowWrite) {
  if (allowWrite) return false;
  return getModuleListingReadMode(moduleKey) === "hide-action-column";
}

/**
 * User module: Edit + Delete on write only — never inject a View icon.
 */
export function getUserManagementActionFlags({
  allowWrite,
  onEdit,
  editPath,
  onDelete,
  showDeleteAction = true,
}) {
  const showEdit = allowWrite && Boolean(onEdit || editPath);
  const showDelete = allowWrite && showDeleteAction && Boolean(onDelete);

  return { showEdit, showDelete };
}

/**
 * Whether the module's original UI includes view-only actions for read permission.
 */
export function hasNativeReadOnlyListingActions({
  permissionModule,
  actionVariant,
  onView,
  onFindUser,
  onUserSurveyData,
  onSurveyClone,
  onPdfDownload,
  onApprove,
  onReject,
  onListProjects,
}) {
  const mode = getModuleListingReadMode(permissionModule);

  if (shouldHideActionColumnWhenReadOnly(permissionModule, false)) {
    return false;
  }

  if (mode === "survey-read") {
    return Boolean(onView || onFindUser || onUserSurveyData);
  }

  if (mode === "group-survey-view") {
    return Boolean(onListProjects);
  }

  if (mode === "pdf-only") {
    return Boolean(onPdfDownload);
  }

  if (mode === "reward-pending-read") {
    return Boolean(onView);
  }

  if (actionVariant === "view-edit" && (onFindUser || onUserSurveyData || onSurveyClone)) {
    return Boolean(onView || onFindUser || onUserSurveyData);
  }

  if (actionVariant === "pdf-download") {
    return Boolean(onPdfDownload);
  }

  if (actionVariant === "reward-pending") {
    return Boolean(onView);
  }

  if (actionVariant === "group-survey") {
    return Boolean(onListProjects);
  }

  return false;
}

/**
 * Whether the Action column should render for the current listing configuration.
 */
export function shouldShowListingActionColumn({
  permissionModule,
  actionVariant,
  allowRead,
  allowWrite,
  onView,
  onEdit,
  onDelete,
  editPath,
  showDeleteAction = true,
  onManagePermissions,
  onFindUser,
  onUserSurveyData,
  onSurveyClone,
  onPdfDownload,
  onApprove,
  onReject,
  onListProjects,
  hasActionColumn = true,
}) {
  if (!hasActionColumn || !allowRead) return false;

  if (actionVariant === "user-management") {
    const { showEdit, showDelete } = getUserManagementActionFlags({
      allowWrite,
      onEdit,
      editPath,
      onDelete,
      showDeleteAction,
    });
    return showEdit || showDelete;
  }

  if (allowWrite) {
    return Boolean(
      onEdit ||
        editPath ||
        onDelete ||
        onManagePermissions ||
        onView ||
        onFindUser ||
        onUserSurveyData ||
        onSurveyClone ||
        onPdfDownload ||
        onApprove ||
        onReject ||
        onListProjects ||
        actionVariant === "pdf-download" ||
        actionVariant === "reward-pending" ||
        actionVariant === "group-survey"
    );
  }

  return hasNativeReadOnlyListingActions({
    permissionModule,
    actionVariant,
    onView,
    onFindUser,
    onUserSurveyData,
    onSurveyClone,
    onPdfDownload,
    onApprove,
    onReject,
    onListProjects,
  });
}
