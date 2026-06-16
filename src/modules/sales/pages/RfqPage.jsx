import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DeleteConfirmModal from "../../../components/admin/DeleteConfirmModal";
import { isSalesLoginRole } from "../../../services/auth/loginRole";
import ModuleListingPage from "../../shared/components/ModuleListingPage";
import { useApiListing } from "../../shared/hooks/useApiListing";
import { useFlashMessage } from "../../shared/hooks/useFlashMessage";
import { useListingRefresh } from "../../shared/hooks/useListingRefresh";
import { DEFAULT_PAGE_SIZE } from "../../shared/utils/pagination";
import { toastApiError, toastApiSuccess } from "../../../services/toast/apiToast";
import {
  deleteSalesProject,
  getRecords,
} from "../../../services/sales/salesProjectsApi";
import AddRfqLogModal from "../components/AddRfqLogModal";
import RfqExpandableDetails from "../components/RfqExpandableDetails";
import RfqSalesLogListModal from "../components/RfqSalesLogListModal";

const ADMIN_RFQ_COLUMNS = [
  "ID",
  "Name",
  "Email Address",
  "Project ID (if won)",
  "Country",
  "Action",
];

const SALES_RFQ_COLUMNS = [
  "ID",
  "Name",
  "Email Address",
  "Project ID (if won)",
  "Country",
  "Email Subject",
  "Status",
  "Sales Manager",
  "Action",
];

function RfqPage({ isDarkMode }) {
  const navigate = useNavigate();
  const isSalesRole = isSalesLoginRole();
  const listColumns = useMemo(
    () => (isSalesRole ? SALES_RFQ_COLUMNS : ADMIN_RFQ_COLUMNS),
    [isSalesRole]
  );
  useFlashMessage();
  const {
    rows: projects,
    totalRecords,
    isLoading,
    currentPage,
    pageSize,
    handleSearch,
    handlePageChange,
    handlePageSizeChange,
    refresh: fetchProjects,
  } = useApiListing({ fetchFn: getRecords, initialPageSize: DEFAULT_PAGE_SIZE });
  useListingRefresh(fetchProjects);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [addLogTarget, setAddLogTarget] = useState(null);
  const [viewLogsTarget, setViewLogsTarget] = useState(null);
  const [logsRefreshKey, setLogsRefreshKey] = useState(0);

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
        title="List Sales Projects"
        searchPlaceholder="Search RFQ..."
        actionLabel="Add RFQ"
        onActionClick={() => navigate("/sales/rfq/add")}
        columns={listColumns}
        rows={projects}
        rowIdKey="recordId"
        editPath="/sales/rfq"
        actionVariant="rfq"
        showStatus={isSalesRole}
        permissionModule="rfq"
        isLoading={isLoading}
        emptyMessage="No RFQ projects found"
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
        key={addLogTarget?.recordId ?? addLogTarget?.id ?? "rfq-log-modal"}
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
