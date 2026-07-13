import { useCallback, useMemo, useState } from "react";
import {
  applyNameColumnSort,
  cycleNameColumnSortMode,
  nameSortModeToColumnSort,
} from "../utils/nameColumnSort";

/**
 * Shared three-state name-column sorting for ModuleListingPage.
 *
 * Cycle: Default → Newest First (up arrow) → Alphabetical A–Z (down arrow) → Default
 *
 * @param {{
 *   rows: Array,
 *   columnLabel: string,
 *   getTextValue?: (row: object) => string,
 *   getNewestValue?: (row: object) => number|string,
 * }} options
 */
export function useNameColumnSort({
  rows,
  columnLabel,
  getTextValue,
  getNewestValue,
} = {}) {
  const [mode, setMode] = useState(null);

  const sortableColumns = useMemo(
    () => (columnLabel ? [columnLabel] : []),
    [columnLabel]
  );

  const columnSort = useMemo(
    () => nameSortModeToColumnSort(columnLabel, mode),
    [columnLabel, mode]
  );

  const onColumnSort = useCallback(
    (clickedColumn) => {
      if (!columnLabel || clickedColumn !== columnLabel) return;
      setMode((current) => cycleNameColumnSortMode(current));
    },
    [columnLabel]
  );

  const sortedRows = useMemo(() => {
    if (!columnLabel) return Array.isArray(rows) ? rows : [];
    return applyNameColumnSort(
      rows,
      mode ? { mode, column: columnLabel } : null,
      { getTextValue, getNewestValue }
    );
  }, [rows, mode, columnLabel, getTextValue, getNewestValue]);

  return {
    sortedRows,
    sortableColumns,
    columnSort,
    onColumnSort,
    sortMode: mode,
  };
}
