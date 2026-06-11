import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ModuleListingPage from "../../shared/components/ModuleListingPage";
import { useFlashMessage } from "../../shared/hooks/useFlashMessage";
import { DEFAULT_PAGE_SIZE } from "../../shared/utils/pagination";
import { toastApiError, toastApiSuccess } from "../../../services/toast/apiToast";
import { getRecords, updateGroupProjectStatus } from "../services/groupSurveyApi";

function GroupSurveyPage({ isDarkMode }) {
  const navigate = useNavigate();
  const location = useLocation();
  useFlashMessage();
  const [rows, setRows] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);

  const fetchGroupProjects = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getRecords();
      setRows(data.items);
      setTotalRecords(data.total ?? data.count ?? data.items.length);
    } catch (error) {
      toastApiError(error);
      setRows([]);
      setTotalRecords(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroupProjects();
  }, [fetchGroupProjects]);

  useEffect(() => {
    if (location.state?.refresh) {
      fetchGroupProjects();
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.state, location.pathname, navigate, fetchGroupProjects]);

  const getGroupId = (row) => row?.id;

  const handleStatusToggle = async (row) => {
    if (!row?.id || statusUpdatingId != null) return;

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
      const data = await updateGroupProjectStatus(row.id, { status: nextStatus });
      toastApiSuccess(data);
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

  return (
    <ModuleListingPage
      isDarkMode={isDarkMode}
      title="Group Survey"
      subtitle="Manage group survey records here."
      searchPlaceholder="Search group surveys..."
      actionLabel="Add Group Survey"
      onActionClick={() => navigate("/survey/group/add")}
      columns={["S. No.", "Client Name", "Project Name", "Status", "Action"]}
      rows={rows}
      rowIdKey="id"
      actionVariant="group-survey"
      onStatusToggle={handleStatusToggle}
      isLoading={isLoading}
      emptyMessage="No group surveys found"
      onEdit={(row) => {
        const id = getGroupId(row);
        if (id == null) return;
        navigate(`/survey/group/edit/${encodeURIComponent(String(id))}`);
      }}
      onAddProject={(row) => {
        const id = getGroupId(row);
        if (id == null) return;
        navigate(`/survey/group/${encodeURIComponent(String(id))}/add-project`);
      }}
      onListProjects={(row) => {
        const id = getGroupId(row);
        if (id == null) return;
        navigate(`/survey/group/${encodeURIComponent(String(id))}/projects`);
      }}
      permissionModule="group_survey"
      searchFields={["clientName", "projectName"]}
      totalRecords={totalRecords}
      pageSize={DEFAULT_PAGE_SIZE}
      showPagination
      nowrapAllCells
    />
  );
}

export default GroupSurveyPage;
