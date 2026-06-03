import { getPageNumbers } from "../../modules/shared/utils/pagination";

function AdminPagination({ currentPage, totalPages, onPageChange, isDarkMode }) {
  if (totalPages <= 1) return null;

  const pages = getPageNumbers(currentPage, totalPages);
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
      className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:justify-end"
      aria-label="Pagination"
    >
      <button
        type="button"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
        className={`${btnBase} ${currentPage <= 1 ? disabled : inactive}`}
      >
        Previous
      </button>
      {pages.map((page) => (
        <button
          key={page}
          type="button"
          onClick={() => onPageChange(page)}
          className={`${btnBase} ${page === currentPage ? active : inactive}`}
          aria-current={page === currentPage ? "page" : undefined}
        >
          {page}
        </button>
      ))}
      <button
        type="button"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className={`${btnBase} ${currentPage >= totalPages ? disabled : inactive}`}
      >
        Next
      </button>
    </nav>
  );
}

export default AdminPagination;
