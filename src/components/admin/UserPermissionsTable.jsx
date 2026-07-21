import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { PERMISSION_TREE } from "../../modules/permissions/permissionTree";
import {
  areAllPermissionsSelected,
  deriveExpandedPermissionGroupIds,
  getParentRowPermission,
  setAllPermissions,
  setChildModulePermission,
  setParentGroupPermission,
} from "../../modules/permissions/permissionsUtils";

function PermissionCheckboxes({
  label,
  moduleKey,
  permissions,
  disabled,
  onChange,
}) {
  const flags = permissions[moduleKey] ?? { canRead: false, canWrite: false };

  return (
    <>
      <td className="px-4 py-2.5 text-center">
        <input
          type="checkbox"
          className="admin-checkbox"
          checked={flags.canRead}
          disabled={disabled}
          aria-label={`${label} read`}
          title="Read"
          onChange={(e) =>
            onChange(
              setChildModulePermission(permissions, moduleKey, "canRead", e.target.checked)
            )
          }
        />
      </td>
      <td className="px-4 py-2.5 text-center">
        <input
          type="checkbox"
          className="admin-checkbox"
          checked={flags.canWrite}
          disabled={disabled}
          aria-label={`${label} write`}
          title="Write"
          onChange={(e) =>
            onChange(
              setChildModulePermission(permissions, moduleKey, "canWrite", e.target.checked)
            )
          }
        />
      </td>
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
}) {
  const canRead = getParentRowPermission(permissions, parentKey, childKeys, "canRead");
  const canWrite = getParentRowPermission(permissions, parentKey, childKeys, "canWrite");

  return (
    <>
      <td className="px-4 py-2.5 text-center">
        <input
          type="checkbox"
          className="admin-checkbox"
          checked={canRead}
          disabled={disabled}
          aria-label={`${label} read`}
          title="Read"
          onChange={(e) =>
            onChange(
              setParentGroupPermission(
                permissions,
                parentKey,
                childKeys,
                "canRead",
                e.target.checked
              )
            )
          }
        />
      </td>
      <td className="px-4 py-2.5 text-center">
        <input
          type="checkbox"
          className="admin-checkbox"
          checked={canWrite}
          disabled={disabled}
          aria-label={`${label} write`}
          title="Write"
          onChange={(e) =>
            onChange(
              setParentGroupPermission(
                permissions,
                parentKey,
                childKeys,
                "canWrite",
                e.target.checked
              )
            )
          }
        />
      </td>
    </>
  );
}

function UserPermissionsTable({
  permissions,
  onChange,
  disabled = false,
  /** When set (e.g. user id in edit mode), auto-expands groups with assigned child permissions. */
  permissionsInitKey = null,
}) {
  const [expandedGroups, setExpandedGroups] = useState(() => new Set());

  useEffect(() => {
    if (permissionsInitKey == null) return;
    setExpandedGroups(deriveExpandedPermissionGroupIds(permissions));
  }, [permissionsInitKey, permissions]);

  const allRead = areAllPermissionsSelected(permissions, "canRead");
  const allWrite = areAllPermissionsSelected(permissions, "canWrite");

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

  const renderModuleLabel = (label) => (
    <span className="admin-text block font-medium">{label}</span>
  );

  return (
    <div className="admin-permissions-table overflow-hidden rounded-xl border">
      <div className="max-h-[min(70vh,520px)] overflow-auto">
        <table className="admin-table min-w-full text-sm">
          <thead className="admin-permissions-table__head sticky top-0 z-10">
            <tr className="admin-text-muted">
              <th className="admin-text px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide whitespace-nowrap">
                Module
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide whitespace-nowrap">
                <label className="admin-permissions-table__label inline-flex items-center justify-center gap-2">
                  <input
                    type="checkbox"
                    className="admin-checkbox"
                    checked={allRead}
                    disabled={disabled}
                    onChange={(e) =>
                      onChange(setAllPermissions(permissions, "canRead", e.target.checked))
                    }
                  />
                  <span className="admin-text-muted">Select All Read</span>
                </label>
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide whitespace-nowrap">
                <label className="admin-permissions-table__label inline-flex items-center justify-center gap-2">
                  <input
                    type="checkbox"
                    className="admin-checkbox"
                    checked={allWrite}
                    disabled={disabled}
                    onChange={(e) =>
                      onChange(setAllPermissions(permissions, "canWrite", e.target.checked))
                    }
                  />
                  <span className="admin-text-muted">Select All Write</span>
                </label>
              </th>
            </tr>
            <tr className="admin-text-muted border-b border-[var(--admin-permissions-table-border)]">
              <th className="px-4 py-2 text-left text-xs font-medium whitespace-nowrap">
                &nbsp;
              </th>
              <th className="admin-text-muted px-4 py-2 text-center text-xs font-medium whitespace-nowrap">
                Read
              </th>
              <th className="admin-text-muted px-4 py-2 text-center text-xs font-medium whitespace-nowrap">
                Write
              </th>
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
                        {/* Indent under parent: chevron column spacer + nest padding */}
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
