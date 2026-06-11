import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import DeleteConfirmModal from "../../../components/admin/DeleteConfirmModal";
import ModuleListingPage from "../../shared/components/ModuleListingPage";
import { useFlashMessage } from "../../shared/hooks/useFlashMessage";
import { DEFAULT_PAGE_SIZE } from "../../shared/utils/pagination";
import { toastApiError, toastApiSuccess } from "../../../services/toast/apiToast";
import {
  deleteSalesProject,
  getRecords,
} from "../../../services/sales/salesProjectsApi";
import AddRfqLogModal from "../components/AddRfqLogModal";
import RfqExpandableDetails from "../components/RfqExpandableDetails";
import RfqSalesLogListModal from "../components/RfqSalesLogListModal";

const LIST_COLUMNS = [
  "S.No",
  "ID",
  "Name",
  "Email Address",
  "Project ID (if won)",
  "Country",
  "Action",
];

function RfqPage({ isDarkMode }) {
  const navigate = useNavigate();
  const location = useLocation();
  useFlashMessage();
  const [projects, setProjects] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [addLogTarget, setAddLogTarget] = useState(null);
  const [viewLogsTarget, setViewLogsTarget] = useState(null);
  const [logsRefreshKey, setLogsRefreshKey] = useState(0);

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

  const handleDeleteRequest = (row) => {
    setDeleteTarget(row);
  };

  const handleDeleteCancel = () => {
    if (isDeleting) return;
    setDeleteTarget(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget?.recordId) return;

    setIsDeleting(true);
    try {
      const data = await deleteSalesProject(deleteTarget.recordId);
      setDeleteTarget(null);
      toastApiSuccess(data);
      await fetchProjects();
    } catch (error) {
      toastApiError(error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
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
        actionVariant="rfq"
        showStatus={false}
        permissionModule="rfq"
        searchFields={["id", "name", "emailAddress", "projectId", "country"]}
        isLoading={isLoading}
        emptyMessage="No RFQ projects found"
        totalRecords={totalRecords}
        pageSize={DEFAULT_PAGE_SIZE}
        showPagination
        nowrapAllCells
        nameAsText
        onDelete={handleDeleteRequest}
        onAddLog={(row) => setAddLogTarget(row)}
        onViewLogs={(row) => setViewLogsTarget(row)}
        renderExpandedContent={(row) => <RfqExpandableDetails row={row} />}
      />

      <DeleteConfirmModal
        isOpen={Boolean(deleteTarget)}
        onCancel={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />

      <AddRfqLogModal
        isOpen={Boolean(addLogTarget)}
        row={addLogTarget}
        isDarkMode={isDarkMode}
        onClose={() => setAddLogTarget(null)}
        onSubmitted={() => {
          fetchProjects();
          setLogsRefreshKey((key) => key + 1);
        }}
      />

      <RfqSalesLogListModal
        isOpen={Boolean(viewLogsTarget)}
        row={viewLogsTarget}
        isDarkMode={isDarkMode}
        refreshKey={logsRefreshKey}
        onClose={() => setViewLogsTarget(null)}
      />
    </div>
  );
}

export default RfqPage;
