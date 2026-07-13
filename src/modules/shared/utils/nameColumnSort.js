import { getColumnKey, getRowValue } from "./tableHelpers";

/**
 * Resolve a timestamp/id for "newest first" ordering.
 * Prefers raw timestamps, then numeric ids (higher = newer).
 */
export function getListingNewestValue(row) {
  if (!row || typeof row !== "object") return 0;

  const dateCandidates = [
    row.createdAtRaw,
    row.created_at,
    row.updatedAtRaw,
    row.updated_at,
    row.createdAt,
    row.updatedAt,
  ];

  for (const value of dateCandidates) {
    if (value == null || value === "") continue;
    if (typeof value === "number" && Number.isFinite(value)) return value;
    const parsed = Date.parse(String(value));
    if (Number.isFinite(parsed)) return parsed;
  }

  const idCandidates = [row.id, row.recordId, row.survey_id];
  for (const value of idCandidates) {
    if (value == null || value === "") continue;
    const asNumber = Number(value);
    if (Number.isFinite(asNumber)) return asNumber;
  }

  return 0;
}

export function getListingTextValue(row, columnLabel) {
  if (!row) return "";
  const key = getColumnKey(columnLabel);
  const value = getRowValue(row, key);
  if (value == null || value === "-" || value === "—") return "";
  return String(value).trim();
}

export function compareTextAsc(left, right) {
  return String(left ?? "").localeCompare(String(right ?? ""), undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

/**
 * Three-state listing sort:
 *   null → newest → alpha → null
 * UI maps newest → asc (up arrow), alpha → desc (down arrow).
 *
 * @param {Array} rows
 * @param {{ mode: null | "newest" | "alpha", column: string } | null} sortState
 * @param {{ getTextValue?: (row: object) => string, getNewestValue?: (row: object) => number|string }} [options]
 */
export function applyNameColumnSort(rows, sortState, options = {}) {
  if (!Array.isArray(rows) || rows.length <= 1 || !sortState?.mode) {
    return Array.isArray(rows) ? rows : [];
  }

  const getText =
    options.getTextValue ??
    ((row) => getListingTextValue(row, sortState.column));
  const getNewest = options.getNewestValue ?? getListingNewestValue;

  const sorted = [...rows];

  if (sortState.mode === "newest") {
    sorted.sort((left, right) => {
      const leftValue = Number(getNewest(left)) || 0;
      const rightValue = Number(getNewest(right)) || 0;
      if (leftValue !== rightValue) return rightValue - leftValue; // newest first
      return compareTextAsc(getText(left), getText(right));
    });
    return sorted;
  }

  if (sortState.mode === "alpha") {
    sorted.sort((left, right) => compareTextAsc(getText(left), getText(right)));
    return sorted;
  }

  return rows;
}

/**
 * Cycle: default → newest (up) → alpha (down) → default
 */
export function cycleNameColumnSortMode(currentMode) {
  if (currentMode == null) return "newest";
  if (currentMode === "newest") return "alpha";
  return null;
}

/** Map internal mode to ModuleListingPage columnSort shape. */
export function nameSortModeToColumnSort(columnLabel, mode) {
  if (!mode || !columnLabel) return null;
  if (mode === "newest") return { column: columnLabel, direction: "asc" };
  if (mode === "alpha") return { column: columnLabel, direction: "desc" };
  return null;
}
