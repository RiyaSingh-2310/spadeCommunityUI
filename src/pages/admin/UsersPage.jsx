import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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

const LIST_COLUMNS = [
  "ID",
  "Profile Image",
  "Name",
  "Email Address",
  "Status",
  "Action",
];

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
      const msg = error instanceof ApiError ? error.message : error?.message || "";
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
      setDeleteTarget(null);
      showFlash(data.message, "success");
      await fetchUsers();
    } catch (error) {
      const msg = error instanceof ApiError ? error.message : error?.message || "";
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
      showFlash(data.message, "success");
      await fetchUsers();
    } catch (error) {
      const msg = error instanceof ApiError ? error.message : error?.message || "";
      showFlash(msg, "error");
    }
  };

  return (
    <div className="space-y-4">
      <FormFlashMessage message={flashMessage} type={flashType} />
      {loadError && <FormErrorMessage message={loadError} />}

      <ModuleListingPage
        isDarkMode={isDarkMode}
        title="Admin Users"
        searchPlaceholder="Search by name or email..."
        actionLabel="Add User"
        onActionClick={() => navigate("/users/add")}
        columns={LIST_COLUMNS}
        rows={users}
        rowIdKey="id"
        searchFields={["name", "email"]}
        isLoading={isLoading}
        loadingMessage="Loading Admin Users..."
        emptyMessage="No Admin Users Found"
        onEdit={(row) => navigate(`/users/edit/${row.id}`)}
        onDelete={handleDeleteRequest}
        onStatusToggle={handleStatusToggle}
        nowrapAllCells
      />

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
