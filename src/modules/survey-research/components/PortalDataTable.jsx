import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";

function SortIcon({ active, direction }) {
  if (!active) return <ArrowUpDown size={14} className="opacity-50" />;
  return direction === "asc" ? <ArrowUp size={14} /> : <ArrowDown size={14} />;
}

function PortalDataTable({
  columns,
  rows,
  sort,
  onSort,
  emptyMessage = "No records found.",
  isLoading = false,
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
  onPageSizeChange,
  renderActions,
}) {
  if (isLoading) {
    return (
      <div className="srp-card p-10 text-center text-sm" style={{ color: "var(--srp-text-muted)" }}>
        Loading records...
      </div>
    );
  }

  return (
    <div className="srp-card overflow-hidden">
      <div className="srp-table-wrap">
        <table className="srp-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key}>
                  {column.sortable ? (
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5"
                      onClick={() => onSort(column.key)}
                    >
                      {column.label}
                      <SortIcon
                        active={sort.key === column.key}
                        direction={sort.key === column.key ? sort.direction : "asc"}
                      />
                    </button>
                  ) : (
                    column.label
                  )}
                </th>
              ))}
              {renderActions ? <th className="text-right">Actions</th> : null}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (renderActions ? 1 : 0)}
                  className="py-14 text-center text-sm"
                  style={{ color: "var(--srp-text-muted)" }}
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id}>
                  {columns.map((column) => (
                    <td key={column.key}>
                      {column.render ? column.render(row) : row[column.key] ?? "—"}
                    </td>
                  ))}
                  {renderActions ? (
                    <td className="text-right whitespace-nowrap">{renderActions(row)}</td>
                  ) : null}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {total > 0 ? (
        <div
          className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
          style={{ borderColor: "var(--srp-border)" }}
        >
          <p className="text-sm" style={{ color: "var(--srp-text-muted)" }}>
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <select
              className="rounded-lg border px-2 py-1.5 text-sm"
              style={{ borderColor: "var(--srp-border)", background: "var(--srp-surface)" }}
              value={pageSize}
              onChange={(event) => onPageSizeChange(Number(event.target.value))}
            >
              {[5, 10, 20].map((size) => (
                <option key={size} value={size}>
                  {size} / page
                </option>
              ))}
            </select>
            <button
              type="button"
              className="srp-btn-ghost !px-2"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-medium">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              className="srp-btn-ghost !px-2"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default PortalDataTable;
