import {
  buildDatedExportFilename,
  triggerBrowserFileDownload,
} from "../../services/api/csvExport";
import { PERMISSION_TREE } from "./permissionTree";
import { normalizePermissions } from "./permissionsUtils";

/**
 * Permission rows shown in the User Permissions table (leaves + group children).
 * @returns {{ key: string, label: string }[]}
 */
export function getPermissionTableItems() {
  const items = [];

  for (const node of PERMISSION_TREE) {
    if (node.type === "leaf") {
      items.push({ key: node.key, label: node.label });
      continue;
    }

    for (const child of node.children ?? []) {
      items.push({ key: child.key, label: child.label });
    }
  }

  return items;
}

/**
 * @param {import("./permissionsUtils").PermissionsMap | null | undefined} permissions
 */
export function getSavedDownloadPermissionItems(permissions) {
  const normalized = normalizePermissions(permissions);
  return getPermissionTableItems().filter(
    (item) => normalized[item.key]?.canDownload === true
  );
}

/**
 * @param {import("./permissionsUtils").PermissionsMap | null | undefined} permissions
 */
export function hasSavedDownloadPermission(permissions) {
  return getSavedDownloadPermissionItems(permissions).length > 0;
}

function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

/**
 * Builds CSV content for modules with saved Download permission only.
 * @param {import("./permissionsUtils").PermissionsMap | null | undefined} permissions
 */
export function buildDownloadPermissionsCsvContent(permissions) {
  const normalized = normalizePermissions(permissions);
  const rows = getSavedDownloadPermissionItems(normalized);
  const lines = ["Module,Module Key,Read,Write,Download"];

  for (const item of rows) {
    const flags = normalized[item.key] ?? {
      canRead: false,
      canWrite: false,
      canDownload: false,
    };
    lines.push(
      [
        csvEscape(item.label),
        csvEscape(item.key),
        flags.canRead ? "Yes" : "No",
        flags.canWrite ? "Yes" : "No",
        flags.canDownload ? "Yes" : "No",
      ].join(",")
    );
  }

  return `${lines.join("\n")}\n`;
}

/**
 * Downloads a CSV of items that currently have saved Download permission.
 * @param {import("./permissionsUtils").PermissionsMap | null | undefined} permissions
 * @param {{ userName?: string }} [options]
 */
export function downloadSavedDownloadPermissionsCsv(permissions, options = {}) {
  const items = getSavedDownloadPermissionItems(permissions);
  if (!items.length) {
    return { success: false, message: "No Download permissions are saved." };
  }

  const userPart = String(options.userName ?? "")
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const baseName = userPart
    ? `user-download-permissions-${userPart}`
    : "user-download-permissions";

  const csv = buildDownloadPermissionsCsvContent(permissions);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  triggerBrowserFileDownload(blob, buildDatedExportFilename(baseName));

  return {
    success: true,
    message: "Download permissions CSV downloaded successfully.",
    count: items.length,
  };
}
