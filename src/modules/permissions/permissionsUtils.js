/**
 * Frontend permission flags control UI visibility and disabled states only.
 * They are not a security boundary. Hidden or disabled actions can still be
 * attempted against the API; the backend must enforce authorization.
 * API 401/403 responses are handled by the shared HTTP client.
 */
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

function parseBooleanFlag(value) {
  if (value === true || value === 1 || value === "1" || value === "true") return true;
  if (
    value === false ||
    value === 0 ||
    value === "0" ||
    value === "false" ||
    value == null
  ) {
    return false;
  }
  return Boolean(value);
}

function parsePermissionEntry(entry) {
  if (!entry || typeof entry !== "object") {
    return createEmptyModulePermission();
  }
  const canRead = parseBooleanFlag(
    entry.canRead ?? entry.read ?? entry.can_read ?? entry.CanRead
  );
  const canWrite = parseBooleanFlag(
    entry.canWrite ?? entry.write ?? entry.can_write ?? entry.CanWrite
  );
  return {
    canRead: canWrite ? true : canRead,
    canWrite,
  };
}

function looksLikePermissionFlags(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return (
    "canRead" in value ||
    "canWrite" in value ||
    "read" in value ||
    "write" in value ||
    "can_read" in value ||
    "can_write" in value
  );
}

function looksLikePermissionsMap(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return Object.values(value).some((entry) => looksLikePermissionFlags(entry));
}

/** API/backend aliases that differ from frontend module keys. */
const MODULE_KEY_ALIASES = {
  salesmanager: "sales_manager",
  salesmanagers: "sales_manager",
  projectmanager: "project_managers",
  projectmanagers: "project_managers",
};

function resolveModuleKey(moduleName) {
  const raw = String(moduleName ?? "").trim();
  if (!raw) return null;

  const lower = raw.toLowerCase();
  if (PERMISSION_MODULE_KEYS.includes(lower)) return lower;
  if (PERMISSION_MODULE_KEYS.includes(raw)) return raw;

  const labelMatch = PERMISSION_MODULES.find(
    (module) => module.label.toLowerCase() === lower
  );
  if (labelMatch) return labelMatch.key;

  const snake = lower.replace(/[\s-]+/g, "_");
  if (PERMISSION_MODULE_KEYS.includes(snake)) return snake;

  if (MODULE_KEY_ALIASES[lower]) return MODULE_KEY_ALIASES[lower];
  if (MODULE_KEY_ALIASES[snake]) return MODULE_KEY_ALIASES[snake];

  return null;
}

function permissionsObjectToMap(source) {
  const map = /** @type {Record<string, unknown>} */ ({});

  for (const [rawKey, entry] of Object.entries(source)) {
    const key = resolveModuleKey(rawKey);
    if (key) {
      map[key] = entry;
    }
  }

  return map;
}

function permissionsArrayToMap(entries) {
  const map = /** @type {Record<string, unknown>} */ ({});

  for (const entry of entries) {
    if (!entry || typeof entry !== "object") continue;

    const key = resolveModuleKey(
      entry.module ??
        entry.moduleKey ??
        entry.module_key ??
        entry.key ??
        entry.name ??
        entry.id
    );

    if (key) {
      map[key] = entry;
    }
  }

  return map;
}

/**
 * Resolves nested `{ permissions: ... }` wrappers and encoded permission strings.
 * @param {unknown} raw
 */
function unwrapPermissionsSource(raw) {
  let current = raw;

  for (let depth = 0; depth < 5; depth += 1) {
    if (current == null) return null;

    if (typeof current === "string") {
      const decoded = decodePermissionsRaw(current);
      if (decoded == null) return null;
      current = decoded;
      continue;
    }

    if (Array.isArray(current)) {
      return permissionsArrayToMap(current);
    }

    if (typeof current !== "object") return null;

    if (looksLikePermissionsMap(current)) {
      return current;
    }

    const nested = /** @type {{ permissions?: unknown }} */ (current).permissions;
    if (nested != null) {
      current = nested;
      continue;
    }

    return current;
  }

  return current;
}

/**
 * Decodes base64-encoded permission JSON from the API.
 * @param {unknown} encoded
 */
export function decodePermissions(encoded) {
  if (!encoded) return null;
  try {
    const base64 = String(encoded).trim();
    const utf8 =
      typeof Buffer !== "undefined"
        ? Buffer.from(base64, "base64").toString("utf-8")
        : atob(base64);
    return JSON.parse(utf8);
  } catch {
    return encoded;
  }
}

/**
 * Decodes API permission payloads (base64 JSON, plain JSON string, or object).
 * @param {unknown} raw
 */
export function decodePermissionsRaw(raw) {
  if (raw == null) return null;
  if (typeof raw === "object") return raw;
  if (typeof raw !== "string") return null;

  let current = decodePermissions(raw);

  if (typeof current === "string" && current === raw) {
    try {
      return JSON.parse(current.trim());
    } catch {
      return null;
    }
  }

  for (let depth = 0; depth < 3 && typeof current === "string"; depth += 1) {
    const next = decodePermissions(current);
    if (next === current) break;
    current = next;
  }

  return current;
}

/**
 * Reads permission payload from admin/user API records (all known field names).
 * @param {Record<string, unknown> | null | undefined} record
 */
export function extractPermissionsRawFromRecord(record) {
  if (!record || typeof record !== "object") return null;

  return (
    record.permissions ??
    record.permissions_json ??
    record.permissionsJson ??
    record.permission ??
    record.permissions_encrypted ??
    record.encrypted_permissions ??
    null
  );
}

/** Raw/encrypted permission fields — never persist after login. */
export const ENCRYPTED_PERMISSION_FIELD_KEYS = [
  "permissions_json",
  "permissionsJson",
  "permission",
  "permissions_encrypted",
  "encrypted_permissions",
];

/**
 * Decrypts and normalizes permissions from an admin/user API record.
 * @param {Record<string, unknown> | null | undefined} record
 */
export function resolvePermissionsFromRecord(record) {
  return normalizePermissions(extractPermissionsRawFromRecord(record));
}

/**
 * Resolves permissions from the first source that contains a payload (login API may
 * attach permissions on admin, data, or the top-level response).
 * @param {...(Record<string, unknown> | null | undefined)} sources
 */
export function resolvePermissionsFromSources(...sources) {
  for (const source of sources) {
    if (!source || typeof source !== "object") continue;
    const raw = extractPermissionsRawFromRecord(source);
    if (raw == null) continue;
    const normalized = normalizePermissions(raw);
    if (hasAnyPermissionGrant(normalized)) {
      return normalized;
    }
  }

  for (const source of sources) {
    if (!source || typeof source !== "object") continue;
    const raw = extractPermissionsRawFromRecord(source);
    if (raw != null) {
      return normalizePermissions(raw);
    }
  }

  return createDefaultPermissions();
}

/**
 * Removes encrypted/raw permission fields from a stored admin session object.
 * @param {Record<string, unknown>} admin
 */
export function stripEncryptedPermissionFields(admin) {
  const next = { ...admin };
  for (const key of ENCRYPTED_PERMISSION_FIELD_KEYS) {
    delete next[key];
  }
  return next;
}

/**
 * Decrypts permissions and returns a session-safe admin object (no encrypted fields).
 * @param {Record<string, unknown> | null | undefined} record
 * @param {...(Record<string, unknown> | null | undefined)} permissionSources
 */
export function prepareAdminSessionUser(record, ...permissionSources) {
  if (!record || typeof record !== "object") return null;

  const permissions = resolvePermissionsFromSources(record, ...permissionSources);
  const sessionUser = stripEncryptedPermissionFields({
    ...record,
    permissions,
  });

  return sessionUser;
}

/**
 * Normalizes API/mock permissions to include every module key.
 * @param {PermissionsMap | string | null | undefined} raw
 */
export function normalizePermissions(raw) {
  const base = createDefaultPermissions();

  if (raw == null || raw === "") return base;

  const source = unwrapPermissionsSource(raw);
  if (!source || typeof source !== "object" || Array.isArray(source)) return base;

  const map = Array.isArray(source)
    ? permissionsArrayToMap(source)
    : permissionsObjectToMap(source);

  for (const key of PERMISSION_MODULE_KEYS) {
    base[key] = parsePermissionEntry(map[key]);
  }

  return syncAllParentsFromChildren(base);
}

/**
 * Deep equality for permission maps (all module keys).
 * @param {PermissionsMap | string | null | undefined} a
 * @param {PermissionsMap | string | null | undefined} b
 */
export function permissionsEqual(a, b) {
  const left = normalizePermissions(a);
  const right = normalizePermissions(b);

  return PERMISSION_MODULE_KEYS.every((key) => {
    const l = left[key] ?? createEmptyModulePermission();
    const r = right[key] ?? createEmptyModulePermission();
    return l.canRead === r.canRead && l.canWrite === r.canWrite;
  });
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

/** Group ids that should expand because a child module has Read/Write access. */
export function deriveExpandedPermissionGroupIds(permissions) {
  const expanded = new Set();

  for (const node of getPermissionGroups()) {
    const hasGrant = node.children.some((child) => {
      const flags = permissions?.[child.key];
      return flags?.canRead || flags?.canWrite;
    });
    if (hasGrant) expanded.add(node.id);
  }

  return expanded;
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

/** Modules that inherit access from related keys when the API has not granted them yet. */
const MODULE_ACCESS_FALLBACKS = {
  reward_history: ["pending_rewards", "completed_rewards", "reward_points"],
  reward_settings: ["reward_points", "pending_rewards", "completed_rewards"],
};

function moduleHasGrant(permissions, key) {
  const flags = permissions?.[key];
  return flags?.canRead === true || flags?.canWrite === true;
}

function resolveModuleFlags(permissions, moduleKey) {
  if (moduleHasGrant(permissions, moduleKey)) {
    return permissions[moduleKey];
  }

  const fallbacks = MODULE_ACCESS_FALLBACKS[moduleKey];
  if (!fallbacks) {
    return permissions?.[moduleKey];
  }

  for (const key of fallbacks) {
    if (moduleHasGrant(permissions, key)) {
      return permissions[key];
    }
  }

  return permissions?.[moduleKey];
}

/**
 * @param {PermissionsMap | null | undefined} permissions
 * @param {string} moduleKey
 */
export function canReadModule(permissions, moduleKey, { isSuperAdmin = false } = {}) {
  if (isSuperAdmin) return true;
  const flags = {
    ...createEmptyModulePermission(),
    ...resolveModuleFlags(permissions, moduleKey),
  };
  return flags.canRead === true || flags.canWrite === true;
}

/**
 * @param {PermissionsMap | null | undefined} permissions
 * @param {string} moduleKey
 */
export function canWriteModule(permissions, moduleKey, { isSuperAdmin = false } = {}) {
  if (isSuperAdmin) return true;
  const flags = {
    ...createEmptyModulePermission(),
    ...resolveModuleFlags(permissions, moduleKey),
  };
  return flags.canWrite === true;
}

/** @deprecated Use canReadModule — supports legacy read flag */
export function moduleHasReadAccess(permissions, moduleKey, options) {
  return canReadModule(permissions, moduleKey, options);
}
