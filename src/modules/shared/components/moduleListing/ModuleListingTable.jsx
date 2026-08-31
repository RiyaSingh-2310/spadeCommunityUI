import { Fragment } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import TableCard from "../../../../components/admin/TableCard";
import {
  isActionColumn,
  isCheckboxColumn,
  isStatusColumn,
  TABLE_HEAD_BASE,
} from "../../utils/tableHelpers";
import { toUiSentenceCase } from "../../utils/uiText";
import ModuleListingTableBody from "./ModuleListingTableBody";

function SortableHeader({ columnLabel, columnSort, onColumnSort }) {
  const isActive = columnSort?.column === columnLabel;
  const direction = columnSort?.direction;
  const upActive = isActive && direction === "asc";
  const downActive = isActive && direction === "desc";
  const displayLabel = toUiSentenceCase(columnLabel);
  return (
    <button
      type="button"
      onClick={() => onColumnSort?.(columnLabel)}
      className={`admin-table-sort-trigger inline-flex cursor-pointer items-center gap-1.5 transition hover:text-[var(--admin-foreground)] ${
        isActive ? "text-[var(--admin-primary-color)]" : ""
      }`}
      aria-label={`Sort by ${displayLabel}`}
    >
      <span>{displayLabel}</span>
      <span className="inline-flex flex-col leading-none" aria-hidden>
        <ArrowUp
          size={11}
          strokeWidth={2.5}
          className={upActive ? "text-[var(--admin-primary-color)]" : "opacity-35"}
        />
        <ArrowDown
          size={11}
          strokeWidth={2.5}
          className={`-mt-0.5 ${downActive ? "text-[var(--admin-primary-color)]" : "opacity-35"}`}
        />
      </span>
    </button>
  );
}

/**
 * Table card + header + body for ModuleListingPage.
 */
function ModuleListingTable({
  paginationFooter,
  compactTable,
  hasExpandColumn,
  tableColumns,
  statusColumnClass,
  sortableColumnSet,
  columnSort,
  onColumnSort,
  renderCheckboxHeader,
  bodyProps,
}) {
  return (
    <TableCard footer={paginationFooter} flush>
      <table
        className={`admin-table min-w-full text-sm${compactTable ? " admin-table-compact" : ""}`}
      >
        <thead>
          <tr className="admin-text-muted">
            {hasExpandColumn && (
              <th className={`${TABLE_HEAD_BASE} w-12 text-left`} aria-label="Expand row">
                <span className="sr-only">Expand</span>
              </th>
            )}
            {tableColumns.map((h) => {
              if (isCheckboxColumn(h)) {
                return <Fragment key="select-all">{renderCheckboxHeader()}</Fragment>;
              }
              return (
                <th
                  key={h}
                  className={`${TABLE_HEAD_BASE} ${
                    isStatusColumn(h) ? `admin-table-status-col ${statusColumnClass}` : ""
                  } ${isActionColumn(h) ? "admin-table-actions-col text-right" : "text-left"}`}
                >
                  {sortableColumnSet.has(h) && onColumnSort ? (
                    <SortableHeader
                      columnLabel={h}
                      columnSort={columnSort}
                      onColumnSort={onColumnSort}
                    />
                  ) : (
                    toUiSentenceCase(h)
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          <ModuleListingTableBody {...bodyProps} />
        </tbody>
      </table>
    </TableCard>
  );
}

export default ModuleListingTable;
