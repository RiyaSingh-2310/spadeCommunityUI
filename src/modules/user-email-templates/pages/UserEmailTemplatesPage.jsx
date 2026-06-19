import { useNavigate } from "react-router-dom";
import ModuleListingPage from "../../shared/components/ModuleListingPage";
import { useApiListing } from "../../shared/hooks/useApiListing";
import { useFlashMessage } from "../../shared/hooks/useFlashMessage";
import { useListingRefresh } from "../../shared/hooks/useListingRefresh";
import { DEFAULT_PAGE_SIZE } from "../../shared/utils/pagination";
import { getRecords } from "../services/userEmailTemplatesApi";

const LIST_COLUMNS = ["S.No", "Email Title", "Slug", "Action"];

function UserEmailTemplatesPage({ isDarkMode }) {
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

  return (
    <ModuleListingPage
      isDarkMode={isDarkMode}
      title="List User Email Templates"
      searchPlaceholder="Search email templates..."
      columns={LIST_COLUMNS}
      rows={rows}
      rowIdKey="id"
      permissionModule="user_email_templates"
      isLoading={isLoading}
      emptyMessage="No email templates found"
      showStatus={false}
      actionVariant="edit-only"
      showDeleteAction={false}
      onEdit={(row) =>
        navigate(`/user-email-templates/edit/${encodeURIComponent(String(row.id))}`)
      }
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

export default UserEmailTemplatesPage;
