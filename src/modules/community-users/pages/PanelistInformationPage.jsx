import { useCallback } from "react";
import ModuleListingPage from "../../shared/components/ModuleListingPage";
import { useApiListing } from "../../shared/hooks/useApiListing";
import { DEFAULT_PAGE_SIZE } from "../../shared/utils/pagination";
import { getRecords } from "../services/communityUsersApi";

const LIST_COLUMNS = [
  "Panelist ID",
  "Name",
  "Email Address",
  "Created At",
  "IP Address",
  "Email Verified",
  "Questionnaire Completed",
  "Reward Points",
  "Joining Date",
  "Status",
];

function PanelistInformationPage({ isDarkMode }) {
  const fetchPanelists = useCallback(
    (params) => getRecords({ ...params, filters: {} }),
    []
  );

  const {
    rows,
    totalRecords,
    totalPages,
    isLoading,
    listError,
    currentPage,
    pageSize,
    handleSearch,
    handlePageChange,
    handlePageSizeChange,
    refresh,
  } = useApiListing({
    fetchFn: fetchPanelists,
    initialPageSize: DEFAULT_PAGE_SIZE,
  });

  return (
    <ModuleListingPage
      isDarkMode={isDarkMode}
      title="Panelist Information"
      breadcrumbs={[
        { label: "Panelists", to: "/community-users" },
        { label: "Panelist Information" },
      ]}
      searchPlaceholder="Search panelists..."
      columns={LIST_COLUMNS}
      rows={rows}
      rowIdKey="id"
      permissionModule="community_users"
      showStatus
      statusAsText
      isLoading={isLoading}
      errorMessage={listError}
      onRetry={refresh}
      emptyMessage="No panelists found"
      onSearch={handleSearch}
      totalRecords={totalRecords}
      paginationTotalPages={totalPages}
      serverPaginated
      serverSearch
      paginationPage={currentPage}
      onPaginationPageChange={handlePageChange}
      paginationPageSize={pageSize}
      onPaginationPageSizeChange={handlePageSizeChange}
      showPagination
      nowrapAllCells
      nameAsText
    />
  );
}

export default PanelistInformationPage;
