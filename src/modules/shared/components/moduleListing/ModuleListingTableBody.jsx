import { Fragment } from "react";
import { Minus, Plus } from "lucide-react";
import TableLoadingSkeleton from "../../../../components/admin/TableLoadingSkeleton";
import { getListingRowKey } from "./getListingRowKey";
import { ListingEmptyRow, ListingErrorRow } from "./ListingStateRows";
import ModuleListingDataCells from "./ModuleListingDataCells";

/**
 * Listing table body: loading, error+retry, empty, or data rows.
 */
function ModuleListingTableBody({
  isLoading,
  errorMessage,
  onRetry,
  emptyMessage,
  filteredLength,
  pagination,
  pageSize,
  getRowId,
  hasExpandColumn,
  expandedRowIds,
  toggleRowExpanded,
  getRowClassName,
  tableColumns,
  dataCellProps,
  renderExpandedContent,
}) {
  const colSpan = tableColumns.length + (hasExpandColumn ? 1 : 0);

  if (isLoading) {
    return (
      <TableLoadingSkeleton
        columns={hasExpandColumn ? ["", ...tableColumns] : tableColumns}
      />
    );
  }

  if (errorMessage) {
    return (
      <ListingErrorRow
        colSpan={colSpan}
        message={errorMessage}
        onRetry={onRetry}
      />
    );
  }

  if (filteredLength === 0) {
    return <ListingEmptyRow colSpan={colSpan} message={emptyMessage} />;
  }

  return pagination.items.map((row, idx) => {
    const globalIdx = (pagination.currentPage - 1) * pageSize + idx;
    const rowId = getRowId(row);
    const rowKey = getListingRowKey(rowId, pagination.currentPage, idx);
    const isExpanded = hasExpandColumn && expandedRowIds.has(String(rowId));
    const rowClassName =
      typeof getRowClassName === "function" ? getRowClassName(row, globalIdx) : "";

    return (
      <Fragment key={rowKey}>
        <tr
          className={`admin-table-row align-middle${rowClassName ? ` ${rowClassName}` : ""}`}
        >
          {hasExpandColumn && (
            <td className="px-3 py-3 align-middle whitespace-nowrap">
              <button
                type="button"
                onClick={() => toggleRowExpanded(rowId)}
                className={`inline-flex h-7 w-7 items-center justify-center rounded-full border transition hover:opacity-90 ${
                  isExpanded
                    ? "border-[var(--admin-danger-text)] text-[var(--admin-danger-text)]"
                    : "border-[var(--admin-primary-color)] text-[var(--admin-primary-color)]"
                }`}
                aria-label={isExpanded ? "Collapse row" : "Expand row"}
                aria-expanded={isExpanded}
              >
                {isExpanded ? (
                  <Minus size={14} strokeWidth={2.5} />
                ) : (
                  <Plus size={14} strokeWidth={2.5} />
                )}
              </button>
            </td>
          )}
          <ModuleListingDataCells
            row={row}
            globalIdx={globalIdx}
            tableColumns={tableColumns}
            rowId={rowId}
            {...dataCellProps}
          />
        </tr>
        {isExpanded && renderExpandedContent ? (
          <tr className="admin-table-row align-middle">
            <td colSpan={colSpan} className="p-0 align-top">
              <div className="admin-table-expanded-panel">
                {renderExpandedContent(row)}
              </div>
            </td>
          </tr>
        ) : null}
      </Fragment>
    );
  });
}

export default ModuleListingTableBody;
