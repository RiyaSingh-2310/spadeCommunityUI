import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ModuleListingPage from "../../shared/components/ModuleListingPage";
import { useFlashMessage } from "../../shared/hooks/useFlashMessage";
import { DEFAULT_PAGE_SIZE } from "../../shared/utils/pagination";
import { toastApiError, toastApiSuccess } from "../../../services/toast/apiToast";
import {
  getRecords,
  updatePrescreenGroupStatus,
} from "../../../services/prescreen/prescreenGroupApi";

const LIST_COLUMNS = ["S.No", "Survey Title", "Language", "Status", "Action"];

function PrescreenGroupPage({ isDarkMode }) {
  const navigate = useNavigate();
  const location = useLocation();
  useFlashMessage();
  const [rows, setRows] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);

  const fetchPrescreenGroups = useCallback(async () => {
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

  const handleStatusToggle = async (row) => {
    if (!row?.id || statusUpdatingId != null) return;

    const nextStatus = row.status === "Active" ? "Inactive" : "Active";
    const previousStatus = row.status;
    setStatusUpdatingId(row.id);

    try {
      const data = await updatePrescreenGroupStatus(row.id, {
        surveyTitle: row.surveyTitle,
        language: row.language,
        prescreenIds: row.prescreenIds,
        status: nextStatus,
      });
      setRows((prev) =>
        prev.map((item) =>
          String(item.id) === String(row.id) ? { ...item, status: nextStatus } : item
        )
      );
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
      onStatusToggle={handleStatusToggle}
      isLoading={isLoading}
      emptyMessage="No prescreen groups found"
      totalRecords={totalRecords}
      pageSize={DEFAULT_PAGE_SIZE}
      showPagination
      nowrapAllCells
    />
  );
}

export default PrescreenGroupPage;
