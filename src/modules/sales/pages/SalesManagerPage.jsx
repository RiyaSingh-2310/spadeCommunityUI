import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import DeleteConfirmModal from "../../../components/admin/DeleteConfirmModal";
import ModuleListingPage from "../../shared/components/ModuleListingPage";
import { useApiListing } from "../../shared/hooks/useApiListing";
import { useCsvExport } from "../../shared/hooks/useCsvExport";
import { useFlashMessage } from "../../shared/hooks/useFlashMessage";
import { useListingRefresh } from "../../shared/hooks/useListingRefresh";
import { useNameColumnSort } from "../../shared/hooks/useNameColumnSort";
import { DEFAULT_PAGE_SIZE } from "../../shared/utils/pagination";
import { isAuthenticated } from "../../../services/auth/authStorage";
import { toastApiError, toastApiSuccess } from "../../../services/toast/apiToast";
import {
  deleteSalesManager,
  exportSalesManagersCsv,
  getRecords,
  updateSalesManagerStatus,
} from "../../../services/sales/salesManagersApi";

const LIST_COLUMNS = ["S.No", "Name", "Email Address", "Status", "Action"];

function SalesManagerPage({ isDarkMode }) {
  const navigate = useNavigate();
  useFlashMessage();

  const fetchSalesManagers = useCallback(async (params) => {
    if (!isAuthenticated()) {
      return { items: [], total: 0 };
    }
    return getRecords(params);
  }, []);

  const {
    rows: salesManagers,
    totalRecords,
    isLoading,
    listError,
    currentPage,
    pageSize,
    handleSearch,
    handlePageChange,
    handlePageSizeChange,
    refresh: refreshSalesManagers,
  } = useApiListing({ fetchFn: fetchSalesManagers, initialPageSize: DEFAULT_PAGE_SIZE });
  useListingRefresh(refreshSalesManagers);
  const { sortedRows, sortableColumns, columnSort, onColumnSort } = useNameColumnSort({
    rows: salesManagers,
    columnLabel: "Name",
  });

  const [statusUpdatingId, setStatusUpdatingId] = useState(null);
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
      const data = await deleteSalesManager(deleteTarget.id);
      setDeleteTarget(null);
      toastApiSuccess(data);
      await refreshSalesManagers();
    } catch (error) {
      toastApiError(error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStatusToggle = async (row) => {
    if (!row?.id || statusUpdatingId != null) return;

    const nextStatus = row.status === "Active" ? "Inactive" : "Active";
    setStatusUpdatingId(row.id);

    try {
      const data = await updateSalesManagerStatus(row.id, {
        status: nextStatus,
      });
      toastApiSuccess(data);
      await refreshSalesManagers();
    } catch (error) {
      toastApiError(error);
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const exportCsv = useCallback(() => exportSalesManagersCsv(), []);
  const { isExporting, downloadCsv } = useCsvExport(exportCsv);

  return (
    <div className="space-y-4">
      <ModuleListingPage
        isDarkMode={isDarkMode}
        title="Sales Manager"
        searchPlaceholder="Search sales managers..."
        actionLabel="Add Sales Manager"
        onActionClick={() => navigate("/sales/sales-manager/add")}
        csvExportLabel="Download CSV"
        onCsvExportClick={downloadCsv}
        isCsvExporting={isExporting}
        columns={LIST_COLUMNS}
        rows={sortedRows}
        sortableColumns={sortableColumns}
        columnSort={columnSort}
        onColumnSort={onColumnSort}
        rowIdKey="id"
        editPath="/sales/sales-manager"
        permissionModule="sales_manager"
        isLoading={isLoading}
        errorMessage={listError}
        onRetry={refreshSalesManagers}
        emptyMessage="No sales managers found"
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
