import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DeleteConfirmModal from "../../components/admin/DeleteConfirmModal";
import ModuleListingPage from "../../modules/shared/components/ModuleListingPage";
import { useApiListing } from "../../modules/shared/hooks/useApiListing";
import { useFlashMessage } from "../../modules/shared/hooks/useFlashMessage";
import { useListingRefresh } from "../../modules/shared/hooks/useListingRefresh";
import { useNameColumnSort } from "../../modules/shared/hooks/useNameColumnSort";
import { DEFAULT_PAGE_SIZE } from "../../modules/shared/utils/pagination";
import { toastApiError, toastApiSuccess } from "../../services/toast/apiToast";
import {
  deleteRecord,
  formStatusToApiStatus,
  getRecords,
  updateRecord,
} from "../../services/users/usersApi";

const LIST_COLUMNS = [
  "ID",
  "Name",
  "Email Address",
  "Status",
  "Action",
];

function UsersPage({ isDarkMode }) {
  const navigate = useNavigate();
  useFlashMessage();
  const {
    rows: users,
    totalRecords,
    isLoading,
    currentPage,
    pageSize,
    handleSearch,
    handlePageChange,
    handlePageSizeChange,
    refresh: fetchUsers,
  } = useApiListing({ fetchFn: getRecords, initialPageSize: DEFAULT_PAGE_SIZE });
  useListingRefresh(fetchUsers);
  const { sortedRows, sortableColumns, columnSort, onColumnSort } = useNameColumnSort({
    rows: users,
    columnLabel: "Name",
  });

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteRequest = (row) => {
    setDeleteTarget(row);
  };

  const handleDeleteCancel = () => {
    if (isDeleting) return;
    setDeleteTarget(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget?.id) return;

    setIsDeleting(true);
    try {
      const data = await deleteRecord(deleteTarget.id);
      setDeleteTarget(null);
      toastApiSuccess(data);
      await fetchUsers();
    } catch (error) {
      toastApiError(error);
    } finally {
      setIsDeleting(false);
    }
  };

  const navigateToUserEdit = (row) => {
    const userId = row?.id ?? row?.admin_id;
    if (userId == null || String(userId).trim() === "") {
      return;
    }
    navigate(`/users/edit/${encodeURIComponent(String(userId))}`);
  };

  const handleStatusToggle = async (row) => {
    const nextStatus = row.status === "Active" ? "Inactive" : "Active";
    try {
      const data = await updateRecord(row.id, {
        name: row.name,
        permission_type: row.permission_type || "user",
        status: formStatusToApiStatus(nextStatus),
        permissions: row.permissions,
      });
      toastApiSuccess(data);
      await fetchUsers();
    } catch (error) {
      toastApiError(error);
    }
  };

  const navigateToUserPermissions = (row) => {
    const userId = row?.id ?? row?.admin_id;
    if (userId == null || String(userId).trim() === "") return;
    navigate(`/users/${encodeURIComponent(String(userId))}/permissions`);
  };

  return (
    <div className="space-y-4">
      <ModuleListingPage
        isDarkMode={isDarkMode}
        title="Admin Users"
        searchPlaceholder="Search by name or email..."
        actionLabel="Add User"
        onActionClick={() => navigate("/users/add")}
        columns={LIST_COLUMNS}
        rows={sortedRows}
        sortableColumns={sortableColumns}
        columnSort={columnSort}
        onColumnSort={onColumnSort}
        rowIdKey="id"
        permissionModule="users"
        actionVariant="user-management"
        isLoading={isLoading}
        emptyMessage="No Admin Users Found"
        onEdit={navigateToUserEdit}
        onDelete={handleDeleteRequest}
        onManagePermissions={navigateToUserPermissions}
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
        nowrapAllCells
      />

      <DeleteConfirmModal
        isOpen={Boolean(deleteTarget)}
        onCancel={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />
    </div>
  );
}

export default UsersPage;
