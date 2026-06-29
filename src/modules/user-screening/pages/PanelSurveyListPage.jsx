import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DeleteConfirmModal from "../../../components/admin/DeleteConfirmModal";
import ModuleListingPage from "../../shared/components/ModuleListingPage";
import { useApiListing } from "../../shared/hooks/useApiListing";
import { useFlashMessage } from "../../shared/hooks/useFlashMessage";
import { DEFAULT_PAGE_SIZE } from "../../shared/utils/pagination";
import {
  deletePanelSurvey,
  listPanelSurveyRecords,
  updatePanelSurveyStatus,
} from "../../../services/screening/screeningQuestionsApi";
import { toastApiError, toastApiSuccess } from "../../../services/toast/apiToast";

function PanelSurveyListPage({ isDarkMode }) {
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
    fetchFn: listPanelSurveyRecords,
    initialPageSize: DEFAULT_PAGE_SIZE,
    preserveRowOrder: true,
  });

  const [statusUpdatingId, setStatusUpdatingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleStatusToggle = async (row) => {
    if (row?.id == null || statusUpdatingId != null) return;

    const previousStatus = row.status;
    const nextStatus =
      String(previousStatus ?? "").toLowerCase() === "active" ? "Inactive" : "Active";

    setStatusUpdatingId(row.id);
    setRows((prev) =>
      prev.map((item) =>
        String(item.id) === String(row.id) ? { ...item, status: nextStatus } : item
      )
    );

    try {
      const data = await updatePanelSurveyStatus(row, nextStatus);
      toastApiSuccess(data);
      await refresh();
    } catch (error) {
      toastApiError(error);
      setRows((prev) =>
        prev.map((item) =>
          String(item.id) === String(row.id) ? { ...item, status: previousStatus } : item
        )
      );
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const handleEdit = (row) => {
    if (row?.id == null) return;
    navigate(`/user-screening/panel-survey/edit/${encodeURIComponent(String(row.id))}`);
  };

  const handleDeleteRequest = (row) => {
    if (row?.id == null) return;
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
      const data = await deletePanelSurvey(deleteTarget.id);
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
        title="Panel Survey"
        breadcrumbs={[
          { label: "Panelist", to: "/community-users" },
          { label: "Panel Survey" },
        ]}
        searchPlaceholder="Search panel surveys..."
        actionLabel="Add Panel Survey"
        onActionClick={() => navigate("/user-screening/panel-survey/add")}
        columns={["S.No", "Survey Title", "Language", "Status", "Action"]}
        rows={rows}
        permissionModule="panel_survey"
        nowrapAllCells
        rowIdKey="id"
        onEdit={handleEdit}
        onDelete={handleDeleteRequest}
        onStatusToggle={handleStatusToggle}
        isLoading={isLoading}
        emptyMessage="No panel surveys found"
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
        message="Are you sure you want to delete this Panel Survey?"
      />
    </div>
  );
}

export default PanelSurveyListPage;
