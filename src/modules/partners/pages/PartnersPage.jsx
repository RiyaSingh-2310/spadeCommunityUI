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
  clearPartnerDetailCache,
  deleteRecord,
  getRecords,
  updatePartnerStatus,
} from "../../../services/partners/partnersApi";
import PartnerExpandableDetails from "../components/PartnerExpandableDetails";

const LIST_COLUMNS = [
  "S.No",
  "Partner Code",
  "Name",
  "Email Address",
  "Country",
  "Contact Number",
  "Website URL",
  "Created Date",
  "Status",
  "Action",
];

function PartnersPage({ isDarkMode }) {
  const navigate = useNavigate();
  useFlashMessage();

  const fetchPartners = useCallback(async (params) => {
    clearPartnerDetailCache();
    return getRecords(params);
  }, []);

  const {
    rows: partners,
    totalRecords,
    isLoading,
    currentPage,
    pageSize,
    handleSearch,
    handlePageChange,
    handlePageSizeChange,
    refresh: refreshPartners,
  } = useApiListing({ fetchFn: fetchPartners, initialPageSize: DEFAULT_PAGE_SIZE });
  useListingRefresh(refreshPartners);
  const { sortedRows, sortableColumns, columnSort, onColumnSort } = useNameColumnSort({
    rows: partners,
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
      await refreshPartners();
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
      const data = await updatePartnerStatus(row.id, {
        name: row.name,
        status: nextStatus,
      });
      toastApiSuccess(data);
      await refreshPartners();
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
        title="Partners"
        searchPlaceholder="Search partners..."
        actionLabel="Add Partner"
        onActionClick={() => navigate("/partners/add")}
        columns={LIST_COLUMNS}
        rows={sortedRows}
        sortableColumns={sortableColumns}
        columnSort={columnSort}
        onColumnSort={onColumnSort}
        rowIdKey="id"
        editPath="/partners"
        permissionModule="partners"
        nameAsText
        isLoading={isLoading}
        emptyMessage="No partners found"
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
        renderExpandedContent={(row) => (
          <PartnerExpandableDetails partnerId={row.id} isDarkMode={isDarkMode} />
        )}
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

export default PartnersPage;
