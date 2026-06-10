import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import DeleteConfirmModal from "../../components/admin/DeleteConfirmModal";
import ModuleListingPage from "../../modules/shared/components/ModuleListingPage";
import { useFlashMessage } from "../../modules/shared/hooks/useFlashMessage";
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
  const location = useLocation();
  useFlashMessage();
  const [users, setUsers] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getRecords();
      setUsers(data.items);
      setTotalRecords(data.total ?? data.count ?? data.items.length);
    } catch (error) {
      toastApiError(error);
      setUsers([]);
      setTotalRecords(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    if (location.state?.refresh) {
      fetchUsers();
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.state, location.pathname, navigate, fetchUsers]);

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
        rows={users}
        rowIdKey="id"
        permissionModule="users"
        actionVariant="user-management"
        searchFields={["name", "email", "emailAddress"]}
        isLoading={isLoading}
        emptyMessage="No Admin Users Found"
        onEdit={navigateToUserEdit}
        onDelete={handleDeleteRequest}
        onManagePermissions={navigateToUserPermissions}
        onStatusToggle={handleStatusToggle}
        totalRecords={totalRecords}
        pageSize={DEFAULT_PAGE_SIZE}
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
