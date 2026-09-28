import { useCallback, useEffect, useRef, useState } from "react";
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
import ProjectListStatusFilter from "../components/ProjectListStatusFilter";
import ProjectUrlInfoModal from "../components/ProjectUrlInfoModal";
import PartnerProjectsPage from "./PartnerProjectsPage";
import { isPartnerLoginRole } from "../../../services/auth/loginRole";

const CLONE_CONFIRM_CLASS =
  "admin-btn-primary flex h-10 cursor-pointer items-center justify-center gap-2 px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60";

function projectListEmptyMessage(status) {
  return String(status).toLowerCase() === "inactive"
    ? "No inactive projects found."
    : "No active projects found.";
}

function AdminSurveyListingPage({ isDarkMode }) {
  const navigate = useNavigate();
  useFlashMessage();
  const [statusFilter, setStatusFilter] = useState("active");
  const [awaitingStatusResults, setAwaitingStatusResults] = useState(false);
  const statusFetchStartedRef = useRef(false);
  const [cloneTarget, setCloneTarget] = useState(null);
  const [isCloning, setIsCloning] = useState(false);
  const [infoTarget, setInfoTarget] = useState(null);
  const fetchProjects = useCallback(
    (params) => getRecords({ ...params, status: statusFilter }),
    [statusFilter]
  );
  const {
    rows,
    setRows,
    totalRecords,
    totalPages,
    isLoading,
    listError,
    currentPage,
    pageSize,
    handleSearch,
    handlePageChange,
    handlePageSizeChange,
    refresh: fetchSurveys,
  } = useApiListing({ fetchFn: fetchProjects, initialPageSize: DEFAULT_PAGE_SIZE });
  useListingRefresh(fetchSurveys);

  useEffect(() => {
    if (isLoading) {
      statusFetchStartedRef.current = true;
      return;
    }
    if (!statusFetchStartedRef.current) return;
    statusFetchStartedRef.current = false;
    setAwaitingStatusResults(false);
  }, [isLoading]);

  const handleStatusFilterChange = (value) => {
    if (value === statusFilter) return;
    setAwaitingStatusResults(true);
    setRows([]);
    setStatusFilter(value);
    handlePageChange(1);
  };
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
      await fetchSurveys();
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
        toolbarEnd={
          <ProjectListStatusFilter
            value={statusFilter}
            onChange={handleStatusFilterChange}
          />
        }
        actionLabel="Add Project"
        onActionClick={() => navigate("/survey/add")}
        columns={[
          "ID",
          "Project Name",
          "Client",
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
        onProjectUrlInfo={(row) => {
          if (row?.recordId == null) return;
          setInfoTarget(row);
        }}
        onStatusToggle={handleStatusToggle}
        permissionModule="survey"
        isLoading={isLoading || awaitingStatusResults}
        errorMessage={listError}
        onRetry={fetchSurveys}
        emptyMessage={projectListEmptyMessage(statusFilter)}
        onSearch={handleSearch}
        totalRecords={totalRecords}
        paginationTotalPages={totalPages}
        serverPaginated
        serverSearch
        paginationPage={currentPage}
        onPaginationPageChange={handlePageChange}
        paginationPageSize={pageSize}
        onPaginationPageSizeChange={handlePageSizeChange}
        showPagination
        nowrapAllCells
      />

      <ProjectUrlInfoModal
        isOpen={Boolean(infoTarget)}
        onClose={() => setInfoTarget(null)}
        isDarkMode={isDarkMode}
        projectId={infoTarget?.recordId}
        projectName={infoTarget?.projectName}
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

function SurveyPage({ isDarkMode }) {
  if (isPartnerLoginRole()) {
    return <PartnerProjectsPage isDarkMode={isDarkMode} />;
  }
  return <AdminSurveyListingPage isDarkMode={isDarkMode} />;
}

export default SurveyPage;
