import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ModuleListingPage from "../../shared/components/ModuleListingPage";
import { useFlashMessage } from "../../shared/hooks/useFlashMessage";
import { DEFAULT_PAGE_SIZE } from "../../shared/utils/pagination";
import { toastApiError } from "../../../services/toast/apiToast";
import { getRecords } from "../../../services/sales/salesProjectsApi";

const LIST_COLUMNS = ["S.No", "ID", "Name", "Email Address", "Project ID (if won)", "Country"];

function RfqPage({ isDarkMode }) {
  const navigate = useNavigate();
  const location = useLocation();
  useFlashMessage();
  const [projects, setProjects] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getRecords();
      setProjects(data.items);
      setTotalRecords(data.total ?? data.count ?? data.items.length);
    } catch (error) {
      toastApiError(error);
      setProjects([]);
      setTotalRecords(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    if (location.state?.refresh) {
      fetchProjects();
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.state, location.pathname, navigate, fetchProjects]);

  return (
    <ModuleListingPage
      isDarkMode={isDarkMode}
      title="RFQ"
      searchPlaceholder="Search RFQ..."
      actionLabel="Add RFQ"
      onActionClick={() => navigate("/sales/rfq/add")}
      columns={LIST_COLUMNS}
      rows={projects}
      rowIdKey="recordId"
      editPath="/sales/rfq"
      showStatus={false}
      permissionModule="rfq"
      searchFields={["id", "name", "emailAddress", "projectId", "country"]}
      isLoading={isLoading}
      loadingMessage="Loading RFQ projects..."
      emptyMessage="No RFQ projects found"
      totalRecords={totalRecords}
      pageSize={DEFAULT_PAGE_SIZE}
      showPagination
      nowrapAllCells
      nameAsText
    />
  );
}

export default RfqPage;
