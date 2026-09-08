import AdminPagination from "../../../../components/admin/AdminPagination";

/**
 * Builds the listing pagination footer element (or null).
 */
export function buildListingPaginationFooter({
  showPagination,
  isLoading,
  filteredLength,
  usesServerListing,
  totalRecords,
  isDarkMode,
  pagination,
  pageSize,
  handlePageChange,
  handlePageSizeChange,
}) {
  if (
    !showPagination ||
    isLoading ||
    !(filteredLength > 0 || (usesServerListing && (totalRecords ?? 0) > 0))
  ) {
    return null;
  }

  return (
    <AdminPagination
      isDarkMode={isDarkMode}
      currentPage={pagination.currentPage}
      totalPages={pagination.totalPages}
      totalItems={pagination.totalItems}
      pageSize={pageSize}
      onPageChange={handlePageChange}
      onPageSizeChange={handlePageSizeChange}
    />
  );
}
