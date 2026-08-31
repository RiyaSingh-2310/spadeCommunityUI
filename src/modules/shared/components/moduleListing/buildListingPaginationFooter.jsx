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
  normalizedQuery,
  pageSize,
  handlePageChange,
  handlePageSizeChange,
  visibleItemCountOverride = null,
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
      visibleItemCount={
        visibleItemCountOverride != null
          ? visibleItemCountOverride
          : totalRecords != null && (usesServerListing || !normalizedQuery)
          ? usesServerListing
            ? pagination.currentPage >= pagination.totalPages
              ? pagination.totalItems
              : Math.min(pagination.currentPage * pageSize, pagination.totalItems)
            : Math.min(
                (pagination.currentPage - 1) * pageSize + pagination.items.length,
                pagination.totalItems
              )
          : null
      }
      pageSize={pageSize}
      onPageChange={handlePageChange}
      onPageSizeChange={handlePageSizeChange}
    />
  );
}
