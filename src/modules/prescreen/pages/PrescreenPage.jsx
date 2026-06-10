import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ModuleListingPage from "../../shared/components/ModuleListingPage";
import {
  deleteRecord,
  getRecords,
} from "../../../services/prescreen/prescreenQuestionnairesApi";
import { toastApiError } from "../../../services/toast/apiToast";

function PrescreenPage({ isDarkMode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPrescreens = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getRecords();
      setRows(data.items);
    } catch (error) {
      toastApiError(error);
      setRows([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrescreens();
  }, [fetchPrescreens]);

  useEffect(() => {
    if (location.state?.refresh) {
      fetchPrescreens();
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.state, location.pathname, navigate, fetchPrescreens]);

  const handleEdit = (row) => {
    if (!row?.id) return;
    navigate(`/prescreen/edit/${encodeURIComponent(row.id)}`);
  };

  const handleDelete = async (row) => {
    if (!row?.id) return;
    try {
      await deleteRecord(row.id);
      await fetchPrescreens();
    } catch (error) {
      toastApiError(error);
    }
  };

  const handleStatusToggle = (row) => {
    if (!row?.id) return;
    setRows((prev) =>
      prev.map((item) =>
        String(item.id) === String(row.id)
          ? {
              ...item,
              status: String(item.status).toLowerCase() === "active" ? "Inactive" : "Active",
            }
          : item
      )
    );
  };

  return (
    <ModuleListingPage
      isDarkMode={isDarkMode}
      title="Prescreen"
      searchPlaceholder="Search prescreens..."
      actionLabel="Add Prescreen"
      onActionClick={() => navigate("/prescreen/add")}
      columns={["S.No", "Title", "Language", "Right Answer", "Status", "Action"]}
      rows={rows}
      rowIdKey="id"
      onEdit={handleEdit}
      onDelete={handleDelete}
      onStatusToggle={handleStatusToggle}
      permissionModule="prescreen"
      isLoading={isLoading}
      emptyMessage="No prescreens found"
      nowrapAllCells
    />
  );
}

export default PrescreenPage;
