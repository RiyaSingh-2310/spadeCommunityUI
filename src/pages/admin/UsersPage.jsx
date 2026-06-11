import { useCallback, useEffect, useRef, useState } from "react";
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
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const fetchRequestIdRef = useRef(0);

  const fetchUsers = useCallback(async () => {
    const requestId = ++fetchRequestIdRef.current;
    setIsLoading(true);

    try {
      const data = await getRecords({ page: currentPage, limit: pageSize });

      if (requestId !== fetchRequestIdRef.current) {
        return;
      }

      const total = data.total ?? data.count ?? 0;
      const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);

      if (data.items.length === 0 && currentPage > 1 && total > 0) {
        setCurrentPage((prev) => Math.max(1, Math.min(prev, totalPages) - 1));
        return;
      }

      setUsers(data.items);
      setTotalRecords(total);

      if (currentPage > totalPages) {
        setCurrentPage(totalPages);
      }
    } catch (error) {
      if (requestId !== fetchRequestIdRef.current) {
        return;
      }
      toastApiError(error);
      setUsers([]);
      setTotalRecords(0);
    } finally {
      if (requestId === fetchRequestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [currentPage, pageSize]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    if (location.state?.refresh) {
      fetchUsers();
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.state, location.pathname, navigate, fetchUsers]);

  const handlePageChange = useCallback(
    (nextPage) => {
      const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize) || 1);
      if (nextPage < 1 || nextPage > totalPages || nextPage === currentPage) {
        return;
      }
      setCurrentPage(nextPage);
    },
    [currentPage, pageSize, totalRecords]
  );

  const handlePageSizeChange = useCallback((nextSize) => {
    const safeSize = Number(nextSize);
    if (!Number.isFinite(safeSize) || safeSize <= 0) return;
    setPageSize(safeSize);
    setCurrentPage(1);
  }, []);

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
        serverPaginated
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
