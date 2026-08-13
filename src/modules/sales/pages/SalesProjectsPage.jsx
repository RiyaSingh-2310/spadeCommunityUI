import { useNavigate } from "react-router-dom";
import ModuleListingPage from "../../shared/components/ModuleListingPage";
import { useApiListing } from "../../shared/hooks/useApiListing";
import { useFlashMessage } from "../../shared/hooks/useFlashMessage";
import { useListingRefresh } from "../../shared/hooks/useListingRefresh";
import { DEFAULT_PAGE_SIZE } from "../../shared/utils/pagination";
import { getRecords } from "../../survey/services/surveyApi";

const LIST_COLUMNS = [
  "ID",
  "Project Name",
  "Client",
  "LOI",
  "IR",
  "Start Date",
  "End Date",
  "Status",
  "Action",
];

function SalesProjectsPage({ isDarkMode }) {
  const navigate = useNavigate();
  useFlashMessage();
  const {
    rows,
    totalRecords,
    isLoading,
    listError,
    currentPage,
    pageSize,
    handleSearch,
    handlePageChange,
    handlePageSizeChange,
    refresh: fetchProjects,
  } = useApiListing({ fetchFn: getRecords, initialPageSize: DEFAULT_PAGE_SIZE });
  useListingRefresh(fetchProjects);

  return (
    <ModuleListingPage
      isDarkMode={isDarkMode}
      title="Projects"
      searchPlaceholder="Search projects..."
      columns={LIST_COLUMNS}
      rows={rows}
      rowIdKey="recordId"
      actionVariant="view-edit"
      showDeleteAction={false}
      onView={(row) => {
        const id = row.recordId;
        if (id == null) return;
        navigate(`/sales/projects/view/${encodeURIComponent(id)}`);
      }}
      permissionModule="survey"
      isLoading={isLoading}
        errorMessage={listError}
        onRetry={fetchProjects}
      emptyMessage="No projects found"
      onSearch={handleSearch}
      totalRecords={totalRecords}
      serverPaginated
      serverSearch
      paginationPage={currentPage}
      onPaginationPageChange={handlePageChange}
      paginationPageSize={pageSize}
      onPaginationPageSizeChange={handlePageSizeChange}
      showPagination
      nowrapAllCells
    />
  );
}

export default SalesProjectsPage;
