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
  getRecords,
  updateClientStatus,
} from "../../services/clients/clientsApi";

const LIST_COLUMNS = [
  "S.No",
  "Client Code",
  "Name",
  "Email Address",
  "Country",
  "Contact Number",
  "Website URL",
  "Status",
  "Action",
];

function ClientsPage({ isDarkMode }) {
  const navigate = useNavigate();
  useFlashMessage();
  const {
    rows: clients,
    totalRecords,
    isLoading,
    currentPage,
    pageSize,
    handleSearch,
    handlePageChange,
    handlePageSizeChange,
    refresh: fetchClients,
  } = useApiListing({ fetchFn: getRecords, initialPageSize: DEFAULT_PAGE_SIZE });
  useListingRefresh(fetchClients);
  const { sortedRows, sortableColumns, columnSort, onColumnSort } = useNameColumnSort({
    rows: clients,
    columnLabel: "Name",
  });

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);

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
      await fetchClients();
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
      const data = await updateClientStatus(row.id, {
        name: row.name,
        status: nextStatus,
        country: row.countryValue ?? row.country,
        contactNumber: row.contactNumber,
      });
      toastApiSuccess(data);
      await fetchClients();
    } catch (error) {
      toastApiError(error);
    } finally {
      setStatusUpdatingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <ModuleListingPage
        isDarkMode={isDarkMode}
        title="Client List"
        searchPlaceholder="Search clients..."
        actionLabel="Add Client User"
        onActionClick={() => navigate("/clients/add")}
        columns={LIST_COLUMNS}
        rows={sortedRows}
        sortableColumns={sortableColumns}
        columnSort={columnSort}
        onColumnSort={onColumnSort}
        rowIdKey="id"
        editPath="/clients"
        onDelete={handleDeleteRequest}
        isLoading={isLoading}
        emptyMessage="No clients found"
        onStatusToggle={handleStatusToggle}
        permissionModule="clients"
        nameAsText
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

export default ClientsPage;
