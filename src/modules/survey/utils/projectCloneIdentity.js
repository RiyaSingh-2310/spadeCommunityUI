import { NAME_FIELD_MAX_LENGTH } from "../../shared/utils/validation";

const CLONE_NAME_SUFFIX = /\s+-\s+(\d+)$/;

export function normalizeProjectIdentity(value) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

export function stripCloneNameSuffix(name) {
  return String(name ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .replace(CLONE_NAME_SUFFIX, "");
}

/**
 * Next unused clone name: "Project Name - 1", "Project Name - 2", ...
 * @param {unknown} sourceName
 * @param {unknown[]} existingNames
 */
export function nextUniqueCloneProjectName(sourceName, existingNames = []) {
  const stem = stripCloneNameSuffix(sourceName) || "Project";
  const taken = new Set(
    (Array.isArray(existingNames) ? existingNames : []).map(normalizeProjectIdentity)
  );

  let n = 1;
  while (n < 10000) {
    const suffix = ` - ${n}`;
    const maxStem = Math.max(1, NAME_FIELD_MAX_LENGTH - suffix.length);
    const candidate = `${stem.slice(0, maxStem)}${suffix}`;
    if (!taken.has(normalizeProjectIdentity(candidate))) return candidate;
    n += 1;
  }

  return `${stem.slice(0, Math.max(1, NAME_FIELD_MAX_LENGTH - 8))} - ${Date.now() % 100000}`;
}

/**
 * Next unused project code that is not a copy of the source code.
 * @param {unknown} sourceCode
 * @param {unknown[]} existingCodes
 */
export function nextUniqueCloneProjectCode(sourceCode, existingCodes = []) {
  const base = String(sourceCode ?? "").trim() || "PRJ";
  const taken = new Set(
    (Array.isArray(existingCodes) ? existingCodes : []).map(normalizeProjectIdentity)
  );

  let n = 1;
  while (n < 10000) {
    const candidate = `${base}-${n}`;
    if (!taken.has(normalizeProjectIdentity(candidate))) return candidate;
    n += 1;
  }

  return `${base}-${Date.now() % 100000}`;
}
