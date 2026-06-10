import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ModuleListingPage from "../../shared/components/ModuleListingPage";
import { useFlashMessage } from "../../shared/hooks/useFlashMessage";
import { DEFAULT_PAGE_SIZE } from "../../shared/utils/pagination";
import { isAuthenticated } from "../../../services/auth/authStorage";
import { getRecords } from "../../../services/prescreen/prescreenGroupApi";
import { toastApiError } from "../../../services/toast/apiToast";

const LIST_COLUMNS = ["S.No", "Survey Title", "Language", "Status", "Action"];

function PrescreenGroupPage({ isDarkMode }) {
  const navigate = useNavigate();
  const location = useLocation();
  useFlashMessage();
  const [rows, setRows] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPrescreenGroups = useCallback(async () => {
    if (!isAuthenticated()) {
      setRows([]);
      setTotalRecords(0);
      setIsLoading(false);
      return;
    }

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
    fetchPrescreenGroups();
  }, [fetchPrescreenGroups]);

  useEffect(() => {
    if (location.state?.refresh) {
      fetchPrescreenGroups();
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.state, location.pathname, navigate, fetchPrescreenGroups]);

  return (
    <ModuleListingPage
      isDarkMode={isDarkMode}
      title="Prescreen Group"
      searchPlaceholder="Search prescreen groups..."
      actionLabel="Add Survey Group"
      onActionClick={() => navigate("/prescreen/group/add")}
      columns={LIST_COLUMNS}
      rows={rows}
      rowIdKey="id"
      editPath="/prescreen/group"
      permissionModule="prescreen_group"
      searchFields={["surveyTitle", "language"]}
      isLoading={isLoading}
      emptyMessage="No prescreen groups found"
      statusAsText
      totalRecords={totalRecords}
      pageSize={DEFAULT_PAGE_SIZE}
      showPagination
      nowrapAllCells
    />
  );
}

export default PrescreenGroupPage;
