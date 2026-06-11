import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DeleteConfirmModal from "../../../components/admin/DeleteConfirmModal";
import ModuleListingPage from "../../shared/components/ModuleListingPage";
import { useApiListing } from "../../shared/hooks/useApiListing";
import { useFlashMessage } from "../../shared/hooks/useFlashMessage";
import { useListingRefresh } from "../../shared/hooks/useListingRefresh";
import { DEFAULT_PAGE_SIZE } from "../../shared/utils/pagination";
import { toastApiError, toastApiSuccess } from "../../../services/toast/apiToast";
import { deleteSurvey, updateSurveyStatus } from "../services/surveyApi";
import { getGroupProjectSurveys, getRecord } from "../services/groupSurveyApi";

function GroupSurveyProjectsListPage({ isDarkMode }) {
  const navigate = useNavigate();
  const { groupId } = useParams();
  useFlashMessage();

  const [groupRecord, setGroupRecord] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);

  const fetchProjects = useCallback(
    async (params) => {
      if (!groupId) {
        return { items: [], total: 0 };
      }
      return getGroupProjectSurveys(groupId, params);
    },
    [groupId]
  );

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
    refresh: refreshProjects,
  } = useApiListing({
    fetchFn: fetchProjects,
    initialPageSize: DEFAULT_PAGE_SIZE,
    enabled: Boolean(groupId),
  });
  useListingRefresh(refreshProjects);

  useEffect(() => {
    if (!groupId) {
      setGroupRecord(null);
      return;
    }

    let cancelled = false;
    getRecord(groupId)
      .then((group) => {
        if (!cancelled) setGroupRecord(group);
      })
      .catch((error) => {
        if (!cancelled) {
          toastApiError(error);
          setGroupRecord(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [groupId]);

  const handleDeleteRequest = (row) => {
    setDeleteTarget(row);
  };

  const handleDeleteCancel = () => {
    if (isDeleting) return;
    setDeleteTarget(null);
  };

  const handleDeleteConfirm = async () => {
    const recordId = deleteTarget?.recordId;
    if (recordId == null) return;

    setIsDeleting(true);
    try {
      const data = await deleteSurvey(recordId);
      setDeleteTarget(null);
      toastApiSuccess(data);
      await refreshProjects();
    } catch (error) {
      toastApiError(error);
    } finally {
      setIsDeleting(false);
    }
  };

  const projectsPath = `/survey/group/${encodeURIComponent(groupId)}/projects`;

  const handleStatusToggle = async (row) => {
    const recordId = row?.recordId;
    if (recordId == null || statusUpdatingId != null) return;

    const previousStatus = row.status;
    const nextStatus =
      String(previousStatus ?? "").toLowerCase() === "active" ? "Inactive" : "Active";
    setStatusUpdatingId(recordId);
    setRows((prev) =>
      prev.map((item) =>
        String(item.recordId) === String(recordId) ? { ...item, status: nextStatus } : item
      )
    );

    try {
      const data = await updateSurveyStatus(recordId, { status: nextStatus });
      toastApiSuccess(data);
    } catch (error) {
      toastApiError(error);
      setRows((prev) =>
        prev.map((item) =>
          String(item.recordId) === String(recordId)
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
        title="View Projects"
        subtitle={groupRecord?.project_name ?? ""}
        breadcrumbs={[
          { label: "Group Survey", to: "/survey/group" },
          { label: "View Projects" },
        ]}
        searchPlaceholder="Search projects..."
        actionLabel="Add Group Survey"
        onActionClick={() =>
          navigate(`/survey/group/${encodeURIComponent(groupId)}/add-project`)
        }
        columns={[
          "ID",
          "Project Name",
          "Client Code",
          "Start Date",
          "End Date",
          "LOI",
          "IR",
          "Status",
          "Action",
        ]}
        rows={rows}
        rowIdKey="recordId"
        actionVariant="group-survey-projects"
        permissionModule="group_survey"
        onAddProject={() =>
          navigate(`/survey/group/${encodeURIComponent(groupId)}/add-project`)
        }
        onEdit={(row) => {
          const recordId = row?.recordId;
          if (recordId == null) return;
          navigate(`/survey/edit/${encodeURIComponent(String(recordId))}`, {
            state: { returnTo: projectsPath },
          });
        }}
        onDelete={handleDeleteRequest}
        onStatusToggle={handleStatusToggle}
        isLoading={isLoading}
        emptyMessage="No projects found"
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

export default GroupSurveyProjectsListPage;
