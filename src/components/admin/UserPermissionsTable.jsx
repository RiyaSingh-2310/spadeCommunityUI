import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { PERMISSION_TREE } from "../../modules/permissions/permissionTree";
import {
  areAllDownloadsSelected,
  createEmptyDownloadSelections,
  setDownloadSelectionsForKeys,
} from "../../modules/permissions/temporaryDownloadSelections";
import {
  areAllPermissionsSelected,
  deriveExpandedPermissionGroupIds,
  getParentRowPermission,
  setAllPermissions,
  setChildModulePermission,
  setParentGroupPermission,
} from "../../modules/permissions/permissionsUtils";
import { PERMISSION_MODULE_KEYS } from "../../modules/permissions/permissionModules";

const BASE_COLUMNS = [
  { type: "canRead", label: "Read", selectAllLabel: "Select All Read" },
  { type: "canWrite", label: "Write", selectAllLabel: "Select All Write" },
];

const DOWNLOAD_COLUMN = {
  type: "canDownload",
  label: "Download",
  selectAllLabel: "Select All Download",
};

function PermissionCheckboxes({
  label,
  moduleKey,
  permissions,
  disabled,
  onChange,
  showDownload,
  downloadSelected,
  onDownloadToggle,
}) {
  const flags = permissions[moduleKey] ?? {
    canRead: false,
    canWrite: false,
    canDownload: false,
  };

  return (
    <>
      {BASE_COLUMNS.map((column) => (
        <td key={column.type} className="px-4 py-2.5 text-center">
          <input
            type="checkbox"
            className="admin-checkbox"
            checked={Boolean(flags[column.type])}
            disabled={disabled}
            aria-label={`${label} ${column.label.toLowerCase()}`}
            title={column.label}
            onChange={(e) =>
              onChange(
                setChildModulePermission(
                  permissions,
                  moduleKey,
                  column.type,
                  e.target.checked
                )
              )
            }
          />
        </td>
      ))}
      {showDownload ? (
        <td className="px-4 py-2.5 text-center">
          <input
            type="checkbox"
            className="admin-checkbox"
            checked={Boolean(downloadSelected)}
            disabled={disabled}
            aria-label={`${label} download`}
            title="Download"
            onChange={(e) => onDownloadToggle(moduleKey, e.target.checked)}
          />
        </td>
      ) : null}
    </>
  );
}

function ParentPermissionCheckboxes({
  label,
  parentKey,
  childKeys,
  permissions,
  disabled,
  onChange,
  showDownload,
  downloadSelections,
  onDownloadGroupToggle,
}) {
  const parentDownloadChecked = areAllDownloadsSelected(
    downloadSelections,
    childKeys
  );

  return (
    <>
      {BASE_COLUMNS.map((column) => {
        const checked = getParentRowPermission(
          permissions,
          parentKey,
          childKeys,
          column.type
        );
        return (
          <td key={column.type} className="px-4 py-2.5 text-center">
            <input
              type="checkbox"
              className="admin-checkbox"
              checked={checked}
              disabled={disabled}
              aria-label={`${label} ${column.label.toLowerCase()}`}
              title={column.label}
              onChange={(e) =>
                onChange(
                  setParentGroupPermission(
                    permissions,
                    parentKey,
                    childKeys,
                    column.type,
                    e.target.checked
                  )
                )
              }
            />
          </td>
        );
      })}
      {showDownload ? (
        <td className="px-4 py-2.5 text-center">
          <input
            type="checkbox"
            className="admin-checkbox"
            checked={parentDownloadChecked}
            disabled={disabled}
            aria-label={`${label} download`}
            title="Download"
            onChange={(e) => onDownloadGroupToggle(childKeys, e.target.checked)}
          />
        </td>
      ) : null}
    </>
  );
}

/**
 * @param {{
 *   permissions: object,
 *   onChange: (next: object) => void,
 *   disabled?: boolean,
 *   permissionsInitKey?: string | number | null,
 *   showDownload?: boolean,
 *   downloadSelections?: Record<string, boolean>,
 *   onDownloadSelectionsChange?: (next: Record<string, boolean>) => void,
 * }} props
 */
function UserPermissionsTable({
  permissions,
  onChange,
  disabled = false,
  permissionsInitKey = null,
  showDownload = false,
  downloadSelections,
  onDownloadSelectionsChange,
}) {
  const [expandedGroups, setExpandedGroups] = useState(() => new Set());
  const columns = useMemo(
    () => (showDownload ? [...BASE_COLUMNS, DOWNLOAD_COLUMN] : BASE_COLUMNS),
    [showDownload]
  );

  const resolvedDownloadSelections = useMemo(
    () => ({
      ...createEmptyDownloadSelections(),
      ...(downloadSelections ?? {}),
    }),
    [downloadSelections]
  );

  useEffect(() => {
    if (permissionsInitKey == null) return;
    setExpandedGroups(deriveExpandedPermissionGroupIds(permissions));
  }, [permissionsInitKey, permissions]);

  const toggleGroup = (groupId) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const handleDownloadToggle = (moduleKey, checked) => {
    if (!onDownloadSelectionsChange) return;
    onDownloadSelectionsChange(
      setDownloadSelectionsForKeys(resolvedDownloadSelections, [moduleKey], checked)
    );
  };

  const handleDownloadGroupToggle = (childKeys, checked) => {
    if (!onDownloadSelectionsChange) return;
    onDownloadSelectionsChange(
      setDownloadSelectionsForKeys(resolvedDownloadSelections, childKeys, checked)
    );
  };

  const handleSelectAllDownload = (checked) => {
    if (!onDownloadSelectionsChange) return;
    onDownloadSelectionsChange(
      setDownloadSelectionsForKeys(
        resolvedDownloadSelections,
        PERMISSION_MODULE_KEYS,
        checked
      )
    );
  };

  const renderModuleLabel = (label) => (
    <span className="admin-text block font-medium">{label}</span>
  );

  return (
    <div className="admin-permissions-table overflow-hidden rounded-xl border">
      <div className="max-h-[min(70vh,520px)] overflow-auto">
        <table className="admin-table min-w-full text-sm">
          <thead className="admin-permissions-table__head sticky top-0 z-10">
            <tr className="admin-text-muted">
              <th className="admin-text px-4 py-3 text-left text-xs font-semibold tracking-[0.02em] whitespace-nowrap">
                Module
              </th>
              {columns.map((column) => {
                const allSelected =
                  column.type === "canDownload"
                    ? areAllDownloadsSelected(resolvedDownloadSelections)
                    : areAllPermissionsSelected(permissions, column.type);
                return (
                  <th
                    key={column.type}
                    className="px-4 py-3 text-center text-xs font-semibold tracking-[0.02em] whitespace-nowrap"
                  >
                    <label className="admin-permissions-table__label inline-flex items-center justify-center gap-2">
                      <input
                        type="checkbox"
                        className="admin-checkbox"
                        checked={allSelected}
                        disabled={disabled}
                        onChange={(e) => {
                          if (column.type === "canDownload") {
                            handleSelectAllDownload(e.target.checked);
                            return;
                          }
                          onChange(
                            setAllPermissions(
                              permissions,
                              column.type,
                              e.target.checked
                            )
                          );
                        }}
                      />
                      <span className="admin-text-muted">{column.selectAllLabel}</span>
                    </label>
                  </th>
                );
              })}
            </tr>
            <tr className="admin-text-muted border-b border-[var(--admin-permissions-table-border)]">
              <th className="px-4 py-2 text-left text-xs font-medium whitespace-nowrap">
                &nbsp;
              </th>
              {columns.map((column) => (
                <th
                  key={column.type}
                  className="admin-text-muted px-4 py-2 text-center text-xs font-medium whitespace-nowrap"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERMISSION_TREE.flatMap((node) => {
              if (node.type === "leaf") {
                return [
                  <tr
                    key={node.key}
                    className="admin-permissions-table__row border-t align-middle transition-colors"
                  >
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      {renderModuleLabel(node.label)}
                    </td>
                    <PermissionCheckboxes
                      label={node.label}
                      moduleKey={node.key}
                      permissions={permissions}
                      disabled={disabled}
                      onChange={onChange}
                      showDownload={showDownload}
                      downloadSelected={resolvedDownloadSelections[node.key]}
                      onDownloadToggle={handleDownloadToggle}
                    />
                  </tr>,
                ];
              }

              const childKeys = node.children.map((child) => child.key);
              const isExpanded = expandedGroups.has(node.id);

              const rows = [
                <tr
                  key={node.id}
                  className="admin-permissions-table__row border-t align-middle transition-colors"
                >
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="admin-icon-btn admin-text-subtle inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-colors"
                        onClick={() => toggleGroup(node.id)}
                        disabled={disabled}
                        aria-expanded={isExpanded}
                        aria-label={`${isExpanded ? "Collapse" : "Expand"} ${node.label}`}
                      >
                        {isExpanded ? (
                          <ChevronDown size={14} aria-hidden />
                        ) : (
                          <ChevronRight size={14} aria-hidden />
                        )}
                      </button>
                      {renderModuleLabel(node.label)}
                    </div>
                  </td>
                  <ParentPermissionCheckboxes
                    label={node.label}
                    parentKey={node.parentKey}
                    childKeys={childKeys}
                    permissions={permissions}
                    disabled={disabled}
                    onChange={onChange}
                    showDownload={showDownload}
                    downloadSelections={resolvedDownloadSelections}
                    onDownloadGroupToggle={handleDownloadGroupToggle}
                  />
                </tr>,
              ];

              if (isExpanded) {
                node.children.forEach((child) => {
                  rows.push(
                    <tr
                      key={`${node.id}__child__${child.label}`}
                      className="admin-permissions-table__row border-t align-middle transition-colors"
                    >
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <div className="flex items-center gap-2 pl-2 sm:pl-3">
                          <span
                            className="inline-flex h-6 w-6 shrink-0"
                            aria-hidden="true"
                          />
                          <span className="pl-2 sm:pl-3">
                            {renderModuleLabel(child.label)}
                          </span>
                        </div>
                      </td>
                      <PermissionCheckboxes
                        label={child.label}
                        moduleKey={child.key}
                        permissions={permissions}
                        disabled={disabled}
                        onChange={onChange}
                        showDownload={showDownload}
                        downloadSelected={resolvedDownloadSelections[child.key]}
                        onDownloadToggle={handleDownloadToggle}
                      />
                    </tr>
                  );
                });
              }

              return rows;
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default UserPermissionsTable;
