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
  isDarkMode,
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
    "inline-flex h-9 min-w-[2.75rem] items-center justify-center rounded-full px-4 text-sm font-semibold transition";
  const inactive = isDarkMode
    ? "border border-[#344662] bg-[#131f31] text-[var(--admin-muted-foreground)] hover:bg-[#1f3047] hover:text-[var(--admin-foreground)]"
    : "border border-[#d8e3ef] bg-white text-[var(--admin-muted-foreground)] hover:bg-[#eef4fb] hover:text-[var(--admin-foreground)]";
  const active =
    "min-w-[2.75rem] rounded-full bg-[#10a950] px-4 text-sm font-semibold text-white shadow-[0_4px_12px_rgba(16,169,80,0.25)] inline-flex h-9 items-center justify-center";
  const disabled =
    "cursor-not-allowed opacity-45 " +
    (isDarkMode
      ? "border border-[#344662] bg-[#131f31] text-[var(--admin-subtle-foreground)]"
      : "border border-[#d8e3ef] bg-white text-[var(--admin-subtle-foreground)]");

  const selectClass = isDarkMode
    ? "h-9 appearance-none rounded-full border border-[#344662] bg-[#131f31] pl-3 pr-8 text-sm font-semibold text-[var(--admin-foreground)] outline-none focus:border-[#10a950]"
    : "h-9 appearance-none rounded-full border border-[#d8e3ef] bg-white pl-3 pr-8 text-sm font-semibold text-[var(--admin-foreground)] outline-none focus:border-[#10a950]";

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
          <span className="admin-text-muted text-sm">Show</span>
          <SearchableSelect
            value={String(pageSize)}
            onChange={handlePageSizeChange}
            options={pageSizeOptions}
            inputClass={selectClass}
            searchable={false}
            aria-label="Entries per page"
          />
          <span className="admin-text-muted text-sm">Entries</span>
        </div>
      ) : (
        <div className="hidden sm:block" aria-hidden />
      )}

      <p className="admin-text-muted text-center text-sm whitespace-nowrap">
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
