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

/** @typedef {{ canRead: boolean, canWrite: boolean, canDownload: boolean }} PermissionFlags */
/** @typedef {Record<string, PermissionFlags>} PermissionsMap */

export function createEmptyModulePermission() {
  return { canRead: false, canWrite: false, canDownload: false };
}

export function createDefaultPermissions() {
  return PERMISSION_MODULE_KEYS.reduce((acc, key) => {
    acc[key] = createEmptyModulePermission();
    return acc;
  }, /** @type {PermissionsMap} */ ({}));
}

export function createFullPermissions() {
  return PERMISSION_MODULE_KEYS.reduce((acc, key) => {
    acc[key] = { canRead: true, canWrite: true, canDownload: true };
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

const WRITE_ACTION_TOKENS = new Set([
  "write",
  "edit",
  "update",
  "add",
  "create",
  "delete",
  "remove",
  "full",
  "all",
  "manage",
]);
const DOWNLOAD_ACTION_TOKENS = new Set([
  "download",
  "export",
  "csv",
  "full",
  "all",
]);
const READ_ACTION_TOKENS = new Set([
  "read",
  "view",
  "get",
  "list",
  ...WRITE_ACTION_TOKENS,
]);

function parsePermissionEntry(entry) {
  if (entry === true || entry === 1 || entry === "1" || entry === "true") {
    return { canRead: true, canWrite: true, canDownload: true };
  }
  if (
    entry === false ||
    entry === 0 ||
    entry === "0" ||
    entry === "false" ||
    entry == null
  ) {
    return createEmptyModulePermission();
  }

  if (typeof entry === "string") {
    const token = entry.toLowerCase().trim();
    if (!token) return createEmptyModulePermission();
    const canWrite = WRITE_ACTION_TOKENS.has(token);
    const canDownload = DOWNLOAD_ACTION_TOKENS.has(token);
    const canRead = READ_ACTION_TOKENS.has(token) || canWrite;
    return { canRead, canWrite, canDownload };
  }

  if (Array.isArray(entry)) {
    const tokens = entry.map((value) => String(value ?? "").toLowerCase().trim());
    const canWrite = tokens.some((token) => WRITE_ACTION_TOKENS.has(token));
    const canDownload = tokens.some((token) => DOWNLOAD_ACTION_TOKENS.has(token));
    const canRead =
      canWrite || tokens.some((token) => READ_ACTION_TOKENS.has(token));
    return { canRead, canWrite, canDownload };
  }

  if (typeof entry !== "object") {
    return createEmptyModulePermission();
  }

  const view = parseBooleanFlag(
    entry.view ?? entry.View ?? entry.canView ?? entry.can_view
  );
  const add = parseBooleanFlag(
    entry.add ?? entry.Add ?? entry.create ?? entry.Create ?? entry.canAdd ?? entry.can_add
  );
  const edit = parseBooleanFlag(
    entry.edit ??
      entry.Edit ??
      entry.update ??
      entry.Update ??
      entry.canEdit ??
      entry.can_edit
  );
  const del = parseBooleanFlag(
    entry.delete ?? entry.Delete ?? entry.canDelete ?? entry.can_delete
  );
  const explicitRead = parseBooleanFlag(
    entry.canRead ?? entry.read ?? entry.can_read ?? entry.CanRead
  );
  const explicitWrite = parseBooleanFlag(
    entry.canWrite ?? entry.write ?? entry.can_write ?? entry.CanWrite
  );
  const explicitDownload = parseBooleanFlag(
    entry.csv_download ??
      entry.csvDownload ??
      entry.canDownload ??
      entry.download ??
      entry.can_download ??
      entry.CanDownload ??
      entry.export ??
      entry.canExport ??
      entry.can_export
  );

  const canWrite = explicitWrite || add || edit || del;
  const canRead = canWrite || explicitRead || view;
  // Download is independent — never inferred from write/read.
  const canDownload = explicitDownload;
  return { canRead, canWrite, canDownload };
}

function looksLikePermissionObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return (
    "canRead" in value ||
    "canWrite" in value ||
    "canDownload" in value ||
    "csv_download" in value ||
    "csvDownload" in value ||
    "read" in value ||
    "write" in value ||
    "download" in value ||
    "can_read" in value ||
    "can_write" in value ||
    "can_download" in value ||
    "view" in value ||
    "add" in value ||
    "edit" in value ||
    "delete" in value ||
    "create" in value ||
    "update" in value ||
    "export" in value ||
    "canExport" in value
  );
}

/** Frontend module key → backend permission module name (checkPermission). */
export const FRONTEND_TO_API_MODULE_NAME = {
  users: "Admin",
  clients: "Client",
  partners: "Partners",
  project_managers: "ProjectManager",
  sales_manager: "SalesManager",
  prescreen: "QuestionLibrary",
  prescreen_group: "QuestionnaireGroup",
};

export function toApiPermissionModuleName(moduleKey) {
  const key = String(moduleKey ?? "").trim();
  if (!key) return "";
  if (FRONTEND_TO_API_MODULE_NAME[key]) return FRONTEND_TO_API_MODULE_NAME[key];
  return key
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

function looksLikePermissionFlags(value) {
  if (typeof value === "boolean") return true;
  if (typeof value === "string") {
    const token = value.toLowerCase().trim();
    return READ_ACTION_TOKENS.has(token) || WRITE_ACTION_TOKENS.has(token);
  }
  if (Array.isArray(value)) {
    return value.every(
      (item) =>
        typeof item === "boolean" ||
        typeof item === "string" ||
        looksLikePermissionObject(item)
    );
  }
  return looksLikePermissionObject(value);
}

function looksLikePermissionsMap(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const values = Object.values(value);
  if (!values.length) return false;
  return values.some((entry) => looksLikePermissionFlags(entry));
}

/** API/backend aliases that differ from frontend module keys. */
const MODULE_KEY_ALIASES = {
  salesmanager: "sales_manager",
  salesmanagers: "sales_manager",
  projectmanager: "project_managers",
  projectmanagers: "project_managers",
  reward: "reward_points",
  rewardmanagement: "reward_points",
  reward_management: "reward_points",
  user_email: "user_email_templates",
  useremail: "user_email_templates",
  user_email_template: "user_email_templates",
  useremailtemplate: "user_email_templates",
  useremailtemplates: "user_email_templates",
  email_template: "user_email_templates",
  email_templates: "user_email_templates",
  emailtemplate: "user_email_templates",
  emailtemplates: "user_email_templates",
  panelist: "community_users",
  panelists: "community_users",
  community_user: "community_users",
  admin: "users",
  admin_user: "users",
  admin_users: "users",
  client: "clients",
  question_library: "prescreen",
  questionlibrary: "prescreen",
  questionnaire_group: "prescreen_group",
  questionnairegroup: "prescreen_group",
  logactivity: "log_activity",
  activity_log: "log_activity",
  activitylog: "log_activity",
};

function normalizeLookupToken(value) {
  return String(value ?? "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");
}

function stripTrailingPlural(token) {
  const value = String(token ?? "");
  if (value.endsWith("ies") && value.length > 4) return `${value.slice(0, -3)}y`;
  if (value.endsWith("s") && !value.endsWith("ss") && value.length > 3) {
    return value.slice(0, -1);
  }
  return value;
}

function compactLookupToken(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

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

  const compact = compactLookupToken(raw);
  const compactStem = stripTrailingPlural(compact);
  const fuzzyLabel = PERMISSION_MODULES.find((module) => {
    const labelCompact = compactLookupToken(module.label);
    return (
      labelCompact === compact ||
      stripTrailingPlural(labelCompact) === compactStem
    );
  });
  if (fuzzyLabel) return fuzzyLabel.key;

  const snake = normalizeLookupToken(raw);
  if (PERMISSION_MODULE_KEYS.includes(snake)) return snake;

  const snakeStem = stripTrailingPlural(snake);
  if (PERMISSION_MODULE_KEYS.includes(snakeStem)) return snakeStem;
  if (PERMISSION_MODULE_KEYS.includes(`${snakeStem}s`)) return `${snakeStem}s`;

  if (MODULE_KEY_ALIASES[lower]) return MODULE_KEY_ALIASES[lower];
  if (MODULE_KEY_ALIASES[snake]) return MODULE_KEY_ALIASES[snake];
  if (MODULE_KEY_ALIASES[compact]) return MODULE_KEY_ALIASES[compact];
  if (MODULE_KEY_ALIASES[snakeStem]) return MODULE_KEY_ALIASES[snakeStem];
  if (MODULE_KEY_ALIASES[compactStem]) return MODULE_KEY_ALIASES[compactStem];

  const keyByStem = PERMISSION_MODULE_KEYS.find((key) => {
    const keyCompact = compactLookupToken(key);
    return (
      stripTrailingPlural(key) === snakeStem ||
      keyCompact === compact ||
      stripTrailingPlural(keyCompact) === compactStem
    );
  });
  if (keyByStem) return keyByStem;

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

  return syncAllParentsFromChildren(base, { preserveExplicitApiParents: true });
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
    return (
      l.canRead === r.canRead &&
      l.canWrite === r.canWrite &&
      l.canDownload === r.canDownload
    );
  });
}

export function hasAnyPermissionGrant(permissions) {
  const normalized = normalizePermissions(permissions);
  return PERMISSION_MODULE_KEYS.some(
    (key) =>
      normalized[key]?.canRead ||
      normalized[key]?.canWrite ||
      normalized[key]?.canDownload
  );
}

/**
 * API payload as backend array format:
 * [{ module: "ProjectManager", read, write, csv_download }, ...]
 * Also keeps snake_case object map for older readers.
 * @param {PermissionsMap} permissions
 */
export function buildPermissionsPayload(permissions) {
  const normalized = normalizePermissions(permissions);

  const asArray = PERMISSION_MODULE_KEYS.map((key) => {
    const flags = normalized[key] ?? createEmptyModulePermission();
    return {
      module: toApiPermissionModuleName(key),
      read: flags.canRead === true,
      write: flags.canWrite === true,
      csv_download: flags.canDownload === true,
    };
  });

  const asMap = PERMISSION_MODULE_KEYS.reduce((acc, key) => {
    const flags = normalized[key] ?? createEmptyModulePermission();
    acc[key] = {
      canRead: flags.canRead === true,
      canWrite: flags.canWrite === true,
      canDownload: flags.canDownload === true,
      read: flags.canRead === true,
      write: flags.canWrite === true,
      csv_download: flags.canDownload === true,
    };
    return acc;
  }, /** @type {Record<string, object>} */ ({}));

  // Backend Permission.getByAdmin prefers an array of { module, read, write, csv_download }.
  return { permissions: asArray, permissionsMap: asMap };
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

/** Group ids that should expand because a child module has any assigned access. */
export function deriveExpandedPermissionGroupIds(permissions) {
  const expanded = new Set();

  for (const node of getPermissionGroups()) {
    const hasGrant = node.children.some((child) => {
      const flags = permissions?.[child.key];
      return flags?.canRead || flags?.canWrite || flags?.canDownload;
    });
    if (hasGrant) expanded.add(node.id);
  }

  return expanded;
}

/**
 * Child → parent indicator rules (parent row reflects children only).
 * parent.read  = any child has Read OR any child has Write
 * parent.write = any child has Write
 * parent.download = any child has Download
 *
 * @param {PermissionsMap} permissions
 * @param {string[]} childKeys
 */
export function computeAggregatedParentFlags(permissions, childKeys) {
  let anyWrite = false;
  let anyRead = false;
  let anyDownload = false;

  for (const key of childKeys) {
    const flags = { ...createEmptyModulePermission(), ...permissions[key] };
    if (flags.canWrite) anyWrite = true;
    if (flags.canRead) anyRead = true;
    if (flags.canDownload) anyDownload = true;
  }

  return {
    canRead: anyRead || anyWrite,
    canWrite: anyWrite,
    canDownload: anyDownload,
  };
}

/**
 * Syncs every group parentKey from its children using aggregation rules.
 * @param {PermissionsMap} permissions
 * @param {{ preserveExplicitApiParents?: boolean }} [options]
 */
export function syncAllParentsFromChildren(
  permissions,
  { preserveExplicitApiParents = false } = {}
) {
  const next = { ...permissions };

  for (const node of getPermissionGroups()) {
    const childKeys = node.children.map((child) => child.key);
    const aggregated = computeAggregatedParentFlags(next, childKeys);

    next[node.parentKey] = aggregated;

    const apiParentKey = node.apiParentKey;
    if (apiParentKey && !childKeys.includes(apiParentKey)) {
      const existing = permissions[apiParentKey] ?? createEmptyModulePermission();
      if (
        preserveExplicitApiParents &&
        apiParentKey === "notifications" &&
        (existing.canRead || existing.canWrite || existing.canDownload) &&
        !aggregated.canRead &&
        !aggregated.canWrite &&
        !aggregated.canDownload
      ) {
        next[apiParentKey] = existing;
      } else {
        next[apiParentKey] = aggregated;
      }
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
  } else if (type === "canWrite") {
    current.canWrite = checked;
    if (checked) {
      current.canRead = true;
    }
  } else if (type === "canDownload") {
    current.canDownload = checked;
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
 * @param {"canRead" | "canWrite" | "canDownload"} type
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
 * @param {"canRead" | "canWrite" | "canDownload"} type
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
 * @param {"canRead" | "canWrite" | "canDownload"} type
 */
export function getParentRowPermission(permissions, parentKey, childKeys, type) {
  if (!parentKey || childKeys.length === 0) return false;

  return computeAggregatedParentFlags(permissions, childKeys)[type] === true;
}

/**
 * @param {PermissionsMap} permissions
 * @param {"canRead" | "canWrite" | "canDownload"} type
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
 * @param {"canRead" | "canWrite" | "canDownload"} type
 */
export function areAllPermissionsSelected(permissions, type) {
  return PERMISSION_MODULE_KEYS.every((key) => permissions[key]?.[type] === true);
}

function moduleHasGrant(permissions, key) {
  const flags = permissions?.[key];
  return (
    flags?.canRead === true ||
    flags?.canWrite === true ||
    flags?.canDownload === true
  );
}

function resolveModuleFlags(permissions, moduleKey) {
  if (moduleHasGrant(permissions, moduleKey)) {
    return permissions[moduleKey];
  }

  if (moduleKey === "messages" && moduleHasGrant(permissions, "notifications")) {
    return permissions.notifications;
  }

  return permissions?.[moduleKey];
}

/**
 * @param {PermissionsMap | null | undefined} permissions
 * @param {string} moduleKey
 */
export function canReadModule(permissions, moduleKey, _options = {}) {
  const flags = {
    ...createEmptyModulePermission(),
    ...resolveModuleFlags(permissions, moduleKey),
  };
  return flags.canRead === true || flags.canWrite === true;
}

/**
 * Shared nav/route helper: empty keys = always allowed (e.g. Settings).
 * @param {PermissionsMap | null | undefined} permissions
 * @param {string[] | null | undefined} permissionKeys
 * @param {{ isSuperAdmin?: boolean }} [options]
 */
export function canAccessAnyModule(permissions, permissionKeys = [], options) {
  if (!permissionKeys?.length) return true;
  return permissionKeys.some((key) => canReadModule(permissions, key, options));
}

/**
 * @param {PermissionsMap | null | undefined} permissions
 * @param {string} moduleKey
 */
export function canWriteModule(permissions, moduleKey, _options = {}) {
  const flags = {
    ...createEmptyModulePermission(),
    ...resolveModuleFlags(permissions, moduleKey),
  };
  return flags.canWrite === true;
}

/**
 * Download/export access is independent from Read and Write.
 * @param {PermissionsMap | null | undefined} permissions
 * @param {string} moduleKey
 */
export function canDownloadModule(permissions, moduleKey, _options = {}) {
  const flags = {
    ...createEmptyModulePermission(),
    ...resolveModuleFlags(permissions, moduleKey),
  };
  return flags.canDownload === true;
}

function normalizePermissionAction(action) {
  const token = compactLookupToken(action);
  if (
    token === "read" ||
    token === "canread" ||
    token === "view" ||
    token === "canview"
  ) {
    return "read";
  }
  if (
    token === "write" ||
    token === "canwrite" ||
    token === "edit" ||
    token === "update" ||
    token === "add" ||
    token === "create" ||
    token === "delete"
  ) {
    return "write";
  }
  if (
    token === "csvdownload" ||
    token === "candownload" ||
    token === "download" ||
    token === "export" ||
    token === "canexport"
  ) {
    return "csv_download";
  }
  return "";
}

/**
 * Central permission check. Module names are normalized so
 * `Client`, `clients`, and `CLIENT` resolve to the same module.
 *
 * @param {PermissionsMap | null | undefined} permissions
 * @param {string} moduleName
 * @param {"read" | "write" | "csv_download" | string} action
 */
export function hasPermission(permissions, moduleName, action) {
  const moduleKey = resolveModuleKey(moduleName) ?? String(moduleName ?? "").trim();
  const normalizedAction = normalizePermissionAction(action);

  if (normalizedAction === "read") return canReadModule(permissions, moduleKey);
  if (normalizedAction === "write") return canWriteModule(permissions, moduleKey);
  if (normalizedAction === "csv_download") {
    return canDownloadModule(permissions, moduleKey);
  }
  return false;
}

/** @deprecated Use canReadModule — supports legacy read flag */
export function moduleHasReadAccess(permissions, moduleKey, options) {
  return canReadModule(permissions, moduleKey, options);
}

export const REWARD_MODULE_KEYS = [
  "reward_points",
  "reward_history",
  "pending_rewards",
  "completed_rewards",
  "reward_settings",
];

export function canAccessRewardManagement(permissions, options) {
  return REWARD_MODULE_KEYS.some((key) => canReadModule(permissions, key, options));
}

/** Header bell is always available in the authenticated admin shell. */
export function canShowNotificationBell() {
  return true;
}

/** Messages listing/details — assigned Notifications or Messages access. */
export function canOpenMessagesPage(permissions, options) {
  return (
    canReadModule(permissions, "messages", options) ||
    canReadModule(permissions, "notifications", options)
  );
}

export function canMutateNotificationInbox(permissions, options) {
  return (
    canWriteModule(permissions, "messages", options) ||
    canWriteModule(permissions, "notifications", options)
  );
}
