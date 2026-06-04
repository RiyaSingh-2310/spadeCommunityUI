import { getPageNumbers } from "../../modules/shared/utils/pagination";

function AdminPagination({
  currentPage,
  totalPages,
  totalItems = 0,
  pageSize = 10,
  onPageChange,
  isDarkMode,
  /** When true, renders Previous | 1 | Next even with zero items. */
  showWhenEmpty = false,
}) {
  if (totalItems <= 0 && !showWhenEmpty) return null;

  const safeTotalPages = Math.max(1, totalPages);
  const safeCurrentPage = Math.min(Math.max(1, currentPage), safeTotalPages);
  const start = totalItems > 0 ? (safeCurrentPage - 1) * pageSize + 1 : 0;
  const end = totalItems > 0 ? Math.min(safeCurrentPage * pageSize, totalItems) : 0;
  const showControls = showWhenEmpty || safeTotalPages > 1;
  const pages = showWhenEmpty
    ? [1]
    : showControls
      ? getPageNumbers(safeCurrentPage, safeTotalPages)
      : [];
  const btnBase =
    "inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-sm font-semibold transition";
  const inactive = isDarkMode
    ? "border border-[#344662] text-[var(--admin-muted-foreground)] hover:bg-[#1f3047] hover:text-[var(--admin-foreground)]"
    : "border border-[#d8e3ef] text-[var(--admin-muted-foreground)] hover:bg-[#eef4fb] hover:text-[var(--admin-foreground)]";
  const active =
    "bg-[#10a950] text-white shadow-[0_4px_12px_rgba(16,169,80,0.25)]";
  const disabled =
    "cursor-not-allowed opacity-40 " +
    (isDarkMode
      ? "border border-[#344662] text-[var(--admin-subtle-foreground)]"
      : "border border-[#d8e3ef] text-[var(--admin-subtle-foreground)]");

  return (
    <nav
      className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"
      aria-label="Pagination"
    >
      <p className="admin-text-muted text-center text-sm sm:text-left">
        {totalItems > 0
          ? `Showing ${start}–${end} of ${totalItems}`
          : "No records to display"}
      </p>
      {showControls && (
      <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-end">
      <button
        type="button"
        disabled={safeCurrentPage <= 1}
        onClick={() => onPageChange(safeCurrentPage - 1)}
        className={`${btnBase} ${safeCurrentPage <= 1 ? disabled : inactive}`}
      >
        Previous
      </button>
      {pages.map((page) => (
        <button
          key={page}
          type="button"
          onClick={() => onPageChange(page)}
          className={`${btnBase} ${page === safeCurrentPage ? active : inactive}`}
          aria-current={page === safeCurrentPage ? "page" : undefined}
        >
          {page}
        </button>
      ))}
      <button
        type="button"
        disabled={safeCurrentPage >= safeTotalPages}
        onClick={() => onPageChange(safeCurrentPage + 1)}
        className={`${btnBase} ${safeCurrentPage >= safeTotalPages ? disabled : inactive}`}
      >
        Next
      </button>
      </div>
      )}
    </nav>
  );
}

export default AdminPagination;
