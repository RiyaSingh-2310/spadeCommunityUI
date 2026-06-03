import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import DeleteConfirmModal from "../../components/admin/DeleteConfirmModal";
import FormErrorMessage from "../../components/admin/FormErrorMessage";
import FormFlashMessage from "../../components/admin/FormFlashMessage";
import ModuleListingPage from "../../modules/shared/components/ModuleListingPage";
import { useFlashMessage } from "../../modules/shared/hooks/useFlashMessage";
import { ApiError } from "../../services/api/ApiError";
import {
  deleteRecord,
  formStatusToApiStatus,
  getRecords,
  updateRecord,
} from "../../services/users/usersApi";

function UsersPage({ isDarkMode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { message: flashMessage, type: flashType, showFlash } = useFlashMessage();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setLoadError("");
    try {
      const data = await getRecords();
      setUsers(data.items);
    } catch (error) {
      const msg =
        error instanceof ApiError
          ? error.message
          : error?.message || "Failed to load users";
      setLoadError(msg);
      setUsers([]);
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
    setDeleteError("");
    setDeleteTarget(row);
  };

  const handleDeleteCancel = () => {
    if (isDeleting) return;
    setDeleteTarget(null);
    setDeleteError("");
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget?.id) return;

    setIsDeleting(true);
    setDeleteError("");
    try {
      const data = await deleteRecord(deleteTarget.id);
      setUsers((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      setDeleteTarget(null);
      showFlash(data.message, "success");
    } catch (error) {
      const msg =
        error instanceof ApiError
          ? error.message
          : error?.message || "Failed to delete user";
      setDeleteError(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStatusToggle = async (row) => {
    const nextStatus = row.status === "Active" ? "Inactive" : "Active";
    try {
      const data = await updateRecord(row.id, {
        name: row.name,
        permission_type: row.permission_type || "admin",
        status: formStatusToApiStatus(nextStatus),
      });
      setUsers((prev) =>
        prev.map((item) =>
          item.id === row.id ? { ...item, status: nextStatus } : item
        )
      );
      showFlash(data.message, "success");
    } catch (error) {
      const msg =
        error instanceof ApiError ? error.message : error?.message || "";
      showFlash(msg, "error");
    }
  };

  return (
    <div className="space-y-4">
      <FormFlashMessage message={flashMessage} type={flashType} />
      {loadError && <FormErrorMessage message={loadError} />}

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-16">
          <Loader2 size={24} className="animate-spin text-[var(--admin-success-text)]" />
          <span className="admin-text-muted text-sm">Loading users...</span>
        </div>
      ) : users.length === 0 && !loadError ? (
        <div className="admin-text-muted rounded-2xl border border-dashed border-[var(--admin-header-surface-border)] px-6 py-16 text-center text-sm">
          No users found.
        </div>
      ) : (
        <ModuleListingPage
          isDarkMode={isDarkMode}
          title="Admin Users"
          searchPlaceholder="Search users..."
          actionLabel="Add User"
          onActionClick={() => navigate("/users/add")}
          columns={["S.No", "Name", "Email", "Status", "Action"]}
          rows={users}
          rowIdKey="id"
          onEdit={(row) => navigate(`/users/edit/${row.id}`)}
          onDelete={handleDeleteRequest}
          onStatusToggle={handleStatusToggle}
          nowrapAllCells
        />
      )}

      <DeleteConfirmModal
        isOpen={Boolean(deleteTarget)}
        onCancel={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
        errorMessage={deleteError}
      />
    </div>
  );
}

export default UsersPage;
