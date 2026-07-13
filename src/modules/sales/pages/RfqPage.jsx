import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DeleteConfirmModal from "../../../components/admin/DeleteConfirmModal";
import { toastApiError, toastApiSuccess } from "../../../services/toast/apiToast";
import {
  deleteSalesProject,
  getRecords,
  resolveSalesProjectLogId,
} from "../../../services/sales/salesProjectsApi";
import ModuleListingPage from "../../shared/components/ModuleListingPage";
import { useApiListing } from "../../shared/hooks/useApiListing";
import { useFlashMessage } from "../../shared/hooks/useFlashMessage";
import { useListingRefresh } from "../../shared/hooks/useListingRefresh";
import { useNameColumnSort } from "../../shared/hooks/useNameColumnSort";
import { DEFAULT_PAGE_SIZE } from "../../shared/utils/pagination";
import AddRfqLogModal from "../components/AddRfqLogModal";

const RFQ_COLUMNS = [
  "ID",
  "Name",
  "Email Address",
  "Email Subject",
  "Project ID (if won)",
  "Sales Manager",
  "Country",
  "Status",
  "Action",
];

function RfqPage({ isDarkMode }) {
  const navigate = useNavigate();
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
  const { sortedRows, sortableColumns, columnSort, onColumnSort } = useNameColumnSort({
    rows: projects,
    columnLabel: "Name",
  });

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [addLogTarget, setAddLogTarget] = useState(null);

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
        columns={RFQ_COLUMNS}
        rows={sortedRows}
        sortableColumns={sortableColumns}
        columnSort={columnSort}
        onColumnSort={onColumnSort}
        rowIdKey="recordId"
        editPath="/sales/rfq"
        actionVariant="rfq"
        showStatus
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
        onViewLogs={(row) => {
          const projectId = resolveSalesProjectLogId(row);
          if (projectId) {
            navigate(`/sales/rfq/logs/${encodeURIComponent(projectId)}`);
          }
        }}
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
        }}
      />
    </div>
  );
}

export default RfqPage;
