import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import DeleteConfirmModal from "../../../components/admin/DeleteConfirmModal";
import ModuleListingPage from "../../shared/components/ModuleListingPage";
import { useApiListing } from "../../shared/hooks/useApiListing";
import { useFlashMessage } from "../../shared/hooks/useFlashMessage";
import { useListingRefresh } from "../../shared/hooks/useListingRefresh";
import { useNameColumnSort } from "../../shared/hooks/useNameColumnSort";
import { DEFAULT_PAGE_SIZE } from "../../shared/utils/pagination";
import { toastApiError, toastApiSuccess } from "../../../services/toast/apiToast";
import {
  deleteRecord,
  getRecords,
  updateStatus,
} from "../services/userEmailTemplatesApi";

const LIST_COLUMNS = ["ID", "Email Template", "Slug", "Description", "Status", "Action"];

function UserEmailTemplatesPage({ isDarkMode }) {
  const navigate = useNavigate();
  useFlashMessage();

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);

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
    refresh,
  } = useApiListing({ fetchFn: getRecords, initialPageSize: DEFAULT_PAGE_SIZE });
  useListingRefresh(refresh);
  const { sortedRows, sortableColumns, columnSort, onColumnSort } = useNameColumnSort({
    rows,
    columnLabel: "Email Template",
  });

  const handleDeleteRequest = useCallback((row) => {
    setDeleteTarget(row);
  }, []);

  const handleDeleteCancel = useCallback(() => {
    if (isDeleting) return;
    setDeleteTarget(null);
  }, [isDeleting]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget?.id) return;

    setIsDeleting(true);
    try {
      const data = await deleteRecord(deleteTarget.id);
      setDeleteTarget(null);
      toastApiSuccess(data);
      await refresh();
    } catch (error) {
      toastApiError(error);
    } finally {
      setIsDeleting(false);
    }
  }, [deleteTarget, refresh]);

  const handleStatusToggle = useCallback(
    async (row) => {
      if (!row?.id || statusUpdatingId != null) return;

      const nextStatus = row.status === "Active" ? "Inactive" : "Active";
      setStatusUpdatingId(row.id);

      try {
        const data = await updateStatus(row.id, { status: nextStatus });
        toastApiSuccess(data);
        await refresh();
      } catch (error) {
        toastApiError(error);
      } finally {
        setStatusUpdatingId(null);
      }
    },
    [statusUpdatingId, refresh]
  );

  return (
    <div className="space-y-4">
      <ModuleListingPage
        isDarkMode={isDarkMode}
        title="List User Email Templates"
        searchPlaceholder="Search email templates..."
        actionLabel="+ Add User Email Template"
        onActionClick={() => navigate("/user-email-templates/add")}
        columns={LIST_COLUMNS}
        rows={sortedRows}
        sortableColumns={sortableColumns}
        columnSort={columnSort}
        onColumnSort={onColumnSort}
        rowIdKey="id"
        permissionModule="user_email_templates"
        isLoading={isLoading}
        errorMessage={listError}
        onRetry={refresh}
        emptyMessage="No email templates found"
        onEdit={(row) =>
          navigate(`/user-email-templates/edit/${encodeURIComponent(String(row.id))}`)
        }
        onDelete={handleDeleteRequest}
        onStatusToggle={handleStatusToggle}
        onSearch={handleSearch}
        totalRecords={totalRecords}
        serverPaginated
        serverSearch
        paginationPage={currentPage}
        onPaginationPageChange={handlePageChange}
        paginationPageSize={pageSize}
        onPaginationPageSizeChange={handlePageSizeChange}
        showPagination
        descriptionMaxLines={2}
      />

      <DeleteConfirmModal
        isOpen={Boolean(deleteTarget)}
        onCancel={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
        title="Delete Email Template"
        message="Are you sure you want to delete this email template?"
      />
    </div>
  );
}

export default UserEmailTemplatesPage;
