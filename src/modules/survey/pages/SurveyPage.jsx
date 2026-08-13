import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DeleteConfirmModal from "../../../components/admin/DeleteConfirmModal";
import ModuleListingPage from "../../shared/components/ModuleListingPage";
import { useApiListing } from "../../shared/hooks/useApiListing";
import { useFlashMessage } from "../../shared/hooks/useFlashMessage";
import { useListingRefresh } from "../../shared/hooks/useListingRefresh";
import { useNameColumnSort } from "../../shared/hooks/useNameColumnSort";
import { DEFAULT_PAGE_SIZE } from "../../shared/utils/pagination";
import { toastApiError, toastApiSuccess } from "../../../services/toast/apiToast";
import { cloneSurvey, getRecords, updateSurveyStatus } from "../services/surveyApi";

const CLONE_CONFIRM_CLASS =
  "admin-btn-primary flex h-10 cursor-pointer items-center justify-center gap-2 px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60";

function SurveyPage({ isDarkMode }) {
  const navigate = useNavigate();
  useFlashMessage();
  const [cloneTarget, setCloneTarget] = useState(null);
  const [isCloning, setIsCloning] = useState(false);
  const {
    rows,
    setRows,
    totalRecords,
    isLoading,
    listError,
    currentPage,
    pageSize,
    handleSearch,
    handlePageChange,
    handlePageSizeChange,
    refresh: fetchSurveys,
  } = useApiListing({ fetchFn: getRecords, initialPageSize: DEFAULT_PAGE_SIZE });
  useListingRefresh(fetchSurveys);
  const { sortedRows, sortableColumns, columnSort, onColumnSort } = useNameColumnSort({
    rows,
    columnLabel: "Project Name",
  });

  const handleStatusToggle = async (row) => {
    const recordId = row?.recordId;
    if (recordId == null) return;

    const previousStatus = row.status;
    const nextStatus =
      String(previousStatus ?? "").toLowerCase() === "active" ? "Inactive" : "Active";

    setRows((prev) =>
      prev.map((item) =>
        String(item.recordId) === String(recordId) ? { ...item, status: nextStatus } : item
      )
    );

    try {
      const data = await updateSurveyStatus(recordId, { status: nextStatus });
      toastApiSuccess(
        data,
        nextStatus === "Active"
          ? "Project activated successfully."
          : "Project deactivated successfully."
      );
    } catch (error) {
      toastApiError(error);
      setRows((prev) =>
        prev.map((item) =>
          String(item.recordId) === String(recordId)
            ? { ...item, status: previousStatus }
            : item
        )
      );
    }
  };

  const handleCloneConfirm = async () => {
    const id = cloneTarget?.recordId;
    if (id == null || isCloning) return;

    setIsCloning(true);
    setCloneTarget(null);

    try {
      const data = await cloneSurvey(id);
      toastApiSuccess(data, "Project cloned successfully.");
      await fetchSurveys();
    } catch (error) {
      toastApiError(error);
    } finally {
      setIsCloning(false);
    }
  };

  return (
    <>
      <ModuleListingPage
        isDarkMode={isDarkMode}
        title="Projects"
        subtitle="Manage project records here."
        searchPlaceholder="Search projects..."
        actionLabel="Add Project"
        onActionClick={() => navigate("/survey/add")}
        columns={[
          "ID",
          "Project Name",
          "Client",
          "Start Date",
          "End Date",
          "Status",
          "Action",
        ]}
        rows={sortedRows}
        sortableColumns={sortableColumns}
        columnSort={columnSort}
        onColumnSort={onColumnSort}
        rowIdKey="recordId"
        actionVariant="view-edit"
        showDeleteAction={false}
        editPath="/survey"
        onEdit={(row) => {
          const id = row.recordId;
          if (id == null) return;
          navigate(
            {
              pathname: `/survey/edit/${encodeURIComponent(id)}`,
              search: "?from=list",
            },
            {
              state: { from: "list" },
            }
          );
        }}
        onView={(row) => {
          const id = row.recordId;
          if (id == null) return;
          navigate(`/survey/view/${encodeURIComponent(id)}`);
        }}
        onFindUser={(row) => {
          const id = row.recordId;
          if (id == null) return;
          navigate(`/survey/${encodeURIComponent(id)}/find-user`, {
            state: {
              surveyName: row.projectName || "Lifestyle Evolution India",
            },
          });
        }}
        onUserSurveyData={(row) => {
          const id = row.recordId;
          if (id == null) return;
          navigate(`/survey/${encodeURIComponent(id)}/user-survey-data`, {
            state: {
              surveyName: row.projectName || "Lifestyle Evaluation India",
            },
          });
        }}
        onSurveyClone={(row) => {
          if (row?.recordId == null || isCloning) return;
          setCloneTarget(row);
        }}
        onStatusToggle={handleStatusToggle}
        permissionModule="survey"
        isLoading={isLoading}
        errorMessage={listError}
        onRetry={fetchSurveys}
        emptyMessage="No Data Available"
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
        isOpen={Boolean(cloneTarget)}
        onCancel={() => {
          if (!isCloning) setCloneTarget(null);
        }}
        onConfirm={handleCloneConfirm}
        isDeleting={isCloning}
        title="Clone Project"
        message="Are you sure you want to clone this project?"
        confirmLabel="Clone"
        confirmingLabel="Cloning..."
        confirmClassName={CLONE_CONFIRM_CLASS}
      />
    </>
  );
}

export default SurveyPage;
