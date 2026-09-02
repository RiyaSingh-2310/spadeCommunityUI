import { PERMISSION_MODULE_KEYS } from "./permissionModules";
import { exportAdminUsersCsv } from "../../services/users/usersApi";
import { exportClientsCsv } from "../../services/clients/clientsApi";
import { exportPartnersCsv } from "../../services/partners/partnersApi";
import { exportProjectManagersCsv } from "../../services/projectManagers/projectManagersApi";
import { exportSalesManagersCsv } from "../../services/sales/salesManagersApi";
import { exportQuestionLibraryCsv } from "../../services/question-library/questionLibraryApi";
import { exportQuestionnaireGroupCsv } from "../../services/questionnaire-group/questionnaireGroupApi";
import { downloadPanelists } from "../community-users/services/communityUsersApi";
import {
  createDefaultPermissions,
  normalizePermissions,
  setAllPermissions,
} from "./permissionsUtils";

/** @typedef {Record<string, boolean>} DownloadSelections */

/** Module keys that have a CSV export endpoint. */
export const MODULE_CSV_EXPORTERS = {
  users: exportAdminUsersCsv,
  clients: exportClientsCsv,
  partners: exportPartnersCsv,
  project_managers: exportProjectManagersCsv,
  sales_manager: exportSalesManagersCsv,
  prescreen: exportQuestionLibraryCsv,
  prescreen_group: exportQuestionnaireGroupCsv,
  community_users: downloadPanelists,
};

export function createEmptyDownloadSelections() {
  return PERMISSION_MODULE_KEYS.reduce((acc, key) => {
    acc[key] = false;
    return acc;
  }, /** @type {DownloadSelections} */ ({}));
}

/**
 * Read/Write permissions for save — always clear persisted csv_download flags.
 * Temporary Download UI selections are not saved on Update.
 * @param {import("./permissionsUtils").PermissionsMap | null | undefined} permissions
 */
export function permissionsForPersist(permissions) {
  return setAllPermissions(normalizePermissions(permissions), "canDownload", false);
}

/**
 * @param {DownloadSelections | null | undefined} selections
 */
export function getSelectedDownloadModuleKeys(selections) {
  const source = selections ?? createEmptyDownloadSelections();
  return PERMISSION_MODULE_KEYS.filter((key) => source[key] === true);
}

/**
 * @param {DownloadSelections | null | undefined} selections
 */
export function hasAnyDownloadSelection(selections) {
  return getSelectedDownloadModuleKeys(selections).length > 0;
}

/**
 * @param {DownloadSelections} selections
 * @param {string[]} moduleKeys
 */
export function areAllDownloadsSelected(selections, moduleKeys = PERMISSION_MODULE_KEYS) {
  if (!moduleKeys.length) return false;
  return moduleKeys.every((key) => selections?.[key] === true);
}

/**
 * @param {DownloadSelections} selections
 * @param {string[]} moduleKeys
 * @param {boolean} checked
 */
export function setDownloadSelectionsForKeys(selections, moduleKeys, checked) {
  const next = { ...createEmptyDownloadSelections(), ...selections };
  for (const key of moduleKeys) {
    next[key] = checked === true;
  }
  return next;
}

/**
 * Exports CSV for each selected module that has an export endpoint.
 * @param {string[]} moduleKeys
 */
export async function exportSelectedModulesCsv(moduleKeys) {
  const selected = (Array.isArray(moduleKeys) ? moduleKeys : []).filter(
    (key) => typeof MODULE_CSV_EXPORTERS[key] === "function"
  );

  if (!selected.length) {
    const error = new Error(
      "No CSV export is available for the selected Download modules."
    );
    throw error;
  }

  for (const key of selected) {
    await MODULE_CSV_EXPORTERS[key]();
  }

  return {
    success: true,
    message:
      selected.length === 1
        ? "CSV downloaded successfully."
        : `${selected.length} CSV files downloaded successfully.`,
    count: selected.length,
  };
}

/** @deprecated helper kept for tests that build empty permission maps */
export function createPermissionsWithoutDownloads() {
  return permissionsForPersist(createDefaultPermissions());
}
