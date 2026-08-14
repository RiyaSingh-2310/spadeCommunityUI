import { getRowValue } from "./tableHelpers";

function toFiniteNumber(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const text = String(value ?? "").trim();
  if (!text) return null;
  const asNumber = Number(text);
  if (Number.isFinite(asNumber)) return asNumber;
  const digits = text.match(/(\d+)(?!.*\d)/);
  if (!digits) return null;
  const parsed = Number(digits[1]);
  return Number.isFinite(parsed) ? parsed : null;
}

function toTimestamp(value) {
  if (value == null || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) {
    return value < 1e12 ? value * 1000 : value;
  }
  const parsed = Date.parse(String(value));
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Resolve a timestamp/id for "newest first" ordering.
 * Prefers raw timestamps, then numeric ids (higher = newer).
 */
export function getListingNewestValue(row) {
  if (!row || typeof row !== "object") return 0;

  const dateCandidates = [
    row.createdAtRaw,
    row.created_at,
    row.createdAt,
    row.createdDate,
    row.created_date,
    row.createdOn,
    row.created_on,
    row.addedOn,
    row.added_on,
    row.updatedAtRaw,
    row.updated_at,
    row.updatedAt,
  ];

  for (const value of dateCandidates) {
    const timestamp = toTimestamp(value);
    if (timestamp != null) return timestamp;
  }

  const idCandidates = [row.recordId, row.id, row.survey_id, row.surveyId];
  for (const value of idCandidates) {
    const asNumber = toFiniteNumber(value);
    if (asNumber != null) return asNumber;
  }

  return 0;
}

export function getListingTextValue(row, columnLabel) {
  if (!row) return "";
  const value = getRowValue(row, columnLabel);
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

  if (sortState.mode === "newest") {
    return rows
      .map((row, index) => ({ row, index }))
      .sort((left, right) => {
        const leftValue = Number(getNewest(left.row)) || 0;
        const rightValue = Number(getNewest(right.row)) || 0;
        if (leftValue !== rightValue) return rightValue - leftValue;
        return left.index - right.index;
      })
      .map((entry) => entry.row);
  }

  if (sortState.mode === "alpha") {
    return rows
      .map((row, index) => ({ row, index }))
      .sort((left, right) => {
        const cmp = compareTextAsc(getText(left.row), getText(right.row));
        if (cmp !== 0) return cmp;
        return left.index - right.index;
      })
      .map((entry) => entry.row);
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
