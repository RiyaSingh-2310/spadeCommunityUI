import SearchableSelect from "./SearchableSelect";
import {
  getVisibleEntryCount,
  PAGE_SIZE_OPTIONS,
} from "../../modules/shared/utils/pagination";

function AdminPagination({
  currentPage,
  totalPages,
  totalItems = 0,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  /** Override visible count in summary (e.g. cumulative records through current page). */
  visibleItemCount = null,
  /** When true, renders controls even with zero items. */
  showWhenEmpty = false,
  pageSizeOptions = PAGE_SIZE_OPTIONS,
}) {
  if (totalItems <= 0 && !showWhenEmpty) return null;

  const safeTotalPages = Math.max(1, totalPages);
  const safeCurrentPage = Math.min(Math.max(1, currentPage), safeTotalPages);
  const visibleCount =
    visibleItemCount != null
      ? visibleItemCount
      : getVisibleEntryCount(safeCurrentPage, pageSize, totalItems);
  const showPageSizeSelector = Boolean(onPageSizeChange);

  const btnBase =
    "inline-flex h-9 min-w-[2.75rem] cursor-pointer items-center justify-center rounded-full px-4 text-sm font-semibold transition-colors duration-150";
  const inactive =
    "border border-[var(--admin-input-border)] bg-[var(--admin-surface-bg)] text-[var(--admin-muted-foreground)] hover:bg-[var(--admin-table-row-hover)] hover:text-[var(--admin-foreground)]";
  const active =
    "min-w-[2.75rem] cursor-pointer rounded-full bg-[var(--admin-primary-color)] px-4 text-sm font-semibold text-white shadow-[var(--admin-pagination-active-shadow)] inline-flex h-9 items-center justify-center";
  const disabled =
    "cursor-not-allowed opacity-45 border border-[var(--admin-input-border)] bg-[var(--admin-surface-bg)] text-[var(--admin-subtle-foreground)]";

  const selectClass =
    "h-9 appearance-none rounded-full border border-[var(--admin-input-border)] bg-[var(--admin-surface-bg)] pl-3 pr-8 text-sm font-semibold text-[var(--admin-foreground)] outline-none focus:border-[var(--admin-primary-color)] focus:shadow-[0_0_0_3px_var(--admin-input-focus-ring)]";

  const handlePageSizeChange = (nextValue) => {
    const nextSize = Number(nextValue);
    if (!Number.isFinite(nextSize) || nextSize <= 0) return;
    onPageSizeChange?.(nextSize);
  };

  return (
    <nav
      className="mt-4 grid grid-cols-1 items-center gap-4 border-t border-[var(--admin-header-surface-border)] pt-4 sm:grid-cols-[1fr_auto_1fr]"
      aria-label="Pagination"
    >
      {showPageSizeSelector ? (
        <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
          <span className="admin-text-muted text-sm font-medium">Show</span>
          <SearchableSelect
            value={String(pageSize)}
            onChange={handlePageSizeChange}
            options={pageSizeOptions}
            inputClass={selectClass}
            searchable={false}
            aria-label="Entries per page"
          />
          <span className="admin-text-muted text-sm font-medium">Entries</span>
        </div>
      ) : (
        <div className="hidden sm:block" aria-hidden />
      )}

      <p className="admin-text-muted text-center text-sm font-medium whitespace-nowrap">
        {totalItems > 0
          ? `Showing ${visibleCount} of ${totalItems} Entries`
          : "Showing 0 of 0 Entries"}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-end">
        <button
          type="button"
          disabled={safeCurrentPage <= 1}
          onClick={() => onPageChange(safeCurrentPage - 1)}
          className={`${btnBase} ${safeCurrentPage <= 1 ? disabled : inactive}`}
        >
          Previous
        </button>
        <span
          className={active}
          aria-current="page"
          aria-label={`Page ${safeCurrentPage}`}
        >
          {safeCurrentPage}
        </span>
        <button
          type="button"
          disabled={safeCurrentPage >= safeTotalPages || totalItems <= 0}
          onClick={() => onPageChange(safeCurrentPage + 1)}
          className={`${btnBase} ${
            safeCurrentPage >= safeTotalPages || totalItems <= 0 ? disabled : inactive
          }`}
        >
          Next
        </button>
      </div>
    </nav>
  );
}

export default AdminPagination;
