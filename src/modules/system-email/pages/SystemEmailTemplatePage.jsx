import { useNavigate } from "react-router-dom";
import ModuleListingPage from "../../shared/components/ModuleListingPage";
import { useApiListing } from "../../shared/hooks/useApiListing";
import { useFlashMessage } from "../../shared/hooks/useFlashMessage";
import { useListingRefresh } from "../../shared/hooks/useListingRefresh";
import { DEFAULT_PAGE_SIZE } from "../../shared/utils/pagination";
import { getRecords } from "../services/systemEmailsApi";

function SystemEmailTemplatePage({ isDarkMode }) {
  const navigate = useNavigate();
  useFlashMessage();

  const {
    rows,
    totalRecords,
    isLoading,
    currentPage,
    pageSize,
    handleSearch,
    handlePageChange,
    handlePageSizeChange,
    refresh,
  } = useApiListing({ fetchFn: getRecords, initialPageSize: DEFAULT_PAGE_SIZE });
  useListingRefresh(refresh);

  const handleEdit = (row) => {
    navigate(`/system-email/edit/${encodeURIComponent(String(row.id))}`);
  };

  return (
    <ModuleListingPage
      isDarkMode={isDarkMode}
      title="System Email Template"
      searchPlaceholder="Search email templates..."
      columns={["S.No", "Title", "Action"]}
      rows={rows}
      showStatus={false}
      actionVariant="edit-only"
      showDeleteAction={false}
      onEdit={handleEdit}
      rowIdKey="id"
      permissionModule="system_email_templates"
      isLoading={isLoading}
      emptyMessage="No system email templates found"
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

export default SystemEmailTemplatePage;
