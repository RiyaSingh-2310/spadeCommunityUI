import { Trash2 } from "lucide-react";
import { TABLE_HEAD_BASE } from "../../utils/tableHelpers";

export function createListingCheckboxRenderers({
  hideSelectAllCheckbox,
  allVisibleSelected,
  someVisibleSelected,
  handleToggleAllVisible,
  visibleRowIds,
  isLoading,
  onBulkDeleteRequest,
  selectedRowIds,
  isDeleting,
  handleToggleRowSelection,
}) {
  const renderCheckboxHeader = () => (
    <th className={`${TABLE_HEAD_BASE} text-left`}>
      {hideSelectAllCheckbox ? (
        <span className="sr-only">Select</span>
      ) : (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            className="admin-checkbox"
            checked={allVisibleSelected}
            ref={(el) => {
              if (el) el.indeterminate = someVisibleSelected;
            }}
            onChange={(event) => handleToggleAllVisible(event.target.checked)}
            disabled={visibleRowIds.length === 0 || isLoading}
            aria-label="Select all rows"
          />
          {onBulkDeleteRequest && (selectedRowIds?.size ?? 0) > 0 && (
            <button
              type="button"
              onClick={onBulkDeleteRequest}
              disabled={isLoading || isDeleting}
              className="inline-flex items-center justify-center rounded-md p-1 text-[var(--admin-danger-text)] transition-colors hover:bg-[var(--admin-danger-text)]/10 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Delete selected rows"
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      )}
    </th>
  );

  const renderCheckboxCell = (rowId) => (
    <td className="px-4 py-3 align-middle whitespace-nowrap">
      <input
        type="checkbox"
        className="admin-checkbox"
        checked={selectedRowIds?.has(String(rowId)) ?? false}
        onChange={() => handleToggleRowSelection(rowId)}
        aria-label="Select row"
      />
    </td>
  );

  return { renderCheckboxHeader, renderCheckboxCell };
}
