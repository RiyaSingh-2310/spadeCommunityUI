import { PERMISSION_MODULE_KEYS, PERMISSION_MODULES } from "./permissionModules";
import {
  PERMISSION_UI_PARENT_KEYS,
  getPermissionGroups,
} from "./permissionTree";

/** @typedef {{ canRead: boolean, canWrite: boolean }} PermissionFlags */
/** @typedef {Record<string, PermissionFlags>} PermissionsMap */

export function createEmptyModulePermission() {
  return { canRead: false, canWrite: false };
}

export function createDefaultPermissions() {
  return PERMISSION_MODULE_KEYS.reduce((acc, key) => {
    acc[key] = createEmptyModulePermission();
    return acc;
  }, /** @type {PermissionsMap} */ ({}));
}

export function createFullPermissions() {
  return PERMISSION_MODULE_KEYS.reduce((acc, key) => {
    acc[key] = { canRead: true, canWrite: true };
    return acc;
  }, /** @type {PermissionsMap} */ ({}));
}

function parsePermissionEntry(entry) {
  if (!entry || typeof entry !== "object") {
    return createEmptyModulePermission();
  }
  const canRead = Boolean(entry.canRead ?? entry.read);
  const canWrite = Boolean(entry.canWrite ?? entry.write);
  return {
    canRead: canWrite ? true : canRead,
    canWrite,
  };
}

/**
 * Normalizes API/mock permissions to include every module key.
 * @param {PermissionsMap | string | null | undefined} raw
 */
export function normalizePermissions(raw) {
  const base = createDefaultPermissions();

  if (!raw) return base;

  let parsed = raw;
  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return base;
    }
  }

  const source = parsed?.permissions ?? parsed;
  if (!source || typeof source !== "object") return base;

  for (const key of PERMISSION_MODULE_KEYS) {
    base[key] = parsePermissionEntry(source[key]);
  }

  return syncAllParentsFromChildren(base);
}

export function hasAnyPermissionGrant(permissions) {
  const normalized = normalizePermissions(permissions);
  return PERMISSION_MODULE_KEYS.some(
    (key) => normalized[key]?.canRead || normalized[key]?.canWrite
  );
}

/**
 * @param {PermissionsMap} permissions
 */
/**
 * API payload: only real module keys (never UI parent keys like survey_parent).
 * @param {PermissionsMap} permissions
 */
export function buildPermissionsPayload(permissions) {
  const normalized = normalizePermissions(permissions);
  const payload = PERMISSION_MODULE_KEYS.reduce((acc, key) => {
    acc[key] = normalized[key] ?? createEmptyModulePermission();
    return acc;
  }, /** @type {PermissionsMap} */ ({}));
  return { permissions: payload };
}

/**
 * @param {PermissionsMap} permissions
 */
export function stripUiParentPermissionKeys(permissions) {
  const next = { ...permissions };
  for (const key of PERMISSION_UI_PARENT_KEYS) {
    delete next[key];
  }
  return next;
}

/**
 * Child → parent indicator rules (parent row reflects children only).
 * parent.read  = any child has Read OR any child has Write
 * parent.write = any child has Write
 * Parent is cleared only when every child has no Read and no Write.
 *
 * @param {PermissionsMap} permissions
 * @param {string[]} childKeys
 */
export function computeAggregatedParentFlags(permissions, childKeys) {
  let anyWrite = false;
  let anyRead = false;

  for (const key of childKeys) {
    const flags = { ...createEmptyModulePermission(), ...permissions[key] };
    if (flags.canWrite) anyWrite = true;
    if (flags.canRead) anyRead = true;
  }

  return {
    canRead: anyRead || anyWrite,
    canWrite: anyWrite,
  };
}

/**
 * Syncs every group parentKey from its children using aggregation rules.
 * @param {PermissionsMap} permissions
 */
export function syncAllParentsFromChildren(permissions) {
  const next = { ...permissions };

  for (const node of getPermissionGroups()) {
    const childKeys = node.children.map((child) => child.key);
    const aggregated = computeAggregatedParentFlags(next, childKeys);

    next[node.parentKey] = aggregated;

    const apiParentKey = node.apiParentKey;
    if (apiParentKey && !childKeys.includes(apiParentKey)) {
      next[apiParentKey] = aggregated;
    }
  }

  return next;
}

function applyModulePermission(permissions, moduleKey, type, checked) {
  const next = { ...permissions };
  const current = { ...createEmptyModulePermission(), ...next[moduleKey] };

  if (type === "canRead") {
    current.canRead = checked;
    if (!checked) {
      current.canWrite = false;
    }
  } else {
    current.canWrite = checked;
    if (checked) {
      current.canRead = true;
    }
  }

  next[moduleKey] = current;
  return next;
}

/**
 * Child toggle: updates only that module, then syncs parent indicator(s).
 * Never modifies sibling children.
 *
 * @param {PermissionsMap} permissions
 * @param {string} moduleKey
 * @param {"canRead" | "canWrite"} type
 * @param {boolean} checked
 */
export function setModulePermission(permissions, moduleKey, type, checked) {
  const next = applyModulePermission(permissions, moduleKey, type, checked);
  return syncAllParentsFromChildren(next);
}

/** @alias setModulePermission — explicit child-only updates */
export const setChildModulePermission = setModulePermission;

/**
 * Parent → child: applies the same permission to every child only.
 * Siblings are never cross-updated except by receiving the same value from the parent action.
 * Parent module key is then synced from children for API payload consistency.
 *
 * @param {PermissionsMap} permissions
 * @param {string | undefined} parentKey
 * @param {string[]} childKeys
 * @param {"canRead" | "canWrite"} type
 * @param {boolean} checked
 */
export function setParentGroupPermission(
  permissions,
  parentKey,
  childKeys,
  type,
  checked
) {
  let next = { ...permissions };

  for (const key of childKeys) {
    next = applyModulePermission(next, key, type, checked);
  }

  return syncAllParentsFromChildren(next);
}

/**
 * Parent row display: aggregated indicator from children (not stored parent alone).
 * @param {PermissionsMap} permissions
 * @param {string | undefined} parentKey
 * @param {string[]} childKeys
 * @param {"canRead" | "canWrite"} type
 */
export function getParentRowPermission(permissions, parentKey, childKeys, type) {
  if (!parentKey || childKeys.length === 0) return false;

  return computeAggregatedParentFlags(permissions, childKeys)[type] === true;
}

/**
 * @param {PermissionsMap} permissions
 * @param {"canRead" | "canWrite"} type
 * @param {boolean} checked
 */
export function setAllPermissions(permissions, type, checked) {
  let next = { ...permissions };
  for (const { key } of PERMISSION_MODULES) {
    next = applyModulePermission(next, key, type, checked);
  }
  return syncAllParentsFromChildren(next);
}

/**
 * @param {PermissionsMap} permissions
 * @param {"canRead" | "canWrite"} type
 */
export function areAllPermissionsSelected(permissions, type) {
  return PERMISSION_MODULE_KEYS.every((key) => permissions[key]?.[type] === true);
}

/**
 * @param {PermissionsMap | null | undefined} permissions
 * @param {string} moduleKey
 */
export function canReadModule(permissions, moduleKey, { isSuperAdmin = false } = {}) {
  if (isSuperAdmin) return true;
  const flags = permissions?.[moduleKey];
  return flags?.canRead === true || flags?.canWrite === true;
}

/**
 * @param {PermissionsMap | null | undefined} permissions
 * @param {string} moduleKey
 */
export function canWriteModule(permissions, moduleKey, { isSuperAdmin = false } = {}) {
  if (isSuperAdmin) return true;
  return permissions?.[moduleKey]?.canWrite === true;
}

/** @deprecated Use canReadModule — supports legacy read flag */
export function moduleHasReadAccess(permissions, moduleKey, options) {
  return canReadModule(permissions, moduleKey, options);
}
