import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DeleteConfirmModal from "../../../components/admin/DeleteConfirmModal";
import ModuleListingPage from "../../shared/components/ModuleListingPage";
import { useApiListing } from "../../shared/hooks/useApiListing";
import { useFlashMessage } from "../../shared/hooks/useFlashMessage";
import { useListingRefresh } from "../../shared/hooks/useListingRefresh";
import { DEFAULT_PAGE_SIZE } from "../../shared/utils/pagination";
import {
  deleteRecord,
  listPrescreenRecords,
  updatePrescreenStatus,
} from "../../../services/prescreen/prescreenQuestionnairesApi";
import { toastApiError, toastApiSuccess } from "../../../services/toast/apiToast";

const LIST_COLUMNS = ["S.No", "Title", "Language", "Right Answer", "Status", "Action"];

function PrescreenPage({ isDarkMode }) {
  const navigate = useNavigate();
  useFlashMessage();
  const {
    rows,
    totalRecords,
    isLoading,
    currentPage,
    pageSize,
    handleSearch,
    handlePageChange,
    handlePageSizeChange,
    refresh: fetchPrescreens,
  } = useApiListing({
    fetchFn: listPrescreenRecords,
    initialPageSize: DEFAULT_PAGE_SIZE,
    preserveRowOrder: true,
  });
  useListingRefresh(fetchPrescreens);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);

  const handleEdit = (row) => {
    if (!row?.id) return;
    navigate(`/prescreen/edit/${encodeURIComponent(row.id)}`);
  };

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
      await fetchPrescreens();
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
      const data = await updatePrescreenStatus(row.id, nextStatus);
      toastApiSuccess(data);
      await fetchPrescreens();
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
        title="Question Library"
        searchPlaceholder="Search questions..."
        actionLabel="Add Question"
        onActionClick={() => navigate("/prescreen/add")}
        columns={LIST_COLUMNS}
        rows={rows}
        rowIdKey="id"
        onEdit={handleEdit}
        onDelete={handleDeleteRequest}
        onStatusToggle={handleStatusToggle}
        permissionModule="prescreen"
        isLoading={isLoading}
        emptyMessage="No questions found"
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

export default PrescreenPage;
