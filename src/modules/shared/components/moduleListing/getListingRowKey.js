/**
 * Stable unique React key for a listing row.
 * Prefer row id; never fall back to display name (can duplicate).
 */
export function getListingRowKey(rowId, page, index) {
  if (rowId != null && String(rowId).trim() !== "") {
    return String(rowId);
  }
  return `row-${page}-${index}`;
}
