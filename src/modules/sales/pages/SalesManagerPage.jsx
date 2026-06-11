import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import DeleteConfirmModal from "../../../components/admin/DeleteConfirmModal";
import ModuleListingPage from "../../shared/components/ModuleListingPage";
import { useFlashMessage } from "../../shared/hooks/useFlashMessage";
import { DEFAULT_PAGE_SIZE } from "../../shared/utils/pagination";
import { isAuthenticated } from "../../../services/auth/authStorage";
import { toastApiError, toastApiSuccess } from "../../../services/toast/apiToast";
import {
  deleteSalesManager,
  getRecords,
  updateSalesManagerStatus,
} from "../../../services/sales/salesManagersApi";

const LIST_COLUMNS = ["S.No", "Name", "Email Address", "Status", "Action"];

function SalesManagerPage({ isDarkMode }) {
  const navigate = useNavigate();
  const location = useLocation();
  useFlashMessage();
  const [salesManagers, setSalesManagers] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchSalesManagers = useCallback(async () => {
    if (!isAuthenticated()) {
      setSalesManagers([]);
      setTotalRecords(0);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const data = await getRecords();
      setSalesManagers(data.items);
      setTotalRecords(data.total ?? data.count ?? data.items.length);
    } catch (error) {
      toastApiError(error);
      setSalesManagers([]);
      setTotalRecords(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSalesManagers();
  }, [fetchSalesManagers]);

  useEffect(() => {
    if (location.state?.refresh) {
      fetchSalesManagers();
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.state, location.pathname, navigate, fetchSalesManagers]);

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
      const data = await deleteSalesManager(deleteTarget.id);
      setDeleteTarget(null);
      toastApiSuccess(data);
      await fetchSalesManagers();
    } catch (error) {
      toastApiError(error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStatusToggle = async (row) => {
    if (!row?.id || statusUpdatingId != null) return;

    const nextStatus = row.status === "Active" ? "Inactive" : "Active";
    const previousStatus = row.status;
    setStatusUpdatingId(row.id);

    try {
      const data = await updateSalesManagerStatus(row.id, {
        status: nextStatus,
      });
      setSalesManagers((prev) =>
        prev.map((item) =>
          String(item.id) === String(row.id) ? { ...item, status: nextStatus } : item
        )
      );
      toastApiSuccess(data);
    } catch (error) {
      toastApiError(error);
      setSalesManagers((prev) =>
        prev.map((item) =>
          String(item.id) === String(row.id)
            ? { ...item, status: previousStatus }
            : item
        )
      );
    } finally {
      setStatusUpdatingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <ModuleListingPage
        isDarkMode={isDarkMode}
        title="Sales Manager"
        searchPlaceholder="Search sales managers..."
        actionLabel="Add Sales Manager"
        onActionClick={() => navigate("/sales/sales-manager/add")}
        columns={LIST_COLUMNS}
        rows={salesManagers}
        rowIdKey="id"
        editPath="/sales/sales-manager"
        permissionModule="sales_manager"
        searchFields={["name", "emailAddress", "code"]}
        isLoading={isLoading}
        emptyMessage="No sales managers found"
        onDelete={handleDeleteRequest}
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

export default SalesManagerPage;
