import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import ModuleListingPage from "../../shared/components/ModuleListingPage";
import { useApiListing } from "../../shared/hooks/useApiListing";
import { useFlashMessage } from "../../shared/hooks/useFlashMessage";
import { useListingRefresh } from "../../shared/hooks/useListingRefresh";
import { DEFAULT_PAGE_SIZE } from "../../shared/utils/pagination";
import { toastApiError, toastApiSuccess } from "../../../services/toast/apiToast";
import { cloneSurvey, updateSurveyStatus } from "../services/surveyApi";
import {
  getGroupProjectSurveys,
  getRecord,
} from "../services/groupSurveyApi";
import {
  getGroupProjectEditPath,
  getGroupProjectFindUserPath,
  getGroupProjectUserSurveyDataPath,
  getGroupProjectViewPath,
  getGroupProjectsPath,
  getGroupSurveyBreadcrumbs,
} from "../utils/groupSurveyNavigation";

function GroupSurveyProjectsListPage({ isDarkMode }) {
  const navigate = useNavigate();
  const { groupId } = useParams();
  useFlashMessage();

  const [groupRecord, setGroupRecord] = useState(null);
  const [isLoadingGroup, setIsLoadingGroup] = useState(true);
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
      setIsLoadingGroup(false);
      return;
    }

    let cancelled = false;

    const loadGroupProject = async () => {
      setIsLoadingGroup(true);

      try {
        const group = await getRecord(groupId);
        if (!cancelled) setGroupRecord(group);
      } catch (error) {
        if (!cancelled) {
          toastApiError(error);
          setGroupRecord(null);
        }
      } finally {
        if (!cancelled) setIsLoadingGroup(false);
      }
    };

    loadGroupProject();
    return () => {
      cancelled = true;
    };
  }, [groupId]);

  const groupProjectName = groupRecord?.project_name ?? "";
  const projectsPath = getGroupProjectsPath(groupId);

  const breadcrumbs = useMemo(
    () => getGroupSurveyBreadcrumbs(groupId),
    [groupId]
  );

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

  if (isLoadingGroup) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <Loader2 size={28} className="animate-spin text-[#10a950]" />
      </div>
    );
  }

  return (
    <ModuleListingPage
      isDarkMode={isDarkMode}
      title="Group Survey"
      subtitle={groupProjectName}
      breadcrumbs={breadcrumbs}
      searchPlaceholder="Search Project"
      actionLabel="Add Group Survey"
      onActionClick={() => navigate("/survey/group/add")}
      columns={[
        "ID",
        "Project Name",
        "Client Code",
        "LOI",
        "IR",
        "Start Date",
        "End Date",
        "Status",
        "Action",
      ]}
      rows={rows}
      rowIdKey="recordId"
      actionVariant="view-edit"
      showDeleteAction={false}
      permissionModule="group_survey"
      onView={(row) => {
        const recordId = row?.recordId;
        if (recordId == null) return;
        navigate(getGroupProjectViewPath(groupId, recordId));
      }}
      onEdit={(row) => {
        const recordId = row?.recordId;
        if (recordId == null) return;
        const editTarget = getGroupProjectEditPath(recordId, groupId);
        navigate(
          {
            pathname: editTarget.pathname,
            search: editTarget.search,
          },
          { state: editTarget.state }
        );
      }}
      onFindUser={(row) => {
        const recordId = row?.recordId;
        if (recordId == null) return;
        navigate(getGroupProjectFindUserPath(groupId, recordId), {
          state: {
            surveyName: row.projectName || "",
            returnTo: projectsPath,
          },
        });
      }}
      onUserSurveyData={(row) => {
        const recordId = row?.recordId;
        if (recordId == null) return;
        navigate(getGroupProjectUserSurveyDataPath(groupId, recordId), {
          state: {
            surveyName: row.projectName || "",
            returnTo: projectsPath,
          },
        });
      }}
      onSurveyClone={async (row) => {
        const id = row?.recordId;
        if (id == null) return;
        try {
          const data = await cloneSurvey(id);
          toastApiSuccess(data);
          await refreshProjects();
        } catch (error) {
          toastApiError(error);
        }
      }}
      surveyActionLabels={{
        view: "Details",
        edit: "Edit",
        findUser: "Find User",
        userSurveyData: "User Survey Data",
        surveyClone: "Survey Clone",
      }}
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
      compactStatusColumn
    />
  );
}

export default GroupSurveyProjectsListPage;
