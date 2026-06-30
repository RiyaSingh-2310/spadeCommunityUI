import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DeleteConfirmModal from "../../../components/admin/DeleteConfirmModal";
import ModuleListingPage from "../../shared/components/ModuleListingPage";
import { useApiListing } from "../../shared/hooks/useApiListing";
import { useFlashMessage } from "../../shared/hooks/useFlashMessage";
import { DEFAULT_PAGE_SIZE } from "../../shared/utils/pagination";
import {
  deleteCreateSurvey,
  getScreeningRowId,
  listCreateSurveyRecords,
  updateCreateSurveyStatus,
} from "../../../services/screening/screeningQuestionsApi";
import { toastApiError, toastApiSuccess } from "../../../services/toast/apiToast";

function CreateSurveyListPage({ isDarkMode }) {
  const navigate = useNavigate();
  useFlashMessage();

  const {
    rows,
    setRows,
    totalRecords,
    isLoading,
    currentPage,
    pageSize,
    handleSearch,
    handlePageChange,
    handlePageSizeChange,
    refresh,
  } = useApiListing({
    fetchFn: listCreateSurveyRecords,
    initialPageSize: DEFAULT_PAGE_SIZE,
    preserveRowOrder: true,
  });

  const [statusUpdatingId, setStatusUpdatingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleStatusToggle = async (row) => {
    const rowId = getScreeningRowId(row);
    if (rowId == null || statusUpdatingId != null) return;

    const previousStatus = row.status;
    const nextStatus =
      String(previousStatus ?? "").toLowerCase() === "active" ? "Inactive" : "Active";

    setStatusUpdatingId(rowId);
    setRows((prev) =>
      prev.map((item) =>
        String(getScreeningRowId(item)) === String(rowId)
          ? { ...item, status: nextStatus }
          : item
      )
    );

    try {
      const data = await updateCreateSurveyStatus(row, nextStatus);
      toastApiSuccess(data);
      await refresh();
    } catch (error) {
      toastApiError(error);
      setRows((prev) =>
        prev.map((item) =>
          String(getScreeningRowId(item)) === String(rowId)
            ? { ...item, status: previousStatus }
            : item
        )
      );
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const handleEdit = (row) => {
    const rowId = getScreeningRowId(row);
    if (rowId == null) return;
    navigate(`/user-screening/create-survey/edit/${encodeURIComponent(String(rowId))}`);
  };

  const handleDeleteRequest = (row) => {
    const rowId = getScreeningRowId(row);
    if (rowId == null) return;
    setDeleteTarget(row);
  };

  const handleDeleteCancel = () => {
    if (isDeleting) return;
    setDeleteTarget(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      const data = await deleteCreateSurvey(deleteTarget);
      setDeleteTarget(null);
      toastApiSuccess(data);
      await refresh();
    } catch (error) {
      toastApiError(error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <ModuleListingPage
        isDarkMode={isDarkMode}
        title="Create Survey"
        breadcrumbs={[
          { label: "Pre-Screen" },
          { label: "Create Survey" },
        ]}
        searchPlaceholder="Search surveys..."
        actionLabel="Add Survey"
        onActionClick={() => navigate("/user-screening/create-survey/add")}
        columns={[
          "S.No",
          "Survey Title",
          "Language",
          "Question Type",
          "Status",
          "Action",
        ]}
        rows={rows}
        permissionModule="user_screening_management"
        nowrapAllCells
        rowIdKey="id"
        onEdit={handleEdit}
        onDelete={handleDeleteRequest}
        onStatusToggle={handleStatusToggle}
        isLoading={isLoading}
        emptyMessage="No surveys found"
        onSearch={handleSearch}
        totalRecords={totalRecords}
        serverPaginated
        serverSearch
        paginationPage={currentPage}
        onPaginationPageChange={handlePageChange}
        paginationPageSize={pageSize}
        onPaginationPageSizeChange={handlePageSizeChange}
        showPagination
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

export default CreateSurveyListPage;
