import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ModuleListingPage from "../../shared/components/ModuleListingPage";
import { useFlashMessage } from "../../shared/hooks/useFlashMessage";
import { DEFAULT_PAGE_SIZE } from "../../shared/utils/pagination";
import { toastApiError } from "../../../services/toast/apiToast";
import { getRecords } from "../../../services/projectManagers/projectManagersApi";

const LIST_COLUMNS = ["S.No", "Name", "Email Address", "Status", "Action"];

function ProjectManagersPage({ isDarkMode }) {
  const navigate = useNavigate();
  const location = useLocation();
  useFlashMessage();
  const [projectManagers, setProjectManagers] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProjectManagers = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getRecords();
      setProjectManagers(data.items);
      setTotalRecords(data.total ?? data.count ?? data.items.length);
    } catch (error) {
      toastApiError(error);
      setProjectManagers([]);
      setTotalRecords(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjectManagers();
  }, [fetchProjectManagers]);

  useEffect(() => {
    if (location.state?.refresh) {
      fetchProjectManagers();
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.state, location.pathname, navigate, fetchProjectManagers]);

  return (
    <ModuleListingPage
      isDarkMode={isDarkMode}
      title="Project Managers"
      searchPlaceholder="Search project managers..."
      actionLabel="Add Project Manager"
      onActionClick={() => navigate("/project-managers/add")}
      columns={LIST_COLUMNS}
      rows={projectManagers}
      rowIdKey="id"
      editPath="/project-managers"
      permissionModule="project_managers"
      searchFields={["name", "emailAddress", "code"]}
      isLoading={isLoading}
      loadingMessage="Loading project managers..."
      emptyMessage="No project managers found"
      statusAsText
      totalRecords={totalRecords}
      pageSize={DEFAULT_PAGE_SIZE}
      showPagination
      nowrapAllCells
    />
  );
}

export default ProjectManagersPage;
